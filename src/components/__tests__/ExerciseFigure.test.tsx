import React from 'react';
import { render } from '@testing-library/react-native';
import { ExerciseFigure } from '../specialized/ExerciseFigure';
import { EXERCISES } from '../../content/exercises';

describe('ExerciseFigure', () => {
  it.each(EXERCISES.map((e) => [e.id, e] as const))('renders the animation for %s', (_id, exercise) => {
    const view = render(<ExerciseFigure exercise={exercise} />);
    expect(view.getByLabelText(`Animación del ejercicio ${exercise.name}`)).toBeTruthy();
    view.unmount();
  });
});
