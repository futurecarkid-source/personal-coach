import { Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

/** Comparte la tarjeta como imagen (hoja de compartir de iOS). Si no se puede capturar, comparte un texto. */
export async function shareCard(target: unknown, fallbackText: string): Promise<void> {
  try {
    if (await Sharing.isAvailableAsync()) {
      const uri = await captureRef(target as never, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Comparte tu tarjeta' });
      return;
    }
  } catch {
    // Se intenta con texto.
  }
  try {
    await Share.share({ message: fallbackText });
  } catch {
    // La persona cerró la hoja.
  }
}
