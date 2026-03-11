import HistoryExerciseDetails from './HistoryExerciseDetails'
import { getWorkoutDuration } from '../../utils/workouts'
import { getWorkoutHistoryBadge } from '../../utils/history'

const VIDEO_WORKOUT_COLOR = '#ef4444'

export default function HistoryWorkoutCard({
    workout,
    expanded = false,
    onToggle,
    onDuplicate,
    onDelete,
}) {
    return (
        <div
            className="history-card"
            onClick={onToggle}
            style={{
                borderLeft: `5px solid ${workout.routineColor || (workout.isVideoWorkout ? VIDEO_WORKOUT_COLOR : 'var(--border)')}`,
            }}
        >
            <div className="history-card-top">
                <div>
                    {workout.routineName && <div className="history-date">{workout.routineName}</div>}
                    <div className="history-meta" style={{ marginTop: workout.routineName ? 0 : 4 }}>
                        <span>{workout.startTime} – {workout.endTime}</span>
                        <span>{getWorkoutDuration(workout.startTime, workout.endTime)}</span>
                    </div>
                </div>
                <span className="history-sets-badge">
                    {getWorkoutHistoryBadge(workout)}
                </span>
            </div>

            <div className="history-exercises">
                {(workout.exercises || []).map((exercise, index) => (
                    <span key={`${exercise.id || exercise.name}-${index}`} className="history-tag">{exercise.name}</span>
                ))}
            </div>

            {expanded && (
                <div className="history-expanded">
                    {workout.notes && (
                        <div className="history-note-panel">
                            <div className="history-note-title">Note Allenamento:</div>
                            <div className="history-note-copy">{workout.notes}</div>
                        </div>
                    )}

                    {(workout.exercises || []).map((exercise, index) => (
                        <HistoryExerciseDetails
                            key={`${exercise.id || exercise.name}-${index}`}
                            exercise={exercise}
                        />
                    ))}

                    <div className="history-actions">
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1 }}
                            onClick={(event) => {
                                event.stopPropagation()
                                onDuplicate()
                            }}
                        >
                            Ripeti
                        </button>
                        <button
                            className="btn btn-sm"
                            style={{ color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid var(--danger-bg)' }}
                            onClick={(event) => {
                                event.stopPropagation()
                                onDelete()
                            }}
                        >
                            Elimina
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
