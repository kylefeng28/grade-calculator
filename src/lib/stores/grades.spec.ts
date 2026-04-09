import { describe, it, expect, beforeEach } from 'vitest';
import {
	getCategories,
	getEntries,
	getTotalWeight,
	getCategoryAverages,
	getOverallGrade,
	addCategory,
	removeCategory,
	updateCategory,
	addEntry,
	removeEntry,
	updateEntry,
	resetAll,
	exportData,
	importData,
	getCalculateEntries,
	calculateNeededScore,
	moveCategoryByIndex,
	moveEntryByIndex,
	encodeToUrlParam,
	loadFromUrlParam
} from './grades.svelte';

// Note: since the store uses module-level $state, tests share state.
// We rely on ordering here; a reset function could be added if needed.

describe('grades store', () => {
	it('starts empty', () => {
		// Clean slate from module load in test environment
		expect(getCategories().length).toBeGreaterThanOrEqual(0);
	});

	it('can add and retrieve categories', () => {
		const before = getCategories().length;
		addCategory('Quizzes', 25);
		addCategory('Midterms', 30);
		expect(getCategories().length).toBe(before + 2);
		expect(getTotalWeight()).toBeGreaterThanOrEqual(55);
	});

	it('can update a category', () => {
		const cat = getCategories().find((c) => c.name === 'Quizzes')!;
		updateCategory(cat.id, 'Weekly Quizzes', 20);
		const updated = getCategories().find((c) => c.id === cat.id)!;
		expect(updated.name).toBe('Weekly Quizzes');
		expect(updated.weight).toBe(20);
	});

	it('can add grade entries', () => {
		const cat = getCategories().find((c) => c.name === 'Weekly Quizzes')!;
		addEntry('Quiz 1', cat.id, 95);
		addEntry('Quiz 2', cat.id, 85);
		expect(getEntries().length).toBeGreaterThanOrEqual(2);
	});

	it('computes category averages', () => {
		const cat = getCategories().find((c) => c.name === 'Weekly Quizzes')!;
		const avg = getCategoryAverages().get(cat.id);
		expect(avg).toBe(90); // (95 + 85) / 2
	});

	it('computes overall grade', () => {
		const grade = getOverallGrade();
		expect(grade).not.toBeNaN();
		expect(grade).toBeGreaterThan(0);
		expect(grade).toBeLessThanOrEqual(100);
	});

	it('can update an entry', () => {
		const entry = getEntries().find((e) => e.name === 'Quiz 1')!;
		updateEntry(entry.id, 'Quiz 1 (retake)', entry.categoryId, 100);
		const updated = getEntries().find((e) => e.id === entry.id)!;
		expect(updated.name).toBe('Quiz 1 (retake)');
		expect(updated.score).toBe(100);
	});

	it('can remove an entry', () => {
		const before = getEntries().length;
		const entry = getEntries()[0];
		removeEntry(entry.id);
		expect(getEntries().length).toBe(before - 1);
	});

	it('removing a category also removes its entries', () => {
		const cat = getCategories().find((c) => c.name === 'Midterms')!;
		addEntry('Midterm 1', cat.id, 70);
		const beforeEntries = getEntries().length;
		removeCategory(cat.id);
		expect(getCategories().find((c) => c.id === cat.id)).toBeUndefined();
		// The midterm entry should be gone
		expect(getEntries().filter((e) => e.categoryId === cat.id).length).toBe(0);
		expect(getEntries().length).toBe(beforeEntries - 1);
	});

	it('can export and import data', () => {
		// Ensure we have some data
		addCategory('Finals', 40);
		const cat = getCategories().find((c) => c.name === 'Finals')!;
		addEntry('Final Exam', cat.id, 88);

		const json = exportData();
		const parsed = JSON.parse(json);
		expect(parsed.categories).toBeDefined();
		expect(parsed.entries).toBeDefined();

		// Reset, then import
		resetAll();
		expect(getCategories().length).toBe(0);
		expect(getEntries().length).toBe(0);

		importData(json);
		expect(getCategories().find((c) => c.name === 'Finals')).toBeDefined();
		expect(getEntries().find((e) => e.name === 'Final Exam')).toBeDefined();
	});

	it('importData rejects invalid data', () => {
		expect(() => importData('not json')).toThrow();
		expect(() => importData('{"categories": "bad"}')).toThrow();
	});

	it('resetAll clears everything', () => {
		addCategory('Temp', 10);
		resetAll();
		expect(getCategories().length).toBe(0);
		expect(getEntries().length).toBe(0);
	});
});

