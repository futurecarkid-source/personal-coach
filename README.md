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

## Estado
Hecho y verificado (tipos, lint, 59 pruebas, empaquetado de iOS con Metro): cuestionario inicial, plan por reglas, "Empezar ejercicio", check-in, racha y XP, tarjeta con inclinación, temporizador, tracker de partido con xG y mapa de calor, pizarra táctica.

**No verificado en dispositivo:** el aspecto del vidrio, la háptica, el parallax y los gestos solo se pueden juzgar en un iPhone o iPad.

Pendiente (ver inventario): animaciones de ejercicios por patrón (hoy hay un marcador), 20–30 ejercicios (hay 18), reglas de dolor y lesiones, Preparación (ACWR), servicio de IA y suscripciones, video de partidos, simulador, Zen y reflejos, nutrición y sueño, y el resto de módulos.
