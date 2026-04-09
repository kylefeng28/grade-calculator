export interface GradeCategory {
	id: string;
	name: string;
	weight: number; // percentage, e.g. 25
}

/** The three modes a grade entry can be in */
export type EntryMode = 'normal' | 'calculate' | 'whatif';

export interface GradeEntry {
	id: string;
	name: string;
	categoryId: string;
	/** Only meaningful when mode is 'normal'. Ignored for 'calculate' and 'whatif'. */
	score: number | null;
	/** Entry mode: normal has a real score, calculate solves for it, whatif is a scenario placeholder */
	mode: EntryMode;
}

/**
 * A named what-if scenario. Maps what-if entry IDs to hypothetical scores.
 * Entries not present in the map are treated as if they don't exist in the scenario.
 */
export interface Scenario {
	id: string;
	name: string;
	/** Maps GradeEntry.id (where mode === 'whatif') to a hypothetical score */
	scores: Record<string, number>;
}

export interface ClassData {
	id: string;
	name: string;
	categories: GradeCategory[];
	entries: GradeEntry[];
	targetGrade: number;
	/** What-if scenarios for this class */
	scenarios: Scenario[];
}

export interface AppData {
	classes: ClassData[];
	activeClassId: string;
}
