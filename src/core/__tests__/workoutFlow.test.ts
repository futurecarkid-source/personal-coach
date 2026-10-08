import { EXERCISE_BY_ID } from '../../content/exercises';
import { initialWorkoutFlow, totalSets, workoutReducer, type WorkoutEvent, type WorkoutFlow } from '../workoutFlow';
import type { Exercise } from '../../types';

const get = (id: string): Exercise => {
  const e = EXERCISE_BY_ID.get(id);
  if (!e) throw new Error(`missing ${id}`);
  return e;
};

const run = (events: WorkoutEvent[], exercises: Exercise[]): WorkoutFlow =>
  events.reduce((flow, ev) => workoutReducer(flow, ev, exercises), initialWorkoutFlow);

describe('workout flow', () => {
  const squat = get('sentadilla-peso-corporal'); // 3 series con descanso
  const calm = get('respiracion-calma'); // 1 serie sin descanso

  it('goes to rest after a set and advances the set index', () => {
    const flow = run([{ type: 'COMPLETE_SET' }], [squat, calm]);
    expect(flow).toMatchObject({ exerciseIndex: 0, setIndex: 1, stage: 'rest', setsDone: 1 });
    expect(workoutReducer(flow, { type: 'REST_DONE' }, [squat, calm]).stage).toBe('ready');
  });

  it('moves to the next exercise after the last set and finishes at the end', () => {
    const events: WorkoutEvent[] = [];
    for (let i = 0; i < squat.sets; i += 1) events.push({ type: 'COMPLETE_SET' }, { type: 'REST_DONE' });
    const mid = run(events, [squat, calm]);
    expect(mid).toMatchObject({ exerciseIndex: 1, setIndex: 0, stage: 'ready', setsDone: 3 });
    const done = workoutReducer(mid, { type: 'COMPLETE_SET' }, [squat, calm]);
    expect(done.stage).toBe('summary');
    expect(done.setsDone).toBe(4);
    expect(totalSets([squat, calm])).toBe(4);
  });

  it('timed sets go ready -> work -> rest', () => {
    const plank = get('plancha-frontal');
    let flow = workoutReducer(initialWorkoutFlow, { type: 'START_WORK' }, [plank]);
    expect(flow.stage).toBe('work');
    flow = workoutReducer(flow, { type: 'COMPLETE_SET' }, [plank]);
    expect(flow.stage).toBe('rest');
  });

  it('skips and goes back between exercises', () => {
    const flow = run([{ type: 'SKIP_EXERCISE' }], [squat, calm]);
    expect(flow.exerciseIndex).toBe(1);
    expect(workoutReducer(flow, { type: 'PREVIOUS_EXERCISE' }, [squat, calm]).exerciseIndex).toBe(0);
    expect(workoutReducer(flow, { type: 'SKIP_EXERCISE' }, [squat, calm]).stage).toBe('summary');
  });

  it('ignores events in summary and with no exercises', () => {
    const summary: WorkoutFlow = { exerciseIndex: 0, setIndex: 0, stage: 'summary', setsDone: 1 };
    expect(workoutReducer(summary, { type: 'COMPLETE_SET' }, [squat])).toBe(summary);
    expect(workoutReducer(initialWorkoutFlow, { type: 'COMPLETE_SET' }, [])).toBe(initialWorkoutFlow);
  });
});
