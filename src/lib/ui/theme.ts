export function setPageTitle(title: string) {
	if (typeof document !== 'undefined') {
		document.title = `${title} | Gastos`;
	}
}
