import * as SecureStore from 'expo-secure-store';

const ACCESS_CODE_KEY = 'dorsal.ai.accessCode';

/** El código de acceso al servicio de IA vive en el llavero del dispositivo, nunca en el estado ni en archivos. */
export async function getAccessCode(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_CODE_KEY);
  } catch {
    return null;
  }
}

export async function setAccessCode(code: string): Promise<boolean> {
  try {
    const trimmed = code.trim();
    if (!trimmed) {
      await SecureStore.deleteItemAsync(ACCESS_CODE_KEY);
      return true;
    }
    await SecureStore.setItemAsync(ACCESS_CODE_KEY, trimmed);
    return true;
  } catch {
    return false;
  }
}
