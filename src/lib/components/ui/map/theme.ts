type Theme = "light" | "dark";

export function resolveMapTheme({
	explicitTheme,
	ambientTheme,
}: {
	explicitTheme?: Theme;
	ambientTheme: Theme;
}): Theme {
	return explicitTheme ?? ambientTheme;
}
