const ACCESS_CODE_KEY = 'dorsal.ai.accessCode';

/** En la web no hay llavero: el código se guarda en el almacenamiento local de este navegador. */
export async function getAccessCode(): Promise<string | null> {
  try {
    return globalThis.localStorage?.getItem(ACCESS_CODE_KEY) ?? null;
  } catch {
    return null;
  }
}

export async function setAccessCode(code: string): Promise<boolean> {
  try {
    const trimmed = code.trim();
    if (!trimmed) globalThis.localStorage?.removeItem(ACCESS_CODE_KEY);
    else globalThis.localStorage?.setItem(ACCESS_CODE_KEY, trimmed);
    return true;
  } catch {
    return false;
  }
}
