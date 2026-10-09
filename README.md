# Dorsal (nombre de trabajo)

App de iPhone y iPad para futbolistas: plan personal, juego diario, cuerpo y mente, partidos y táctica.
Especificación completa: [`docs/INVENTARIO_FUNCIONAL.md`](docs/INVENTARIO_FUNCIONAL.md).

**Stack:** TypeScript estricto · React Native 0.86 · Expo SDK 57 (no migrar a la 58) · Expo Router · Reanimated 4 · Gesture Handler · `expo-glass-effect` (Liquid Glass) · `expo-blur` (respaldo) · `expo-haptics` · `expo-sqlite/kv-store` · Zod.

## Comandos
```
npm install
npm run typecheck   # tsc --noEmit
npm run lint        # eslint (reglas de Expo + React Compiler)
npm test            # jest: núcleo puro + componentes
npm start           # Expo (Expo Go en iPhone/iPad)
```

## Estructura
- `app/` rutas de Expo Router (solo reexportan pantallas).
- `src/types/` tipos globales; los datos persistidos se validan con Zod.
- `src/theme/` colores, vidrio, físicas de muelle (`springs`), háptica (`haptics`).
- `src/core/` lógica pura con pruebas: OVR, xG, mapa de calor, formaciones, temporizador, racha, plan por reglas, flujo de "Empezar ejercicio".
- `src/context/` estado global (reducer) + persistencia local validada y con recuperación.
- `src/components/common/` GlassSurface, GlassCard, GlassButton, HapticTouch, Chip, etc.
- `src/components/specialized/` PlayerCard3D, TacticalBoard, MatchTracker, IntervalTimer, ExerciseGlyph.
- `src/navigation/` barra de pestañas flotante de vidrio.
- `src/screens/` pantallas.
- `src/content/` ejercicios y eventos de partido (datos).

## Servicio de IA
`server/` contiene el servicio (Cloudflare Worker, SDK oficial de Anthropic). Ver [`server/README.md`](server/README.md).

## Navegación iOS 26
Cada pestaña tiene su pila nativa con título grande. La barra de pestañas es la **del sistema** (Liquid Glass real, `NativeTabs`, alfa en Expo SDK 57) con una guarda de arranque: si falla, se usa la barra de vidrio propia (`FloatingTabBar`). Las hojas (Coach, Dolor) son `formSheet` con detents. Los ajustes usan controles SwiftUI reales (`@expo/ui`).

## Estado
Hecho y verificado (tipos, lint, 237 pruebas, empaquetado de iOS con Metro y del Worker): cuestionario inicial, plan por reglas, "Empezar ejercicio", check-in, racha y XP, tarjeta con inclinación, temporizador, tracker de partido con xG y mapa de calor, pizarra táctica, **IA** (coach en chat, plan semanal validado, orientación de dolor, explicación de pizarra, revisión de partido, refinado de cifras), **dolor y lesiones** (reglas locales de alerta R1 a R11 y seguimiento a 24/48/72 h), navegación nativa de iOS 26, **Preparación** (carga ACWR/EWMA, monotonía, bienestar, sueño, sensibilidad), **Mente** (respiración guiada con háptica y test de reflejos con línea base), **guía de lesiones** (14 fichas con acceso a "Tengo este dolor"), 30 ejercicios y la regla **"online primero"** (aviso a las 48 h y pantalla de conexión a las 72 h, solo si hay servicio configurado).

**No verificado en dispositivo:** el aspecto del vidrio, la háptica, el parallax y los gestos solo se pueden juzgar en un iPhone o iPad.

Los ejercicios tienen **maniquí animado** propio (figura de palos de perfil, 27 animaciones originales calculadas con ángulos en `src/core/pose.ts`, datos en `src/content/exerciseAnimations.ts`); la hoja de contacto de revisión se genera con `POSE_DUMP=<carpeta> npx jest src/core/__tests__/pose.test.ts`.

El reporte de dolor tiene **mapa del cuerpo** (frente y espalda, lado izquierdo o derecho), **foto con marcadores** que se queda solo en el dispositivo y se borra al resolver el dolor, y orientación de IA también en los seguimientos (la IA solo puede subir la precaución).

**Juego:** rangos (Cantera a Leyenda), misiones diarias, cofre del día, reto semanal, 17 logros con celebración (confeti y vibración) y pantalla de Logros. La lógica está en `src/core/progression.ts`. Gestos: deslizar filas para borrar, deslizar el ejercicio para cambiarlo, hojas con tiradores y escala con muelle al tocar. En iPad, Inicio usa dos columnas.

Pendiente (ver inventario): análisis de la foto por IA (hoy nunca se envía), publicar el servicio de IA y suscripciones, video de partidos, simulador, nutrición, varios jugadores, y el resto de módulos. Los textos de lesiones y ejercicios deben revisarlos profesionales del deporte antes de publicar.
