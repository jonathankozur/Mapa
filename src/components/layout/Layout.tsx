import React, { ReactNode } from 'react';
import { GridControl } from '../../features/grid/components/GridControl';

interface LayoutProps {
    children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
            {/* Sidebar Placeholder */}
            <aside className="w-64 bg-white shadow-md z-10 flex flex-col p-4">
                <h1 className="text-xl font-bold text-blue-600 mb-6">Mapa GIS</h1>
                <nav className="flex-1 overflow-y-auto">
                    <div className="mb-4">
                        <GridControl />
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative">
                {children}
            </main>
        </div>
    );
};
