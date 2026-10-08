import { Directory, File, Paths } from 'expo-file-system';

const PHOTO_DIR = 'pain-photos';

/** Copia la foto a la carpeta de documentos de la app (no la borra el sistema). Devuelve la ruta nueva, o null si falla. */
export function savePhotoCopy(sourceUri: string): string | null {
  try {
    const dir = new Directory(Paths.document, PHOTO_DIR);
    if (!dir.exists) dir.create({ intermediates: true });
    const target = new File(dir, `dolor-${Date.now()}.jpg`);
    new File(sourceUri).copy(target);
    return target.uri;
  } catch {
    return null;
  }
}

/** Borra una foto guardada; si ya no existe no hace nada. */
export function deletePhoto(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Nada que borrar.
  }
}
