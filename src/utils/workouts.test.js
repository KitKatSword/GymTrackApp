import test from 'node:test'
import assert from 'node:assert/strict'
import {
    getCompletedSetCount,
    getCompletedWarmupSetCount,
    getRoutineTotalSets,
    syncRoutineRestTargetsFromWorkout,
    getWorkoutCompletedSetCount,
    getWorkoutDuration,
} from './workouts.js'
import { getWorkoutHistoryBadge } from './history.js'

test('separa serie lavoranti e riscaldamento nei conteggi', () => {
    const exercise = {
        sets: [
            { completed: true, isWarmup: true },
            { completed: true },
            { completed: false },
        ],
    }

    assert.equal(getCompletedSetCount(exercise), 2)
    assert.equal(getCompletedSetCount(exercise, { includeWarmups: false }), 1)
    assert.equal(getCompletedWarmupSetCount(exercise), 1)
    assert.equal(getWorkoutCompletedSetCount({ exercises: [exercise] }, { includeWarmups: false }), 1)
})

test('calcola una durata che attraversa la mezzanotte', () => {
    assert.equal(getWorkoutDuration('23:30', '00:15'), '45 min')
    assert.equal(getWorkoutDuration('22:00', '00:30'), '2h 30min')
    assert.equal(getWorkoutDuration('bad', '00:30'), '--')
    assert.equal(getWorkoutDuration('25:00', '26:00'), '--')
})

test('conteggia routine miste senza trasformare un EMOM in tre serie', () => {
    const routine = {
        exercises: [
            { setsCount: 3, warmupSetsCount: 2, params: ['weight', 'reps'] },
            { setsCount: 3, isEmom: true, params: ['emom'] },
        ],
    }

    assert.equal(getRoutineTotalSets(routine), 5)
})

test('mostra il riscaldamento nel badge storico senza sommarlo alle serie lavoranti', () => {
    const workout = {
        exercises: [{
            sets: [
                { completed: true, isWarmup: true },
                { completed: true },
                { completed: true },
            ],
        }],
    }

    assert.equal(getWorkoutHistoryBadge(workout), '2 serie + 1 risc.')
})

test('propaga anche un recupero impostato a zero nella routine', () => {
    let update = null
    syncRoutineRestTargetsFromWorkout(
        {
            routineId: 'r1',
            routineName: 'Test',
            exercises: [{ sourceExerciseId: 'bench', name: 'Panca', targetRest: 0 }],
        },
        [{ id: 'r1', name: 'Test', exercises: [{ exerciseId: 'bench', name: 'Panca', targetRest: 90 }] }],
        (id, changes) => { update = { id, changes } },
    )

    assert.equal(update.id, 'r1')
    assert.equal(update.changes.exercises[0].targetRest, 0)
})
