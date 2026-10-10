/** En el navegador se comparte texto (o se copia) con la hoja nativa del navegador si existe. */
export async function shareCard(_target: unknown, fallbackText: string): Promise<void> {
  const nav = globalThis.navigator as (Navigator & { share?: (d: { text: string }) => Promise<void> }) | undefined;
  try {
    if (nav?.share) await nav.share({ text: fallbackText });
    else await nav?.clipboard?.writeText(fallbackText);
  } catch {
    // Cancelado.
  }
}
