export default function Home({ stats, todayWorkout, onStartWorkout, onResumeWorkout }) {
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
        </div>
    )
}
