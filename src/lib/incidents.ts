export enum IncidentType {
	Sports = 'Sports',
	Maintenance = 'Maintenance',
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
	/** True when the restriction applies only on working days (not weekends/holidays). */
	onlyClosedOnWeekDays: boolean;
	/** Category of the incident. */
	type: IncidentType;
	/** MultiLineString in WGS84 [lng, lat]. */
	coordinates: [number, number][][];
	/** Source-specific extras that don't fit the common shape. */
	meta: Record<string, unknown>;
};

export type ProviderContext = {
	fetch: typeof globalThis.fetch;
};

export type LoadOptions = {
	/** If set, only incidents on one of these roads are returned (exact match on `roadName`). */
	roads?: readonly string[];
	/** If set, only incidents whose `isClosed` matches this value are returned. */
	isClosed?: boolean;
};
