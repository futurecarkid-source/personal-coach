# Servicio de IA de Dorsal

Un Cloudflare Worker mínimo. La app **no** habla con el proveedor: solo con este servicio, que

1. comprueba el código de acceso (hoy, el del dueño: Pro permanente y gratuito),
2. limita el uso por minuto y por día,
3. tiene los **prompts del lado del servidor** (no es un proxy abierto: solo ejecuta las tareas de `src/ai/contract.ts`),
4. llama a Claude con el SDK oficial de Anthropic y valida la salida con Zod,
5. no guarda ni registra el contenido de las consultas.

## Tareas
`coach_chat`, `weekly_plan`, `pain_followup`, `tactic_explain`, `match_review`, `scouting_estimate`.

## Modelo y costo
Por defecto usa `claude-opus-5-5` (US$4 / US$20 por millón de tokens de entrada/salida). Es una decisión de precio cambiarlo:
`MODEL_DEFAULT` o `MODEL_<TAREA>` (por ejemplo `MODEL_COACH_CHAT=claude-haiku-5-5`, US$0,10 / US$0,50) en `wrangler.toml` > `[vars]`.
Conviene medir calidad y costo antes de bajar de modelo. Se envía `fallbacks: "default"` para reintentar rechazos de seguridad.

## Publicar (sin terminal)
1. Cuenta gratuita de Cloudflare y un token de API (plantilla "Edit Cloudflare Workers").
2. Clave de API de Anthropic con saldo.
3. En GitHub > Settings > Secrets > Actions: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ANTHROPIC_API_KEY` y `OWNER_ACCESS_CODE` (inventa un código largo).
4. (Opcional, recomendado) crear un KV llamado `USAGE` y pegar su id en `wrangler.toml` para que los límites persistan.
5. Actions > "Publicar servicio de IA" > Run workflow.
6. Arma tu **enlace de conexión**: la dirección del Worker + `#` + tu código, por ejemplo `https://dorsal.tu-usuario.workers.dev/#mi-codigo-largo`.
7. En la app: Perfil > IA y Coach > Conectar la IA > pega el enlace y toca "Conectar y probar". La app comprueba la conexión de verdad (ruta `/v1/ping`, sin gastar saldo de IA).

El servicio ya responde los permisos CORS que necesita la versión web (PWA).

## Pendiente (etapa de suscripciones)
Verificación de suscriptores Pro (RevenueCat) en `src/auth.ts`, y video (solo Gemini; Claude no acepta video).
