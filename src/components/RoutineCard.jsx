import { getRoutineTotalSets } from '../utils/workouts'

export default function RoutineCard({
    routine,
    expanded = false,
    onToggle,
    action = null,
    children = null,
    style = {},
}) {
    const totalSets = getRoutineTotalSets(routine)

    return (
        <div
            className="routine-card"
            style={{ borderLeft: `5px solid ${routine.color || 'var(--border)'}`, cursor: onToggle ? 'pointer' : undefined, ...style }}
            onClick={onToggle}
        >
            <div className="routine-card-header">
                <div>
                    <div className="routine-card-title">{routine.name}</div>
                    <div className="routine-card-meta">
                        {routine.exercises.length} esercizi · {totalSets} serie
                    </div>
                </div>
                {action}
            </div>

            <div className="routine-card-tags">
                {routine.exercises.map((exercise, index) => (
                    <span key={`${exercise.exerciseId || exercise.id || exercise.name}-${index}`} className="history-tag">
                        {exercise.name}
                    </span>
                ))}
            </div>

            {expanded && (
                <div className="history-expanded">
                    {children}
                </div>
            )}
        </div>
    )
}
