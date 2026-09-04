export interface Subject {
    id: string | number;
    name: string;
    name_hi?: string;
    icon_class?: string;
    progress?: number;
}

export interface SubjectCard {
    id: string | number;
    name: string;
    hindiName?: string;
    icon?: string;
    progress: number;
}

export interface User {
    id: string | number;
    username: string;
    fullName: string;
    mobile?: string;
    roll_number?: string;
    board?: string;
    grade?: string;
    school_name?: string;
    parent_name?: string;
    parent_mobile?: string;
    xp: number;
    coins: number;
    avatar: string;
    rankTitle: string;
    level?: number;
    nextLevelXp?: number;
    xpWithinLevel?: number;
    progress?: number;
    streak: number;
}

export interface Quest {
    id: number;
    title: string;
    icon: string;
    xpReward: number;
    progress: number;
    total: number;
    completed: boolean;
}
