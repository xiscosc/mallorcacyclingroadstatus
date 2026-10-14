export type RideWithGpsRouteSummary = {
	id: string;
	name: string;
	/** Distance in meters. */
	distance: number;
	/** Elevation gain in meters. */
	elevationGain: number;
	private: boolean;
};

/** Extract the route id from a ridewithgps.com URL (e.g. https://ridewithgps.com/routes/12345). */
export function parseRideWithGpsUrl(input: string): { routeId: string } | null {
	try {
		const url = new URL(input);
		if (!/(^|\.)ridewithgps\.com$/.test(url.hostname)) return null;
		const m = url.pathname.match(/^\/routes\/(\d+)/);
		if (!m) return null;
		return { routeId: m[1] };
	} catch {
		return null;
	}
}
