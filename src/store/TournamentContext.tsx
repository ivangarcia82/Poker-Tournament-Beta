import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppState, Tournament, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');

interface TournamentContextType {
    state: AppState;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, username: string, password: string) => Promise<void>;
    logout: () => void;
    addTournament: (tournament: Tournament) => void;
    updateTournament: (id: string, updates: Partial<Tournament>) => void;
    deleteTournament: (id: string) => void;
}

const initialState: AppState = {
    user: null,
    tournaments: [],
};

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(() => {
        const savedUser = localStorage.getItem('poker_manager_user');
        return {
            ...initialState,
            user: savedUser ? JSON.parse(savedUser) : null
        };
    });

    useEffect(() => {
        if (!state.user?.token) return;

        fetch(`${API_URL}/tournaments`, {
            headers: { 'Authorization': `Bearer ${state.user.token}` }
        })
            .then(res => {
                if (!res.ok) {
                    if (res.status === 401) logout();
                    throw new Error('Failed to fetch');
                }
                return res.json();
            })
            .then(data => {
                setState(prev => ({ ...prev, tournaments: data }));
            })
            .catch(err => console.error('Failed to fetch tournaments:', err));
    }, [state.user?.token]);

    const login = async (email: string, password: string) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Login failed');
        }

        const data = await response.json();
        const newUser: User = { ...data.user, token: data.token };
        localStorage.setItem('poker_manager_user', JSON.stringify(newUser));
        setState(prev => ({ ...prev, user: newUser }));
    };

    const register = async (email: string, username: string, password: string) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Registration failed');
        }

        const data = await response.json();
        const newUser: User = { ...data.user, token: data.token };
        localStorage.setItem('poker_manager_user', JSON.stringify(newUser));
        setState(prev => ({ ...prev, user: newUser }));
    };

    const logout = () => {
        localStorage.removeItem('poker_manager_user');
        setState(prev => ({ ...prev, user: null }));
    };

    const addTournament = async (tournament: Tournament) => {
        setState(prev => ({
            ...prev,
            tournaments: [...prev.tournaments, tournament],
        }));
        await fetch(`${API_URL}/tournaments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.user?.token}`
            },
            body: JSON.stringify(tournament)
        }).catch(err => console.error(err));
    };

    const updateTournament = async (id: string, updates: Partial<Tournament>) => {
        setState(prev => {
            const updatedTournaments = prev.tournaments.map(t => (t.id === id ? { ...t, ...updates } : t));
            const updatedTournament = updatedTournaments.find(t => t.id === id);

            if (updatedTournament) {
                fetch(`${API_URL}/tournaments/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.user?.token}`
                    },
                    body: JSON.stringify(updatedTournament)
                }).catch(err => console.error(err));
            }

            return {
                ...prev,
                tournaments: updatedTournaments,
            };
        });
    };

    const deleteTournament = async (id: string) => {
        setState(prev => ({
            ...prev,
            tournaments: prev.tournaments.filter(t => t.id !== id),
        }));
        await fetch(`${API_URL}/tournaments/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.user?.token}`
            }
        }).catch(err => console.error(err));
    };

    return (
        <TournamentContext.Provider value={{ state, login, register, logout, addTournament, updateTournament, deleteTournament }}>
            {children}
        </TournamentContext.Provider>
    );
};

export const useTournament = () => {
    const context = useContext(TournamentContext);
    if (context === undefined) {
        throw new Error('useTournament must be used within a TournamentProvider');
    }
    return context;
};
