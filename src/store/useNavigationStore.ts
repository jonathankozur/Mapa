import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavigationStatus = 'idle' | 'running' | 'paused' | 'finished';

interface NavigationState {
    status: NavigationStatus;
    visitedIndices: number[]; // Storing indices of generatedPoints.features
    startTime: number | null;
    elapsedTime: number; // in seconds

    // Actions
    startSession: () => void;
    pauseSession: () => void;
    resumeSession: () => void;
    stopSession: () => void;
    markPointVisited: (index: number) => void;
    resetSession: () => void;
    tickTimer: () => void; // Call every second
}

export const useNavigationStore = create<NavigationState>()(
    persist(
        (set, get) => ({
            status: 'idle',
            visitedIndices: [],
            startTime: null,
            elapsedTime: 0,

            startSession: () => set({
                status: 'running',
                startTime: Date.now(),
                // If starting fresh, clear visited? Or keep resume? 
                // For MVP: Start = Start Fresh or Resume depending on context? 
                // Let's assume Start from Idle = Clear.
            }),

            resumeSession: () => set({ status: 'running' }),

            pauseSession: () => set({ status: 'paused' }),

            stopSession: () => set({ status: 'finished' }),

            markPointVisited: (index) => {
                const { visitedIndices } = get();
                if (!visitedIndices.includes(index)) {
                    set({ visitedIndices: [...visitedIndices, index] });
                    return true;
                }
                return false;
            },

            resetSession: () => set({
                status: 'idle',
                visitedIndices: [],
                startTime: null,
                elapsedTime: 0
            }),

            tickTimer: () => {
                if (get().status === 'running') {
                    set((state) => ({ elapsedTime: state.elapsedTime + 1 }));
                }
            }
        }),
        {
            name: 'navigation-storage',
        }
    )
);
