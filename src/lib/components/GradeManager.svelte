<script lang="ts">
	import {
		getCategories,
		getEntries,
		addEntry,
		removeEntry,
		updateEntry
	} from '$lib/stores/grades.svelte';

	let newName = $state('');
	let newCategoryId = $state('');
	let newScore = $state(0);
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editCategoryId = $state('');
	let editScore = $state(0);

	function handleAdd() {
		const name = newName.trim();
		if (!name || !newCategoryId) return;
		addEntry(name, newCategoryId, newScore);
		newName = '';
		newScore = 0;
	}

	function startEdit(entry: { id: string; name: string; categoryId: string; score: number }) {
		editingId = entry.id;
		editName = entry.name;
		editCategoryId = entry.categoryId;
		editScore = entry.score;
	}

	function saveEdit() {
		if (editingId && editName.trim() && editCategoryId) {
			updateEntry(editingId, editName.trim(), editCategoryId, editScore);
			editingId = null;
		}
	}

	function cancelEdit() {
		editingId = null;
	}

	function categoryName(categoryId: string): string {
		return getCategories().find((c) => c.id === categoryId)?.name ?? 'Unknown';
	}
</script>

<section>
	<h2 class="mb-4 text-xl font-semibold text-gray-800">Grades</h2>

	{#if getCategories().length === 0}
		<p class="text-sm text-gray-500">Add categories first before entering grades.</p>
	{:else}
		<form onsubmit={handleAdd} class="mb-4 flex items-end gap-3">
			<div class="flex-1">
				<label for="entry-name" class="block text-sm font-medium text-gray-700">Name</label>
				<input
					id="entry-name"
					type="text"
					bind:value={newName}
					placeholder="e.g. Quiz 1"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				/>
			</div>
			<div class="w-40">
				<label for="entry-category" class="block text-sm font-medium text-gray-700">Category</label>
				<select
					id="entry-category"
					bind:value={newCategoryId}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				>
					<option value="">Select...</option>
					{#each getCategories() as cat (cat.id)}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>
			</div>
			<div class="w-24">
				<label for="entry-score" class="block text-sm font-medium text-gray-700">Score %</label>
				<input
					id="entry-score"
					type="number"
					bind:value={newScore}
					min="0"
					max="100"
					step="any"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				/>
			</div>
			<button
				type="submit"
				class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
			>
				Add
			</button>
		</form>

		{#if getEntries().length > 0}
			<div class="overflow-hidden rounded-lg border border-gray-200">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
							<th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
							<th class="px-4 py-2 text-right text-sm font-medium text-gray-500">Score</th>
							<th class="px-4 py-2 text-right text-sm font-medium text-gray-500">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each getEntries() as entry (entry.id)}
							{#if editingId === entry.id}
								<tr>
									<td class="px-4 py-2">
										<input
											type="text"
											bind:value={editName}
											class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
										/>
									</td>
									<td class="px-4 py-2">
										<select
											bind:value={editCategoryId}
											class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
										>
											{#each getCategories() as cat (cat.id)}
												<option value={cat.id}>{cat.name}</option>
											{/each}
										</select>
									</td>
									<td class="px-4 py-2">
										<input
											type="number"
											bind:value={editScore}
											min="0"
											max="100"
											step="any"
											class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
										/>
									</td>
									<td class="px-4 py-2 text-right">
										<button
											onclick={saveEdit}
											class="text-sm text-indigo-600 hover:text-indigo-800"
										>
											Save
										</button>
										<button
											onclick={cancelEdit}
											class="ml-2 text-sm text-gray-500 hover:text-gray-700"
										>
											Cancel
										</button>
									</td>
								</tr>
							{:else}
								<tr>
									<td class="px-4 py-2 text-sm text-gray-900">{entry.name}</td>
									<td class="px-4 py-2 text-sm text-gray-600">{categoryName(entry.categoryId)}</td>
									<td class="px-4 py-2 text-right text-sm text-gray-900">{entry.score}%</td>
									<td class="px-4 py-2 text-right">
										<button
											onclick={() => startEdit(entry)}
											class="text-sm text-indigo-600 hover:text-indigo-800"
										>
											Edit
										</button>
										<button
											onclick={() => removeEntry(entry.id)}
											class="ml-2 text-sm text-red-600 hover:text-red-800"
										>
											Remove
										</button>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="text-sm text-gray-500">No grades entered yet.</p>
		{/if}
	{/if}
</section>
