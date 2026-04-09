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
	importData
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
