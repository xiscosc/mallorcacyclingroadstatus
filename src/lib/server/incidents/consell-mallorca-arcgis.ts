import {
	IncidentsProvider,
	IncidentType,
	type Incident,
	type LoadOptions,
	type ProviderContext
} from './provider';

/** One row per affected road stretch of an incident. `idinciden` repeats across stretches. */
type IncidentAttributes = {
	idlocalit: number;
	idinciden: number;
	causa: string | null;
	carretera: string | null;
	sentit: string | null;
	inici: number | null;
	fin: number | null;
	afeccio: string | null;
	gravetat: string | null;
	pkinici: number | null;
	pkfin: number | null;
	desinici: string | null;
	desfin: string | null;
	observacions: string | null;
	hex_color: string | null;
	url: string | null;
};

/** Geometry layer: only the join key matters, the rest of the metadata lives on the point layer. */
type SegmentAttributes = { idlocalit: number };

type Polyline = { paths: number[][][] };

type EsriFeature<G, A> = { attributes: A; geometry?: G | null };

type EsriLayer<G, A> = {
	spatialReference?: { wkid?: number; latestWkid?: number };
	features?: EsriFeature<G, A>[];
	error?: { code?: number; message?: string };
};

const WGS84_WKID = 4326;
const UTM_31N_WKIDS = new Set([25831, 32631]);

const TYPE_BY_CAUSA: Record<string, IncidentType> = {
	'Prova esportiva': IncidentType.Sports,
	Manteniment: IncidentType.Maintenance,
	Obres: IncidentType.Maintenance
};

/**
 * Incidents feed from the Consell de Mallorca road authority, ArcGIS REST flavour
 * (`f=json`): an `incidencies` point layer (metadata) joined to a `trams` polyline
 * layer (geometry) by `idlocalit`. Both layers ship WGS84 coordinates already and
 * express dates as epoch milliseconds, so neither reprojection nor date parsing is
 * normally needed — the CRS is still checked in case the endpoint serves UTM 31N.
 *
 * Point rows without a matching stretch (a PK marker rather than a segment) carry no
 * geometry and are skipped.
 */
export class ConsellDeMallorcaArcGisProvider extends IncidentsProvider {
	readonly name = 'consell-mallorca-arcgis';
	readonly displayName = 'Consell de Mallorca';

	constructor(
		private readonly pointsUrl: string,
		private readonly linesUrl: string
	) {
		super();
	}

	async load({ fetch }: ProviderContext, options?: LoadOptions): Promise<Incident[]> {
		const [points, lines] = await Promise.all([
			this.fetchLayer<never, IncidentAttributes>(fetch, this.pointsUrl, 'incidents'),
			this.fetchLayer<Polyline, SegmentAttributes>(fetch, this.linesUrl, 'stretches')
		]);

		const toLngLat = this.coordinateMapper(lines);

		const byLocalitat = new Map<number, IncidentAttributes>();
		for (const f of points.features ?? []) byLocalitat.set(f.attributes.idlocalit, f.attributes);

		const roadFilter = options?.roads ? new Set(options.roads) : null;
		const incidents: Incident[] = [];
		for (const f of lines.features ?? []) {
			const info = byLocalitat.get(f.attributes.idlocalit);
			const paths = f.geometry?.paths;
			if (!info?.carretera || !paths?.length) continue;
			if (roadFilter && !roadFilter.has(info.carretera)) continue;
			const isClosed = this.isRoadClosed(info);
			if (options?.isClosed !== undefined && isClosed !== options.isClosed) continue;
			const observacions = info.observacions ?? '';
			incidents.push({
				id: String(info.idlocalit),
				providerName: this.displayName,
				roadName: info.carretera,
				startDate: this.parseEpoch(info.inici),
				endDate: this.parseEpoch(info.fin),
				isClosed,
				onlyClosedOnWeekDays: /laborable/i.test(observacions),
				type: TYPE_BY_CAUSA[info.causa ?? ''] ?? IncidentType.Other,
				coordinates: paths.map((path) => path.map(toLngLat)),
				meta: {
					idinciden: info.idinciden,
					causa: info.causa,
					afeccio: info.afeccio,
					gravetat: info.gravetat,
					observacions,
					sentit: info.sentit,
					pkinici: info.pkinici,
					pkfin: info.pkfin,
					desinici: info.desinici,
					desfin: info.desfin,
					hex_color: info.hex_color,
					url: info.url
				}
			});
		}
		return incidents;
	}

	/** `gravetat` is the controlled vocabulary; `afeccio` is the free-text label shown by the source. */
	private isRoadClosed(info: IncidentAttributes): boolean {
		return (
			info.gravetat?.trim().toUpperCase() === 'TANCADA' ||
			info.afeccio?.trim().toUpperCase() === 'TANCADA'
		);
	}

	/** Dates arrive as epoch milliseconds (UTC), so no zone handling is needed. */
	private parseEpoch(value: number | null | undefined): Date | undefined {
		if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
		return new Date(value);
	}

	/** Layers declare their own CRS: pass WGS84 through, reproject UTM 31N, reject anything else. */
	private coordinateMapper(
		layer: EsriLayer<unknown, unknown>
	): (point: number[]) => [number, number] {
		const wkid = layer.spatialReference?.latestWkid ?? layer.spatialReference?.wkid ?? WGS84_WKID;
		if (wkid === WGS84_WKID) return ([lng, lat]) => [lng, lat];
		if (UTM_31N_WKIDS.has(wkid)) return ([x, y]) => this.utm31nToLngLat([x, y]);
		throw new Error(`${this.name}: unsupported spatial reference ${wkid}`);
	}

	/** `label` (not the URL) goes into errors so query tokens never reach the logs. */
	private async fetchLayer<G, A>(
		fetch: typeof globalThis.fetch,
		url: string,
		label: string
	): Promise<EsriLayer<G, A>> {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`${this.name}: ${label} layer responded ${res.status}`);
		const layer = this.parseJsonOrJsonp<EsriLayer<G, A>>(await res.text());
		// ArcGIS reports failures with HTTP 200 and an `error` payload.
		if (layer.error) {
			throw new Error(`${this.name}: ${label} layer error: ${layer.error.message ?? 'unknown'}`);
		}
		if (!Array.isArray(layer.features)) {
			throw new Error(`${this.name}: ${label} layer has no features array`);
		}
		return layer;
	}
}
