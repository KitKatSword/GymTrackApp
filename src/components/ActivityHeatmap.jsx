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
            if (!w.endTime || !w.date) return;
            if (!data[w.date]) data[w.date] = 0;

            let setsCount = 0;
            if (Array.isArray(w.exercises)) {
                w.exercises.forEach(ex => {
                    if (ex.isEmom && ex.emomCompleted) {
                        setsCount += 3;
                    } else if (Array.isArray(ex.sets)) {
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

    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    return (
        <div className="card" style={{ marginBottom: 'var(--space-4)', padding: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>
                    Attività <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>· Ultime {weeks} settimane</span>
                </div>

                {/* Scroll Button posizionato in alto, non rompe lo scorrimento laterale */}
                <button
                    onClick={() => setWeeks(isExpanded ? defaultWeeks : expandedWeeks)}
                    style={{
                        background: 'var(--bg-card-hover)',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none',
                        flexShrink: 0
                    }}
                    title={isExpanded ? "Meno settimane" : "Più settimane"}
                >
                    <svg
                        width="18" height="18" viewBox="0 0 24 24" fill="none"
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

            <div className="heatmap-container-wrapper" style={{ margin: 0, paddingBottom: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>

                    {/* Colonne Etichette Giorni */}
                    <div style={{ display: 'flex', flexDirection: 'column', marginRight: '8px' }}>
                        <div style={{ height: '24px' }}></div> {/* Spazio vuoto per allineare altezza intestazione mesi */}
                        {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((label, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)' }}>
                                {i % 2 === 1 ? label : ''}
                            </div>
                        ))}
                    </div>

                    {/* Griglia Scorrevoli strutturata in COLONNE per settimana */}
                    <div style={{ display: 'flex', flex: 1, gap: isExpanded ? '3px' : '5px', minWidth: isExpanded ? '600px' : 'auto' }}>
                        {grid.map((week, idx) => {
                            // Legge il mese estraendolo direttamente dalla stringa YYYY-MM-DD per evitare bug da fuso orario di 'new Date()'
                            const getMonthSafe = (wIdx) => parseInt(grid[wIdx][0].date.split('-')[1], 10) - 1;
                            const currentMonth = getMonthSafe(idx);

                            // Mostra il mese se è la prima colonna in assoluto o se è avvenuto il transito ad un mese diverso dalla colonna precedente
                            const showMonth = idx === 0 || currentMonth !== getMonthSafe(idx - 1);

                            return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

                                    {/* Etichetta Mese */}
                                    <div style={{ height: '24px', position: 'relative' }}>
                                        {showMonth && (
                                            <span style={{
                                                position: 'absolute',
                                                left: 0,
                                                bottom: '6px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: 'var(--text-muted)',
                                                whiteSpace: 'nowrap' /* Impedisce che testi lunghi vadano a capo rovinando il layout */
                                            }}>
                                                {monthNames[currentMonth]}
                                            </span>
                                        )}
                                    </div>

                                    {/* 7 Giorni Cella flexbox verticalmente scalati */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: isExpanded ? '3px' : '5px', flex: 1 }}>
                                        {week.map(day => (
                                            <div
                                                key={day.date}
                                                className={`heatmap-cell ${day.isFuture ? 'future' : getIntensityClass(day.intensity)}`}
                                                title={day.isFuture ? '' : `${day.date} — ${day.intensity ? day.intensity + ' serie' : 'Nessun allenamento'}`}
                                                style={{
                                                    flex: 1,
                                                    aspectRatio: '1 / 1', /* Mantiene sempre un quadrato perfetto indipendentemente da quanti pixel assume flex */
                                                    borderRadius: isExpanded ? '2px' : '4px',
                                                    transition: 'border-radius 0.3s ease'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
