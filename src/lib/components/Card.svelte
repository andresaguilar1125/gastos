<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		class?: string;
		/** Keep the header pinned below the top nav while the card scrolls. */
		stickyHeader?: boolean;
		children: Snippet;
		header?: Snippet;
		footer?: Snippet;
	}

	let {
		title,
		subtitle,
		class: className = '',
		stickyHeader = false,
		children,
		header,
		footer
	}: Props = $props();

	/** Header height, exposed as `--card-header-h` so stacked sticky rows can offset below it. */
	let headerH = $state(0);
	let sectionEl = $state<HTMLElement>();

	$effect(() => {
		if (!stickyHeader || !sectionEl) return;
		sectionEl.style.setProperty('--card-header-h', `${headerH}px`);
	});
</script>

<section
	bind:this={sectionEl}
	class="min-w-0 rounded-2xl border border-accent-4/20 bg-white shadow-sm transition-colors {className}"
>
	{#if header || title}
		<header
			bind:clientHeight={headerH}
			class="flex items-start justify-between gap-3 border-b border-accent-4/10 px-5 py-4 {stickyHeader
				? 'sticky top-[var(--topnav-h,0px)] z-30 rounded-t-2xl bg-white '
				: ''}"
		>
			{#if header}
				{@render header()}
			{:else}
				<div>
					<h2 class="text-base font-semibold text-accent-5">{title}</h2>
					{#if subtitle}
						<p class="mt-0.5 text-sm text-accent-4">{subtitle}</p>
					{/if}
				</div>
			{/if}
		</header>
	{/if}

	<div class="px-5 py-4">
		{@render children()}
	</div>

	{#if footer}
		<footer class="border-t border-accent-4/10 px-5 py-3">
			{@render footer()}
		</footer>
	{/if}
</section>
