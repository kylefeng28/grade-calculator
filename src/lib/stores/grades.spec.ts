import { describe, it, expect } from 'vitest';
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
	exportSingleClassData,
	exportAllData,
	importData,
	getCalculateEntries,
	getWhatIfEntries,
	calculateNeededScore,
	calculateNeededScoreForScenario,
	getScenarioOverallGrade,
	moveCategoryByIndex,
	moveEntryByIndex,
	encodeToUrlParam,
	loadFromUrlParam,
	getClasses,
	getActiveClassId,
	setActiveClass,
	addClass,
	renameClass,
	removeClass,
	getTargetGrade,
	setTargetGrade,
	getScenarios,
	addScenario,
	removeScenario,
	renameScenario,
	setScenarioScore
} from './grades.svelte';

// Note: since the store uses module-level $state, tests share state.
// We rely on ordering here; a reset function could be added if needed.

describe('grades store', () => {
	it('starts with one default class', () => {
		resetAll();
		expect(getClasses().length).toBe(1);
		expect(getCategories().length).toBe(0);
	});

	it('can add and retrieve categories', () => {
		resetAll();
		addCategory('Quizzes', 25);
		addCategory('Midterms', 30);
		expect(getCategories().length).toBe(2);
		expect(getTotalWeight()).toBe(55);
	});

	it('can update a category', () => {
		resetAll();
		addCategory('Quizzes', 25);
		const cat = getCategories()[0];
		updateCategory(cat.id, 'Weekly Quizzes', 20);
		const updated = getCategories().find((c) => c.id === cat.id)!;
		expect(updated.name).toBe('Weekly Quizzes');
		expect(updated.weight).toBe(20);
	});

	it('can add grade entries', () => {
		resetAll();
		addCategory('Quizzes', 100);
		const cat = getCategories()[0];
		addEntry('Quiz 1', cat.id, 95);
		addEntry('Quiz 2', cat.id, 85);
		expect(getEntries().length).toBe(2);
	});

	it('computes category averages', () => {
		resetAll();
		addCategory('Quizzes', 100);
		const cat = getCategories()[0];
		addEntry('Quiz 1', cat.id, 95);
		addEntry('Quiz 2', cat.id, 85);
		const avg = getCategoryAverages().get(cat.id);
		expect(avg).toBe(90);
	});

	it('computes overall grade', () => {
		resetAll();
		addCategory('Quizzes', 100);
		const cat = getCategories()[0];
		addEntry('Quiz 1', cat.id, 95);
		addEntry('Quiz 2', cat.id, 85);
		const grade = getOverallGrade();
		expect(grade).toBe(90);
	});

	it('can update an entry', () => {
		resetAll();
		addCategory('Quizzes', 100);
		const cat = getCategories()[0];
		addEntry('Quiz 1', cat.id, 80);
		const entry = getEntries()[0];
		updateEntry(entry.id, 'Quiz 1 (retake)', entry.categoryId, 100);
		const updated = getEntries()[0];
		expect(updated.name).toBe('Quiz 1 (retake)');
		expect(updated.score).toBe(100);
	});

	it('can remove an entry', () => {
		resetAll();
		addCategory('Quizzes', 100);
		const cat = getCategories()[0];
		addEntry('Quiz 1', cat.id, 80);
		addEntry('Quiz 2', cat.id, 90);
		removeEntry(getEntries()[0].id);
		expect(getEntries().length).toBe(1);
	});

	it('removing a category also removes its entries', () => {
		resetAll();
		addCategory('Quizzes', 50);
		addCategory('Midterms', 50);
		const [q, m] = getCategories();
		addEntry('Quiz 1', q.id, 80);
		addEntry('Midterm 1', m.id, 70);
		removeCategory(m.id);
		expect(getCategories().length).toBe(1);
		// The midterm entry should be gone
		expect(getEntries().length).toBe(1);
		expect(getEntries()[0].categoryId).toBe(q.id);
	});

	it('can export and import single-class data', () => {
		resetAll();
		addCategory('Finals', 40);
		const cat = getCategories()[0];
		addEntry('Final Exam', cat.id, 88);

		const json = exportSingleClassData();
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
		expect(getClasses().length).toBe(1);
	});
});

