import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db, Project } from '../lib/db';
import { Feature, Polygon, FeatureCollection, Point } from 'geojson';

interface UseProjectsReturn {
    projects: Project[];
    loading: boolean;
    error: string | null;
    saveProject: (
        name: string,
        polygon: Feature<Polygon>,
        points: FeatureCollection<Point> | null,
        settings: {
            spacing: number;
            useRoads: boolean;
            rotation: number;
            gridType: 'rect' | 'hex';
        },
        existingId?: string
    ) => Promise<string>;
    loadProject: (id: string) => Promise<Project | undefined>;
    deleteProject: (id: string) => Promise<void>;
    exportProject: (id: string) => Promise<void>;
    importProject: (file: File) => Promise<string>;
    refreshProjects: () => Promise<void>;
}

/**
 * Hook personalizado para gestionar proyectos en IndexedDB
 */
export function useProjects(): UseProjectsReturn {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar lista de proyectos
    const refreshProjects = useCallback(async () => {
        try {
            setLoading(true);
            const allProjects = await db.projects
                .orderBy('updatedAt')
                .reverse()
                .toArray();
            setProjects(allProjects);
            setError(null);
        } catch (err) {
            console.error('Error loading projects:', err);
            setError('Error cargando proyectos');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar al montar
    useEffect(() => {
        refreshProjects();
    }, [refreshProjects]);

    // Guardar proyecto (crear o actualizar)
    const saveProject = useCallback(async (
        name: string,
        polygon: Feature<Polygon>,
        points: FeatureCollection<Point> | null,
        settings: {
            spacing: number;
            useRoads: boolean;
            rotation: number;
            gridType: 'rect' | 'hex';
        },
        existingId?: string
    ): Promise<string> => {
        const now = new Date();
        const id = existingId || uuidv4();

        const project: Project = {
            id,
            name,
            createdAt: existingId
                ? (await db.projects.get(existingId))?.createdAt || now
                : now,
            updatedAt: now,
            polygon,
            points,
            settings
        };

        await db.projects.put(project);
        await refreshProjects();
        return id;
    }, [refreshProjects]);

    // Cargar un proyecto específico
    const loadProject = useCallback(async (id: string): Promise<Project | undefined> => {
        return await db.projects.get(id);
    }, []);

    // Eliminar proyecto
    const deleteProject = useCallback(async (id: string): Promise<void> => {
        await db.projects.delete(id);
        await refreshProjects();
    }, [refreshProjects]);

    // Exportar proyecto como GeoJSON
    const exportProject = useCallback(async (id: string): Promise<void> => {
        const project = await db.projects.get(id);
        if (!project) {
            throw new Error('Proyecto no encontrado');
        }

        const geoJson = {
            type: 'FeatureCollection',
            properties: {
                name: project.name,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                settings: project.settings
            },
            features: [
                project.polygon,
                ...(project.points?.features || [])
            ]
        };

        const blob = new Blob([JSON.stringify(geoJson, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/\s+/g, '_')}.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    // Importar proyecto desde archivo GeoJSON
    const importProject = useCallback(async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const content = e.target?.result as string;
                    const geoJson = JSON.parse(content);

                    // Buscar el polígono en las features
                    const polygonFeature = geoJson.features?.find(
                        (f: any) => f.geometry?.type === 'Polygon'
                    );

                    if (!polygonFeature) {
                        throw new Error('No se encontró un polígono en el archivo');
                    }

                    // Buscar puntos
                    const pointFeatures = geoJson.features?.filter(
                        (f: any) => f.geometry?.type === 'Point'
                    ) || [];

                    const points: FeatureCollection<Point> | null = pointFeatures.length > 0
                        ? { type: 'FeatureCollection', features: pointFeatures }
                        : null;

                    // Extraer metadata si existe
                    const props = geoJson.properties || {};
                    const name = props.name || file.name.replace('.geojson', '');
                    // Default values for new settings if reading old files
                    const settings = props.settings || {
                        spacing: 50,
                        useRoads: false,
                        rotation: 0,
                        gridType: 'rect'
                    };

                    // Fallback individual if settings obj exists but keys miss
                    if (settings.rotation === undefined) settings.rotation = 0;
                    if (settings.gridType === undefined) settings.gridType = 'rect';

                    const id = await saveProject(name, polygonFeature, points, settings);
                    resolve(id);
                } catch (err) {
                    console.error('Error importing project:', err);
                    reject(new Error('Error importando archivo. Verifica el formato.'));
                }
            };

            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            reader.readAsText(file);
        });
    }, [saveProject]);

    return {
        projects,
        loading,
        error,
        saveProject,
        loadProject,
        deleteProject,
        exportProject,
        importProject,
        refreshProjects
    };
}
