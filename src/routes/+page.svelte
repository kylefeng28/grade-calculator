<script lang="ts">
	import CategoryManager from '$lib/components/CategoryManager.svelte';
	import GradeManager from '$lib/components/GradeManager.svelte';
	import { getOverallGrade } from '$lib/stores/grades.svelte';
</script>

<div class="mx-auto max-w-3xl px-4 py-8">
	<h1 class="mb-8 text-3xl font-bold text-gray-900">Grade Calculator</h1>

	<div class="space-y-8">
		<div class="rounded-lg bg-white p-6 shadow">
			<CategoryManager />
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<GradeManager />
		</div>

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
