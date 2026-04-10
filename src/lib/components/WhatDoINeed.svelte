<script lang="ts">
	import {
		getCalculateEntries,
		getCategories,
		getTargetGrade,
		setTargetGrade,
		calculateNeededScore,
		getCalculationBreakdown,
		getCalculationBreakdownForScenario,
		getScenarios,
		getWhatIfEntries,
		calculateNeededScoreForScenario,
		getScenarioOverallGrade
	} from '$lib/stores/grades.svelte';
	import type { CalcBreakdown } from '$lib/stores/grades.svelte';

	const calcEntries = $derived(getCalculateEntries());
	const neededScore = $derived(calculateNeededScore(getTargetGrade()));
	const breakdown = $derived(getCalculationBreakdown(getTargetGrade()));
	const scenarios = $derived(getScenarios());
	const hasWhatIf = $derived(getWhatIfEntries().length > 0);

	let showWork = $state(false);
	let showScenarioWork = $state<Record<string, boolean>>({});

	function categoryName(categoryId: string): string {
		return getCategories().find((c) => c.id === categoryId)?.name ?? 'Unknown';
	}
</script>

{#snippet scoreResult(score: number, label?: string)}
	{#if Number.isNaN(score)}
		<p class="text-sm text-gray-500">
			Cannot calculate — make sure you have categories with weight and at least one scored entry.
		</p>
	{:else if score > 100}
		<p class="text-sm text-red-600">
			You would need <span class="font-bold">{score.toFixed(2)}%</span>{label ? ` (${label})` : ''} — this target is
			<span class="font-semibold">not achievable</span> even with a perfect score.
		</p>
	{:else if score < 0}
		<p class="text-sm text-green-600">
			{label ? `${label}: ` : ''}You've already surpassed this target! Even scoring 0% would give you above {getTargetGrade()}%.
		</p>
	{:else}
		<p class="text-2xl font-bold text-amber-700">
			{score.toFixed(2)}%
		</p>
		<p class="mt-1 text-sm text-gray-600">
			{label ? `${label}: ` : ''}You need at least <span class="font-medium">{score.toFixed(2)}%</span>
			{#if calcEntries.length === 1}
				on <span class="font-medium">{calcEntries[0].name}</span>
			{:else}
				on each remaining item
			{/if}
			to achieve an overall grade of {getTargetGrade()}%.
		</p>
	{/if}
{/snippet}

{#snippet calculationWork(bd: CalcBreakdown)}
	<div class="mt-3 space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
		<!-- Step 1: Per-category breakdown table -->
		<div>
			<p class="mb-2 font-medium text-gray-700">Step 1: Category averages (X = unknown score)</p>
			<div class="overflow-x-auto">
				<table class="min-w-full text-left text-sm">
					<thead>
						<tr class="border-b border-gray-300 text-xs text-gray-500">
							<th class="pb-1 pr-4">Category</th>
							<th class="pb-1 pr-4">Weight</th>
							<th class="pb-1 pr-4">Known scores</th>
							<th class="pb-1 pr-4">Unknowns</th>
							<th class="pb-1">Average</th>
						</tr>
					</thead>
					<tbody>
						{#each bd.steps as step}
							<tr class="border-b border-gray-100">
								<td class="py-1 pr-4 font-medium text-gray-800">{step.categoryName}</td>
								<td class="py-1 pr-4 text-gray-600">{step.weight}%</td>
								<td class="py-1 pr-4 text-gray-600">
									{#if step.knownScores.length > 0}
										{step.knownScores.join(', ')}
										<span class="text-gray-400">(sum = {step.knownSum})</span>
									{:else}
										<span class="text-gray-400">none</span>
									{/if}
								</td>
								<td class="py-1 pr-4 text-gray-600">
									{#if step.calcCount > 0}
										{step.calcCount} × X
									{:else}
										<span class="text-gray-400">—</span>
									{/if}
								</td>
								<td class="py-1 font-mono text-gray-700">
									{step.avgExpr}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Step 2: Weighted sum equation -->
		<div>
			<p class="mb-2 font-medium text-gray-700">Step 2: Weighted overall grade equation</p>
			<div class="space-y-1 rounded bg-white p-3 font-mono text-xs leading-relaxed text-gray-700">
				<p>
					overall = Σ(category_avg × weight) / total_weight × 100
				</p>
				<p class="text-gray-500">
					where total weight used = {bd.weightUsed}%
				</p>
			</div>
		</div>

		<!-- Step 3: Solve -->
		<div>
			<p class="mb-2 font-medium text-gray-700">Step 3: Solve for X (target = {bd.targetGrade}%)</p>
			<div class="space-y-1 rounded bg-white p-3 font-mono text-xs leading-relaxed">
				{#each bd.solveSteps as step, i}
					<p class={i === bd.solveSteps.length - 1 ? 'font-semibold text-amber-700' : 'text-gray-700'}>
						{step}
					</p>
				{/each}
			</div>
		</div>
	</div>
{/snippet}

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
						value={getTargetGrade()}
						oninput={(e) => setTargetGrade(Number((e.target as HTMLInputElement).value))}
						min="0"
						max="100"
						step="any"
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
					/>
					<span class="text-sm text-gray-500">%</span>
				</div>
			</div>
		</div>

		<!-- Baseline result (without what-if entries) -->
		<div class="mt-4 rounded-md border border-amber-200 bg-white p-4">
			{#if hasWhatIf && scenarios.length > 0}
				<p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Baseline (current grades only)</p>
			{/if}
			{@render scoreResult(neededScore)}

			{#if breakdown}
				<button
					onclick={() => (showWork = !showWork)}
					class="mt-3 text-sm text-amber-700 underline decoration-amber-300 hover:text-amber-900"
				>
					{showWork ? 'Hide calculation' : 'Show calculation'}
				</button>
				{#if showWork}
					{@render calculationWork(breakdown)}
				{/if}
			{/if}
		</div>

		<!-- Per-scenario results -->
		{#if hasWhatIf && scenarios.length > 0}
			{#each scenarios as scenario (scenario.id)}
				{@const scenarioBreakdown = getCalculationBreakdownForScenario(getTargetGrade(), scenario.id)}
				<div class="mt-3 rounded-md border border-blue-200 bg-white p-4">
					<div class="mb-2 flex items-center justify-between">
						<p class="text-xs font-medium uppercase tracking-wide text-blue-600">{scenario.name}</p>
						<span class="text-xs text-gray-500">
							Projected grade: <span class="font-medium text-blue-700">{getScenarioOverallGrade(scenario.id).toFixed(2)}%</span>
						</span>
					</div>
					{@render scoreResult(calculateNeededScoreForScenario(getTargetGrade(), scenario.id), scenario.name)}

					{#if scenarioBreakdown}
						<button
							onclick={() => (showScenarioWork = { ...showScenarioWork, [scenario.id]: !showScenarioWork[scenario.id] })}
							class="mt-3 text-sm text-blue-700 underline decoration-blue-300 hover:text-blue-900"
						>
							{showScenarioWork[scenario.id] ? 'Hide calculation' : 'Show calculation'}
						</button>
						{#if showScenarioWork[scenario.id]}
							{@render calculationWork(scenarioBreakdown)}
						{/if}
					{/if}
				</div>
			{/each}
		{/if}
	</section>
{/if}
