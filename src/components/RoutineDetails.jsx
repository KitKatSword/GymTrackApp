export default function RoutineDetails({ routine, showRest = true, actions = null }) {
    return (
        <>
            {routine.exercises.map((exercise, index) => (
                <div key={`${exercise.exerciseId || exercise.id || exercise.name}-${index}`} className="routine-detail-item">
                    <span className="routine-detail-name">{exercise.name}</span>
                    <span className="routine-detail-sets">
                        {exercise.setsCount} serie
                        {showRest && exercise.targetRest && exercise.targetRest !== 90 && (
                            <span style={{ marginLeft: 6, opacity: 0.7 }}>
                                · ⏱ {Math.floor(exercise.targetRest / 60)}:{(exercise.targetRest % 60).toString().padStart(2, '0')}
                            </span>
                        )}
                    </span>
                </div>
            ))}

            {actions && (
                <div className="history-actions" style={{ marginTop: 12 }}>
                    {actions}
                </div>
            )}
        </>
    )
}
