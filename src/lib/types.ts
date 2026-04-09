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
