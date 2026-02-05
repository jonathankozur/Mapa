import React, { ReactNode } from 'react';
import { GridControl } from '../../features/grid/components/GridControl';
import { ProjectManager } from '../../features/projects/components/ProjectManager';

interface LayoutProps {
    children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
            {/* Sidebar */}
            <aside className="w-72 bg-white shadow-md z-10 flex flex-col overflow-hidden">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold text-blue-600">Mapa GIS</h1>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-4">
                    <ProjectManager />
                    <GridControl />
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative">
                {children}
            </main>
        </div>
    );
};
