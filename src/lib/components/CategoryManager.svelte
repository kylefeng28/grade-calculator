<script lang="ts">
	import {
		getCategories,
		getTotalWeight,
		getCategoryAverages,
		addCategory,
		removeCategory,
		updateCategory,
		moveCategoryByIndex
	} from '$lib/stores/grades.svelte';

	let newName = $state('');
	let newWeight = $state(0);
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editWeight = $state(0);

	// Drag state
	let dragIndex = $state<number | null>(null);
	let dropTargetIndex = $state<number | null>(null);

	function handleAdd(e: Event) {
		e.preventDefault();
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

	function handleDragStart(index: number, e: DragEvent) {
		dragIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', '');
		}
	}

	function handleDragOver(index: number, e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dropTargetIndex = index;
	}

	function handleDrop(index: number, e: DragEvent) {
		e.preventDefault();
		if (dragIndex !== null) {
			moveCategoryByIndex(dragIndex, index);
		}
		dragIndex = null;
		dropTargetIndex = null;
	}

	function handleDragEnd() {
		dragIndex = null;
		dropTargetIndex = null;
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
				required
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
			/>
		</div>
		<div class="w-28">
			<label for="cat-weight" class="block text-sm font-medium text-gray-700">Weight %</label>
			<input
				id="cat-weight"
				type="number"
				bind:value={newWeight}
				min="1"
				max="100"
				required
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
						<th class="w-8 px-2 py-2"></th>
						<th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
						<th class="px-4 py-2 text-right text-sm font-medium text-gray-500">Weight</th>
						<th class="px-4 py-2 text-right text-sm font-medium text-gray-500">Average</th>
						<th class="px-4 py-2 text-right text-sm font-medium text-gray-500">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each getCategories() as cat, i (cat.id)}
						{#if editingId === cat.id}
							<tr>
								<td class="w-8 px-2 py-2"></td>
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
							<tr
								draggable="true"
								ondragstart={(e) => handleDragStart(i, e)}
								ondragover={(e) => handleDragOver(i, e)}
								ondrop={(e) => handleDrop(i, e)}
								ondragend={handleDragEnd}
								class={[
									'transition-colors',
									dragIndex === i ? 'opacity-50' : '',
									dropTargetIndex === i && dragIndex !== i
										? 'border-t-2 border-t-indigo-400'
										: ''
								].join(' ')}
							>
								<td class="w-8 cursor-grab px-2 py-2 text-center text-gray-400 active:cursor-grabbing">
									<svg class="inline h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
										<path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
									</svg>
								</td>
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
										title="Edit"
									>
										Edit
									</button>
									<button
										onclick={() => addCategory(cat.name + ' (copy)', cat.weight)}
										class="ml-2 text-sm text-gray-500 hover:text-gray-700"
										title="Duplicate"
									>
										<svg class="inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
										</svg>
									</button>
									<button
										onclick={() => removeCategory(cat.id)}
										class="ml-2 text-gray-400 hover:text-red-600"
										title="Remove"
									>
										<svg class="inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
										</svg>
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
