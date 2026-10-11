# Auditoría iOS 26 de Fulbito (código nativo y web)

Qué ya cumple, qué se corrigió en esta ronda y qué falta. "Probado" significa visto en pantalla; la app nativa en un iPhone real todavía no se ha visto.

## Ya cumple (código nativo)
- **Barra de pestañas del sistema** (`NativeTabs`) con minimizado al bajar y adaptación a barra lateral en iPad; respaldo propio de vidrio si falla.
- **Títulos grandes** que se contraen, barra transparente con desenfoque y gesto de volver (`TabStack`).
- **Hojas del sistema** (`formSheet`) con topes de altura y esquinas de 34 pt para Coach y Dolor.
- **Vidrio líquido real** (`expo-glass-effect`) en controles; desenfoque simulado en iOS anterior.
- **Iconos SF Symbols**, tamaños táctiles de 44 pt, vibraciones, tipografía del sistema con Dynamic Type limitado a 1,4×.
- **Controles de SwiftUI** (`@expo/ui`) para interruptores y ajustes en Perfil.
- **Márgenes seguros** y teclado automáticos.

## Corregido en esta ronda
- Peso y tamaño de la tipografía ajustados a San Francisco (títulos 700, encabezados 600, etiquetas 12 pt sin mayúsculas gritonas).
- **Reducir transparencia** (Accesibilidad de iOS): el vidrio pasa a superficie sólida con borde fino.
- **Icono con variantes** clara, oscura y tintada (iOS 18/26), además del color esmeralda.
- Web: sin cuadro de título al bajar, barra de estado difuminada, fondo sin franja blanca.

## Falta (y por qué)
| Tema | Qué hace falta | Quién |
|---|---|---|
| **Probar en iPhone real** | Vidrio líquido, vibraciones, barra del sistema, hojas | Tú, con Expo Go (`docs/PROBAR_EN_IPHONE.md`) |
| **Icono en capas de iOS 26** (`.icon` de Icon Composer) | Hace falta una Mac con Icon Composer; el icono actual es una imagen plana | Mac |
| **Colores del sistema** (`PlatformColor`) | Que fondos y textos sigan "Aumentar contraste" y el modo oscuro del sistema al píxel; hoy son colores fijos equivalentes | Código + prueba en iPhone |
| **Vidrio solo en lo que flota** | Apple pide material para controles y barras, no para todas las tarjetas; hoy las tarjetas son de vidrio por pedido tuyo. En iPhone real conviene comparar con tarjetas sólidas | Decisión de diseño tras probar |
| **Rendimiento** | Muchas capas de vidrio en pantallas largas; medir en un iPhone antiguo | Prueba real |
| **Widgets, Live Activities, Siri, Salud, Watch** | Extensiones nativas fuera de Expo Go (compilación propia) | Mac + cuenta Apple |
| **Textos de salud** | Revisión por un fisioterapeuta antes de publicar | Profesional |
| **Notificaciones y pagos** | Probar en dispositivo real | Tú |

## Límite de la versión web (PWA)
No puede tener el vidrio líquido real del sistema, vibraciones ni la barra de pestañas del sistema. Se ve como iOS, pero la referencia de calidad es la app nativa.
