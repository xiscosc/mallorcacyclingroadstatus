export enum IncidentType {
	Sports = 'Sports',
	Maintenance = 'Maintenance',
	Eclipse = 'Eclipse',
	Other = 'Other'
}

/** A single incident with route geometry, ready to paint on the map. */
export type Incident = {
	/** Stable id within the source. Prefix with provider name when merging sources. */
	id: string;
	/** Human-readable name of the source, e.g. "Consell de Mallorca". */
	providerName: string;
	/** Human-readable road identifier, e.g. "Ma-11". */
	roadName: string;
	/** When the incident starts, if known. */
	startDate?: Date;
	/** When the incident ends, if known. */
	endDate?: Date;
	/** Whether the road is fully closed for this incident. */
	isClosed: boolean;
	/**
	 * Traffic is cut without the road being fully closed: rolling cuts behind an
	 * event, intermittent stops, a single lane taken out. Riders can still be held
	 * up, so these are worth surfacing even though `isClosed` is false.
	 */
	hasTrafficCuts: boolean;
	/** True when the restriction applies only on working days (not weekends/holidays). */
	onlyClosedOnWeekDays: boolean;
	/** Category of the incident. */
	type: IncidentType;
	/** MultiLineString in WGS84 [lng, lat]. Empty when the source only gives a point. */
	coordinates: [number, number][][];
	/**
	 * Anchor point in WGS84 [lng, lat] — where the source pins the incident. It is
	 * the only geometry available for PK markers, which carry no road stretch.
	 */
	location?: [number, number];
	/** Source-specific extras that don't fit the common shape. */
	meta: Record<string, unknown>;
};

export type ProviderContext = {
	fetch: typeof globalThis.fetch;
};

export type LoadOptions = {
	/** If set, only incidents on one of these roads are returned (exact match on `roadName`). */
	roads?: readonly string[];
};

/**
 * Whether an incident is worth putting in front of a rider: the road is shut, the
 * traffic is being cut, or it falls under the eclipse-day restrictions. Everything
 * else the sources publish (roadworks with no restriction, narrowed lanes, "take
 * care" notices) is noise on a bike and is dropped by the cron.
 */
export function affectsRiders(incident: Incident): boolean {
	return incident.isClosed || incident.hasTrafficCuts || incident.type === IncidentType.Eclipse;
}