describe('multi-class support', () => {
	it('can add and switch between classes', () => {
		resetAll();
		addCategory('Chem Cat', 100);
		addEntry('Chem Grade', getCategories()[0].id, 90);

		const physicsId = addClass('Physics');
		expect(getActiveClassId()).toBe(physicsId);
		expect(getCategories().length).toBe(0); // Physics is empty

		// Switch back to first class
		const chemId = getClasses()[0].id;
		setActiveClass(chemId);
		expect(getCategories()[0].name).toBe('Chem Cat');
		expect(getEntries()[0].name).toBe('Chem Grade');
	});

	it('can rename a class', () => {
		resetAll();
		const id = getClasses()[0].id;
		renameClass(id, 'Chemistry');
		expect(getClasses()[0].name).toBe('Chemistry');
	});

	it('can remove a class but not the last one', () => {
		resetAll();
		addClass('Physics');
		expect(getClasses().length).toBe(2);

		const first = getClasses()[0].id;
		removeClass(first);
		expect(getClasses().length).toBe(1);

		// Cannot remove the last class
		const last = getClasses()[0].id;
		removeClass(last);
		expect(getClasses().length).toBe(1);
	});

	it('switches active class when removing the active class', () => {
		resetAll();
		const secondId = addClass('Physics');
		expect(getActiveClassId()).toBe(secondId);

		removeClass(secondId);
		expect(getActiveClassId()).toBe(getClasses()[0].id);
	});

	it('each class has independent data', () => {
		resetAll();
		addCategory('Chem Cat', 100);
		setTargetGrade(85);

		addClass('Physics');
		addCategory('Phys Cat', 100);
		setTargetGrade(90);

		expect(getCategories()[0].name).toBe('Phys Cat');
		expect(getTargetGrade()).toBe(90);

		setActiveClass(getClasses()[0].id);
		expect(getCategories()[0].name).toBe('Chem Cat');
		expect(getTargetGrade()).toBe(85);
	});

	it('exports all classes in multi-class format', () => {
		resetAll();
		renameClass(getClasses()[0].id, 'Chemistry');
		addCategory('Chem Cat', 100);
		addClass('Physics');
		addCategory('Phys Cat', 100);

		const json = exportAllData();
		const data = JSON.parse(json);
		expect(data.classes.length).toBe(2);
		expect(data.classes[0].name).toBe('Chemistry');
		expect(data.classes[1].name).toBe('Physics');
	});

	it('imports multi-class format and replaces everything', () => {
		resetAll();
		renameClass(getClasses()[0].id, 'Chemistry');
		addCategory('Chem Cat', 50);
		addClass('Physics');
		addCategory('Phys Cat', 50);

		const json = exportAllData();

		resetAll();
		expect(getClasses().length).toBe(1);

		importData(json);
		expect(getClasses().length).toBe(2);
		expect(getClasses().map((c) => c.name)).toEqual(['Chemistry', 'Physics']);
	});

	it('imports single-class format into active class', () => {
		resetAll();
		renameClass(getClasses()[0].id, 'Chemistry');
		addClass('Physics');
		// Active class is now Physics

		const singleClassJson = JSON.stringify({
			categories: [{ id: 'c1', name: 'Tests', weight: 100 }],
			entries: [{ id: 'e1', name: 'Test 1', categoryId: 'c1', score: 75 }],
			targetGrade: 80
		});

		importData(singleClassJson);
		// Physics (active) should now have the imported data
		expect(getCategories()[0].name).toBe('Tests');
		expect(getEntries()[0].score).toBe(75);
		expect(getTargetGrade()).toBe(80);

		// Chemistry should be untouched
		setActiveClass(getClasses()[0].id);
		expect(getCategories().length).toBe(0);
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
		addEntry('Final', finalExam.id, null, 'calculate');

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
		addEntry('Test 2', cat.id, null, 'calculate');
		addEntry('Test 3', cat.id, null, 'calculate');

		// avg = (80 + X + X) / 3, overall = avg * 1.0
		// target 70: 70 = (80 + 2X) / 3 => 210 = 80 + 2X => X = 65
		expect(calculateNeededScore(70)).toBeCloseTo(65, 1);
	});

	it('returns >100 when target is not achievable', () => {
		resetAll();
		addCategory('Tests', 100);
		const cat = getCategories()[0];
		addEntry('Test 1', cat.id, 20);
		addEntry('Test 2', cat.id, null, 'calculate');
		// avg = (20 + X) / 2, target 90: 90 = (20 + X)/2 => X = 160
		expect(calculateNeededScore(90)).toBeCloseTo(160, 1);
	});

	it('returns negative when target is already surpassed', () => {
		resetAll();
		addCategory('Tests', 100);
		const cat = getCategories()[0];
		addEntry('Test 1', cat.id, 100);
		addEntry('Test 2', cat.id, null, 'calculate');
		// avg = (100 + X) / 2, target 30: 30 = (100+X)/2 => X = -40
		expect(calculateNeededScore(30)).toBeCloseTo(-40, 1);
	});

	it('handles categories without any entries', () => {
		resetAll();
		addCategory('Quizzes', 50);
		addCategory('Final', 50);
		const [quizzes, final] = getCategories();
		// Quizzes has no entries at all, Final has a calculate entry
		addEntry('Final Exam', final.id, null, 'calculate');
		// Only Final has entries, so weightUsed = 50
		// overall = X * 50 / 50 = X
		// target 70: X = 70
		expect(calculateNeededScore(70)).toBeCloseTo(70, 1);
	});

	it('what-if entries do not affect baseline calculation', () => {
		resetAll();
		addCategory('Tests', 100);
		const cat = getCategories()[0];
		addEntry('Test 1', cat.id, 80);
		addEntry('Test 2', cat.id, null, 'calculate');
		addEntry('Test 3 (hypothetical)', cat.id, null, 'whatif');

		// Baseline should only consider Test 1 (normal) and Test 2 (calculate)
		// avg = (80 + X) / 2, target 70: 70 = (80+X)/2 => X = 60
		expect(calculateNeededScore(70)).toBeCloseTo(60, 1);
		// What-if entry should not appear in averages
		expect(getOverallGrade()).toBe(80); // Only Test 1 contributes
	});
});

