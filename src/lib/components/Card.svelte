<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		class?: string;
		children: Snippet;
		header?: Snippet;
		footer?: Snippet;
	}

	let { title, subtitle, class: className = '', children, header, footer }: Props = $props();
</script>

<section
	class="rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900 {className}"
>
	{#if header || title}
		<header class="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
			{#if header}
				{@render header()}
			{:else}
				<div>
					<h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
					{#if subtitle}
						<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
					{/if}
				</div>
			{/if}
		</header>
	{/if}

	<div class="px-5 py-4">
		{@render children()}
	</div>

	{#if footer}
		<footer class="border-t border-gray-100 px-5 py-3 dark:border-gray-800">
			{@render footer()}
		</footer>
	{/if}
</section>
