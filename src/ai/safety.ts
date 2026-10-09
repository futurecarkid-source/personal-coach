import { isMinor, type AgeBand, type Settings } from '../types';
import type { AiErrorCode } from './contract';

/** Mensajes fijos (no los genera la IA). */
export const CRISIS_MESSAGE =
  'Lamento que estés pasando por esto. No tienes que cargarlo solo: habla ahora con alguien de confianza o con un profesional de la salud mental. Si estás en peligro inmediato o piensas hacerte daño, llama al número de emergencias de tu país o acude a urgencias. Busca también la línea de ayuda en crisis de tu país.';

export const EATING_MESSAGE =
  'Lo que cuentas es importante. Si te preocupa tu peso o tu relación con la comida, habla con un profesional de la salud o un nutricionista deportivo. Aquí no te daré metas de peso ni conteos de comida; sí puedo ayudarte con tu entrenamiento y tu recuperación.';

export const MEDICATION_MESSAGE =
  'No puedo recomendar medicamentos ni dosis. Si necesitas algo para el dolor o una lesión, consúltalo con un médico o un farmacéutico.';

export const AI_LABEL = 'Respuesta generada por IA. Puede contener errores y no es consejo médico.';

const CRISIS_PATTERNS: readonly RegExp[] = [
  /suicid/i,
  /quitarme la vida/i,
  /matarme/i,
  /no quiero (seguir )?vivir/i,
  /(hacerme|hacerle a mi cuerpo) da[ñn]o/i,
  /acabar con (todo|mi vida)/i,
  /autolesi/i,
  /cortarme/i,
];

const EATING_PATTERNS: readonly RegExp[] = [
  /vomitar (a prop[oó]sito|despu[eé]s de comer)/i,
  /purgarme|purga(s)? /i,
  /dejar de comer/i,
  /no comer para (adelgazar|bajar)/i,
  /me da asco mi cuerpo/i,
  /atrac[oó]n(es)?/i,
];

export type SensitiveKind = 'crisis' | 'eating' | null;

/** Detecta mensajes de crisis emocional o de trastorno alimentario ANTES de llamar a la IA. */
export function detectSensitive(text: string): SensitiveKind {
  if (CRISIS_PATTERNS.some((p) => p.test(text))) return 'crisis';
  if (EATING_PATTERNS.some((p) => p.test(text))) return 'eating';
  return null;
}

const MEDICATION_PATTERNS: readonly RegExp[] = [
  /\b(ibuprofeno|paracetamol|acetaminof[eé]n|diclofenaco|naproxeno|aspirina|[aá]cido acetilsalic[ií]lico|tramadol|codeina|code[ií]na|morfina|corticoide(s)?|cortisona|infiltraci[oó]n(es)?|antiinflamatorio(s)?|analg[eé]sico(s)?|relajante(s)? muscular(es)?)\b/i,
  /\b\d+([.,]\d+)?\s?(mg|miligramos?|ml|mililitros?|gramos?)\b/i,
];

export interface SanitizedReply {
  text: string;
  replaced: boolean;
}

/** Quita de la respuesta cualquier frase que hable de medicamentos o dosis (defensa adicional al prompt). */
export function sanitizeReply(text: string, maxChars = 1200): SanitizedReply {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((s) => !MEDICATION_PATTERNS.some((p) => p.test(s)));
  const replaced = kept.length !== sentences.length;
  let result = kept.join(' ').trim();
  if (replaced) result = result ? `${result}\n\n${MEDICATION_MESSAGE}` : MEDICATION_MESSAGE;
  if (result.length > maxChars) result = `${result.slice(0, maxChars - 1).trimEnd()}…`;
  return { text: result, replaced };
}

export function clip(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

export interface AiGateInput {
  ageBand: AgeBand;
  settings: Pick<Settings, 'aiConsentAt' | 'guardianConsent' | 'aiGatewayUrl'>;
  /** Hay un código de acceso guardado. */
  hasAccessCode: boolean;
  /** La tarea envía fotos o video (nunca permitido a menores). */
  sendsMedia?: boolean;
}

export type AiGateResult = { allowed: true } | { allowed: false; code: AiErrorCode; message: string };

/**
 * ¿Se puede usar la IA ahora? Orden: servicio configurado, consentimiento, menores.
 * Los menores solo con autorización de un adulto y nunca con fotos o video.
 */
export function canUseAi(input: AiGateInput): AiGateResult {
  if (!input.settings.aiGatewayUrl.trim() || !input.hasAccessCode) {
    return { allowed: false, code: 'not_configured', message: 'La IA todavía no está configurada en este dispositivo.' };
  }
  if (!input.settings.aiConsentAt) {
    return { allowed: false, code: 'consent_required', message: 'Antes de usar la IA debes aceptar qué se envía y a quién.' };
  }
  if (isMinor(input.ageBand)) {
    if (input.sendsMedia) {
      return { allowed: false, code: 'not_allowed', message: 'Por tu edad no se envían fotos ni video a la IA.' };
    }
    if (!input.settings.guardianConsent) {
      return { allowed: false, code: 'not_allowed', message: 'Esta función requiere el permiso de un padre, madre o tutor.' };
    }
  }
  return { allowed: true };
}

/** Texto del aviso de consentimiento (nombra al proveedor y qué datos salen del dispositivo). */
export const CONSENT_TEXT = [
  'Para usar la IA, Fulbito envía a su servicio y de ahí a Anthropic (el proveedor del modelo Claude) los datos mínimos de cada consulta:',
  '• tu posición, nivel, rango de edad, molestias y resumen de tus últimas sesiones y check-ins;',
  '• lo que escribes en el chat o en la pregunta;',
  '• nunca tu nombre ni apodo, club, país, fotos ni video.',
  'Fulbito no guarda el contenido de las consultas. El proveedor puede conservarlo temporalmente según sus políticas.',
  'La IA puede equivocarse y no es consejo médico. Puedes retirar este permiso en Perfil.',
].join('\n');