describe('what-if scenarios', () => {
	it('can add and manage scenarios', () => {
		resetAll();
		addCategory('Tests', 100);
		const cat = getCategories()[0];
		addEntry('Test 1', cat.id, 80);
		addEntry('Test 2', cat.id, null, 'whatif');

		expect(getWhatIfEntries().length).toBe(1);

		const scenarioId = addScenario('Scenario A');
		expect(getScenarios().length).toBe(1);
		expect(getScenarios()[0].name).toBe('Scenario A');

		// New scenario should be pre-populated with 0 for what-if entries
		const whatIfEntry = getWhatIfEntries()[0];
		expect(getScenarios()[0].scores[whatIfEntry.id]).toBe(0);
	});

	it('can rename and remove scenarios', () => {
		resetAll();
		addCategory('Tests', 100);
		const cat = getCategories()[0];
		addEntry('Test 2', cat.id, null, 'whatif');

		const id = addScenario('A');
		renameScenario(id, 'Best Case');
		expect(getScenarios()[0].name).toBe('Best Case');

		removeScenario(id);
		expect(getScenarios().length).toBe(0);
	});

	it('computes scenario overall grade', () => {
		resetAll();
		addCategory('Tests', 100);
		const cat = getCategories()[0];
		addEntry('Test 1', cat.id, 80);
		addEntry('Test 2', cat.id, null, 'whatif');

		const scenarioId = addScenario('A');
		const whatIfEntry = getWhatIfEntries()[0];
		setScenarioScore(scenarioId, whatIfEntry.id, 90);

		// Scenario grade: (80 + 90) / 2 = 85
		expect(getScenarioOverallGrade(scenarioId)).toBeCloseTo(85, 1);
	});

	it('computes needed score for a scenario with what-if and calculate entries', () => {
		resetAll();
		// Quizzes 50%, Final 50%
		addCategory('Quizzes', 50);
		addCategory('Final', 50);
		const [quizzes, final] = getCategories();

		addEntry('Quiz 1', quizzes.id, 80);
		addEntry('Quiz 2', quizzes.id, null, 'whatif');
		addEntry('Final Exam', final.id, null, 'calculate');

		const scenarioId = addScenario('A');
		const whatIfEntry = getWhatIfEntries()[0];
		setScenarioScore(scenarioId, whatIfEntry.id, 90);

		// In scenario A:
		// Quiz avg = (80 + 90) / 2 = 85, weight 50
		// Final avg = X / 1 = X, weight 50
		// overall = (85 * 0.5 + X * 0.5) / 1.0 = 42.5 + 0.5X
		// target 70: 70 = 42.5 + 0.5X => X = 55
		expect(calculateNeededScoreForScenario(70, scenarioId)).toBeCloseTo(55, 1);
	});

	it('different scenarios produce different needed scores', () => {
		resetAll();
		addCategory('Quizzes', 50);
		addCategory('Final', 50);
		const [quizzes, final] = getCategories();

		addEntry('Quiz 1', quizzes.id, 80);
		addEntry('Quiz 2', quizzes.id, null, 'whatif');
		addEntry('Final Exam', final.id, null, 'calculate');

		const aId = addScenario('A');
		const bId = addScenario('B');
		const whatIfEntry = getWhatIfEntries()[0];

		// Scenario A: Quiz 2 = 80
		setScenarioScore(aId, whatIfEntry.id, 80);
		// Scenario B: Quiz 2 = 100
		setScenarioScore(bId, whatIfEntry.id, 100);

		// Scenario A: quiz avg = (80+80)/2 = 80. target 70: 70 = 80*0.5 + X*0.5 => X = 60
		expect(calculateNeededScoreForScenario(70, aId)).toBeCloseTo(60, 1);

		// Scenario B: quiz avg = (80+100)/2 = 90. target 70: 70 = 90*0.5 + X*0.5 => X = 50
		expect(calculateNeededScoreForScenario(70, bId)).toBeCloseTo(50, 1);
	});

	it('removing a what-if entry cleans up scenario scores', () => {
		resetAll();
		addCategory('Tests', 100);
		const cat = getCategories()[0];
		addEntry('Test 1', cat.id, null, 'whatif');

		const scenarioId = addScenario('A');
		const entryId = getWhatIfEntries()[0].id;
		setScenarioScore(scenarioId, entryId, 90);
		expect(getScenarios()[0].scores[entryId]).toBe(90);

		removeEntry(entryId);
		expect(getScenarios()[0].scores[entryId]).toBeUndefined();
	});

	it('changing entry mode from whatif cleans up scenario scores', () => {
		resetAll();
		addCategory('Tests', 100);
		const cat = getCategories()[0];
		addEntry('Test 1', cat.id, null, 'whatif');

		const scenarioId = addScenario('A');
		const entry = getWhatIfEntries()[0];
		setScenarioScore(scenarioId, entry.id, 90);

		// Change mode to normal
		updateEntry(entry.id, 'Test 1', cat.id, 85, 'normal');
		expect(getScenarios()[0].scores[entry.id]).toBeUndefined();
	});

	it('migration: entries without mode field get normalized', () => {
		resetAll();
		// Simulate importing legacy data without mode field
		const legacyJson = JSON.stringify({
			categories: [{ id: 'c1', name: 'Tests', weight: 100 }],
			entries: [
				{ id: 'e1', name: 'Test 1', categoryId: 'c1', score: 80 },
				{ id: 'e2', name: 'Test 2', categoryId: 'c1', score: null }
			],
			targetGrade: 70
		});

		importData(legacyJson);
		const entries = getEntries();
		// score: 80 should get mode: 'normal'
		expect(entries.find((e) => e.id === 'e1')?.mode).toBe('normal');
		// score: null should get mode: 'calculate'
		expect(entries.find((e) => e.id === 'e2')?.mode).toBe('calculate');
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
	it('round-trips single-class data through encode/decode', () => {
		resetAll();
		addCategory('Quizzes', 40);
		addCategory('Final', 60);
		const [q, f] = getCategories();
		addEntry('Quiz 1', q.id, 85);
		addEntry('Final Exam', f.id, null, 'calculate');

		const encoded = encodeToUrlParam();
		resetAll();
		loadFromUrlParam(encoded);

		expect(getCategories().map((c) => c.name)).toEqual(['Quizzes', 'Final']);
		expect(getEntries().length).toBe(2);
		expect(getEntries().find((e) => e.name === 'Quiz 1')?.score).toBe(85);
		expect(getEntries().find((e) => e.name === 'Final Exam')?.mode).toBe('calculate');
	});

	it('round-trips multi-class data through encode/decode', () => {
		resetAll();
		renameClass(getClasses()[0].id, 'Chemistry');
		addCategory('Chem Cat', 100);
		addClass('Physics');
		addCategory('Phys Cat', 100);

		const encoded = encodeToUrlParam();
		resetAll();
		loadFromUrlParam(encoded);

		expect(getClasses().length).toBe(2);
		expect(getClasses().map((c) => c.name)).toEqual(['Chemistry', 'Physics']);
	});

	it('rejects invalid encoded data', () => {
		expect(() => loadFromUrlParam('not-valid-base64!!')).toThrow();
	});
});
