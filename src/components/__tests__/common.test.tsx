import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Chip, FaceRating, GlassButton } from '../common';

describe('common components', () => {
  it('GlassButton calls onPress and exposes its label', () => {
    const onPress = jest.fn();
    render(<GlassButton label="Empezar" onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Empezar'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('GlassButton does not fire when disabled', () => {
    const onPress = jest.fn();
    render(<GlassButton label="Nada" disabled onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Nada'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('Chip reports selection state to accessibility', () => {
    render(<Chip label="Amateur" selected onPress={() => undefined} />);
    expect(screen.getByLabelText('Amateur').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('FaceRating maps each face to a value from 1 to 10', () => {
    const onChange = jest.fn();
    render(<FaceRating label="Ánimo" value={null} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Ánimo: 8 de 10'));
    expect(onChange).toHaveBeenCalledWith(8);
  });
});
