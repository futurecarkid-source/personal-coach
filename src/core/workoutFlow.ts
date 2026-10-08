import type { Exercise } from '../types';

export type WorkoutStage = 'ready' | 'work' | 'rest' | 'summary';

export interface WorkoutFlow {
  exerciseIndex: number;
  setIndex: number;
  stage: WorkoutStage;
  setsDone: number;
}

export type WorkoutEvent =
  | { type: 'START_WORK' }
  | { type: 'COMPLETE_SET' }
  | { type: 'REST_DONE' }
  | { type: 'SKIP_EXERCISE' }
  | { type: 'PREVIOUS_EXERCISE' };

export const initialWorkoutFlow: WorkoutFlow = { exerciseIndex: 0, setIndex: 0, stage: 'ready', setsDone: 0 };

/** Total de series de una sesión. */
export function totalSets(exercises: readonly Exercise[]): number {
  return exercises.reduce((sum, e) => sum + e.sets, 0);
}

/**
 * Máquina de estados de "Empezar ejercicio".
 * Series: lista → trabajo (solo ejercicios por tiempo) → descanso → siguiente serie o siguiente ejercicio → resumen.
 * La posición ya avanza al entrar en descanso, así la pantalla puede mostrar "a continuación".
 */
export function workoutReducer(flow: WorkoutFlow, event: WorkoutEvent, exercises: readonly Exercise[]): WorkoutFlow {
  const current = exercises[flow.exerciseIndex];
  if (!current || flow.stage === 'summary') return flow;

  switch (event.type) {
    case 'START_WORK':
      return flow.stage === 'ready' ? { ...flow, stage: 'work' } : flow;

    case 'COMPLETE_SET': {
      if (flow.stage !== 'ready' && flow.stage !== 'work') return flow;
      const setsDone = flow.setsDone + 1;
      const lastSet = flow.setIndex + 1 >= current.sets;
      const lastExercise = flow.exerciseIndex + 1 >= exercises.length;
      if (lastSet && lastExercise) return { ...flow, setsDone, stage: 'summary' };
      const next = lastSet
        ? { exerciseIndex: flow.exerciseIndex + 1, setIndex: 0 }
        : { exerciseIndex: flow.exerciseIndex, setIndex: flow.setIndex + 1 };
      return { ...next, setsDone, stage: current.restSeconds > 0 ? 'rest' : 'ready' };
    }

    case 'REST_DONE':
      return flow.stage === 'rest' ? { ...flow, stage: 'ready' } : flow;

    case 'SKIP_EXERCISE': {
      if (flow.exerciseIndex + 1 >= exercises.length) return { ...flow, stage: 'summary' };
      return { ...flow, exerciseIndex: flow.exerciseIndex + 1, setIndex: 0, stage: 'ready' };
    }

    case 'PREVIOUS_EXERCISE':
      if (flow.exerciseIndex === 0) return { ...flow, setIndex: 0, stage: 'ready' };
      return { ...flow, exerciseIndex: flow.exerciseIndex - 1, setIndex: 0, stage: 'ready' };

    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}
