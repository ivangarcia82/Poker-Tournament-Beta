import React, { createContext, useContext, useState, useEffect } from 'react';

interface TourContextType {
    run: boolean;
    stepIndex: number;
    startTour: () => void;
    stopTour: () => void;
    setStepIndex: (index: number) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('has_seen_tour');
        if (!hasSeenTour) {
            setRun(true);
        }
    }, []);

    const startTour = () => {
        setStepIndex(0);
        setRun(true);
    };

    const stopTour = () => {
        setRun(false);
        localStorage.setItem('has_seen_tour', 'true');
    };

    return (
        <TourContext.Provider value={{ run, stepIndex, startTour, stopTour, setStepIndex }}>
            {children}
        </TourContext.Provider>
    );
};

export const useTour = () => {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
};
