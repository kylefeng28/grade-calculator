<script lang="ts">
	import {
		getCategories,
		getTotalWeight,
		getCategoryAverages,
		addCategory,
		removeCategory,
		updateCategory
	} from '$lib/stores/grades.svelte';

	let newName = $state('');
	let newWeight = $state(0);
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editWeight = $state(0);

	function handleAdd() {
		const name = newName.trim();
		if (!name || newWeight <= 0) return;
		addCategory(name, newWeight);
		newName = '';
		newWeight = 0;
	}

	function startEdit(cat: { id: string; name: string; weight: number }) {
		editingId = cat.id;
		editName = cat.name;
		editWeight = cat.weight;
	}

	function saveEdit() {
		if (editingId && editName.trim()) {
			updateCategory(editingId, editName.trim(), editWeight);
			editingId = null;
		}
	}

	function cancelEdit() {
		editingId = null;
	}
</script>

<section>
	<h2 class="mb-4 text-xl font-semibold text-gray-800">Grade Categories</h2>

	<form onsubmit={handleAdd} class="mb-4 flex items-end gap-3">
		<div class="flex-1">
			<label for="cat-name" class="block text-sm font-medium text-gray-700">Category Name</label>
			<input
				id="cat-name"
				type="text"
				bind:value={newName}
				placeholder="e.g. Quizzes"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
			/>
		</div>
		<div class="w-28">
			<label for="cat-weight" class="block text-sm font-medium text-gray-700">Weight %</label>
			<input
				id="cat-weight"
				type="number"
				bind:value={newWeight}
				min="0"
				max="100"
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

	{#if getCategories().length > 0}
		<div class="overflow-hidden rounded-lg border border-gray-200">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
						<th class="px-4 py-2 text-right text-sm font-medium text-gray-500">Weight</th>
						<th class="px-4 py-2 text-right text-sm font-medium text-gray-500">Average</th>
						<th class="px-4 py-2 text-right text-sm font-medium text-gray-500">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each getCategories() as cat (cat.id)}
						{#if editingId === cat.id}
							<tr>
								<td class="px-4 py-2">
									<input
										type="text"
										bind:value={editName}
										class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
									/>
								</td>
								<td class="px-4 py-2">
									<input
										type="number"
										bind:value={editWeight}
										min="0"
										max="100"
										class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
									/>
								</td>
								<td class="px-4 py-2"></td>
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
								<td class="px-4 py-2 text-sm text-gray-900">{cat.name}</td>
								<td class="px-4 py-2 text-right text-sm text-gray-900">{cat.weight}%</td>
								<td class="px-4 py-2 text-right text-sm text-gray-600">
									{#if getCategoryAverages().get(cat.id) !== undefined && !Number.isNaN(getCategoryAverages().get(cat.id))}
										{getCategoryAverages().get(cat.id)?.toFixed(1)}%
									{:else}
										<span class="text-gray-400">&mdash;</span>
									{/if}
								</td>
								<td class="px-4 py-2 text-right">
									<button
										onclick={() => startEdit(cat)}
										class="text-sm text-indigo-600 hover:text-indigo-800"
									>
										Edit
									</button>
									<button
										onclick={() => removeCategory(cat.id)}
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

		<p class="mt-2 text-sm text-gray-500">
			Total weight:
			<span class={getTotalWeight() === 100 ? 'font-medium text-green-600' : 'font-medium text-amber-600'}>
				{getTotalWeight()}%
			</span>
			{#if getTotalWeight() !== 100}
				<span class="text-amber-600">(should be 100%)</span>
			{/if}
		</p>
	{:else}
		<p class="text-sm text-gray-500">No categories yet. Add one above to get started.</p>
	{/if}
</section>
