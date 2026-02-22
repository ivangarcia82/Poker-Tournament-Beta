export interface User {
    id: string;
    email: string;
    username: string;
    token?: string;
}

export interface BlindLevel {
    id: string;
    level: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    durationMinutes: number;
    isBreak: boolean;
    breakName?: string;
}

export interface TournamentBonus {
    id: string;
    name: string; // e.g., 'Punctuality', 'Staff Bonus'
    cost: number; // Cost in $, can be 0
    chips: number; // Extra chips granted, can be 0
}

export interface Player {
    id: string;
    name: string;
    status: 'active' | 'eliminated';
    position?: number;
    reEntries: number;
    appliedBonuses: string[]; // List of TournamentBonus IDs
}

export interface PayoutStructure {
    id: string;
    positions: number; // How many get paid
    percentages: number[]; // e.g. [50, 30, 20]
}

export interface Tournament {
    id: string;
    userId: string;
    name: string;
    date: string;
    status: 'draft' | 'running' | 'paused' | 'completed';

    // Settings
    buyIn: number;
    startingChips: number;
    bonuses: TournamentBonus[];

    // State
    currentLevelIndex: number;
    timeRemainingSeconds: number;

    levels: BlindLevel[];
    players: Player[];
    payoutStructure?: PayoutStructure;
    updatedAt?: string;
    rakePercentage?: number;
    customPayouts?: number[];
}

export interface AppState {
    user: User | null;
    tournaments: Tournament[];
}
