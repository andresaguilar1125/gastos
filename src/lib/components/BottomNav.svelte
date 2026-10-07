<script lang="ts">
	import { page } from '$app/state';
	import {
		LayoutDashboard,
		PiggyBank,
		UtensilsCrossed,
		Shapes,
		Receipt,
		ShoppingCart,
		Plane,
		Settings
	} from '@lucide/svelte';

	const mobileLinks = [
		{ href: '/', label: 'Inicio', icon: LayoutDashboard },
		{ href: '/ahorro', label: 'Ahorros', icon: PiggyBank },
		{ href: '/comida', label: 'Comida', icon: UtensilsCrossed },
		{ href: '/extras', label: 'Extras', icon: Shapes },
		{ href: '/recibos', label: 'Recibos', icon: Receipt },
		{ href: '/super', label: 'Super', icon: ShoppingCart },
		{ href: '/viajes', label: 'Viajes', icon: Plane },
		{ href: '/settings', label: 'Config', icon: Settings }
	];

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname === `${href}/`;
	}
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-[var(--safe-bottom)] shadow-lg dark:border-gray-800 dark:bg-gray-900 md:hidden"
	aria-label="Navegación principal"
>
	<ul class="no-scrollbar flex items-stretch gap-1 overflow-x-auto px-2 py-1.5">
		{#each mobileLinks as link}
			<li class="shrink-0">
				<a
					href={link.href}
					class="flex min-h-[44px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors {isActive(
						link.href
					)
						? 'text-primary'
						: 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'}"
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					<link.icon class="h-5 w-5" aria-hidden="true" />
					<span class="whitespace-nowrap">{link.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
