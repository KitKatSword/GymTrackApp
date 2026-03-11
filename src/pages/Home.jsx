import { useRef, useState } from 'react'
import ActivityHeatmap from '../components/ActivityHeatmap'

export default function Home({ stats, workouts, activeWorkout, onStartWorkout, onResumeWorkout, onExport, onImport, theme, onToggleTheme, routines = [], onStartFromRoutine }) {
    const [showBackupModal, setShowBackupModal] = useState(false)
    const [expandedRoutineId, setExpandedRoutineId] = useState(null)
    const longPressTimer = useRef(null)
    const today = new Date()
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

    const recentRoutineNames = [...new Set(workouts.filter(w => w.routineName).map(w => w.routineName))].slice(0, 4);
    const recentRoutines = recentRoutineNames.map(name => routines.find(r => r.name === name)).filter(Boolean);

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div className="page-subtitle">
                        {dayNames[today.getDay()]}, {today.getDate()} {monthNames[today.getMonth()]}
                    </div>
                    <div className="page-title">GymTrack</div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="theme-toggle" onClick={() => setShowBackupModal(true)} aria-label="Backup Dati">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </button>
                    <button className="theme-toggle" onClick={onToggleTheme} aria-label="Cambia tema">
                        {theme === 'dark' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.streak}</div>
                    <div className="stat-label">Streak</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.thisWeekCount}</div>
                    <div className="stat-label">Settimana</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalSets}</div>
                    <div className="stat-label">Serie tot</div>
                </div>
            </div>

            {/* Heatmap */}
            <ActivityHeatmap workouts={workouts} />

            {activeWorkout ? (
                <div className="active-workout-card" style={{ marginTop: 'var(--space-4)' }}>
                    <div className="active-workout-card-header">
                        <div>
                            <div className="active-workout-card-title">Allenamento in corso</div>
                            <div className="active-workout-card-subtitle">
                                Iniziato alle {activeWorkout.startTime}
                            </div>
                        </div>
                        <div className="pulse-dot" />
                    </div>
                    <div className="active-workout-card-meta">
                        {activeWorkout.exercises.length} esercizi · {activeWorkout.exercises.reduce((s, e) => s + e.sets.filter(st => st.completed).length, 0)} serie completate
                    </div>
                    <button className="btn btn-primary btn-full" onClick={onResumeWorkout}>
                        Continua →
                    </button>
                </div>
            ) : (
                <>
                    {/* Azioni Rapide */}
                    <div style={{ marginTop: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
                        <button
                            className="btn btn-full"
                            onClick={onStartWorkout}
                            style={{
                                padding: 'var(--space-4)',
                                fontSize: 'var(--text-base)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'var(--bg-card)' }}
                            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)' }}
                            onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.backgroundColor = 'var(--bg-card)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--accent-dim)', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </div>
                                <span style={{ fontWeight: 700 }}>Allenamento Libero</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </button>
                    </div>

                    {/* Routine Recenti */}
                    {recentRoutines.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-5)' }}>
                            <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Fatte di recente</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {recentRoutines.map(routine => {
                                    const isExpanded = expandedRoutineId === routine.id;
                                    return (
                                        <div
                                            key={routine.id}
                                            className="routine-card"
                                            style={{ borderLeft: `5px solid ${routine.color || 'var(--border)'}`, cursor: 'pointer' }}
                                            onClick={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                                        >
                                            <div className="routine-card-header">
                                                <div>
                                                    <div className="routine-card-title">{routine.name}</div>
                                                    <div className="routine-card-meta">
                                                        {routine.exercises.length} esercizi · {routine.exercises.reduce((s, e) => s + e.setsCount, 0)} serie
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (activeWorkout) {
                                                            alert("Hai già un allenamento in corso. Terminalo prima di iniziarne uno nuovo.")
                                                        } else {
                                                            onStartFromRoutine(routine)
                                                        }
                                                    }}
                                                    className={activeWorkout ? "play-btn-round disabled" : "play-btn-round"}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}>
                                                        <polygon points="5 3 19 12 5 21 5 3" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Exercise preview tags */}
                                            <div className="routine-card-tags">
                                                {routine.exercises.map((ex, i) => (
                                                    <span key={i} className="history-tag">{ex.name}</span>
                                                ))}
                                            </div>

                                            {isExpanded && (
                                                <div className="history-expanded">
                                                    {routine.exercises.map((ex, i) => (
                                                        <div key={i} className="routine-detail-item">
                                                            <span className="routine-detail-name">{ex.name}</span>
                                                            <span className="routine-detail-sets">
                                                                {ex.setsCount} serie
                                                                {ex.targetRest && ex.targetRest !== 90 && (
                                                                    <span style={{ marginLeft: 6, opacity: 0.7 }}>
                                                                        · ⏱ {Math.floor(ex.targetRest / 60)}:{(ex.targetRest % 60).toString().padStart(2, '0')}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}



            {/* Backup Modal */}
            {showBackupModal && (
                <div className="modal-overlay" onClick={() => setShowBackupModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div style={{ fontWeight: 700, fontSize: "var(--text-lg)", marginBottom: 16 }}>
                            Gestione Dati
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: 24 }}>
                            Effettua il backup dei tuoi allenamenti, oppure ripristina i dati da un file preesistente.
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <button className="btn btn-secondary" onClick={() => { onExport(); setShowBackupModal(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Esporta Backup
                            </button>
                            <button className="btn btn-secondary" onClick={() => { onImport(); setShowBackupModal(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Importa Dati
                            </button>
                        </div>
                        <button className="btn btn-ghost btn-full" style={{ marginTop: 'var(--space-4)' }} onClick={() => setShowBackupModal(false)}>
                            Annulla
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
