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
		const catEntries = entries.filter((e) => e.categoryId === cat.id);
		if (catEntries.length === 0) {
			map.set(cat.id, NaN);
		} else {
			const avg = catEntries.reduce((sum, e) => sum + e.score, 0) / catEntries.length;
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

export function addEntry(name: string, categoryId: string, score: number): void {
	entries.push({ id: genId(), name, categoryId, score });
}

export function removeEntry(id: string): void {
	entries = entries.filter((e) => e.id !== id);
}

export function updateEntry(id: string, name: string, categoryId: string, score: number): void {
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
