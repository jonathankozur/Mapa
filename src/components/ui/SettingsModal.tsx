import React, { useState, useRef } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { useProjects } from '../../hooks/useProjects';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'grid' | 'projects'>('grid');
    const {
        projectSettings,
        setProjectSettings,
        polygons,
        generatedPoints,
        projectName,
        currentProjectId,
        setCurrentProject,
        loadProjectData,
        clearProject
    } = useMapStore();

    const {
        projects,
        loading,
        error,
        saveProject,
        loadProject,
        deleteProject,
        exportProject,
        importProject
    } = useProjects();

    // Project Manager State
    const [projectNameInput, setProjectNameInput] = useState(projectName);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // --- Helpers ---
    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const updateSettings = (updates: Partial<typeof projectSettings>) => {
        setProjectSettings({ ...projectSettings, ...updates });
    };

    // --- Project Actions ---
    const handleSave = async () => {
        if (polygons.length === 0) {
            showMessage('error', 'Dibuja un polígono primero');
            return;
        }
        setSaving(true);
        try {
            const id = await saveProject(
                projectNameInput,
                polygons[polygons.length - 1],
                generatedPoints,
                projectSettings,
                currentProjectId || undefined
            );
            setCurrentProject(id, projectNameInput);
            showMessage('success', 'Guardado correctamente');
        } catch (err) {
            showMessage('error', 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleLoad = async (id: string) => {
        try {
            const project = await loadProject(id);
            if (project) {
                loadProjectData(project.polygon, project.points, project.settings);
                setCurrentProject(project.id, project.name);
                setProjectNameInput(project.name);
                showMessage('success', `Cargado: ${project.name}`);
            }
        } catch (err) {
            showMessage('error', 'Error al cargar');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar "${name}"?`)) return;
        try {
            await deleteProject(id);
            if (currentProjectId === id) {
                clearProject();
                setProjectNameInput('Nuevo Proyecto');
            }
            showMessage('success', 'Eliminado');
        } catch (err) {
            showMessage('error', 'Error al eliminar');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const id = await importProject(file);
            await handleLoad(id);
            showMessage('success', 'Importado correctamente');
        } catch (err) {
            showMessage('error', 'Error al importar');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Configuración</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'grid' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('grid')}
                    >
                        Grilla
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'projects' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('projects')}
                    >
                        Proyectos
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'grid' ? (
                        <div className="space-y-6">
                            {/* Spacing */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Espaciado: {projectSettings.spacing} m
                                </label>
                                <input
                                    type="range"
                                    min="10"
                                    max="500"
                                    step="10"
                                    value={projectSettings.spacing}
                                    onChange={(e) => updateSettings({ spacing: Number(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Rotation */}
                            {!projectSettings.useRoads && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rotación: {projectSettings.rotation || 0}°
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={projectSettings.rotation || 0}
                                        onChange={(e) => updateSettings({ rotation: Number(e.target.value) })}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                            )}

                            {/* Grid Type */}
                            {!projectSettings.useRoads && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Patrón</label>
                                    <div className="flex gap-2">
                                        {(['rect', 'hex'] as const).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => updateSettings({ gridType: type })}
                                                className={`flex-1 py-2 px-3 text-sm rounded border ${projectSettings.gridType === type
                                                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                                                    : 'border-gray-300 text-gray-600'
                                                    }`}
                                            >
                                                {type === 'rect' ? 'Rectangular' : 'Hexagonal'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Use Roads */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="useRoads"
                                    checked={projectSettings.useRoads}
                                    onChange={(e) => updateSettings({ useRoads: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="useRoads" className="ml-2 block text-sm text-gray-900">
                                    Solo en rutas transitables
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Project Name */}
                            <div>
                                <input
                                    type="text"
                                    value={projectNameInput}
                                    onChange={(e) => setProjectNameInput(e.target.value)}
                                    placeholder="Nombre del proyecto"
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                    onClick={() => { clearProject(); setProjectNameInput('Nuevo Proyecto'); }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded"
                                >
                                    Nuevo
                                </button>
                            </div>

                            {/* Import/Export */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => currentProjectId && exportProject(currentProjectId)}
                                    disabled={!currentProjectId}
                                    className="flex-1 border border-blue-500 text-blue-600 hover:bg-blue-50 py-1.5 rounded text-sm disabled:opacity-50"
                                >
                                    Exportar GeoJSON
                                </button>
                                <label className="flex-1 border border-blue-500 text-blue-600 hover:bg-blue-50 py-1.5 rounded text-sm text-center cursor-pointer">
                                    Importar
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".geojson,.json"
                                        onChange={handleImport}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {message && (
                                <div className={`p-2 text-sm rounded text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}

                            {/* List */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-gray-700 mb-2">Guardados</h4>
                                {loading ? (
                                    <div className="text-center text-gray-500">Cargando...</div>
                                ) : error ? (
                                    <div className="text-center text-red-500 text-sm">{error}</div>
                                ) : projects.length === 0 ? (
                                    <div className="text-center text-gray-500 text-sm">No hay proyectos.</div>
                                ) : (
                                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                                        {projects.map((p) => (
                                            <li key={p.id} className={`flex justify-between items-center p-2 rounded border ${currentProjectId === p.id ? 'bg-blue-50 border-blue-200' : 'border-gray-100'}`}>
                                                <span
                                                    className="truncate cursor-pointer flex-1 font-medium text-sm text-gray-700"
                                                    onClick={() => handleLoad(p.id)}
                                                >
                                                    {p.name}
                                                </span>
                                                <button onClick={() => handleDelete(p.id, p.name)} className="text-red-400 hover:text-red-600 ml-2">
                                                    ✕
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