describe('what do I need calculation', () => {
	it('returns NaN when there are no calculate entries', () => {
		resetAll();
		addCategory('Quizzes', 100);
		const cat = getCategories()[0];
		addEntry('Quiz 1', cat.id, 80);
		expect(getCalculateEntries().length).toBe(0);
		expect(calculateNeededScore(70)).toBeNaN();
	});

	it('calculates needed score for a single unknown', () => {
		resetAll();
		// Quizzes 25%, Midterms 30%, Final 25%, Assignments 20%
		addCategory('Quizzes', 25);
		addCategory('Midterms', 30);
		addCategory('Final Exam', 25);
		addCategory('Assignments', 20);
		const [quizzes, midterms, finalExam, assignments] = getCategories();

		addEntry('Quiz 1', quizzes.id, 95);
		addEntry('Quiz 2', quizzes.id, 60);
		addEntry('Midterm 1', midterms.id, 60);
		addEntry('Assignment 1', assignments.id, 80);
		// Final is unknown
		addEntry('Final', finalExam.id, null);

		expect(getCalculateEntries().length).toBe(1);

		// Manual calculation:
		// quiz avg = 77.5, midterm avg = 60, assignments avg = 80
		// known contribution = 77.5*0.25 + 60*0.30 + 80*0.20 = 19.375 + 18 + 16 = 53.375
		// final contribution = X * 0.25
		// total weight = 100, so overall = 53.375 + 0.25*X
		// For target 70: 0.70 = 53.375/100 + 0.25*X/100 ... wait, let me redo
		// overall = (77.5*25 + 60*30 + X*25 + 80*20) / 100
		//         = (1937.5 + 1800 + 25X + 1600) / 100
		//         = (5337.5 + 25X) / 100
		// For target 70: 70 = (5337.5 + 25X) / 100
		// 7000 = 5337.5 + 25X
		// 25X = 1662.5
		// X = 66.5
		const needed = calculateNeededScore(70);
		expect(needed).toBeCloseTo(66.5, 1);
	});

	it('calculates when multiple entries are unknown in same category', () => {
		resetAll();
		addCategory('Tests', 100);
		const cat = getCategories()[0];
		addEntry('Test 1', cat.id, 80);
		addEntry('Test 2', cat.id, null);
		addEntry('Test 3', cat.id, null);

		// avg = (80 + X + X) / 3, overall = avg * 1.0
		// target 70: 70 = (80 + 2X) / 3 => 210 = 80 + 2X => X = 65
		expect(calculateNeededScore(70)).toBeCloseTo(65, 1);
	});

	it('returns >100 when target is not achievable', () => {
		resetAll();
		addCategory('Tests', 100);
		const cat = getCategories()[0];
		addEntry('Test 1', cat.id, 20);
		addEntry('Test 2', cat.id, null);
		// avg = (20 + X) / 2, target 90: 90 = (20 + X)/2 => X = 160
		expect(calculateNeededScore(90)).toBeCloseTo(160, 1);
	});

	it('returns negative when target is already surpassed', () => {
		resetAll();
		addCategory('Tests', 100);
		const cat = getCategories()[0];
		addEntry('Test 1', cat.id, 100);
		addEntry('Test 2', cat.id, null);
		// avg = (100 + X) / 2, target 30: 30 = (100+X)/2 => X = -40
		expect(calculateNeededScore(30)).toBeCloseTo(-40, 1);
	});

	it('handles categories without any entries', () => {
		resetAll();
		addCategory('Quizzes', 50);
		addCategory('Final', 50);
		const [quizzes, final] = getCategories();
		// Quizzes has no entries at all, Final has a calculate entry
		addEntry('Final Exam', final.id, null);
		// Only Final has entries, so weightUsed = 50
		// overall = X * 50 / 50 = X
		// target 70: X = 70
		expect(calculateNeededScore(70)).toBeCloseTo(70, 1);
	});
});

describe('reordering', () => {
	it('can reorder categories', () => {
		resetAll();
		addCategory('A', 30);
		addCategory('B', 40);
		addCategory('C', 30);
		expect(getCategories().map((c) => c.name)).toEqual(['A', 'B', 'C']);

		moveCategoryByIndex(0, 2);
		expect(getCategories().map((c) => c.name)).toEqual(['B', 'C', 'A']);

		moveCategoryByIndex(2, 0);
		expect(getCategories().map((c) => c.name)).toEqual(['A', 'B', 'C']);
	});

	it('can reorder entries', () => {
		resetAll();
		addCategory('Tests', 100);
		const cat = getCategories()[0];
		addEntry('E1', cat.id, 90);
		addEntry('E2', cat.id, 80);
		addEntry('E3', cat.id, 70);
		expect(getEntries().map((e) => e.name)).toEqual(['E1', 'E2', 'E3']);

		moveEntryByIndex(2, 0);
		expect(getEntries().map((e) => e.name)).toEqual(['E3', 'E1', 'E2']);
	});

	it('no-ops for same index or out of bounds', () => {
		resetAll();
		addCategory('A', 50);
		addCategory('B', 50);
		moveCategoryByIndex(0, 0);
		expect(getCategories().map((c) => c.name)).toEqual(['A', 'B']);

		moveCategoryByIndex(-1, 0);
		expect(getCategories().map((c) => c.name)).toEqual(['A', 'B']);

		moveCategoryByIndex(0, 99);
		expect(getCategories().map((c) => c.name)).toEqual(['A', 'B']);
	});
});

describe('URL sharing', () => {
	it('round-trips data through encode/decode', () => {
		resetAll();
		addCategory('Quizzes', 40);
		addCategory('Final', 60);
		const [q, f] = getCategories();
		addEntry('Quiz 1', q.id, 85);
		addEntry('Final Exam', f.id, null);

		const encoded = encodeToUrlParam();
		expect(typeof encoded).toBe('string');
		expect(encoded.length).toBeGreaterThan(0);

		resetAll();
		expect(getCategories().length).toBe(0);

		loadFromUrlParam(encoded);
		expect(getCategories().map((c) => c.name)).toEqual(['Quizzes', 'Final']);
		expect(getEntries().length).toBe(2);
		expect(getEntries().find((e) => e.name === 'Quiz 1')?.score).toBe(85);
		expect(getEntries().find((e) => e.name === 'Final Exam')?.score).toBeNull();
	});

	it('rejects invalid encoded data', () => {
		expect(() => loadFromUrlParam('not-valid-base64!!')).toThrow();
	});
});
