import test from 'node:test'
import assert from 'node:assert/strict'
import { buildExerciseProgress, getExerciseTrackingKey, summarizeExerciseSession } from './progress.js'

test('calcola volume, e1RM e RIR escludendo il riscaldamento', () => {
    const workout = { id: 'w1', date: '2026-06-20', startTime: '10:00', startTimestamp: 100, endTime: '11:00' }
    const exercise = {
        id: 'e1',
        name: 'Panca Piana',
        sets: [
            { completed: true, isWarmup: true, weight: '40', reps: '10', rir: '5' },
            { completed: true, weight: '80', reps: '8', rir: '2' },
            { completed: true, weight: '85', reps: '5', rir: '1' },
        ],
    }
    const result = summarizeExerciseSession(workout, exercise)

    assert.equal(result.setCount, 2)
    assert.equal(result.totalVolume, 1065)
    assert.equal(result.topWeight, 85)
    assert.equal(result.averageRir, 1.5)
    assert.ok(result.bestEstimated1RM > 101 && result.bestEstimated1RM < 102)
})

test('ordina le sedute per timestamp, non per posizione nel localStorage', () => {
    const workouts = [
        {
            id: 'older', date: '2026-01-01', startTime: '10:00', startTimestamp: 10, endTime: '11:00',
            exercises: [{ id: 'a', name: 'Squat', sets: [{ completed: true, weight: '100', reps: '5' }] }],
        },
        {
            id: 'newer', date: '2026-02-01', startTime: '10:00', startTimestamp: 20, endTime: '11:00',
            exercises: [{ id: 'b', sourceExerciseId: 'squat', name: 'Squat', sets: [{ completed: true, weight: '105', reps: '5' }] }],
        },
    ]
    const [squat] = buildExerciseProgress(workouts)

    assert.equal(squat.latest.workoutId, 'newer')
    assert.equal(squat.sessions.length, 2)
})

test('usa il nome normalizzato per collegare dati storici precedenti agli id stabili', () => {
    assert.equal(
        getExerciseTrackingKey({ name: '  Panca Piana ', sourceExerciseId: 'bench-press' }),
        getExerciseTrackingKey({ name: 'Panca Piana' }),
    )
})
