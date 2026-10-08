import type { IconName } from '../components/common/Icon';

export interface TabDef {
  /** Nombre de la ruta (grupo) en `app/(tabs)`. */
  name: string;
  title: string;
  icon: IconName;
  /** Ícono cuando está seleccionada. */
  iconSelected: IconName;
}

export const TABS: readonly TabDef[] = [
  { name: '(hoy)', title: 'Hoy', icon: 'house', iconSelected: 'house.fill' },
  { name: '(entrenar)', title: 'Entrenar', icon: 'figure.run', iconSelected: 'figure.run' },
  { name: '(partido)', title: 'Partido', icon: 'sportscourt', iconSelected: 'sportscourt.fill' },
  { name: '(tactica)', title: 'Táctica', icon: 'square.grid.3x3', iconSelected: 'square.grid.3x3.fill' },
  { name: '(perfil)', title: 'Perfil', icon: 'person.crop.square', iconSelected: 'person.crop.square.fill' },
];
