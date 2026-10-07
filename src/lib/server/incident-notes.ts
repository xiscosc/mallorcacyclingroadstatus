import type { Ai, R2Bucket } from '@cloudflare/workers-types';
import type { Incident, IncidentNote } from '$lib/incidents';
import { locales, type Locale } from '$lib/paraglide/runtime';

const R2_KEY = 'incident-notes.json';
/**
 * Small MoE (4B active) with strong multilingual output and structured outputs, at a
 * fraction of llama-3.3-70b's price — ~7 neurons per note against the 10k/day free tier.
 */
const MODEL = '@cf/google/gemma-4-26b-a4b-it';
/** Bump whenever the prompt or schema changes so every cached summary is regenerated. */
const PROMPT_VERSION = 3;
const MAX_SUMMARY_LENGTH = 60;

type Summary = Pick<IncidentNote, 'eventName' | 'summary'>;

/** Summaries keyed by {@link noteKey}, so a note is only sent to the model once. */
type SummaryCache = Record<string, Summary>;

const SYSTEM_PROMPT = `You condense road-incident notices from Mallorca's road authority (written in Catalan, often partly in capitals) for road cyclists. Reply with JSON only.
- "eventName": the proper name of the event that causes the incident (race, rally, festival...), in normal title case rather than capitals, but keeping Roman numerals, acronyms and brand names exactly as written (e.g. "VI Rally 550 Challenge Mallorca", "Mallorca 312"), without quotes or the organiser. Empty string when there is no named event (maintenance, roadworks, DGT restrictions...).
- "summary": one short phrase per language (en, de, es, ca), at most 40 characters, saying only why the road is affected (e.g. "Car rally", "Maintenance works"). Never mention days, dates, times, lanes, sides, directions, detours, the organiser, the event name or advice to check a website.`;

const SCHEMA = {
	type: 'object',
	properties: {
		eventName: { type: 'string' },
		summary: {
			type: 'object',
			properties: Object.fromEntries(locales.map((l) => [l, { type: 'string' }])),
			required: [...locales],
			additionalProperties: false
		}
	},
	required: ['eventName', 'summary'],
	additionalProperties: false
};

/**
 * Sources repeat the same remark across every stretch of an event (one rally spans a
 * dozen roads), so notes are grouped by content: each distinct note is summarised once
 * and stored once in the snapshot, with incidents pointing at it via `noteId`.
 *
 * Summaries come from Workers AI and are cached in R2 by content hash, so the model only
 * runs for text it has not seen before. When it fails the note keeps its raw text and
 * the UI falls back to that.
 */
export async function groupIncidentNotes(
	incidents: Incident[],
	bucket: R2Bucket,
	ai: Ai | undefined
): Promise<{ incidents: Incident[]; notes: Record<string, IncidentNote> }> {
	const notes: Record<string, IncidentNote> = {};
	const grouped = await Promise.all(
		incidents.map(async ({ notes: text, moreInfoUrl: url, ...incident }) => {
			if (!text && !url) return incident;
			const noteId = await noteKey(text, url);
			notes[noteId] ??= { text, url };
			return { ...incident, noteId };
		})
	);

	const cache = await readCache(bucket);
	const next: SummaryCache = {};
	for (const [id, note] of Object.entries(notes)) {
		const summary = cache[id] ?? (ai && note.text ? await summarize(ai, note.text) : undefined);
		if (!summary) continue;
		next[id] = summary;
		Object.assign(note, summary);
	}

	// Rewrite only when something was added or a note left the feed.
	const unchanged =
		Object.keys(next).length === Object.keys(cache).length &&
		Object.keys(next).every((k) => k in cache);
	if (!unchanged) {
		await bucket.put(R2_KEY, JSON.stringify(next), {
			httpMetadata: { contentType: 'application/json; charset=utf-8' }
		});
	}

	return { incidents: grouped, notes };
}

async function noteKey(text = '', url = ''): Promise<string> {
	const input = new TextEncoder().encode([PROMPT_VERSION, MODEL, text, url].join('\n'));
	const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', input));
	return Array.from(digest.subarray(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function readCache(bucket: R2Bucket): Promise<SummaryCache> {
	try {
		const obj = await bucket.get(R2_KEY);
		return obj ? ((await obj.json()) as SummaryCache) : {};
	} catch (err) {
		console.error('incident notes cache unreadable, starting fresh:', err);
		return {};
	}
}

async function summarize(ai: Ai, text: string): Promise<Summary | undefined> {
	try {
		const result = await ai.run(MODEL, {
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT },
				{ role: 'user', content: text }
			],
			response_format: {
				type: 'json_schema',
				json_schema: { name: 'incident_note', schema: SCHEMA, strict: true }
			},
			// Extraction, not a puzzle: thinking would only burn output tokens.
			chat_template_kwargs: { enable_thinking: false },
			max_completion_tokens: 400,
			temperature: 0
		});
		const content = result.choices[0]?.message.content;
		return typeof content === 'string' ? validate(JSON.parse(content)) : undefined;
	} catch (err) {
		console.error('incident note summary failed:', err instanceof Error ? err.message : err);
		return undefined;
	}
}

/** The model is not guaranteed to honour the schema, so anything incomplete is discarded. */
function validate(value: unknown): Summary | undefined {
	if (!value || typeof value !== 'object') return undefined;
	const { eventName, summary } = value as { eventName?: unknown; summary?: unknown };
	if (typeof eventName !== 'string' || !summary || typeof summary !== 'object') return undefined;
	const byLocale: Partial<Record<Locale, string>> = {};
	for (const locale of locales) {
		const phrase = (summary as Record<string, unknown>)[locale];
		if (typeof phrase !== 'string' || !phrase.trim()) return undefined;
		byLocale[locale] = phrase.trim().slice(0, MAX_SUMMARY_LENGTH);
	}
	return {
		eventName: eventName.trim() || undefined,
		summary: byLocale as Record<Locale, string>
	};
}
