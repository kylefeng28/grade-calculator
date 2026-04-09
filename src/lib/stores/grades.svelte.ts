import type { GradeCategory, GradeEntry } from '$lib/types';

let nextId = 0;
function genId(): string {
	return `id-${nextId++}-${Date.now()}`;
}

let categories = $state<GradeCategory[]>([]);
let entries = $state<GradeEntry[]>([]);

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
