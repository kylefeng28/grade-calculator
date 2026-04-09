export interface GradeCategory {
	id: string;
	name: string;
	weight: number; // percentage, e.g. 25
}

export interface GradeEntry {
	id: string;
	name: string;
	categoryId: string;
	score: number | null; // null means "calculate what I need"
}

export interface ClassData {
	id: string;
	name: string;
	categories: GradeCategory[];
	entries: GradeEntry[];
	targetGrade: number;
}

export interface AppData {
	classes: ClassData[];
	activeClassId: string;
}
