import { getExerciseSets } from '../../utils/workouts'

function formatRestTime(restSeconds) {
    return `${Math.floor(restSeconds / 60)}:${(restSeconds % 60).toString().padStart(2, '0')}`
}

function renderSetValue(set, param) {
    if (param === 'weight') return `${set.weight || 0} kg`
    if (param === 'reps') return `${set.reps || 0} reps`
    if (param === 'time') return `${set.time || 0}s`
    return `${set[param] || 0}`
}

function CompletedSetsSummary({ exercise }) {
    const params = Array.isArray(exercise.params) && exercise.params.length ? exercise.params : ['weight', 'reps']
    const completedSets = getExerciseSets(exercise).filter(set => set.completed)

    if (!completedSets.length) return null

    return (
        <div className="history-params-panel">
            {completedSets.map((set, index) => (
                <div
                    key={set.id || `${exercise.id || exercise.name}-set-${index}`}
                    className="history-param-row"
                >
                    <span className="history-param-label">Set {index + 1}</span>
                    <span className="history-param-value">
                        {params.map(param => renderSetValue(set, param)).join(' x ')}
                    </span>
                </div>
            ))}
        </div>
    )
}

function EmomSummary({ exercise }) {
    const blocks = exercise.emomBlocks || []
    const totalMinutes = blocks.reduce((sum, block) => sum + block.minutes, 0)
    const totalReps = blocks.reduce((sum, block) => sum + block.minutes * block.reps, 0)

    return (
        <div className="history-emom-panel">
            <div className="history-emom-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span className="history-emom-meta">
                    {totalMinutes} min · {totalReps} Rep Totali
                </span>
            </div>

            <div className="history-emom-chips">
                {blocks.map((block, index) => (
                    <span key={`${block.minutes}-${block.reps}-${index}`} className="history-emom-chip">
                        {blocks.length > 1 ? `B${index + 1}: ` : ''}{block.minutes}' x {block.reps}
                    </span>
                ))}
                {exercise.emomWeight && (
                    <span className="history-emom-chip history-emom-chip-accent">
                        {exercise.emomWeight} kg
                    </span>
                )}
            </div>
        </div>
    )
}

function VideoSummary({ exercise }) {
    return (
        <span className="history-video-summary">
            📺 Follow Along
            {exercise.videoDuration ? ` · ${exercise.videoDuration}` : ''}
            {exercise.videoKcal > 0 ? ` · 🔥 ${exercise.videoKcal} kcal` : ''}
        </span>
    )
}

export default function HistoryExerciseDetails({ exercise }) {
    return (
        <div className="history-detail-item">
            <div className="history-detail-header">
                <div className="history-exercise-name">{exercise.name}</div>
                {!exercise.isVideo && !exercise.isEmom && exercise.targetRest && (
                    <span className="history-rest-badge">
                        ⏱ {formatRestTime(exercise.targetRest)}
                    </span>
                )}
            </div>

            {exercise.notes && (
                <div className="history-exercise-note">
                    Nota: {exercise.notes}
                </div>
            )}

            <div className="history-exercise-sets">
                {exercise.isVideo && <VideoSummary exercise={exercise} />}
                {exercise.isEmom && <EmomSummary exercise={exercise} />}
                {!exercise.isVideo && !exercise.isEmom && <CompletedSetsSummary exercise={exercise} />}
            </div>
        </div>
    )
}
