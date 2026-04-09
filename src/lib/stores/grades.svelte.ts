import { browser } from '$app/environment';
import type { GradeCategory, GradeEntry } from '$lib/types';

const STORAGE_KEY = 'grade-calculator-data';

let nextId = 0;
function genId(): string {
	return `id-${nextId++}-${Date.now()}`;
}

interface StoredData {
	categories: GradeCategory[];
	entries: GradeEntry[];
}

function loadFromStorage(): StoredData {
	if (!browser) return { categories: [], entries: [] };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { categories: [], entries: [] };
		const data = JSON.parse(raw) as StoredData;
		if (!Array.isArray(data.categories) || !Array.isArray(data.entries)) {
			return { categories: [], entries: [] };
		}
		return data;
	} catch {
		return { categories: [], entries: [] };
	}
}

function saveToStorage(): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories, entries }));
}

const initial = loadFromStorage();
let categories = $state<GradeCategory[]>(initial.categories);
let entries = $state<GradeEntry[]>(initial.entries);

$effect.root(() => {
	$effect(() => {
		// Touch both arrays to track them, then persist
		void categories.length;
		void entries.length;
		void JSON.stringify(categories);
		void JSON.stringify(entries);
		saveToStorage();
	});
});

const totalWeight = $derived(categories.reduce((sum, c) => sum + c.weight, 0));

const categoryAverages = $derived.by(() => {
	const map = new Map<string, number>();
	for (const cat of categories) {
		const scored = entries.filter((e) => e.categoryId === cat.id && e.score !== null);
		if (scored.length === 0) {
			map.set(cat.id, NaN);
		} else {
			const avg = scored.reduce((sum, e) => sum + e.score!, 0) / scored.length;
			map.set(cat.id, avg);
		}
	}
	return map;
});

const overallGrade = $derived.by(() => {
	if (categories.length === 0) return NaN;
	let weightedSum = 0;
	let weightUsed = 0;
	for (const cat of categories) {
		const avg = categoryAverages.get(cat.id);
		if (avg !== undefined && !Number.isNaN(avg)) {
			weightedSum += avg * (cat.weight / 100);
			weightUsed += cat.weight;
		}
	}
	if (weightUsed === 0) return NaN;
	// Normalize to the weight that actually has grades
	return (weightedSum / weightUsed) * 100;
});

export function getCategories(): GradeCategory[] {
	return categories;
}

export function getEntries(): GradeEntry[] {
	return entries;
}

export function getTotalWeight(): number {
	return totalWeight;
}

export function getCategoryAverages(): Map<string, number> {
	return categoryAverages;
}

export function getOverallGrade(): number {
	return overallGrade;
}

export function addCategory(name: string, weight: number): void {
	categories.push({ id: genId(), name, weight });
}

export function removeCategory(id: string): void {
	categories = categories.filter((c) => c.id !== id);
	entries = entries.filter((e) => e.categoryId !== id);
}

export function updateCategory(id: string, name: string, weight: number): void {
	const cat = categories.find((c) => c.id === id);
	if (cat) {
		cat.name = name;
		cat.weight = weight;
	}
}

export function addEntry(name: string, categoryId: string, score: number | null): void {
	entries.push({ id: genId(), name, categoryId, score });
}

export function removeEntry(id: string): void {
	entries = entries.filter((e) => e.id !== id);
}

export function updateEntry(id: string, name: string, categoryId: string, score: number | null): void {
	const entry = entries.find((e) => e.id === id);
	if (entry) {
		entry.name = name;
		entry.categoryId = categoryId;
		entry.score = score;
	}
}

export function resetAll(): void {
	categories = [];
	entries = [];
}

export function exportData(): string {
	return JSON.stringify({ categories, entries }, null, 2);
}

export function importData(json: string): void {
	const data = JSON.parse(json) as StoredData;
	if (!Array.isArray(data.categories) || !Array.isArray(data.entries)) {
		throw new Error('Invalid data format');
	}
	categories = data.categories;
	entries = data.entries;
}

export function getCalculateEntries(): GradeEntry[] {
	return entries.filter((e) => e.score === null);
}

/**
 * Solves for the score X that all "calculate" entries (score === null) need
 * so that the overall weighted grade equals `targetGrade`.
 *
 * Returns the needed score, or NaN if it can't be solved
 * (e.g. no calculate entries, or no categories with weight).
 */
export function calculateNeededScore(targetGrade: number): number {
	const calcEntries = entries.filter((e) => e.score === null);
	if (calcEntries.length === 0) return NaN;

	// For each category, compute:
	//   avg_i(X) = (knownSum + calcCount * X) / totalCount
	// where totalCount = knownCount + calcCount
	//
	// overall(X) = sum(avg_i(X) * weight_i) / sum(weight_i)  [only cats with entries]
	//            = targetGrade / 100
	//
	// This is linear in X: overall(X) = A * X + B
	// Solve: X = (targetGrade/100 - B) / A

	let A = 0;
	let B = 0;
	let weightUsed = 0;

	for (const cat of categories) {
		const catEntries = entries.filter((e) => e.categoryId === cat.id);
		if (catEntries.length === 0) continue;

		const knownScored = catEntries.filter((e) => e.score !== null);
		const knownSum = knownScored.reduce((sum, e) => sum + e.score!, 0);
		const calcCount = catEntries.filter((e) => e.score === null).length;
		const totalCount = catEntries.length;
		const w = cat.weight / 100;

		// avg_i(X) = (knownSum + calcCount * X) / totalCount
		// contribution = avg_i(X) * w = (knownSum * w / totalCount) + (calcCount * w / totalCount) * X
		B += (knownSum * w) / totalCount;
		A += (calcCount * w) / totalCount;
		weightUsed += cat.weight;
	}

	if (weightUsed === 0 || A === 0) return NaN;

	// overall = ((A*X + B) / weightUsed) * 100
	// targetGrade = ((A*X + B) / weightUsed) * 100
	// targetGrade * weightUsed / 100 = A*X + B
	const target = (targetGrade * weightUsed) / 100;
	return (target - B) / A;
}
