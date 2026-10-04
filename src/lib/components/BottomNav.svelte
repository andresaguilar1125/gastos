<script lang="ts">
	import { page } from '$app/state';
	import { theme } from '$lib/ui/theme';
	import { Sun, Moon, LayoutDashboard, ShoppingCart, Receipt, Plane, Settings } from '@lucide/svelte';

	const mobileLinks = [
		{ href: '/', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/super', label: 'Super', icon: ShoppingCart },
		{ href: '/recibos', label: 'Recibos', icon: Receipt },
		{ href: '/viajes', label: 'Viajes', icon: Plane },
		{ href: '/settings', label: 'Settings', icon: Settings }
	];

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname === `${href}/`;
	}

	function toggleTheme() {
		theme.toggle();
	}
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-2 pb-[var(--safe-bottom)] pt-2 shadow-lg dark:border-gray-800 dark:bg-gray-900 md:hidden"
	aria-label="Navegación principal"
>
	<ul class="flex items-center justify-around">
		{#each mobileLinks as link}
			<li class="flex-1">
				<a
					href={link.href}
					class="flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors {isActive(link.href)
						? 'text-primary'
						: 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'}"
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					<link.icon class="h-6 w-6" aria-hidden="true" />
					<span>{link.label}</span>
				</a>
			</li>
		{/each}
		<li class="flex-1">
			<button
				type="button"
				onclick={toggleTheme}
				class="flex w-full flex-col items-center justify-center gap-1 rounded-lg p-2 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
				aria-label="Cambiar tema"
			>
				{#if $theme === 'dark'}
					<Sun class="h-6 w-6" aria-hidden="true" />
				{:else}
					<Moon class="h-6 w-6" aria-hidden="true" />
				{/if}
				<span>Tema</span>
			</button>
		</li>
	</ul>
</nav>
