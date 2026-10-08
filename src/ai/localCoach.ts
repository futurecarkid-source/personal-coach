import type { SnapshotContext } from './contract';

export interface LocalCoachReply {
  reply: string;
  action: 'abrir_plan' | 'abrir_temporizador' | 'reportar_dolor' | 'abrir_pizarra' | 'ninguna';
  needsProfessional: boolean;
}

const has = (text: string, ...words: string[]): boolean => words.some((w) => text.includes(w));

/**
 * Coach local (gratis, sin internet ni IA): respuestas por reglas con los datos del día.
 * Se usa cuando la IA no está disponible y no genera consejos médicos.
 */
export function localCoachReply(rawText: string, snapshot: SnapshotContext): LocalCoachReply {
  const text = rawText.toLowerCase();

  if (has(text, 'dolor', 'lesion', 'lesión', 'me duele', 'molestia', 'torc')) {
    return {
      reply:
        'Si algo te duele, lo primero es reportarlo para revisar las señales de alarma y ajustar tu plan. Si el dolor es fuerte, no mejora o te limita para moverte, busca a un profesional de la salud.',
      action: 'reportar_dolor',
      needsProfessional: true,
    };
  }

  if (has(text, 'partido', 'juego', 'competencia')) {
    return {
      reply:
        'Antes del partido: duerme bien, hidrátate, haz un calentamiento progresivo y evita entrenar fuerte el día anterior. Después, dale a tu cuerpo una sesión suave de recuperación.',
      action: 'abrir_plan',
      needsProfessional: false,
    };
  }

  if (has(text, 'pizarra', 'táctica', 'tactica', 'formación', 'formacion', 'jugada')) {
    return { reply: 'Abre la pizarra, elige una formación y dibuja la jugada. Si conectas la IA, el coach puede explicártela.', action: 'abrir_pizarra', needsProfessional: false };
  }

  if (has(text, 'temporizador', 'cronómetro', 'cronometro', 'intervalos', 'tabata', 'hiit')) {
    return { reply: 'Tienes temporizador, cronómetro e intervalos (Tabata, HIIT, EMOM) en Entrenar.', action: 'abrir_temporizador', needsProfessional: false };
  }

  const feelsLow = snapshot.lastCheckIn !== null && (snapshot.lastCheckIn.mood <= 3 || snapshot.lastCheckIn.energy <= 3 || snapshot.lastCheckIn.soreness >= 7);
  if (feelsLow) {
    return {
      reply: 'Hoy te noto con poca energía o molestias. Mejor una sesión suave de recuperación y descanso; escuchar al cuerpo también es entrenar.',
      action: 'abrir_plan',
      needsProfessional: snapshot.lastCheckIn !== null && snapshot.lastCheckIn.soreness >= 7,
    };
  }

  if (snapshot.todaySession) {
    if (snapshot.todaySession.kind === 'descanso') {
      return { reply: 'Hoy es día de descanso. Descansar también es entrenar; tu racha no se rompe.', action: 'ninguna', needsProfessional: false };
    }
    const first = snapshot.todaySession.exercises.slice(0, 3).join(', ');
    return {
      reply: `Hoy toca: ${snapshot.todaySession.title}${first ? ` (${first}…)` : ''}. Empieza con el calentamiento y escucha a tu cuerpo.`,
      action: 'abrir_plan',
      needsProfessional: false,
    };
  }

  return {
    reply: 'Puedo ayudarte con tu sesión de hoy, tu recuperación, un dolor, la pizarra o el partido. Cuéntame qué necesitas.',
    action: 'ninguna',
    needsProfessional: false,
  };
}
