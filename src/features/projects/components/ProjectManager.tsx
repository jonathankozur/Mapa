import { useState, useRef } from 'react';
import { useProjects } from '../../../hooks/useProjects';
import { useMapStore } from '../../../store/useMapStore';

export const ProjectManager = () => {
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

    const {
        polygons,
        generatedPoints,
        projectName,
        projectSettings,
        currentProjectId,
        setCurrentProject,
        loadProjectData,
        clearProject
    } = useMapStore();

    const [saving, setSaving] = useState(false);
    const [projectNameInput, setProjectNameInput] = useState(projectName);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSave = async () => {
        if (polygons.length === 0) {
            showMessage('error', 'Primero dibuja un polígono');
            return;
        }

        setSaving(true);
        try {
            const polygon = polygons[polygons.length - 1];
            const id = await saveProject(
                projectNameInput,
                polygon,
                generatedPoints,
                projectSettings,
                currentProjectId || undefined
            );
            setCurrentProject(id, projectNameInput);
            showMessage('success', 'Proyecto guardado');
        } catch (err) {
            showMessage('error', 'Error guardando proyecto');
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
            showMessage('error', 'Error cargando proyecto');
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
            showMessage('success', 'Proyecto eliminado');
        } catch (err) {
            showMessage('error', 'Error eliminando proyecto');
        }
    };

    const handleExport = async (id: string) => {
        try {
            await exportProject(id);
            showMessage('success', 'Archivo descargado');
        } catch (err) {
            showMessage('error', 'Error exportando');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const id = await importProject(file);
            await handleLoad(id);
            showMessage('success', 'Proyecto importado');
        } catch (err) {
            showMessage('error', 'Error importando archivo');
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleNew = () => {
        clearProject();
        setProjectNameInput('Nuevo Proyecto');
    };

    return (
        <div className="p-4 bg-white rounded shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3">Proyecto</h3>

            {/* Nombre del proyecto */}
            <div className="mb-3">
                <input
                    type="text"
                    value={projectNameInput}
                    onChange={(e) => setProjectNameInput(e.target.value)}
                    placeholder="Nombre del proyecto"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 mb-3">
                <button
                    onClick={handleSave}
                    disabled={saving || polygons.length === 0}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm py-2 px-3 rounded transition-colors"
                >
                    {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                    onClick={handleNew}
                    className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded transition-colors"
                >
                    Nuevo
                </button>
            </div>

            {/* Import/Export */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => currentProjectId && handleExport(currentProjectId)}
                    disabled={!currentProjectId}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-xs py-1.5 px-2 rounded transition-colors"
                >
                    Exportar GeoJSON
                </button>
                <label className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-1.5 px-2 rounded transition-colors text-center cursor-pointer">
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

            {/* Mensaje de feedback */}
            {message && (
                <p className={`text-xs text-center mb-3 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'
                    }`}>
                    {message.text}
                </p>
            )}

            {/* Lista de proyectos */}
            <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Proyectos Guardados
                </h4>

                {loading ? (
                    <p className="text-xs text-gray-500">Cargando...</p>
                ) : error ? (
                    <p className="text-xs text-red-500">{error}</p>
                ) : projects.length === 0 ? (
                    <p className="text-xs text-gray-500">No hay proyectos guardados</p>
                ) : (
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {projects.map((project) => (
                            <li
                                key={project.id}
                                className={`p-2 rounded border text-sm ${currentProjectId === project.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span
                                        className="truncate flex-1 cursor-pointer hover:text-blue-600"
                                        onClick={() => handleLoad(project.id)}
                                        title={project.name}
                                    >
                                        {project.name}
                                    </span>
                                    <div className="flex gap-1 ml-2">
                                        <button
                                            onClick={() => handleExport(project.id)}
                                            className="text-blue-500 hover:text-blue-700 text-xs p-1"
                                            title="Exportar"
                                        >
                                            ↓
                                        </button>
                                        <button
                                            onClick={() => handleDelete(project.id, project.name)}
                                            className="text-red-500 hover:text-red-700 text-xs p-1"
                                            title="Eliminar"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(project.updatedAt).toLocaleDateString()}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
