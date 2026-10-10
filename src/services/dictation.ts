/** En la app nativa se usa el micrófono del teclado de iOS (dictado del sistema); no hace falta código propio. */
export function dictationSupported(): boolean {
  return false;
}

export function startDictation(_onText: (text: string) => void, _onEnd: () => void): () => void {
  return () => undefined;
}
