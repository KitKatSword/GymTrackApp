import { useState } from 'react'
import VideoPlayer from './VideoPlayer'

export default function VideoExerciseCard({
    exercise,
    workoutId,
    onToggleSet,
    onRemoveExercise,
    onUpdateNotes,
}) {
    const [showPlayer, setShowPlayer] = useState(false)
    const [localNotes, setLocalNotes] = useState(exercise.notes || '')

    const isCompleted = exercise.sets?.[0]?.completed ?? false
    const thumb = exercise.videoYt
        ? `https://img.youtube.com/vi/${exercise.videoYt}/mqdefault.jpg`
        : null

    const handleToggle = () => {
        if (exercise.sets?.[0]) {
            onToggleSet(workoutId, exercise.id, exercise.sets[0].id)
        }
    }

    const handleComplete = () => {
        // Called from VideoPlayer modal — mark as completed if not already
        if (!isCompleted && exercise.sets?.[0]) {
            onToggleSet(workoutId, exercise.id, exercise.sets[0].id)
        }
    }

    const handleNotesBlur = () => {
        if (onUpdateNotes) onUpdateNotes(workoutId, exercise.id, localNotes)
    }

    return (
        <div className={`exercise-card video-exercise-card ${isCompleted ? 'video-done' : ''}`}>
            <div className="exercise-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="exercise-name">
                        📺 {exercise.name}
                    </div>
                    <div className="exercise-category-badge">
                        Follow Along · {exercise.category || 'Video'}
                    </div>
                </div>

                <button
                    className="exercise-delete-btn"
                    onClick={() => onRemoveExercise(workoutId, exercise.id)}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4h6v2" />
                    </svg>
                </button>
            </div>

            {/* Video thumbnail + play */}
            {thumb && (
                <div className="video-exercise-thumb" onClick={() => setShowPlayer(true)}>
                    <img src={thumb} alt="" loading="lazy" />
                    <div className="video-exercise-play">▶</div>
                    {exercise.videoDuration && (
                        <div className="video-card-duration">{exercise.videoDuration}</div>
                    )}
                </div>
            )}

            {/* Info chips */}
            <div className="video-exercise-info">
                {exercise.videoDuration && (
                    <span className="video-badge">⏱ {exercise.videoDuration}</span>
                )}
                {exercise.videoKcal > 0 && (
                    <span className="video-badge">🔥 {exercise.videoKcal} kcal</span>
                )}
            </div>

            {/* Complete button */}
            <button
                className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'} btn-full`}
                onClick={handleToggle}
                style={{ marginTop: 8 }}
            >
                {isCompleted ? '✓ Completato' : '✓ Segna come completato'}
            </button>

            {/* Notes */}
            <div style={{ marginTop: 6 }}>
                <input
                    type="text"
                    className="workout-note"
                    placeholder="Nota esercizio..."
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                />
            </div>

            {/* Video Player Modal */}
            {showPlayer && (
                <VideoPlayer
                    video={{
                        yt: exercise.videoYt,
                        title: exercise.name,
                        dur: exercise.videoDuration,
                        kcal: exercise.videoKcal,
                        cat: exercise.category,
                    }}
                    onClose={() => setShowPlayer(false)}
                    onComplete={handleComplete}
                    isCompleted={isCompleted}
                />
            )}
        </div>
    )
}
