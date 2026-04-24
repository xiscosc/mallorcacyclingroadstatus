import { DateTime } from 'luxon';
import {
	IncidentsProvider,
	IncidentType,
	type Incident,
	type LoadOptions,
	type ProviderContext
} from './provider';

type Restriction = {
	codi: number;
	carretera: string;
	restriccio: string;
	tipoinc: string;
	observacions: string;
	sentit_desc: string;
	inici: string;
	fin: string;
	pkinici: number | null;
	pkfin: number | null;
	desinici: string;
	desfin: string;
	color: number;
};

type FC<G, P> = {
	type: 'FeatureCollection';
	features: { type: 'Feature'; geometry: G; properties: P }[];
};

type PointFC = FC<{ type: 'Point'; coordinates: [number, number] }, Restriction>;
type LineFC = FC<
	{ type: 'MultiLineString'; coordinates: [number, number][][] },
	{ codi: number; color: number }
>;

const SOURCE_TZ = 'Europe/Madrid';

const TYPE_BY_TIPOINC: Record<string, IncidentType> = {
	'Prova esportiva': IncidentType.Sports,
	Manteniment: IncidentType.Maintenance,
	Obres: IncidentType.Maintenance
};

/**
 * Incidents feed from the Consell de Mallorca road authority (JSONP, UTM 31N).
 * Joins the points feed (metadata) with the lines feed (geometry) by `codi`.
 * Dates come as `DD/MM/YYYY HH:MM` in local (Europe/Madrid) time.
 */
export class ConsellDeMallorcaRoadsProvider extends IncidentsProvider {
	readonly name = 'consell-mallorca';
	readonly displayName = 'Consell de Mallorca';

	constructor(
		private readonly pointsUrl: string,
		private readonly linesUrl: string
	) {
		super();
	}

	async load({ fetch }: ProviderContext, options?: LoadOptions): Promise<Incident[]> {
		const [pointsText, linesText] = await Promise.all([
			fetch(this.pointsUrl).then((r) => r.text()),
			fetch(this.linesUrl).then((r) => r.text())
		]);

		const points = this.parseJsonp<PointFC>(pointsText);
		const lines = this.parseJsonp<LineFC>(linesText);

		const byCodi = new Map<number, Restriction>();
		for (const f of points.features) byCodi.set(f.properties.codi, f.properties);

		const roadFilter = options?.roads ? new Set(options.roads) : null;
		const incidents: Incident[] = [];
		for (const f of lines.features) {
			const info = byCodi.get(f.properties.codi);
			if (!info) continue;
			if (roadFilter && !roadFilter.has(info.carretera)) continue;
			const isClosed = info.restriccio === 'Tancada';
			if (options?.isClosed !== undefined && isClosed !== options.isClosed) continue;
			incidents.push({
				id: String(f.properties.codi),
				providerName: this.displayName,
				roadName: info.carretera,
				startDate: this.parseLocalDate(info.inici),
				endDate: this.parseLocalDate(info.fin),
				isClosed,
				onlyClosedOnWeekDays: /laborable/i.test(info.observacions),
				type: TYPE_BY_TIPOINC[info.tipoinc] ?? IncidentType.Other,
				coordinates: f.geometry.coordinates.map((line) =>
					line.map((pt) => this.utm31nToLngLat(pt))
				),
				meta: {
					restriccio: info.restriccio,
					tipoinc: info.tipoinc,
					observacions: info.observacions,
					sentit_desc: info.sentit_desc,
					pkinici: info.pkinici,
					pkfin: info.pkfin,
					desinici: info.desinici,
					desfin: info.desfin,
					color: info.color
				}
			});
		}
		return incidents;
	}

	private parseLocalDate(s: string | null | undefined): Date | undefined {
		if (!s) return undefined;
		const dt = DateTime.fromFormat(s.trim(), 'dd/MM/yyyy HH:mm', { zone: SOURCE_TZ });
		return dt.isValid ? dt.toJSDate() : undefined;
	}
}
