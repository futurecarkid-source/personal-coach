import type { BodyZone } from '../types';

export interface InjuryInfo {
  id: string;
  name: string;
  zone: BodyZone;
  /** Qué es, en palabras sencillas. */
  summary: string;
  signs: readonly string[];
  prevention: readonly string[];
  /** Ejercicios de la biblioteca que ayudan a prevenir (no a tratar). */
  exerciseIds: readonly string[];
  /** Cuándo no esperar y consultar. */
  seeDoctor: readonly string[];
  /** Solo para menores en crecimiento. */
  growing?: boolean;
}

export const INJURIES_DISCLAIMER =
  'Información educativa para prevenir. No sustituye a un médico o fisioterapeuta ni sirve para diagnosticar. Si dudas, consulta.';

/** Guía de lesiones frecuentes en el fútbol; los textos son orientativos y conviene que los revise un profesional antes de publicar. */
export const INJURIES: readonly InjuryInfo[] = [
  {
    id: 'isquios',
    name: 'Tirón de isquiotibiales',
    zone: 'isquiotibiales',
    summary: 'Distensión o rotura de fibras en la parte trasera del muslo, típica al correr rápido o estirarse con fuerza.',
    signs: ['Dolor súbito atrás del muslo al acelerar', 'Sensación de pinchazo o tirón', 'Dolor al estirar o contraer'],
    prevention: ['Calentar con progresiones antes de correr fuerte', 'Fortalecer con ejercicios excéntricos', 'No sumar mucho sprint de golpe'],
    exerciseIds: ['nordic-asistido', 'peso-muerto-rumano-unipodal', 'puente-gluteo'],
    seeDoctor: ['Hematoma grande', 'No puedes caminar sin dolor', 'Sentiste un “crack” o desgarro'],
  },
  {
    id: 'ingle',
    name: 'Dolor de ingle (aductores)',
    zone: 'ingle',
    summary: 'Sobrecarga de los músculos de la cara interna del muslo, común en pases, cambios de dirección y disparos.',
    signs: ['Dolor en la ingle al correr o patear', 'Molestia al juntar las piernas', 'Rigidez matutina'],
    prevention: ['Fortalecer aductores', 'Movilidad de cadera', 'Evitar subir el volumen de golpe'],
    exerciseIds: ['copenhagen-rodilla', 'movilidad-cadera-90-90', 'plancha-lateral'],
    seeDoctor: ['Dolor persistente más de una semana', 'Dolor en reposo o por la noche', 'Hinchazón en la zona'],
  },
  {
    id: 'rodilla-corredor',
    name: 'Dolor de rodilla (anterior)',
    zone: 'rodilla',
    summary: 'Molestia por sobrecarga delante de la rodilla o debajo de la rótula; aparece al bajar escaleras o tras muchos saltos.',
    signs: ['Dolor al subir o bajar escaleras', 'Molestia al sentarse mucho rato', 'Dolor al saltar'],
    prevention: ['Fortalecer cuádriceps y glúteos', 'Aprender a aterrizar suave', 'Descansar entre bloques de saltos'],
    exerciseIds: ['sentadilla-peso-corporal', 'sentadilla-bulgara', 'salto-aterrizaje'],
    seeDoctor: ['La rodilla se bloquea o se “sale”', 'Hinchazón tras un giro', 'No puedes apoyar'],
  },
  {
    id: 'ligamentos-rodilla',
    name: 'Ligamentos de la rodilla',
    zone: 'rodilla',
    summary: 'Los ligamentos estabilizan la rodilla. Se lesionan con giros bruscos o aterrizajes con la rodilla hacia dentro.',
    signs: ['Chasquido y hinchazón rápida', 'Sensación de que la rodilla “falla”', 'Dolor intenso en el giro'],
    prevention: ['Programas de control neuromuscular', 'Fuerza de glúteo e isquios', 'Técnica de aterrizaje y cambio de dirección'],
    exerciseIds: ['salto-aterrizaje', 'equilibrio-unipodal', 'zancada-alterna', 'cambio-direccion-t'],
    seeDoctor: ['Hinchazón en menos de 2 horas', 'Inestabilidad o bloqueo', 'Dolor al apoyar'],
  },
  {
    id: 'tobillo',
    name: 'Esguince de tobillo',
    zone: 'tobillo',
    summary: 'Torcedura que estira los ligamentos externos del tobillo; la lesión más común en el fútbol.',
    signs: ['Dolor y hinchazón tras torcerlo', 'Dificultad para apoyar', 'Moretón'],
    prevention: ['Entrenamiento de equilibrio', 'Fortalecer tobillo y pantorrilla', 'Calzado adecuado y superficie en buen estado'],
    exerciseIds: ['equilibrio-unipodal', 'elevacion-gemelos', 'movilidad-tobillo-pared'],
    seeDoctor: ['No puedes dar 4 pasos', 'Dolor en el hueso al presionar', 'Deformidad'],
  },
  {
    id: 'aquiles',
    name: 'Tendón de Aquiles',
    zone: 'aquiles',
    summary: 'Irritación del tendón detrás del tobillo por sobrecarga: más carrera o saltos de los que tolera.',
    signs: ['Rigidez y dolor al levantarte', 'Dolor al empujar o saltar', 'Engrosamiento del tendón'],
    prevention: ['Subir la carga poco a poco', 'Fortalecer gemelos con control', 'Calentar bien'],
    exerciseIds: ['elevacion-gemelos', 'movilidad-tobillo-pared'],
    seeDoctor: ['Sentiste un golpe o chasquido atrás del tobillo', 'No puedes ponerte de puntillas', 'Dolor que dura semanas'],
  },
  {
    id: 'gemelo',
    name: 'Sobrecarga de gemelo',
    zone: 'gemelo',
    summary: 'Fatiga o pequeñas roturas en la pantorrilla, sobre todo al acelerar o tras mucha carga.',
    signs: ['Pinchazo en la pantorrilla', 'Dolor al ponerte de puntillas', 'Tensión que no cede'],
    prevention: ['Progresión de sprints', 'Fortalecer gemelo y sóleo', 'Hidratación y descanso'],
    exerciseIds: ['elevacion-gemelos', 'foam-roller-piernas'],
    seeDoctor: ['Pantorrilla hinchada, caliente o roja', 'Dolor al caminar', 'Hematoma'],
  },
  {
    id: 'canilla',
    name: 'Dolor en la canilla (periostitis)',
    zone: 'canilla',
    summary: 'Dolor a lo largo de la tibia por exceso de impacto o cambios de superficie.',
    signs: ['Dolor en el borde interno de la espinilla', 'Aparece al empezar y a veces cede', 'Sensible al presionar'],
    prevention: ['Aumentar el volumen despacio', 'Variar superficies', 'Fortalecer pie y pantorrilla'],
    exerciseIds: ['elevacion-gemelos', 'movilidad-tobillo-pared', 'carrera-progresiva'],
    seeDoctor: ['Dolor en un punto concreto del hueso', 'Dolor en reposo o por la noche', 'No mejora con descanso'],
  },
  {
    id: 'pubalgia',
    name: 'Pubalgia / dolor de pubis',
    zone: 'ingle',
    summary: 'Dolor en la zona baja del abdomen e ingle por desequilibrio entre abdominales y aductores.',
    signs: ['Dolor al patear o cambiar de dirección', 'Molestia al toser o estornudar', 'Dolor tras el esfuerzo'],
    prevention: ['Core fuerte y estable', 'Fuerza de aductores', 'Movilidad de cadera'],
    exerciseIds: ['plancha-frontal', 'dead-bug', 'copenhagen-rodilla', 'movilidad-cadera-90-90'],
    seeDoctor: ['Dolor persistente semanas', 'Bulto en la ingle', 'Dolor que irradia al testículo'],
  },
  {
    id: 'lumbar',
    name: 'Dolor lumbar',
    zone: 'lumbar',
    summary: 'Molestia de la parte baja de la espalda por carga, mala postura o poca fuerza del core.',
    signs: ['Rigidez al levantarte', 'Dolor al agacharte', 'Fatiga muscular lumbar'],
    prevention: ['Core estable', 'Bisagra de cadera bien hecha', 'Movilidad de cadera'],
    exerciseIds: ['plancha-frontal', 'dead-bug', 'puente-gluteo', 'movilidad-cadera-90-90'],
    seeDoctor: ['Dolor que baja por la pierna con debilidad', 'Entumecimiento en entrepierna o pérdida de control de orina', 'Dolor que empeora de noche'],
  },
  {
    id: 'hombro',
    name: 'Hombro (golpe o sobrecarga)',
    zone: 'hombro',
    summary: 'Golpes y caídas pueden estirar o lesionar el hombro; en porteros es más frecuente.',
    signs: ['Dolor al elevar el brazo', 'Debilidad', 'Chasquido o “salto”'],
    prevention: ['Fuerza de espalda y hombro', 'Movilidad de hombro', 'Técnica de caída'],
    exerciseIds: ['remo-banda', 'flexiones-rodillas', 'movilidad-cuello-hombros'],
    seeDoctor: ['Deformidad visible', 'No puedes mover el brazo', 'Entumecimiento'],
  },
  {
    id: 'conmocion',
    name: 'Golpe en la cabeza y conmoción',
    zone: 'cabeza',
    summary: 'Un golpe en la cabeza puede causar conmoción cerebral aunque no te desmayes. No se “aguanta” ni se juega con ella.',
    signs: ['Dolor de cabeza, mareo o náuseas', 'Confusión o visión borrosa', 'Sensibilidad a la luz'],
    prevention: ['Respetar las reglas de juego', 'Usar protección cuando corresponda', 'Avisar siempre tras un golpe'],
    exerciseIds: ['respiracion-calma'],
    seeDoctor: ['SIEMPRE tras un golpe con síntomas', 'Pérdida de conocimiento, vómitos repetidos o convulsión: urgencias ya', 'No vuelvas a jugar sin que un profesional lo autorice'],
  },
  {
    id: 'pie',
    name: 'Fascia plantar y fatiga de pie',
    zone: 'pie',
    summary: 'Inflamación bajo el talón por sobrecarga o calzado inadecuado.',
    signs: ['Dolor en el talón con los primeros pasos', 'Dolor al empujar con el pie', 'Mejora al calentar y vuelve tras reposo'],
    prevention: ['Calzado adecuado', 'Fortalecer pie y pantorrilla', 'Movilidad de tobillo'],
    exerciseIds: ['elevacion-gemelos', 'movilidad-tobillo-pared', 'equilibrio-unipodal'],
    seeDoctor: ['Dolor que dura semanas', 'Dolor en un punto del hueso', 'Hinchazón o moretón'],
  },
  {
    id: 'apofisitis',
    name: 'Zona de crecimiento (Osgood-Schlatter y Sever)',
    zone: 'rodilla',
    growing: true,
    summary: 'En plena etapa de crecimiento, el hueso crece más rápido que el tendón y duele en la rodilla (debajo de la rótula) o en el talón. Es frecuente y pasa al terminar de crecer.',
    signs: ['Bulto doloroso debajo de la rodilla o dolor en el talón', 'Duele al correr y saltar', 'Mejora con reposo'],
    prevention: ['No subir la carga de golpe en brotes de crecimiento', 'Descansar cuando duele', 'Fuerza y movilidad suaves'],
    exerciseIds: ['movilidad-tobillo-pared', 'equilibrio-unipodal'],
    seeDoctor: ['Dolor que no cede con reposo', 'Cojera', 'Hinchazón marcada'],
  },
];

export const INJURY_BY_ID: ReadonlyMap<string, InjuryInfo> = new Map(INJURIES.map((i) => [i.id, i]));
