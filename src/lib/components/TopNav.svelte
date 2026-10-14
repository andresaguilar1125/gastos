<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { LayoutDashboard, Wallet, Settings, UtensilsCrossed, Shapes, Receipt, ShoppingCart, Plane } from '@lucide/svelte';

	const links = [
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

	/** Live height of the sticky bar, exposed as `--topnav-h` for stacked sticky elements. */
	let navH = $state(0);
	$effect(() => {
		document.documentElement.style.setProperty('--topnav-h', `${navH}px`);
	});
</script>

<header
	bind:clientHeight={navH}
	class="sticky top-0 z-50 border-b border-accent-4/20 bg-white/90 backdrop-blur"
	style="padding-top: max(0.5rem, var(--safe-top))"
>
	<div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
		<a href={`${base}/`} class="flex items-center gap-2 whitespace-nowrap">
			<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-3 text-white">
				<Wallet class="h-4.5 w-4.5" aria-hidden="true" />
			</span>
			<span class="text-lg font-bold tracking-tight text-accent-5">Gastos</span>
		</a>

		<nav
			class="no-scrollbar hidden flex-1 items-center gap-1 overflow-x-auto md:flex"
			aria-label="Navegación principal"
		>
			{#each links as link (link.href)}
				<a
					href={`${base}${link.href}`}
					class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActive(
						link.href
					)
						? 'bg-accent-3/10 text-accent-3'
						: 'text-accent-4 hover:bg-accent-4/10 hover:text-accent-5'}"
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					<link.icon class="h-4 w-4 shrink-0" aria-hidden="true" />
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-1">
			<a
				href={`${base}/settings`}
				class="rounded-lg border p-2 transition-colors {isActive('/settings')
					? 'border-accent-3 bg-accent-3/10 text-accent-3'
					: 'border-accent-4/20 text-accent-4 hover:bg-accent-4/10'}"
				aria-label="Configuración"
				title="Configuración"
				aria-current={isActive('/settings') ? 'page' : undefined}
			>
				<Settings class="h-5 w-5" />
			</a>
		</div>
	</div>
</header>
