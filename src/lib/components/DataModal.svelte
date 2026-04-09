<script lang="ts">
	import { exportData, importData } from '$lib/stores/grades.svelte';

	interface Props {
		onclose: () => void;
	}

	let { onclose }: Props = $props();

	let json = $state(exportData());
	let error = $state('');
	let successMsg = $state('');
	let fileInput = $state<HTMLInputElement | null>(null);

	function handleLoadFromJson() {
		error = '';
		successMsg = '';
		try {
			importData(json);
			successMsg = 'Data loaded successfully.';
		} catch {
			error = 'Invalid JSON format. Check your data and try again.';
		}
	}

	function handleExportFile() {
		// Refresh textarea to current state before downloading
		json = exportData();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'grades.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleImportFile() {
		fileInput?.click();
	}

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		error = '';
		successMsg = '';
		const reader = new FileReader();
		reader.onload = () => {
			const text = reader.result as string;
			try {
				// Validate before putting in textarea
				JSON.parse(text);
				json = text;
				successMsg = 'File loaded into editor. Click "Load from JSON" to apply.';
			} catch {
				error = 'File does not contain valid JSON.';
			}
		};
		reader.readAsText(file);
		input.value = '';
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
	onclick={handleBackdropClick}
	onkeydown={handleKeydown}
	role="dialog"
	aria-modal="true"
	aria-label="Import / Export data"
>
	<div class="mx-4 flex max-h-[80vh] w-full max-w-xl flex-col rounded-lg bg-white shadow-xl">
		<div class="flex items-center justify-between border-b px-6 py-4">
			<h2 class="text-lg font-semibold text-gray-900">Import / Export</h2>
			<button
				onclick={onclose}
				class="text-gray-400 hover:text-gray-600"
				aria-label="Close"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="flex-1 overflow-y-auto px-6 py-4">
			{#if error}
				<div class="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
			{/if}
			{#if successMsg}
				<div class="mb-3 rounded-md bg-green-50 p-3 text-sm text-green-700">{successMsg}</div>
			{/if}

			<label for="json-editor" class="block text-sm font-medium text-gray-700">
				Grade data (JSON)
			</label>
			<textarea
				id="json-editor"
				bind:value={json}
				rows="14"
				spellcheck="false"
				class="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
			></textarea>
		</div>

		<div class="flex flex-wrap items-center gap-2 border-t px-6 py-4">
			<button
				onclick={handleLoadFromJson}
				class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
			>
				Load from JSON
			</button>
			<button
				onclick={handleExportFile}
				class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
			>
				Export to file
			</button>
			<button
				onclick={handleImportFile}
				class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
			>
				Import from file
			</button>
			<div class="flex-1"></div>
			<button
				onclick={onclose}
				class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
			>
				Close
			</button>
		</div>

		<input
			bind:this={fileInput}
			type="file"
			accept=".json"
			class="hidden"
			onchange={handleFileChange}
		/>
	</div>
</div>
