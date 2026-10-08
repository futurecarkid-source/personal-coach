import type { EventCategory, MatchEventType } from '../types';

export interface MatchEventDef {
  type: MatchEventType;
  label: string;
  category: EventCategory;
  /** Se pide contexto de tiro (parte del cuerpo, situación, presión). */
  isShot?: boolean;
  /** Evento positivo, negativo o neutro para el color del botón. */
  tone: 'positivo' | 'negativo' | 'neutro';
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  ataque: 'Ataque',
  pase: 'Pase',
  defensa: 'Defensa',
  portero: 'Portero',
  balonParado: 'Balón parado',
  disciplina: 'Disciplina',
  sinBalonMente: 'Sin balón y mente',
};

export const MATCH_EVENT_DEFS: readonly MatchEventDef[] = [
  { type: 'gol', label: 'Gol', category: 'ataque', isShot: true, tone: 'positivo' },
  { type: 'asistencia', label: 'Asistencia', category: 'ataque', tone: 'positivo' },
  { type: 'tiroPuerta', label: 'Tiro a puerta', category: 'ataque', isShot: true, tone: 'neutro' },
  { type: 'tiroFuera', label: 'Tiro fuera', category: 'ataque', isShot: true, tone: 'negativo' },
  { type: 'tiroBloqueado', label: 'Tiro bloqueado', category: 'ataque', isShot: true, tone: 'neutro' },
  { type: 'paseClave', label: 'Pase clave', category: 'ataque', tone: 'positivo' },
  { type: 'regateGanado', label: 'Regate ganado', category: 'ataque', tone: 'positivo' },
  { type: 'regatePerdido', label: 'Regate perdido', category: 'ataque', tone: 'negativo' },
  { type: 'centro', label: 'Centro', category: 'ataque', tone: 'neutro' },
  { type: 'desmarque', label: 'Desmarque', category: 'ataque', tone: 'positivo' },
  { type: 'toqueArea', label: 'Toque en el área', category: 'ataque', tone: 'neutro' },
  { type: 'conduccionProgresiva', label: 'Conducción progresiva', category: 'ataque', tone: 'positivo' },
  { type: 'ocasionCreada', label: 'Ocasión creada', category: 'ataque', tone: 'positivo' },
  { type: 'ocasionFallada', label: 'Ocasión fallada', category: 'ataque', tone: 'negativo' },

  { type: 'paseCompletado', label: 'Pase completado', category: 'pase', tone: 'positivo' },
  { type: 'paseFallido', label: 'Pase fallido', category: 'pase', tone: 'negativo' },
  { type: 'paseLargo', label: 'Pase largo', category: 'pase', tone: 'neutro' },
  { type: 'paseProfundidad', label: 'Pase en profundidad', category: 'pase', tone: 'positivo' },
  { type: 'paseAtras', label: 'Pase hacia atrás', category: 'pase', tone: 'neutro' },

  { type: 'entradaGanada', label: 'Entrada ganada', category: 'defensa', tone: 'positivo' },
  { type: 'entradaPerdida', label: 'Entrada perdida', category: 'defensa', tone: 'negativo' },
  { type: 'intercepcion', label: 'Intercepción', category: 'defensa', tone: 'positivo' },
  { type: 'despeje', label: 'Despeje', category: 'defensa', tone: 'neutro' },
  { type: 'bloqueo', label: 'Bloqueo', category: 'defensa', tone: 'positivo' },
  { type: 'recuperacion', label: 'Recuperación', category: 'defensa', tone: 'positivo' },
  { type: 'perdida', label: 'Pérdida', category: 'defensa', tone: 'negativo' },
  { type: 'dueloGanado', label: 'Duelo ganado', category: 'defensa', tone: 'positivo' },
  { type: 'dueloPerdido', label: 'Duelo perdido', category: 'defensa', tone: 'negativo' },
  { type: 'dueloAereo', label: 'Duelo aéreo', category: 'defensa', tone: 'neutro' },
  { type: 'unoContraUnoDefensivo', label: '1 contra 1 defensivo', category: 'defensa', tone: 'neutro' },
  { type: 'presionEfectiva', label: 'Presión efectiva', category: 'defensa', tone: 'positivo' },

  { type: 'parada', label: 'Parada', category: 'portero', tone: 'positivo' },
  { type: 'salida', label: 'Salida', category: 'portero', tone: 'neutro' },
  { type: 'blocaje', label: 'Blocaje', category: 'portero', tone: 'positivo' },
  { type: 'despejePuños', label: 'Despeje de puños', category: 'portero', tone: 'neutro' },
  { type: 'paseConPie', label: 'Pase con el pie', category: 'portero', tone: 'neutro' },
  { type: 'golEncajado', label: 'Gol encajado', category: 'portero', tone: 'negativo' },
  { type: 'penaltiParado', label: 'Penalti parado', category: 'portero', tone: 'positivo' },

  { type: 'corner', label: 'Córner', category: 'balonParado', tone: 'neutro' },
  { type: 'tiroLibre', label: 'Tiro libre', category: 'balonParado', isShot: true, tone: 'neutro' },
  { type: 'penalti', label: 'Penalti', category: 'balonParado', isShot: true, tone: 'neutro' },
  { type: 'saqueBanda', label: 'Saque de banda', category: 'balonParado', tone: 'neutro' },

  { type: 'faltaCometida', label: 'Falta cometida', category: 'disciplina', tone: 'negativo' },
  { type: 'faltaRecibida', label: 'Falta recibida', category: 'disciplina', tone: 'neutro' },
  { type: 'amarilla', label: 'Amarilla', category: 'disciplina', tone: 'negativo' },
  { type: 'roja', label: 'Roja', category: 'disciplina', tone: 'negativo' },
  { type: 'fueraJuego', label: 'Fuera de juego', category: 'disciplina', tone: 'negativo' },

  { type: 'movSinBalon', label: 'Movimiento sin balón', category: 'sinBalonMente', tone: 'positivo' },
  { type: 'perfilacion', label: 'Perfilación (escaneo)', category: 'sinBalonMente', tone: 'positivo' },
  { type: 'posturaPositiva', label: 'Postura positiva', category: 'sinBalonMente', tone: 'positivo' },
  { type: 'posturaNegativa', label: 'Postura negativa', category: 'sinBalonMente', tone: 'negativo' },
  { type: 'reaccionFalloPresiona', label: 'Tras fallo: presiona', category: 'sinBalonMente', tone: 'positivo' },
  { type: 'reaccionFalloSeFrena', label: 'Tras fallo: se frena', category: 'sinBalonMente', tone: 'negativo' },
  { type: 'comunicacion', label: 'Comunicación', category: 'sinBalonMente', tone: 'positivo' },
  { type: 'esfuerzoRecuperacion', label: 'Esfuerzo de recuperación', category: 'sinBalonMente', tone: 'positivo' },
  { type: 'decisionBuena', label: 'Buena decisión', category: 'sinBalonMente', tone: 'positivo' },
  { type: 'decisionMala', label: 'Mala decisión', category: 'sinBalonMente', tone: 'negativo' },
  { type: 'liderazgo', label: 'Liderazgo', category: 'sinBalonMente', tone: 'positivo' },
];

export const EVENT_DEF_BY_TYPE: ReadonlyMap<MatchEventType, MatchEventDef> = new Map(MATCH_EVENT_DEFS.map((d) => [d.type, d]));
