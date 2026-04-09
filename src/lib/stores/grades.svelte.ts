import { browser } from '$app/environment';
import type { GradeCategory, GradeEntry, ClassData, AppData } from '$lib/types';

const STORAGE_KEY = 'grade-calculator-data';

let nextId = 0;
function genId(): string {
	return `id-${nextId++}-${Date.now()}`;
}

function createEmptyClass(name: string): ClassData {
	return { id: genId(), name, categories: [], entries: [], targetGrade: 70 };
}

function isSingleClassData(data: unknown): data is ClassData {
	return (
		typeof data === 'object' &&
		data !== null &&
		Array.isArray((data as ClassData).categories) &&
		Array.isArray((data as ClassData).entries)
	);
}

function isValidAppData(data: unknown): data is AppData {
	return (
		typeof data === 'object' &&
		data !== null &&
		Array.isArray((data as AppData).classes) &&
		(data as AppData).classes.length > 0
	);
}

function normalizeClassData(data: ClassData): ClassData {
	return {
		id: data.id || genId(),
		name: data.name || 'My Class',
		categories: data.categories,
		entries: data.entries,
		targetGrade: data.targetGrade ?? 70
	};
}

function loadFromStorage(): AppData {
	if (!browser) {
		const c = createEmptyClass('My Class');
		return { classes: [c], activeClassId: c.id };
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			const c = createEmptyClass('My Class');
			return { classes: [c], activeClassId: c.id };
		}
		const data = JSON.parse(raw);
		if (isSingleClassData(data)) {
			const cls = normalizeClassData(data);
			return { classes: [cls], activeClassId: cls.id };
		}
		else if (isValidAppData(data)) {
			return data;
		}
		const c = createEmptyClass('My Class');
		return { classes: [c], activeClassId: c.id };
	} catch {
		const c = createEmptyClass('My Class');
		return { classes: [c], activeClassId: c.id };
	}
}

