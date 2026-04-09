<script lang="ts">
	import {
		getCalculateEntries,
		getCategories,
		calculateNeededScore
	} from '$lib/stores/grades.svelte';

	let targetGrade = $state(70);

	const calcEntries = $derived(getCalculateEntries());
	const neededScore = $derived(calculateNeededScore(targetGrade));

	function categoryName(categoryId: string): string {
		return getCategories().find((c) => c.id === categoryId)?.name ?? 'Unknown';
	}
</script>

{#if calcEntries.length > 0}
	<section class="rounded-lg bg-amber-50 p-6 shadow">
		<h2 class="mb-4 text-xl font-semibold text-gray-800">What Do I Need?</h2>

		<p class="mb-3 text-sm text-gray-600">
			Calculating the score needed on:
		</p>
		<ul class="mb-4 space-y-1">
			{#each calcEntries as entry (entry.id)}
				<li class="text-sm text-gray-700">
					<span class="font-medium">{entry.name}</span>
					<span class="text-gray-500">({categoryName(entry.categoryId)})</span>
				</li>
			{/each}
		</ul>

		<div class="flex items-end gap-3">
			<div class="w-40">
				<label for="target-grade" class="block text-sm font-medium text-gray-700">
					Target overall grade
				</label>
				<div class="mt-1 flex items-center gap-1">
					<input
						id="target-grade"
						type="number"
						bind:value={targetGrade}
						min="0"
						max="100"
						step="any"
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
					/>
					<span class="text-sm text-gray-500">%</span>
				</div>
			</div>
		</div>

		<div class="mt-4 rounded-md border border-amber-200 bg-white p-4">
			{#if Number.isNaN(neededScore)}
				<p class="text-sm text-gray-500">
					Cannot calculate — make sure you have categories with weight and at least one scored entry.
				</p>
			{:else if neededScore > 100}
				<p class="text-sm text-red-600">
					You would need <span class="font-bold">{neededScore.toFixed(1)}%</span> — this target is
					<span class="font-semibold">not achievable</span> even with a perfect score.
				</p>
			{:else if neededScore < 0}
				<p class="text-sm text-green-600">
					You've already surpassed this target! Even scoring 0% would give you above {targetGrade}%.
				</p>
			{:else}
				<p class="text-2xl font-bold text-amber-700">
					{neededScore.toFixed(1)}%
				</p>
				<p class="mt-1 text-sm text-gray-600">
					You need at least <span class="font-medium">{neededScore.toFixed(1)}%</span>
					{#if calcEntries.length === 1}
						on <span class="font-medium">{calcEntries[0].name}</span>
					{:else}
						on each remaining item
					{/if}
					to achieve an overall grade of {targetGrade}%.
				</p>
			{/if}
		</div>
	</section>
{/if}
