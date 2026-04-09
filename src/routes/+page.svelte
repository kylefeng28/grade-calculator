<script lang="ts">
	import CategoryManager from '$lib/components/CategoryManager.svelte';
	import GradeManager from '$lib/components/GradeManager.svelte';
	import WhatDoINeed from '$lib/components/WhatDoINeed.svelte';
	import DataModal from '$lib/components/DataModal.svelte';
	import {
		getOverallGrade,
		getCategories,
		resetAll
	} from '$lib/stores/grades.svelte';

	let showDataModal = $state(false);

	function handleReset() {
		if (confirm('Are you sure you want to reset all data?')) {
			resetAll();
		}
	}
</script>

<div class="mx-auto max-w-3xl px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">Grade Calculator</h1>
		<div class="flex gap-2">
			<button
				onclick={() => (showDataModal = true)}
				class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
			>
				Import / Export
			</button>
			<button
				onclick={handleReset}
				disabled={getCategories().length === 0}
				class="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-white"
			>
				Reset
			</button>
		</div>
	</div>

	<div class="space-y-8">
		<div class="rounded-lg bg-white p-6 shadow">
			<CategoryManager />
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<GradeManager />
		</div>

		<WhatDoINeed />

		{#if !Number.isNaN(getOverallGrade())}
			<div class="rounded-lg bg-indigo-50 p-6 shadow">
				<h2 class="text-xl font-semibold text-gray-800">Overall Grade</h2>
				<p class="mt-2 text-4xl font-bold text-indigo-700">
					{getOverallGrade().toFixed(1)}%
				</p>
				<p class="mt-1 text-sm text-gray-500">
					Weighted average across categories with grades entered
				</p>
			</div>
		{/if}
	</div>
</div>

{#if showDataModal}
	<DataModal onclose={() => (showDataModal = false)} />
{/if}