function saveToStorage(): void {
	if (!browser) return;
	const data: AppData = { classes, activeClassId };
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const initial = loadFromStorage();
let classes = $state<ClassData[]>(initial.classes);
let activeClassId = $state<string>(initial.activeClassId);

$effect.root(() => {
	$effect(() => {
		void JSON.stringify(classes);
		void activeClassId;
		saveToStorage();
	});
});

// --- Active class helpers ---

function getActiveClass(): ClassData {
	return classes.find((c) => c.id === activeClassId) ?? classes[0];
}

// --- Derived values (scoped to active class) ---

const totalWeight = $derived(getActiveClass().categories.reduce((sum, c) => sum + c.weight, 0));

const categoryAverages = $derived.by(() => {
	const ac = getActiveClass();
	const map = new Map<string, number>();
	for (const cat of ac.categories) {
		const scored = ac.entries.filter((e) => e.categoryId === cat.id && e.score !== null);
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
	const ac = getActiveClass();
	if (ac.categories.length === 0) return NaN;
	let weightedSum = 0;
	let weightUsed = 0;
	for (const cat of ac.categories) {
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

// --- Class management ---

export function getClasses(): ClassData[] {
	return classes;
}

export function getActiveClassId(): string {
	return activeClassId;
}

export function setActiveClass(id: string): void {
	if (classes.some((c) => c.id === id)) {
		activeClassId = id;
	}
}

export function addClass(name: string): string {
	const cls = createEmptyClass(name);
	classes.push(cls);
	activeClassId = cls.id;
	return cls.id;
}

export function renameClass(id: string, name: string): void {
	const cls = classes.find((c) => c.id === id);
	if (cls) cls.name = name;
}

export function removeClass(id: string): void {
	if (classes.length <= 1) return;
	classes = classes.filter((c) => c.id !== id);
	if (activeClassId === id) {
		activeClassId = classes[0].id;
	}
}

// --- Getters for active class data ---

export function getCategories(): GradeCategory[] {
	return getActiveClass().categories;
}

export function getEntries(): GradeEntry[] {
	return getActiveClass().entries;
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

export function getTargetGrade(): number {
	return getActiveClass().targetGrade;
}

export function setTargetGrade(value: number): void {
	getActiveClass().targetGrade = value;
}

// --- Category CRUD (active class) ---

export function addCategory(name: string, weight: number): void {
	getActiveClass().categories.push({ id: genId(), name, weight });
}

export function removeCategory(id: string): void {
	const ac = getActiveClass();
	ac.categories = ac.categories.filter((c) => c.id !== id);
	ac.entries = ac.entries.filter((e) => e.categoryId !== id);
}

export function updateCategory(id: string, name: string, weight: number): void {
	const cat = getActiveClass().categories.find((c) => c.id === id);
	if (cat) {
		cat.name = name;
		cat.weight = weight;
	}
}

// --- Entry CRUD (active class) ---

export function addEntry(name: string, categoryId: string, score: number | null): void {
	getActiveClass().entries.push({ id: genId(), name, categoryId, score });
}

export function removeEntry(id: string): void {
	const ac = getActiveClass();
	ac.entries = ac.entries.filter((e) => e.id !== id);
}

export function updateEntry(
	id: string,
	name: string,
	categoryId: string,
	score: number | null
): void {
	const entry = getActiveClass().entries.find((e) => e.id === id);
	if (entry) {
		entry.name = name;
		entry.categoryId = categoryId;
		entry.score = score;
	}
}

// --- Reordering (active class) ---

export function moveCategoryByIndex(fromIndex: number, toIndex: number): void {
	const cats = getActiveClass().categories;
	if (fromIndex === toIndex) return;
	if (fromIndex < 0 || toIndex < 0 || fromIndex >= cats.length || toIndex >= cats.length) return;
	const [item] = cats.splice(fromIndex, 1);
	cats.splice(toIndex, 0, item);
}

export function moveEntryByIndex(fromIndex: number, toIndex: number): void {
	const ents = getActiveClass().entries;
	if (fromIndex === toIndex) return;
	if (fromIndex < 0 || toIndex < 0 || fromIndex >= ents.length || toIndex >= ents.length) return;
	const [item] = ents.splice(fromIndex, 1);
	ents.splice(toIndex, 0, item);
}

// --- Reset ---

export function resetAll(): void {
	const c = createEmptyClass('My Class');
	classes = [c];
	activeClassId = c.id;
}

// --- Export / Import ---

/** Export current class */
export function exportSingleClassData(): string {
	const ac = getActiveClass();
	return JSON.stringify(
		{ name: ac.name, categories: ac.categories, entries: ac.entries, targetGrade: ac.targetGrade },
		null,
		2
	);
}

/** Export all classes */
export function exportAllData(): string {
	const data: AppData = { classes, activeClassId };
	return JSON.stringify(data, null, 2);
}

/**
 * Import data. Auto-detects format:
 * - multi-class: replaces everything
 * - flat single-class format: replaces the active class's data
 */
export function importData(json: string): void {
	const data = JSON.parse(json);
	if (isSingleClassData(data)) {
		const ac = getActiveClass();
		ac.name = data.name;
		ac.categories = data.categories;
		ac.entries = data.entries;
		ac.targetGrade = data.targetGrade ?? 70;
		return;
	}
	else if (isValidAppData(data)) {
		classes = data.classes;
		activeClassId = data.activeClassId;
		// Ensure activeClassId points to a valid class
		if (!classes.some((c) => c.id === activeClassId)) {
			activeClassId = classes[0].id;
		}
		return;
	}
	throw new Error('Invalid data format');
}

// --- URL sharing ---

/** Encode all classes as URL param */
export function encodeToUrlParam(): string {
	const data: AppData = { classes, activeClassId };
	return btoa(JSON.stringify(data));
}

/** Load from URL param. Auto-detects format. */
export function loadFromUrlParam(encoded: string): void {
	const json = atob(encoded);
	const data = JSON.parse(json);
	if (isSingleClassData(data)) {
		const cls = normalizeClassData(data);
		classes = [cls];
		activeClassId = cls.id;
		return;
	}
	else if (isValidAppData(data)) {
		classes = data.classes;
		activeClassId = data.activeClassId;
		if (!classes.some((c) => c.id === activeClassId)) {
			activeClassId = classes[0].id;
		}
		return;
	}
	throw new Error('Invalid data format');
}

// --- What do I need ---

export function getCalculateEntries(): GradeEntry[] {
	return getActiveClass().entries.filter((e) => e.score === null);
}

/**
 * Solves for the score X that all "calculate" entries (score === null) need
 * so that the overall weighted grade equals `targetGrade`.
 *
 * Returns the needed score, or NaN if it can't be solved
 * (e.g. no calculate entries, or no categories with weight).
 */
export function calculateNeededScore(targetGrade: number): number {
	const ac = getActiveClass();
	const calcEntries = ac.entries.filter((e) => e.score === null);
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

	for (const cat of ac.categories) {
		const catEntries = ac.entries.filter((e) => e.categoryId === cat.id);
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
