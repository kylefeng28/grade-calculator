<script lang="ts">
	import {
		getClasses,
		getActiveClassId,
		setActiveClass,
		addClass,
		renameClass,
		removeClass
	} from '$lib/stores/grades.svelte';

	let adding = $state(false);
	let newName = $state('');
	let editingId = $state<string | null>(null);
	let editName = $state('');

	function handleAdd() {
		const name = newName.trim();
		if (!name) return;
		addClass(name);
		newName = '';
		adding = false;
	}

	function startRename(id: string, currentName: string) {
		editingId = id;
		editName = currentName;
	}

	function saveRename() {
		if (editingId && editName.trim()) {
			renameClass(editingId, editName.trim());
		}
		editingId = null;
	}

	function handleRenameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') saveRename();
		if (e.key === 'Escape') editingId = null;
	}

	function handleAddKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleAdd();
		if (e.key === 'Escape') {
			adding = false;
			newName = '';
		}
	}

	function handleRemove(id: string, name: string) {
		if (confirm(`Delete class "${name}"? This will remove all its data.`)) {
			removeClass(id);
		}
	}
</script>

<div class="mb-6 flex items-center gap-1 border-b border-gray-200">
	{#each getClasses() as cls (cls.id)}
		{#if editingId === cls.id}
			<div class="flex items-center border-b-2 border-indigo-500 px-1 pb-2">
				<input
					type="text"
					bind:value={editName}
					onblur={saveRename}
					onkeydown={handleRenameKeydown}
					class="w-28 rounded border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-indigo-500"
				/>
			</div>
		{:else}
			<button
				onclick={() => setActiveClass(cls.id)}
				ondblclick={() => startRename(cls.id, cls.name)}
				class={[
					'group relative flex items-center gap-1 border-b-2 px-3 pb-2 pt-1 text-sm font-medium transition-colors',
					cls.id === getActiveClassId()
						? 'border-indigo-500 text-indigo-600'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
				].join(' ')}
				title="Double-click to rename"
			>
				{cls.name}
				{#if getClasses().length > 1}
					<span
						role="button"
						tabindex="-1"
						onclick={(e) => { e.stopPropagation(); handleRemove(cls.id, cls.name); }}
						onkeydown={(e) => e.stopPropagation()}
						class="ml-1 hidden rounded text-gray-400 hover:text-red-500 group-hover:inline"
					>
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</span>
				{/if}
			</button>
		{/if}
	{/each}

	{#if adding}
		<div class="px-1 pb-2">
			<input
				type="text"
				bind:value={newName}
				placeholder="Class name"
				onblur={() => { if (!newName.trim()) adding = false; }}
				onkeydown={handleAddKeydown}
				class="w-28 rounded border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-indigo-500"
			/>
		</div>
	{:else}
		<button
			onclick={() => { adding = true; }}
			class="border-b-2 border-transparent px-2 pb-2 pt-1 text-sm text-gray-400 hover:text-gray-600"
			title="Add class"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
		</button>
	{/if}
</div>
