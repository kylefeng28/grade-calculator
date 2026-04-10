<script lang="ts">
	import type { EntryMode } from '$lib/types';
	import {
		getCategories,
		getEntries,
		addEntry,
		removeEntry,
		updateEntry,
		moveEntryByIndex
	} from '$lib/stores/grades.svelte';

	let newName = $state('');
	let newCategoryId = $state('');
	let newScore = $state(0);
	let newMode = $state<EntryMode>('normal');
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editCategoryId = $state('');
	let editScore = $state(0);
	let editMode = $state<EntryMode>('normal');

	// Drag state
	let dragIndex = $state<number | null>(null);
	let dropTargetIndex = $state<number | null>(null);

	function handleAdd(e: Event) {
		e.preventDefault();
		const name = newName.trim();
		if (!name || !newCategoryId) return;
		addEntry(name, newCategoryId, newMode === 'normal' ? newScore : null, newMode);
		newName = '';
		newScore = 0;
		newMode = 'normal';
	}

	function startEdit(entry: { id: string; name: string; categoryId: string; score: number | null; mode: EntryMode }) {
		editingId = entry.id;
		editName = entry.name;
		editCategoryId = entry.categoryId;
		editMode = entry.mode;
		editScore = entry.score ?? 0;
	}

	function saveEdit() {
		if (editingId && editName.trim() && editCategoryId) {
			updateEntry(editingId, editName.trim(), editCategoryId, editMode === 'normal' ? editScore : null, editMode);
			editingId = null;
		}
	}

	function cancelEdit() {
		editingId = null;
	}

	function categoryName(categoryId: string): string {
		return getCategories().find((c) => c.id === categoryId)?.name ?? 'Unknown';
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
			moveEntryByIndex(dragIndex, index);
		}
		dragIndex = null;
		dropTargetIndex = null;
	}

	function handleDragEnd() {
		dragIndex = null;
		dropTargetIndex = null;
	}

	const modeOptions: { value: EntryMode; label: string; activeClass: string }[] = [
		{ value: 'normal', label: 'Score', activeClass: 'bg-indigo-100 text-indigo-700' },
		{ value: 'calculate', label: 'Calc', activeClass: 'bg-amber-100 text-amber-700' },
		{ value: 'whatif', label: 'What-If', activeClass: 'bg-blue-100 text-blue-700' }
	];
</script>

{#snippet modeToggle(currentMode: EntryMode, onchange: (mode: EntryMode) => void, size?: 'sm' | 'xs')}
	<fieldset class="flex overflow-hidden rounded-md border border-gray-300">
		{#each modeOptions as opt}
			<button
				type="button"
				onclick={() => onchange(opt.value)}
				class={[
					size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm',
					'whitespace-nowrap transition-colors',
					currentMode === opt.value ? opt.activeClass : 'bg-white text-gray-500 hover:bg-gray-50'
				].join(' ')}
			>
				{opt.label}
			</button>
		{/each}
	</fieldset>
{/snippet}

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
					required
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				/>
			</div>
			<div class="w-40">
				<label for="entry-category" class="block text-sm font-medium text-gray-700">Category</label>
				<select
					id="entry-category"
					bind:value={newCategoryId}
					required
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
					disabled={newMode !== 'normal'}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 sm:text-sm"
				/>
			</div>
			<div class="pb-0.5">
				{@render modeToggle(newMode, (m) => (newMode = m))}
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
							<th class="w-8 px-2 py-2"></th>
							<th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
							<th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
							<th class="px-4 py-2 text-right text-sm font-medium text-gray-500">Score</th>
							<th class="px-4 py-2 text-right text-sm font-medium text-gray-500">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each getEntries() as entry, i (entry.id)}
							{#if editingId === entry.id}
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
										<div class="flex items-center gap-2">
											<input
												type="number"
												bind:value={editScore}
												min="0"
												max="100"
												step="any"
												disabled={editMode !== 'normal'}
												class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 sm:text-sm"
											/>
											{@render modeToggle(editMode, (m) => (editMode = m), 'xs')}
										</div>
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
								<tr
									draggable="true"
									ondragstart={(e) => handleDragStart(i, e)}
									ondragover={(e) => handleDragOver(i, e)}
									ondrop={(e) => handleDrop(i, e)}
									ondragend={handleDragEnd}
									class={[
										entry.mode === 'calculate' ? 'bg-amber-50' : '',
										entry.mode === 'whatif' ? 'bg-blue-50' : '',
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
									<td class="px-4 py-2 text-sm text-gray-900">{entry.name}</td>
									<td class="px-4 py-2 text-sm text-gray-600">{categoryName(entry.categoryId)}</td>
									<td class="px-4 py-2 text-right text-sm">
										{#if entry.mode === 'calculate'}
											<span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
												Calculate
											</span>
										{:else if entry.mode === 'whatif'}
											<span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
												What-If
											</span>
										{:else}
											<span class="text-gray-900">{entry.score}%</span>
										{/if}
									</td>
									<td class="px-4 py-2 text-right">
										<button
											onclick={() => startEdit(entry)}
											class="text-sm text-indigo-600 hover:text-indigo-800"
											title="Edit"
										>
											Edit
										</button>
										<button
											onclick={() => addEntry(entry.name + ' (copy)', entry.categoryId, entry.score, entry.mode)}
											class="ml-2 text-sm text-gray-500 hover:text-gray-700"
											title="Duplicate"
										>
											<svg class="inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
											</svg>
										</button>
										<button
											onclick={() => removeEntry(entry.id)}
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
		{:else}
			<p class="text-sm text-gray-500">No grades entered yet.</p>
		{/if}
	{/if}
</section>
