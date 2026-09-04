export interface Subject {
    id: string | number;
    name: string;
    name_translations?: any;
    icon_class?: string;
    progress?: number;
    curriculum_medium?: string;
}

export interface SubjectCard {
    id: string | number;
    name: string;
    name_translations?: any;
    icon?: string;
    progress: number;
    chapters_completed?: number;
    total_chapters?: number;
    total_xp?: number;
    curriculum_medium?: string;
}

export interface User {
    id: string | number;
    username: string;
    fullName: string;
    mobile?: string;
    roll_number?: string;
    curriculum_code?: string;
    grade?: string;
    school_name?: string;
    parent_name?: string;
    parent_mobile?: string;
    xp: number;
    avatar: string;
    rankTitle: string;
    level?: number;
    nextLevelXp?: number;
    xpWithinLevel?: number;
    progress?: number;
    streak: number;
}

