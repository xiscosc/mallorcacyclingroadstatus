/**
 * Mallorca roads commonly ridden by road cyclists.
 *
 * Scope: Mallorca 312 / 226 / 167 corridors, Serra de Tramuntana classics,
 * Formentor / north coast, and common Raiguer / Pla / Llevant / Migjorn feeders.
 *
 * Excluded fully (motorways / autovías where bikes are banned):
 *   Ma-1, Ma-13, Ma-19, Ma-20, Ma-30 (Segon Cinturó, in conversion).
 *
 * Excluded by segment only (rest of the road is cyclable):
 *   Ma-11  → Túnel de Sóller banned, surface road OK
 *   Ma-11A → Túnel de Sa Mola banned, rest of Coll de Sóller old road OK
 *   Ma-15  → Palma–Manacor autovía (km 0–47) banned; Manacor–Capdepera OK
 *
 * Legal access is segment-specific; for routing, prefer OSM access tags or
 * road geometry over a road-number whitelist.
 */
export type CyclingRoadRegion = {
	readonly id: string;
	readonly name: string;
	readonly description: string;
	readonly roads: readonly string[];
};

export const CYCLING_ROAD_REGIONS: readonly CyclingRoadRegion[] = [
	{
		id: 'tramuntana-core',
		name: 'Tramuntana core',
		description: 'Andratx–Pollença backbone, Sa Calobra, Lluc and Sóller climbs.',
		roads: [
			'Ma-10', // Andratx–Pollença: iconic Tramuntana backbone
			'Ma-11', // Surface sections Palma–Bunyola and Sóller–Port de Sóller
			'Ma-11A', // Coll de Sóller old road (Túnel de Sa Mola banned)
			'Ma-11B', // Sóller–Port de Sóller variant
			'Ma-2100', // Bunyola–Orient–Alaró (Coll d'Orient / Coll d'Honor)
			'Ma-2120', // Ma-10–Fornalutx access
			'Ma-2121', // Sóller–Fornalutx / Biniaraix area
			'Ma-2122', // Sóller (Camí de Ses Argiles)–Ma-10
			'Ma-2123', // Ses Argiles / Sóller connector
			'Ma-2124', // Sa Figuera / Port de Sóller connector
			'Ma-2125', // Port de Sóller local connector
			'Ma-2130', // Inca–Caimari–Lluc (Coll de sa Batalla / Caimari climb)
			'Ma-2140', // Ma-10 → Monestir de Lluc spur
			'Ma-2141' // Sa Calobra: the famous dead-end descent/climb
		]
	},
	{
		id: 'tramuntana-south-west',
		name: 'Tramuntana south-west',
		description: 'Andratx and Palma side: Valldemossa, Esporles, Puigpunyent, Banyalbufar.',
		roads: [
			'Ma-1012', // Peguera–Es Capdellà
			'Ma-1015', // Palmanova / Santa Ponsa–Calvià
			'Ma-1016', // Establiments–Calvià
			'Ma-1020', // Port d'Andratx–Camp de Mar
			'Ma-1021', // Port d'Andratx connector
			'Ma-1022', // Ma-10 (Establiments)–Esporles via Coll des Tords
			'Ma-1030', // Andratx–Sant Elm
			'Ma-1031', // Andratx–Es Capdellà
			'Ma-1032', // Es Capdellà–Puigpunyent
			'Ma-1040', // Palma–Valldemossa
			'Ma-1041', // Palma (Génova)–Puigpunyent gateway
			'Ma-1042', // Ma-1041 spur–Establiments
			'Ma-1043', // Palma (Génova)–Coll de Sa Creu–Calvià
			'Ma-1050', // Ma-10 (Esporles jct)–Banyalbufar / Andratx–S'Arracó
			'Ma-1100', // Ma-10–Esporles
			'Ma-1101', // Puigpunyent–Esporles
			'Ma-1110', // Palma–Valldemossa / S'Esgleieta
			'Ma-1120', // S'Esgleieta–Esporles
			'Ma-1130', // Palma (Ma-20 exit 5B)–Valldemossa
			'Ma-1131', // Valldemossa–Port de Valldemossa hairpins
			'Ma-1134', // Ma-11 spur–Port de Sóller
			'Ma-1140', // S'Esgleieta–Palmanyola
			'Ma-1150' // Port de Sóller lighthouse road
		]
	},
	{
		id: 'tramuntana-raiguer',
		name: 'Tramuntana Raiguer laterals',
		description: 'Foothill connectors between Bunyola, Santa Maria, Alaró, Lloseta and Selva.',
		roads: [
			'Ma-2010', // Ma-11–Bunyola town
			'Ma-2020', // Santa Maria–Bunyola
			'Ma-2021', // Santa Maria–Alaró
			'Ma-2022', // Consell–Alaró
			'Ma-2030', // Palmanyola–Bunyola
			'Ma-2031', // Camí vell de Bunyola
			'Ma-2032', // Bunyola / Santa Maria connector
			'Ma-2040', // Santa Maria / Consell–Alaró valley access
			'Ma-2050', // Foothill access (Alaró)
			'Ma-2110', // Lloseta–Alaró
			'Ma-2111', // Lloseta
			'Ma-2112', // Lloseta–Selva / Inca–Mancor de la Vall
			'Ma-2113', // Lloseta–Mancor connector / Lloseta–Biniamar
			'Ma-2114', // Mancor–Selva
			'Ma-2131', // Selva–Campanet
			'Ma-2132' // Ma-13A–Campanet
		]
	},
	{
		id: 'formentor-north',
		name: 'Cap de Formentor & North',
		description: 'Pollença, Port de Pollença, Formentor and Alcúdia approaches.',
		roads: [
			'Ma-2200', // Pollença–Port de Pollença
			'Ma-2201', // Pollença–Alcúdia (Camí Vell)
			'Ma-2202', // Pollença–Port de Pollença connector
			'Ma-2203', // Ma-2200–Cala Sant Vicenç
			'Ma-2210', // Port de Pollença–Cap de Formentor
			'Ma-2220', // Alcúdia–Port de Pollença
			'Ma-2240' // Punta de l'Avançada
		]
	},
	{
		id: 'north-coast-feeders',
		name: 'North coast feeders',
		description: 'Mallorca 312 corridor: Alcúdia, Can Picafort, Muro, Sa Pobla, Santa Margalida.',
		roads: [
			'Ma-12', // Alcúdia–Can Picafort–Artà coast
			'Ma-3400', // Santa Margalida–Son Serra de Marina
			'Ma-3401', // Santa Margalida connector
			'Ma-3402', // Santa Margalida / Ma-3410 connector
			'Ma-3410', // Santa Margalida–Can Picafort
			'Ma-3411', // Santa Margalida–Muro
			'Ma-3412', // Santa Margalida connector
			'Ma-3413', // Can Picafort connector
			'Ma-3420', // Sa Pobla area
			'Ma-3421', // Sa Pobla / Inca-side connector
			'Ma-3422', // Búger–Sa Pobla
			'Ma-3423', // Búger connector
			'Ma-3430', // Sa Pobla–Santa Margalida
			'Ma-3431', // Muro–Can Picafort / Marjals
			'Ma-3432', // Muro–Son Morey
			'Ma-3433', // Sa Pobla–Platja de Muro / Albufera
			'Ma-3440', // Inca–Santa Margalida / Muro area (Pollença–Muro)
			'Ma-3441', // Llubí connector
			'Ma-3442', // Ma-3440–Muro connector
			'Ma-3443', // Ma-3440–Ma-3430 connector
			'Ma-3450', // Sa Pobla ring road / connector
			'Ma-3460', // Port d'Alcúdia
			'Ma-3470' // Platja de Muro / es Murterar connector
		]
	},
	{
		id: 'pla-central',
		name: 'Pla / Central inland',
		description: 'Old Palma–Inca–Alcúdia corridor and the inland villages of the Pla.',
		roads: [
			'Ma-13A', // Old Palma–Inca–Alcúdia road: primary inland flat corridor
			'Ma-19A', // Palma–Llucmajor parallel to Ma-19 autovía
			'Ma-3010', // Marratxí (Pòrtol)–Santa Maria
			'Ma-3011', // Palma (Son Ferriol)–Sineu
			'Ma-3120', // Sencelles area
			'Ma-3121', // Costitx area
			'Ma-3130', // Sineu–Lloret–Pina–Algaida
			'Ma-3132', // Ma-3130–Petra
			'Ma-3220', // Sant Joan–Petra
			'Ma-3222', // Ma-15–Sant Joan
			'Ma-3240', // Inca–Sineu–Costitx
			'Ma-3241', // Inca–Sineu–Costitx (lateral)
			'Ma-3300', // Sineu–Petra link
			'Ma-3301', // Sineu–Ariany
			'Ma-3310', // Ma-15–Petra
			'Ma-3320', // Manacor–Petra
			'Ma-3321', // Manacor (Camí de Bendrís)–Ma-3330
			'Ma-3322', // Conies / Ma-3321–Sant Llorenç connector
			'Ma-3323', // Camí de Calicant–Sant Llorenç
			'Ma-3330', // Petra / Manacor–Sant Llorenç direction
			'Ma-3340', // Petra–Santa Margalida / Ariany corridor
			'Ma-3341', // Sineu–Ariany branch
			'Ma-3342', // Maria de la Salut connector
			'Ma-3500', // Ma-3440–Muro (Vall de Muro)
			'Ma-3501', // Muro–Sa Pobla
			'Ma-3510', // Sineu–Llubí / Maria de la Salut
			'Ma-3511', // Llubí–Maria de la Salut / Sineu–Llubí
			'Ma-3512', // Maria de la Salut–Muro / Ma-3440 connector
			'Ma-3513', // Maria de la Salut–Ma-3440 connector
			'Ma-3520', // Maria de la Salut connector
			'Ma-3521' // Maria de la Salut / Muro connector
		]
	},
	{
		id: 'llevant',
		name: 'Llevant (east)',
		description: 'Manacor, Sant Llorenç, Artà, Capdepera and the Coves d’Artà coast.',
		roads: [
			'Ma-15', // Manacor–Sant Llorenç–Artà–Capdepera (NOT the Palma–Manacor autovía)
			'Ma-15A', // Old-road bypass parallel to Ma-15 autovía
			'Ma-3331', // Ma-12–Colònia de Sant Pere / Ermita de Betlem approach
			'Ma-3333', // Artà–Ermita de Betlem climb
			'Ma-3334', // Artà–Ses Fulles
			'Ma-4020', // Manacor–Porto Cristo
			'Ma-4021', // Son Carrió–S'Illot
			'Ma-4022', // Sant Llorenç–Son Carrió
			'Ma-4023', // Porto Cristo–Sa Coma–Cala Millor–Son Servera
			'Ma-4024', // Porto Cristo–Son Carrió (inland alternative)
			'Ma-4030', // Sant Llorenç–Son Servera
			'Ma-4040', // Son Servera–Capdepera (Coll des Vidriers)
			'Ma-4042', // Artà–Coves d'Artà / Canyamel
			'Ma-4050' // Capdepera–Far de Capdepera
		]
	},
	{
		id: 'migjorn-southeast',
		name: 'Migjorn / South-east',
		description: 'Felanitx and Santanyí area: Sant Salvador, Portocolom and Cales de Mallorca.',
		roads: [
			'Ma-14', // Santanyí–Felanitx: SE spine
			'Ma-4010', // Felanitx–Portocolom
			'Ma-4011', // Santuari de Sant Salvador climb
			'Ma-4012', // Portocolom–Cala Marçal / Cala Sa Nau
			'Ma-4014', // Portocolom–Porto Cristo via Cales de Mallorca
			'Ma-4015', // Ma-4014–Manacor (ronda des Port)
			'Ma-4016' // Ma-14 (Es Carritxó)–S'Horta
		]
	},
	{
		id: 'south-migjorn',
		name: 'South / Migjorn',
		description: 'Llucmajor, Randa, Porreres, Campos and the Santanyí coast.',
		roads: [
			'Ma-5010', // Llucmajor–Algaida (Randa loop axis)
			'Ma-5017', // Ma-5010–Randa village
			'Ma-5018', // Randa–Santuari de Cura climb
			'Ma-5020', // Llucmajor–Porreres
			'Ma-5040', // Porreres–Campos
			'Ma-5100', // Porreres–Felanitx
			'Ma-5101', // Porreres–Ma-5111
			'Ma-5110', // Petra / Manacor area–Felanitx
			'Ma-5111', // Ma-5110–Vilafranca
			'Ma-5120', // Campos–Felanitx
			'Ma-6014', // S'Arenal–Cap Blanc–Salobrar de Campos
			'Ma-6015', // Llucmajor–S'Estanyol
			'Ma-6020', // Llucmajor–Son Noguera–Ma-6014
			'Ma-6021', // S'Estanyol–Sa Ràpita
			'Ma-6030', // Campos–Sa Ràpita / Es Trenc
			'Ma-6040', // Campos–Colònia de Sant Jordi
			'Ma-6100', // Santanyí–Ses Salines–Colònia de Sant Jordi
			'Ma-6101', // Ses Salines–Salobrar / Ma-6014 jct
			'Ma-6102', // Santanyí–Cala Figuera
			'Ma-6110' // Ma-6100–Far de Cap de Ses Salines
		]
	}
];

export const CYCLING_ROADS: readonly string[] = CYCLING_ROAD_REGIONS.flatMap((r) => r.roads);
