import { useNavigationStore } from '../../store/useNavigationStore';
import { useMapStore } from '../../store/useMapStore';

export const NavigationControls = () => {
    const { status, startSession, pauseSession, resumeSession, stopSession, resetSession, elapsedTime } = useNavigationStore();
    const { generatedPoints } = useMapStore();

    // Only show if we have points to navigate
    const hasPoints = generatedPoints && generatedPoints.features.length > 0;

    // 1. Idle + No Points = Hide (Nothing to do)
    if (status === 'idle' && !hasPoints) return null;

    // 2. Navigation Active + No Points = Error State (Show Reset)
    if (status !== 'idle' && !hasPoints) {
        return (
            <div className="leaflet-bottom leaflet-center" style={{
                pointerEvents: 'auto',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000
            }}>
                <button
                    onClick={resetSession}
                    className="flex flex-row items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl hover:bg-red-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-bold">Error de Sesión: Reiniciar</span>
                </button>
            </div>
        );
    }

    // Formatting Time (MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // FAB Component (Icon Only)
    const NavFab = ({ onClick, icon, color = 'blue', label }: any) => (
        <button
            onClick={onClick}
            title={label}
            className={`flex items-center justify-center bg-white p-4 rounded-full shadow-2xl border-4 border-${color}-500 text-${color}-600 active:scale-95 transition-transform hover:bg-${color}-50`}
            style={{ width: '80px', height: '80px' }}
        >
            {icon}
        </button>
    );

    // Render Logic based on Status
    return (
        <div className="leaflet-bottom leaflet-center" style={{
            pointerEvents: 'auto',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            gap: '16px',
            alignItems: 'center'
        }}>
            {/* Status Indicator / Timer */}
            {status !== 'idle' && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-md font-mono font-bold text-gray-800 whitespace-nowrap">
                    {formatTime(elapsedTime)}
                </div>
            )}

            {/* CONTROL: IDLE -> START */}
            {status === 'idle' && (
                <NavFab
                    onClick={startSession}
                    label="INICIAR"
                    color="green"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}
                />
            )}

            {/* CONTROL: RUNNING -> PAUSE | STOP */}
            {status === 'running' && (
                <>
                    <NavFab
                        onClick={pauseSession}
                        label="PAUSAR"
                        color="yellow"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
                    />
                    <NavFab
                        onClick={stopSession}
                        label="PARAR"
                        color="red"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>}
                    />
                </>
            )}

            {/* CONTROL: PAUSED -> RESUME | STOP */}
            {status === 'paused' && (
                <>
                    <NavFab
                        onClick={resumeSession}
                        label="SEGUIR"
                        color="green"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}
                    />
                    <NavFab
                        onClick={stopSession}
                        label="PARAR"
                        color="red"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>}
                    />
                </>
            )}

            {/* FINISHED -> SUMMARY (Handled by Modal later, but Reset here) */}
            {status === 'finished' && (
                <div className="bg-white p-4 rounded-lg shadow-xl flex flex-col items-center gap-2">
                    <p className="font-bold">¡Recorrido Finalizado!</p>
                    <button
                        onClick={resetSession}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold w-full"
                    >
                        Salir
                    </button>
                </div>
            )}
        </div>
    );
};
