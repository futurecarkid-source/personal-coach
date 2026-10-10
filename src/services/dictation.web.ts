interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function ctor(): (new () => RecognitionLike) | null {
  const g = globalThis as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
  return g.SpeechRecognition ?? g.webkitSpeechRecognition ?? null;
}

export function dictationSupported(): boolean {
  return ctor() !== null;
}

/** Dictado por voz del navegador (Safari lo soporta). Devuelve una función para detenerlo. */
export function startDictation(onText: (text: string) => void, onEnd: () => void): () => void {
  const C = ctor();
  if (!C) {
    onEnd();
    return () => undefined;
  }
  const r = new C();
  r.lang = 'es-ES';
  r.interimResults = false;
  r.onresult = (e) => {
    const first = e.results[0]?.[0];
    if (first) onText(first.transcript);
  };
  r.onend = onEnd;
  r.onerror = onEnd;
  r.start();
  return () => r.stop();
}
