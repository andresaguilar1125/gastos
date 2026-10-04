<script lang="ts">
	import { page } from '$app/state';
	import { theme } from '$lib/ui/theme';
	import { Sun, Moon, LayoutDashboard, ShoppingCart, Receipt, Plane, Settings } from '@lucide/svelte';

	const links = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/super', label: 'Super' },
		{ href: '/recibos', label: 'Recibos' },
		{ href: '/viajes', label: 'Viajes' },
		{ href: '/settings', label: 'Settings' }
	];

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname === `${href}/`;
	}

	function toggleTheme() {
		theme.toggle();
	}
</script>

<header
	class="sticky top-0 z-50 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90"
	style="padding-top: max(0.75rem, var(--safe-top))"
>
	<div class="mx-auto flex max-w-7xl items-center justify-between">
		<a href="/" class="text-lg font-bold text-primary">Finanzas CRC</a>

		<nav class="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
			{#each links as link}
				<a
					href={link.href}
					class="rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActive(link.href)
						? 'bg-primary/10 text-primary'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'}"
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<button
			type="button"
			onclick={toggleTheme}
			class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
			aria-label="Cambiar tema"
		>
			{#if $theme === 'dark'}
				<Sun class="h-5 w-5" />
			{:else}
				<Moon class="h-5 w-5" />
			{/if}
		</button>
	</div>
</header>
