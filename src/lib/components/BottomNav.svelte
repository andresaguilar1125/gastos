<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { LayoutDashboard, UtensilsCrossed, Shapes, Receipt, ShoppingCart, Plane } from '@lucide/svelte';

	const mobileLinks = [
		{ href: '/', label: 'Inicio', icon: LayoutDashboard },
		{ href: '/comida', label: 'Comida', icon: UtensilsCrossed },
		{ href: '/extras', label: 'Extras', icon: Shapes },
		{ href: '/recibos', label: 'Recibos', icon: Receipt },
		{ href: '/super', label: 'Super', icon: ShoppingCart },
		{ href: '/viajes', label: 'Viajes', icon: Plane }
	];

	/** Active when the current path (minus the deploy base) matches `href`. */
	function isActive(href: string) {
		const path = page.url.pathname;
		const clean = base && path.startsWith(base) ? path.slice(base.length) || '/' : path;
		return clean === href || clean === `${href}/`;
	}
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-50 border-t border-accent-4/20 bg-white pb-[var(--safe-bottom)] shadow-lg md:hidden"
	aria-label="Navegación principal"
>
	<ul class="flex items-stretch px-1 py-1.5">
		{#each mobileLinks as link (link.href)}
			<li class="min-w-0 flex-1">
				<a
					href={`${base}${link.href}`}
					class="flex min-h-[44px] w-full flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[11px] font-medium transition-colors {isActive(
						link.href
					)
						? 'text-accent-3'
						: 'text-accent-4 hover:bg-accent-4/10 hover:text-accent-5 '}"
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					<link.icon class="h-5 w-5 shrink-0" aria-hidden="true" />
					<span class="w-full truncate text-center">{link.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
