# Probar la app original (nativa) en tu iPhone o iPad, gratis

No necesitas pagar nada para probarla. El pago de Apple (99 USD al año) solo hace falta si después quieres publicarla en la App Store o repartirla por TestFlight.

## Lo que necesitas
- Tu PC (Windows, Mac o Linux) con internet.
- Tu iPhone o iPad con la app gratuita **Expo Go** (búscala en la App Store).
- El PC y el teléfono en la **misma red wifi** (si no, usa el paso 5).

## Pasos
1. **Instala Node.js** en el PC: entra a nodejs.org y descarga la versión "LTS". Instálala con todo por defecto.
2. **Descarga el proyecto**: en GitHub, abre el repositorio `futurecarkid-source/personal-coach`, cambia a la rama `claude/sports-performance-app-strategy-2tjmq3` y toca **Code > Download ZIP**. Descomprime la carpeta.
3. **Abre una terminal dentro de esa carpeta** (en Windows: abre la carpeta, escribe `cmd` en la barra de direcciones y pulsa Enter).
4. Escribe estos dos comandos, uno a la vez, y espera a que termine cada uno:
   ```
   npm install
   npx expo start
   ```
   Saldrá un **código QR** en la terminal.
5. En el iPhone abre la **cámara**, apunta al QR y toca el aviso "Abrir en Expo Go". Si tu teléfono y el PC no comparten wifi, para el comando con Ctrl+C y usa `npx expo start --tunnel` (la primera vez pedirá instalar algo: acepta).
6. La app abre en Expo Go. Cada vez que yo cambie algo, se actualiza sola al volver a descargar el proyecto.

## Conectar la IA en la app nativa
1. Entra a **Perfil > Conectar la IA**.
2. Pega tu clave de **Google AI Studio** (empieza por `AIza` o `AQ.`). Se consigue gratis en aistudio.google.com/apikey.
3. Toca **Conectar y probar**, acepta qué se envía y prueba con el Coach.
La clave se guarda en el llavero seguro del teléfono.

## Si algo falla
- **"Expo Go no es compatible con esta versión"**: Expo Go solo abre proyectos de la versión que él soporta. Dímelo (con el texto exacto del aviso) y lo ajusto; la alternativa es una "development build", que necesita una Mac con Xcode o la cuenta de Apple de pago.
- **El QR no abre nada**: usa `--tunnel` (paso 5) o revisa que el firewall no bloquee a Node.
- **Lo que no se puede probar en Expo Go**: algunas notificaciones y la barra de pestañas nativa de iOS 26; la app trae una barra propia de respaldo.

## Y para publicar después
Cuando estés conforme: cuenta de Apple Developer (99 USD al año), una compilación con EAS Build y TestFlight para que prueben otros, y luego el envío a la App Store. Los textos de salud conviene que los revise un fisioterapeuta antes.
