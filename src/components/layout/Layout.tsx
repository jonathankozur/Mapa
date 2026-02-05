import React, { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
}

import { useNavigationStore } from '../../store/useNavigationStore';
import { useMapStore } from '../../store/useMapStore';
import { useEffect } from 'react';

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { tickTimer } = useNavigationStore();
    const { isSearchOpen, setSearchOpen } = useMapStore();

    useEffect(() => {
        const interval = setInterval(() => {
            tickTimer();
        }, 1000);
        return () => clearInterval(interval);
    }, [tickTimer]);
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-100 relative">

            {/* Search Bar Placeholder (Google Maps Style) */}
            {/* Search Toggle Button & Bar */}
            <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-[90%] max-w-md transition-all duration-300 ${isSearchOpen ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'}`}>
                <div className="bg-white rounded-lg shadow-md flex items-center p-3 border border-gray-200 pointer-events-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar lugar (próximamente)..."
                        className="flex-1 ml-3 outline-none text-gray-700 bg-transparent placeholder-gray-400"
                        disabled
                    />
                    <button onClick={() => setSearchOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>



            {/* Main Content (Map) */}
            <main className="flex-1 relative w-full h-full">
                {children}
            </main>
        </div>
    );
};
