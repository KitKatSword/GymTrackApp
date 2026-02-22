export default function Home({ stats, todayWorkout, onStartWorkout, onResumeWorkout, onExport, onImport }) {
    const today = new Date()
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-subtitle">
                    {dayNames[today.getDay()]}, {today.getDate()} {monthNames[today.getMonth()]}
                </div>
                <div className="page-title">GymTrack</div>
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

            {/* Active workout / start CTA */}
            {todayWorkout ? (
                <div className="active-workout-card">
                    <div className="active-workout-card-header">
                        <div>
                            <div className="active-workout-card-title">Allenamento in corso</div>
                            <div className="active-workout-card-subtitle">
                                Iniziato alle {todayWorkout.startTime}
                            </div>
                        </div>
                        <div className="pulse-dot" />
                    </div>
                    <div className="active-workout-card-meta">
                        {todayWorkout.exercises.length} esercizi · {todayWorkout.exercises.reduce((s, e) => s + e.sets.filter(st => st.completed).length, 0)} serie completate
                    </div>
                    <button className="btn btn-primary btn-full" onClick={onResumeWorkout}>
                        Continua →
                    </button>
                </div>
            ) : (
                <button
                    className="btn btn-primary btn-full btn-lg"
                    onClick={onStartWorkout}
                    style={{ marginBottom: 'var(--space-4)' }}
                >
                    Inizia Allenamento
                </button>
            )}

            {/* Motivation card */}
            <div className="motivation-card">
                <div className="motivation-card-title">
                    {stats.totalWorkouts === 0
                        ? 'Inizia il tuo percorso'
                        : stats.streak >= 7
                            ? 'Settimana perfetta!'
                            : stats.streak >= 3
                                ? 'Grande costanza!'
                                : 'Continua così!'
                    }
                </div>
                <div className="motivation-card-subtitle">
                    {stats.totalWorkouts} allenamenti completati
                </div>
            </div>

            {/* Backup section */}
            <div className="backup-section">
                <div className="section-label">Backup Dati</div>
                <div className="backup-buttons">
                    <button className="btn btn-secondary btn-sm" onClick={onExport} style={{ flex: 1 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Esporta
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={onImport} style={{ flex: 1 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Importa
                    </button>
                </div>
            </div>
        </div>
    )
}
