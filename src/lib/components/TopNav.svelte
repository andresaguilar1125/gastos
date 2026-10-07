<script lang="ts">
	import { page } from '$app/state';
	import { theme } from '$lib/ui/theme';
	import { Sun, Moon, Wallet, Settings } from '@lucide/svelte';

	const links = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/ahorro', label: 'Ahorros' },
		{ href: '/comida', label: 'Comida' },
		{ href: '/extras', label: 'Extras' },
		{ href: '/recibos', label: 'Recibos' },
		{ href: '/super', label: 'Super' },
		{ href: '/viajes', label: 'Viajes' }
	];

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname === `${href}/`;
	}

	function toggleTheme() {
		theme.toggle();
	}
</script>

<header
	class="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90"
	style="padding-top: max(0.5rem, var(--safe-top))"
>
	<div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
		<a href="/" class="flex items-center gap-2 whitespace-nowrap">
			<span
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white"
			>
				<Wallet class="h-4.5 w-4.5" aria-hidden="true" />
			</span>
			<span class="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">Gastos</span>
		</a>

		<nav
			class="no-scrollbar hidden flex-1 items-center gap-1 overflow-x-auto md:flex"
			aria-label="Navegación principal"
		>
			{#each links as link}
				<a
					href={link.href}
					class="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActive(
						link.href
					)
						? 'bg-primary/10 text-primary'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'}"
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-1">
			<a
				href="/settings"
				class="rounded-lg border p-2 transition-colors {isActive('/settings')
					? 'border-primary bg-primary/10 text-primary'
					: 'border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'}"
				aria-label="Configuración"
				title="Configuración"
				aria-current={isActive('/settings') ? 'page' : undefined}
			>
				<Settings class="h-5 w-5" />
			</a>

			<button
				type="button"
				onclick={toggleTheme}
				class="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
				aria-label="Cambiar tema"
				title="Cambiar tema"
			>
				{#if $theme === 'dark'}
					<Sun class="h-5 w-5" />
				{:else}
					<Moon class="h-5 w-5" />
				{/if}
			</button>
		</div>
	</div>
</header>
