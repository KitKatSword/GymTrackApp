import { useMemo, useState } from 'react';

export default function ActivityHeatmap({ workouts }) {
    const defaultWeeks = 14;
    const expandedWeeks = 28;
    const [weeks, setWeeks] = useState(defaultWeeks);
    const isExpanded = weeks > defaultWeeks;

    const heatmapData = useMemo(() => {
        const data = {};
        if (!workouts) return data;

        workouts.forEach(w => {
            if (!w.endTime) return;
            if (!data[w.date]) data[w.date] = 0;

            // Somma delle serie per quantificare l'intensità del giorno
            let setsCount = 0;
            if (w.exercises) {
                w.exercises.forEach(ex => {
                    if (ex.isEmom && ex.emomCompleted) {
                        setsCount += 3; // Un EMOM conta all'incirca come 3 serie
                    } else if (ex.sets) {
                        setsCount += ex.sets.filter(s => s.completed).length;
                    }
                });
            }
            data[w.date] += setsCount > 0 ? setsCount : 1;
        });
        return data;
    }, [workouts]);

    const grid = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (today.getDay()) - ((weeks - 1) * 7));

        const weeksArray = [];
        let currDate = new Date(startDate);

        for (let w = 0; w < weeks; w++) {
            const weekDays = [];
            for (let d = 0; d < 7; d++) {
                const yyyy = currDate.getFullYear();
                const mm = String(currDate.getMonth() + 1).padStart(2, '0');
                const dd = String(currDate.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;

                const intensity = heatmapData[dateStr] || 0;
                weekDays.push({ date: dateStr, intensity, isFuture: currDate > today });
                currDate.setDate(currDate.getDate() + 1);
            }
            weeksArray.push(weekDays);
        }
        return weeksArray;
    }, [heatmapData, weeks]);

    const getIntensityClass = (val) => {
        if (!val) return 'heatmap-0';
        if (val <= 5) return 'heatmap-1';
        if (val <= 10) return 'heatmap-2';
        if (val <= 16) return 'heatmap-3';
        return 'heatmap-4';
    };

    return (
        <div className="card" style={{ marginBottom: 'var(--space-4)', padding: '16px' }}>
            <div className="heatmap-container-wrapper" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
                <div className="heatmap-container" style={{ width: '100%', display: 'flex', alignItems: 'stretch' }}>

                    {/* Colonne Etichette Giorni */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isExpanded ? '2px' : '5px',
                        paddingRight: '6px',
                        minWidth: '24px',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                        transition: 'gap 0.4s ease'
                    }}>
                        {['', 'Lun', '', 'Mer', '', 'Ven', ''].map((label, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Griglia Heatmap */}
                    <div className="heatmap-grid" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isExpanded ? '2px' : '5px',
                        flex: 1,
                        transition: 'gap 0.4s ease'
                    }}>
                        {Array.from({ length: 7 }).map((_, dayIndex) => (
                            <div key={dayIndex} className="heatmap-row" style={{ display: 'flex', gap: isExpanded ? '2px' : '5px', width: '100%', transition: 'gap 0.4s ease' }}>
                                {grid.map((week, weekIndex) => {
                                    const day = week[dayIndex];
                                    return (
                                        <div
                                            key={`${day.date}-${weekIndex}`}
                                            className={`heatmap-cell ${day.isFuture ? 'future' : getIntensityClass(day.intensity)}`}
                                            title={day.isFuture ? '' : `${day.date} — ${day.intensity ? day.intensity + ' serie' : 'Nessun allenamento'}`}
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                flex: 1,
                                                aspectRatio: '1 / 1',
                                                borderRadius: isExpanded ? '2px' : '4px',
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Pulsante Espandi/Restringi */}
                    <button
                        onClick={() => setWeeks(isExpanded ? defaultWeeks : expandedWeeks)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0 0 0 8px',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            outline: 'none'
                        }}
                        title={isExpanded ? "Meno settimane" : "Più settimane"}
                    >
                        <svg
                            width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.4s ease'
                            }}
                        >
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>

                </div>
            </div>
        </div>
    );
}
