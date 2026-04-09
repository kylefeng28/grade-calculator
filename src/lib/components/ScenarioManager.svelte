<script lang="ts">
	import {
		getCategories,
		getScenarios,
		getWhatIfEntries,
		addScenario,
		removeScenario,
		renameScenario,
		setScenarioScore,
		getScenarioOverallGrade
	} from '$lib/stores/grades.svelte';

	let editingId = $state<string | null>(null);
	let editName = $state('');

	function handleAdd() {
		const num = getScenarios().length + 1;
		addScenario(`Scenario ${String.fromCharCode(64 + num)}`);
	}

	function startRename(id: string, name: string) {
		editingId = id;
		editName = name;
	}

	function saveRename() {
		if (editingId && editName.trim()) {
			renameScenario(editingId, editName.trim());
		}
		editingId = null;
	}

	function handleRenameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') saveRename();
		if (e.key === 'Escape') editingId = null;
	}

	function handleRemove(id: string, name: string) {
		if (confirm(`Delete scenario "${name}"?`)) {
			removeScenario(id);
		}
	}

	function categoryName(categoryId: string): string {
		return getCategories().find((c) => c.id === categoryId)?.name ?? 'Unknown';
	}

	function formatGrade(grade: number): string {
		if (Number.isNaN(grade)) return '—';
		return `${grade.toFixed(1)}%`;
	}
</script>

<section>
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-xl font-semibold text-gray-800">What-If Scenarios</h2>
		<button
			onclick={handleAdd}
			class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
		>
			Add Scenario
		</button>
	</div>

	{#if getWhatIfEntries().length === 0}
		<p class="text-sm text-gray-500">
			Add grade entries with "What-If" mode to create scenarios.
		</p>
	{:else if getScenarios().length === 0}
		<p class="text-sm text-gray-500">
			No scenarios yet. Click "Add Scenario" to create one and assign hypothetical scores to your what-if entries.
		</p>
	{:else}
		<div class="space-y-4">
			{#each getScenarios() as scenario (scenario.id)}
				<div class="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
					<div class="mb-3 flex items-center justify-between">
						{#if editingId === scenario.id}
							<input
								type="text"
								bind:value={editName}
								onblur={saveRename}
								onkeydown={handleRenameKeydown}
								class="rounded border-gray-300 px-2 py-1 text-sm font-semibold focus:border-blue-500 focus:ring-blue-500"
							/>
						{:else}
							<button
								ondblclick={() => startRename(scenario.id, scenario.name)}
								class="text-sm font-semibold text-gray-800"
								title="Double-click to rename"
							>
								{scenario.name}
							</button>
						{/if}
						<div class="flex items-center gap-3">
							<span class="text-sm text-gray-600">
								Projected:
								<span class="font-semibold text-blue-700">
									{formatGrade(getScenarioOverallGrade(scenario.id))}
								</span>
							</span>
							<button
								onclick={() => handleRemove(scenario.id, scenario.name)}
								class="text-sm text-red-500 hover:text-red-700"
							>
								Delete
							</button>
						</div>
					</div>

					<div class="overflow-hidden rounded-md border border-blue-200 bg-white">
						<table class="min-w-full divide-y divide-blue-100">
							<thead class="bg-blue-50">
								<tr>
									<th class="px-3 py-1.5 text-left text-xs font-medium text-gray-500">Entry</th>
									<th class="px-3 py-1.5 text-left text-xs font-medium text-gray-500">Category</th>
									<th class="px-3 py-1.5 text-right text-xs font-medium text-gray-500">Score %</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-blue-50">
								{#each getWhatIfEntries() as entry (entry.id)}
									<tr>
										<td class="px-3 py-1.5 text-sm text-gray-900">{entry.name}</td>
										<td class="px-3 py-1.5 text-sm text-gray-600">{categoryName(entry.categoryId)}</td>
										<td class="px-3 py-1.5 text-right">
											<input
												type="number"
												value={scenario.scores[entry.id] ?? 0}
												oninput={(e) => setScenarioScore(scenario.id, entry.id, Number((e.target as HTMLInputElement).value))}
												min="0"
												max="100"
												step="any"
												class="w-20 rounded border-gray-300 text-right text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
											/>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
