import { browser } from '$app/environment';
import type {
	GradeCategory,
	GradeEntry,
	EntryMode,
	Scenario,
	ClassData,
	AppData
} from '$lib/types';

const STORAGE_KEY = 'grade-calculator-data';

let nextId = 0;
function genId(): string {
	return `id-${nextId++}-${Date.now()}`;
}

function createEmptyClass(name: string): ClassData {
	return { id: genId(), name, categories: [], entries: [], targetGrade: 70, scenarios: [] };
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

/**
 * Normalize a ClassData object to ensure all fields exist.
 * Handles migration from older formats (e.g. entries without mode, classes without scenarios).
 */
function normalizeClassData(data: ClassData): ClassData {
	return {
		id: data.id || genId(),
		name: data.name || 'My Class',
		categories: data.categories,
		entries: data.entries.map((e) => ({
			...e,
			// Migration: infer mode from score if mode field is absent
			mode: e.mode ?? (e.score === null ? 'calculate' : 'normal')
		})),
		targetGrade: data.targetGrade ?? 70,
		scenarios: data.scenarios ?? []
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
		} else if (isValidAppData(data)) {
			// Normalize each class for migration
			data.classes = data.classes.map(normalizeClassData);
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
// Only normal entries with scores contribute to the "real" grade.

const totalWeight = $derived(getActiveClass().categories.reduce((sum, c) => sum + c.weight, 0));

const categoryAverages = $derived.by(() => {
	const ac = getActiveClass();
	const map = new Map<string, number>();
	for (const cat of ac.categories) {
		const scored = ac.entries.filter(
			(e) => e.categoryId === cat.id && e.mode === 'normal' && e.score !== null
		);
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

export function addCategory(name: string, weight: number, index: number | null = null): void {
	const newCategory = { id: genId(), name, weight };
	if (index) {
		getActiveClass().categories.splice(index, 0, newCategory);
	} else {
		getActiveClass().categories.push(newCategory);
	}
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

export function addEntry(
	name: string,
	categoryId: string,
	score: number | null,
	mode: EntryMode = 'normal',
	index: number | null = null,
): void {
	const newEntry = { id: genId(), name, categoryId, score, mode };
	if (index) {
		getActiveClass().entries.splice(index, 0, newEntry);
	} else {
		getActiveClass().entries.push(newEntry);
	}
}

export function removeEntry(id: string): void {
	const ac = getActiveClass();
	ac.entries = ac.entries.filter((e) => e.id !== id);
	// Clean up scenario references to this entry
	for (const scenario of ac.scenarios) {
		delete scenario.scores[id];
	}
}

export function updateEntry(
	id: string,
	name: string,
	categoryId: string,
	score: number | null,
	mode: EntryMode = 'normal'
): void {
	const entry = getActiveClass().entries.find((e) => e.id === id);
	if (entry) {
		const oldMode = entry.mode;
		entry.name = name;
		entry.categoryId = categoryId;
		entry.score = score;
		entry.mode = mode;
		// If mode changed away from whatif, clean up scenario scores for this entry
		if (oldMode === 'whatif' && mode !== 'whatif') {
			for (const scenario of getActiveClass().scenarios) {
				delete scenario.scores[id];
			}
		}
	}
}

// --- Scenario CRUD (active class) ---

export function getScenarios(): Scenario[] {
	return getActiveClass().scenarios;
}

export function addScenario(name: string, scoresTemplate: Record<string, number> = {}): string {
	const id = genId();
	// Pre-populate with 0 for all existing what-if entries
	const scores: Record<string, number> = {};
	for (const entry of getActiveClass().entries) {
		if (entry.mode === 'whatif') {
			scores[entry.id] = scoresTemplate[entry.id] ?? 0;
		}
	}
	getActiveClass().scenarios.push({ id, name, scores });
	return id;
}

export function removeScenario(id: string): void {
	const ac = getActiveClass();
	ac.scenarios = ac.scenarios.filter((s) => s.id !== id);
}

export function renameScenario(id: string, name: string): void {
	const s = getActiveClass().scenarios.find((s) => s.id === id);
	if (s) s.name = name;
}

export function setScenarioScore(scenarioId: string, entryId: string, score: number): void {
	const s = getActiveClass().scenarios.find((s) => s.id === scenarioId);
	if (s) s.scores[entryId] = score;
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
		{
			name: ac.name,
			categories: ac.categories,
			entries: ac.entries,
			targetGrade: ac.targetGrade,
			scenarios: ac.scenarios
		},
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
		const normalized = normalizeClassData(data);
		const ac = getActiveClass();
		ac.name = normalized.name;
		ac.categories = normalized.categories;
		ac.entries = normalized.entries;
		ac.targetGrade = normalized.targetGrade;
		ac.scenarios = normalized.scenarios;
		return;
	} else if (isValidAppData(data)) {
		classes = data.classes.map(normalizeClassData);
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
	} else if (isValidAppData(data)) {
		classes = data.classes.map(normalizeClassData);
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
	return getActiveClass().entries.filter((e) => e.mode === 'calculate');
}

export function getWhatIfEntries(): GradeEntry[] {
	return getActiveClass().entries.filter((e) => e.mode === 'whatif');
}

/** Per-category breakdown of the "what do I need" calculation */
export interface CalcCategoryStep {
	categoryName: string;
	weight: number;
	knownScores: { name: string; score: number }[];
	calcCount: number;
	totalCount: number;
	/** The known sum of scores in this category */
	knownSum: number;
	/** Category average as a function of X: (knownSum + calcCount * X) / totalCount */
	avgExpr: string;
	/** Weighted contribution expression: avg * weight/100 */
	contributionExpr: string;
}

/** Full breakdown of the "what do I need" calculation */
export interface CalcBreakdown {
	steps: CalcCategoryStep[];
	weightUsed: number;
	/** The linear equation: A * X + B = target */
	A: number;
	B: number;
	target: number;
	result: number;
	targetGrade: number;
	/** The overall equation string */
	equation: string;
	/** The solving steps as strings */
	solveSteps: string[];
}

/**
 * Returns a step-by-step breakdown of the "what do I need" calculation.
 * If scenario is provided, includes what-if scores from that scenario.
 * Returns null if there are no calculate entries.
 */
export function getCalculationBreakdown(targetGrade: number, opts: { scenario?: Scenario } = {}): CalcBreakdown | null {
	const calculation = calculateNeededScoreRaw(targetGrade, opts);
	if (Number.isNaN(calculation.result)) {
		return null;
	}
	const { A, B, steps: rawSteps, weightUsed, target, result } = calculation as CalcBreakdown;

	const steps = [];
	for (const step of rawSteps) {
		const { weight, knownScores, knownSum, calcCount, totalCount } = step;

		// Build readable expressions
		const knownParts = knownScores.map((e) => e.toString());
		const calcParts = Array(calcCount).fill('X');
		const allParts = [...knownParts, ...calcParts];
		const avgExpr = `(${allParts.join(' + ')}) / ${totalCount}`;
		const contributionExpr = `${avgExpr} × ${weight}%`;

		steps.push({
			...step,
			avgExpr,
			contributionExpr
		});
	}

	// Build equation strings
	const termStrs = steps.map((s) => {
		const knownPart = s.knownSum > 0 ? s.knownSum.toString() : '0';
		if (s.calcCount > 0) {
			const xPart = s.calcCount === 1 ? 'X' : `${s.calcCount}X`;
			const numerator = s.knownSum > 0 ? `${knownPart} + ${xPart}` : xPart;
			return `(${numerator}) / ${s.totalCount} × ${s.weight / 100}`;
		}
		return `${knownPart} / ${s.totalCount} × ${s.weight / 100}`;
	});

	const equation = `(${termStrs.join(' + ')}) / ${weightUsed / 100} × 100 = ${targetGrade}`;

	const solveSteps: string[] = [];
	solveSteps.push(`Weighted sum = ${A.toFixed(4)}X + ${B.toFixed(4)}`);
	solveSteps.push(
		`Overall = (${A.toFixed(4)}X + ${B.toFixed(4)}) / ${weightUsed / 100} × 100 = ${targetGrade}`
	);
	solveSteps.push(`${A.toFixed(4)}X + ${B.toFixed(4)} = ${target.toFixed(4)}`);
	solveSteps.push(`${A.toFixed(4)}X = ${target.toFixed(4)} − ${B.toFixed(4)} = ${(target - B).toFixed(4)}`);
	solveSteps.push(`X = ${(target - B).toFixed(4)} / ${A.toFixed(4)} = ${result.toFixed(2)}`);

	return { steps, weightUsed, A, B, target, result, targetGrade, equation, solveSteps };
}

/**
 * Solves for the score X that all "calculate" entries need
 * so that the overall weighted grade equals `targetGrade`.
 *
 * If scenario is provided, this will apply the given scenario's what-if scores.
 * Otherwise, treat as the baseline calculation and exclude what-if entries.
 *
 * Returns the needed score, or NaN if it can't be solved
 * (e.g. no calculate entries, or no categories with weight).
 */
export function calculateNeededScore(targetGrade: number, { scenario }: { scenario?: Scenario } = {}): number {
  return calculateNeededScoreRaw(targetGrade, { scenario }).result;
}

export function calculateNeededScoreRaw(targetGrade: number, { scenario }: { scenario?: Scenario } = {}): CalcBreakdown | { result: typeof NaN } {
	const ac = getActiveClass();
	const calcEntries = ac.entries.filter((e) => e.mode === 'calculate');
	if (calcEntries.length === 0) return { result: NaN };

	// For each category, compute:
	//   avg_i(X) = (knownSum + calcCount * X) / totalCount
	// where totalCount = knownCount + calcCount
	//
	// overall(X) = sum(avg_i(X) * weight_i) / sum(weight_i)  [only cats with entries]
	//            = targetGrade / 100
	//
	// This is linear in X: overall(X) = A * X + B
	// Solve: X = (targetGrade/100 - B) / A

	const steps: CalcCategoryStep[] = [];
	let A = 0;
	let B = 0;
	let weightUsed = 0;

	for (const cat of ac.categories) {
		// Exclude what-if entries from baseline calculation
		const catEntries = ac.entries.filter((e) =>
			e.categoryId === cat.id &&
			(e.mode === 'whatif' ? (scenario && scenario.scores[e.id] !== undefined) : true)
		);
		if (catEntries.length === 0) continue;

		const knownScored = catEntries
		  .map((e) => (e.mode === 'normal' && e.score) || (e.mode === 'whatif' && scenario?.scores[e.id]) || null)
		  .filter((e) => e != null);
		const knownCount = knownScored.length;
		const knownSum = knownScored.reduce((sum, e) => sum + e!, 0);
		const calcCount = catEntries.filter((e) => e.mode === 'calculate').length;
		const totalCount = knownCount + calcCount;

		const w = cat.weight / 100;

		// avg_i(X) = (knownSum + calcCount * X) / totalCount
		// contribution = avg_i(X) * w = (knownSum * w / totalCount) + (calcCount * w / totalCount) * X
		B += (knownSum * w) / totalCount;
		A += (calcCount * w) / totalCount;
		weightUsed += cat.weight;

		steps.push({
			categoryName: cat.name,
			weight: cat.weight,
			knownScores: knownScored,
			knownSum,
			calcCount,
			totalCount,
		});
	}

	if (weightUsed === 0 || A === 0) return { result: NaN };

	// overall = ((A*X + B) / weightUsed) * 100
	// targetGrade = ((A*X + B) / weightUsed) * 100
	// targetGrade * weightUsed / 100 = A*X + B
	const target = (targetGrade * weightUsed) / 100;
	const result = (target - B) / A;

	return {
		A,
		B,
		steps,
		weightUsed,
		target,
		result
	}
}

/**
 * Computes the overall grade for a scenario, treating what-if scores
 * as real and ignoring calculate entries.
 */
export function getScenarioOverallGrade(scenarioId: string): number {
	const ac = getActiveClass();
	const scenario = ac.scenarios.find((s) => s.id === scenarioId);
	if (!scenario) return NaN;

	let weightedSum = 0;
	let weightUsed = 0;

	for (const cat of ac.categories) {
		const catEntries = ac.entries.filter((e) => e.categoryId === cat.id);
		let sum = 0;
		let count = 0;

		for (const e of catEntries) {
			if (e.mode === 'normal' && e.score !== null) {
				sum += e.score;
				count++;
			} else if (e.mode === 'whatif' && scenario.scores[e.id] !== undefined) {
				sum += scenario.scores[e.id];
				count++;
			}
			// calculate entries are excluded from this tally
		}

		if (count === 0) continue;
		const avg = sum / count;
		weightedSum += avg * (cat.weight / 100);
		weightUsed += cat.weight;
	}

	if (weightUsed === 0) return NaN;
	return (weightedSum / weightUsed) * 100;
}

export function calculateNeededScoreForScenario(
	targetGrade: number,
	scenarioId: string
) {
	const ac = getActiveClass();
	const scenario = ac.scenarios.find((s) => s.id === scenarioId);
	if (!scenario) return NaN;
	return calculateNeededScore(targetGrade, { scenario });
}

export function getCalculationBreakdownForScenario(
	targetGrade: number,
	scenarioId: string
): CalcBreakdown | null {
	const ac = getActiveClass();
	const scenario = ac.scenarios.find((s) => s.id === scenarioId);
	if (!scenario) return null;
	return getCalculationBreakdown(targetGrade, { scenario });
}
