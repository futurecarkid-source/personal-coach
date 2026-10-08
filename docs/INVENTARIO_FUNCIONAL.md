# Inventario Funcional Personalizado Definitivo

**Proyecto:** Dorsal *(nombre de trabajo, ver §11)* · **Plataforma:** iPhone + iPad (iOS 26) · **Versión del documento:** borrador 1 · **Fecha:** 2026-10-08 · **Estado:** pendiente de aprobación de Federico

---

## 0. Resumen en lenguaje simple

Una app de iPhone y iPad que se ve y se siente como parte de iOS 26 (vidrio líquido real, gestos, iconos y animaciones de Apple). Al terminar un cuestionario te arma un **plan de entrenamiento personal**; cada día entras a un **juego** (racha, misiones, premios, tarjeta 3D) que crea disciplina; cuida tu **cuerpo** (carga, dolor, lesiones, sueño, nutrición) y tu **mente** (reacción, respiración, rutina); y analiza tus **partidos en video**. Lo básico es gratis y funciona sin internet; la IA es la parte de pago (y para ti es gratis).

---

## 1. Qué cambió respecto a la Estrategia Pro Max (Prompt 1)

| Tema | Prompt 1 | Ahora |
|---|---|---|
| Plataformas | iOS + Android con 3 niveles de vidrio | **Solo iPhone y iPad**, con el aspecto exacto de iOS 26. Android queda fuera de la primera etapa |
| Aspecto | Oscuro por defecto | **Claro por defecto** (blanco + grises), acento naranja, vidrio líquido real; el modo oscuro se activa solo con el sistema |
| Eje del producto | Módulos sueltos conectados | **Plan personal diario + juego** (racha, premios) como motor del hábito |
| Servidores | Ninguno | **Un mini-servicio** solo para la IA de pago y las suscripciones. Todo lo demás sigue en el dispositivo |
| IA | Opcional con tu propia clave | **Incluida en el plan Pro** (gratis para ti). La clave propia queda solo como modo de pruebas |
| Modo Partido | Captura en vivo con dos toques | **Etiquetado sobre video grabado**, con postura, actitud y mente |
| Entrenamientos | Banco offline + planificador | **Eje central**: animación, "Empezar ejercicio", plan por IA |
| Módulos nuevos | — | Lesiones con mapa corporal/foto y seguimiento, sueño, nutrición con macros, coach texto/voz, análisis de video con IA, modo entrenador (varios jugadores) |
| GPS | Opcional | Opcional y **apagado por defecto** |
| Tarjeta | 6 atributos | **16 atributos** + OVR por posición + decaimiento suave |
| Sin cambios | — | ACWR, xG/xT, mapa de calor, Zen con háptica, Semáforo Cognitivo, Pizarra de 22 fichas, Simulador |

---

## 2. Lenguaje y tecnología (tu duda del paréntesis)

- **Lenguaje principal: TypeScript** (JavaScript con reglas estrictas), con **React Native + Expo**. Es lo que permite componentes nativos de iOS (vidrio, pestañas, iconos SF Symbols, gestos) sin necesitar un Mac.
- **Python no se usa para las pantallas.** Python no es un lenguaje para programar apps de iPhone. Instagram y Spotify lo usan sobre todo en sus **servidores**; las apps que ves en el teléfono están hechas con herramientas nativas (Swift/Kotlin, y partes en otros lenguajes).
- **Swift/SwiftUI** daría el aspecto más nativo posible, pero necesita Mac y Xcode para compilar y probar; ni tú ni yo podemos hacerlo desde aquí. Cuando una función exija algo exclusivo de Apple, se escribe un **módulo Swift pequeño** que se compila en la nube.
- **Servicio mínimo de IA** (solo para la parte de pago): un pequeño programa en la nube gratuito (propuesta: Cloudflare Workers) que guarda las claves de IA y comprueba que eres suscriptor.

---

## 3. Acceso, precios y reglas de negocio

**Principio (tu queja de otras apps): nada se bloquea al terminar el cuestionario.** Lo que cuesta dinero real (llamadas de IA) es lo que se paga.

| Gratis para todos | Pro (de pago) |
|---|---|
| Cuestionario completo y **plan personalizado generado por el motor local** | Plan **adaptativo por IA**, que se reajusta cada semana y por conversación |
| Biblioteca de ejercicios, "Empezar ejercicio", temporizadores | Coach con chat libre y voz, con memoria de tu historial |
| Check-in diario, Preparación, tarjeta 3D, todo el juego (racha, misiones, premios) | Seguimiento de dolor conversacional por IA |
| Guía de lesiones, reporte de dolor con reglas locales y seguimiento programado | Análisis de video con IA |
| Sueño, nutrición base (calculadora, registro, recetas incluidas) | Menús y recetas por IA (macros verificados por el motor local) |
| Modo Partido con etiquetado manual, pizarra, simulador, tests cognitivos, Zen | Explicaciones tácticas y escenarios generados por IA |
| Coach local, exportar y respaldo | Modo Entrenador con más de N jugadores (N por definir) |

- **Federico: Pro permanente y gratis.**
- Precios y cupos mensuales de IA: por definir según el costo real (el video es lo más caro).
- Sin muro de pago al terminar el cuestionario. Sin compras para obtener ventajas del juego.

---

## 4. Inventario por módulo

Leyenda: **P0** primera versión usable · **P1** siguiente · **P2** después · **P3** experimental / evaluar. **G** gratis · **Pro** de pago. "Origen" indica la respuesta tuya de la que sale cada módulo.

### M00 · Onboarding y Cuestionario de Scouting — P0 · G
*Origen: 0.1–0.6, 1.1, 1.4, 2.1, 2.5, 5.4, 5.5, 6.6.*
- Bienvenida, idioma (español), permisos explicados en el momento en que se necesitan.
- Cuestionario por pasos (5–7 min, barra de avance, "guardar y seguir luego", caritas, deslizadores y chips):
  - perfil: edad, altura, peso, pie dominante, posición principal y secundarias, **categoría/nivel** (principiante, amateur, semipro, pro, cantera por edades), equipo(s) y país;
  - objetivos (**se pueden elegir varios**): subir de nivel o fichar, prevenir lesiones, mejorar mentalidad, mejorar físico, entender el juego, llevar estadísticas, otro;
  - rutina: partidos y entrenos por semana, día de partido, tiempo y equipamiento;
  - historial de lesiones y molestias actuales (selector por zonas);
  - sueño habitual, hábitos de comida, alergias, tipo de dieta;
  - **"¿Tienes Apple Watch, reloj o banda de pulso?"**;
  - autoevaluación de los 16 atributos con ejemplos; tests físicos opcionales (sprint, salto) con guía.
- Verificación de rango de edad → ajusta seguridad y consentimientos para menores.
- "Scouting inicial": calcula la tarjeta y los atributos **estimados** (etiqueta "Estimado") y los revela con animación.
- Al final entrega el plan (M01). **Sin pantalla de pago.**

### M01 · Plan Personalizado — P0 · G (motor local) / Pro (IA)
*Origen: 2.4, 6.6, 7.4.*
- **Motor local (gratis):** plan semanal alrededor de los días de partido (microciclo), carga objetivo en esfuerzo percibido, progresión con límites, exclusión automática de ejercicios contraindicados por lesión o dolor activo, adaptado a tiempo y equipamiento. Determinista y reproducible.
- **Plan IA (Pro):** la IA elige **solo ejercicios que existen en el banco**; la salida se valida con reglas de seguridad (límites de progresión, contraindicaciones) antes de mostrarse. Reajuste semanal por adherencia, check-ins, partidos y dolor. Chat para ajustes ("hoy solo tengo 20 min").
- Vistas: **Hoy** (con opciones "más corto / más fácil / descanso"), Semana, Calendario, ciclo de 4–12 semanas.
- "¿Por qué este plan?": explicación en lenguaje claro.
- Regla de seguridad: Preparación en rojo o dolor activo → el plan se degrada solo a recuperación.
- **La IA elige los ejercicios y programas de prevención por persona**; tú no tienes que escogerlos.

### M02 · Entrenamientos — P0 · G
*Origen: 2.3–2.6, 5.7.*
- **Biblioteca:** meta de 80–120 ejercicios originales en la primera versión; crece por paquetes de contenido hasta 300–500. Categorías: prevención, fuerza, potencia/pliometría, velocidad, agilidad, resistencia/intervalos, movilidad, técnica con balón, coordinación, cabeceo, portero, core, calentamiento, vuelta a la calma, recuperación, rehabilitación.
- **Ficha del ejercicio:** nombre, objetivo, músculos, **animación en bucle**, series × repeticiones o tiempo, descanso, equipamiento, nivel, pasos de ejecución, errores comunes, respiración, progresión/regresión, contraindicaciones.
- **Animaciones:** maniquí vectorial animado por fotogramas, dibujado en el dispositivo (liviano, consistente, sin licencias).
- **Video explicativo de YouTube (opcional):** botón "Ver explicación" que abre la búsqueda del ejercicio en YouTube; no se incrusta en la primera versión.
- **"Empezar ejercicio"** (pantalla completa, al estilo de las apps de fitness de Apple): animación grande, contador de repeticiones o tiempo, cuenta atrás, descanso automático, siguiente/anterior/saltar, sustituir ejercicio, pausa, háptica por fase, voz opcional, pantalla siempre encendida, registro de peso y repeticiones reales, esfuerzo percibido (RPE) al final, resumen con XP.
- Rutinas propias (crear, guardar, editar), favoritos, historial, búsqueda y filtros. Funciona sin internet.

### M03 · Temporizadores — P0 (básicos) / P1 (completo) · G
*Origen: 2.6.*
- Temporizador y **cronómetro normales** (con vueltas), cuenta atrás.
- Intervalos: HIIT, Tabata, EMOM y **personalizados guardables**, descansos y series.
- **Calentamiento guiado** paso a paso.
- Avisos por háptica, sonido y voz. Pantalla encendida. Notificación al terminar en segundo plano. P2: Live Activity / Isla Dinámica.

### M04 · Check-in diario y Preparación — P0 (simple) / P1 (completo) · G
*Origen: 2.8, 5.6.*
- **Check-in de 20–30 s con caritas (1–10):** ánimo y energía; tres toques para sueño, molestias y estrés; mapa corporal opcional.
- **Esfuerzo percibido (RPE)** al terminar cada sesión, con caritas.
- **Anillo de Preparación (0–100)**: se muestra con palabra y color suave (Listo / Moderado / Descansa). No es un semáforo de tres luces; es un anillo estilo Apple Fitness.
- "Detalles": carga aguda/crónica (ACWR por media móvil exponencial 7/28 días), monotonía, tendencia, nivel de confianza; estado **"Calibrando"** los primeros 28 días.
- Sensibilidad ajustable (estricto / equilibrado / permisivo; por defecto equilibrado). Cautela extra para menores.
- Recordatorio diario a la hora que elijas. P2: lectura de Apple Salud (sueño, pulso en reposo, HRV) si tienes reloj.
- Textos con acciones concretas; nunca diagnósticos.

### M05 · Lesiones y Dolor — P1 · G (reglas locales) / Pro (IA conversacional)
*Origen: 2.1, 2.2, 2.9.*
- **Guía de lesiones comunes** (isquiotibiales, cuádriceps, aductores/pubalgia, rodilla, tobillo, gemelo, Aquiles, cadera, lumbar, hombro, canillas, fascitis plantar, conmoción, dolores de crecimiento): al tocar cada una, **explicación breve** (qué es, señales, cómo se previene, cuándo ir al médico) y los ejercicios de prevención recomendados.
- **"Reportar dolor nuevo":**
  1. *Dónde:* mapa corporal (frente y espalda), **foto propia con marcador/dibujo** sobre la zona, o descripción por texto o voz.
  2. *Cómo:* cuándo empezó, qué lo causó, tipo (punzante, tirón, ardor, rigidez), intensidad 0–10, hinchazón, si puedes apoyar o correr.
  3. *Filtro de alertas rojas (reglas locales, no IA):* no poder apoyar, deformidad, entumecimiento, dolor nocturno fuerte, fiebre, golpe en la cabeza con síntomas, etc. → "Consulta a un profesional / urgencias" y se bloquea el entrenamiento de esa zona.
  4. *Respuesta:* primeros pasos prudentes + ajuste automático del plan + (Pro) IA que hace preguntas, resume y explica con lenguaje de "posibles causas", sin diagnosticar ni dar dosis de medicamentos.
- **Seguimiento automático:** la app pregunta a las 24, 48 y 72 h y cada semana "¿Te sigue doliendo? ¿Cuánto?", dibuja la evolución, ajusta el plan y avisa cuándo consultar si no mejora.
- **Retorno al juego por fases** (control del dolor → movilidad → fuerza → carrera → cambios de dirección → contacto → competencia), con criterios claros y recomendación de autorización profesional.
- Las fotos **se quedan en el dispositivo**; si se mandan a la IA, es con tu permiso en cada ocasión y sin metadatos. Menores: sin envío sin consentimiento de un adulto responsable.
- Historial exportable en PDF para fisioterapeuta o médico. Aviso legal visible.

### M06 · Identidad: Tarjeta 3D — P0 (estática de vidrio) / P1 (3D completa) · G
*Origen: 1.1–1.5.*
- **Datos:** nombre o apodo, número, bandera, **posición, categoría (principiante, amateur…)**, club con escudo subido por ti, foto (cámara o galería; recorte de fondo si el dispositivo lo permite).
- **16 atributos:** PAC, SHO, PAS, DRI, DEF, PHY + Visión, Mentalidad, Resistencia, Agilidad, Salto, Juego aéreo, Posicionamiento, Disciplina, Pie débil, Técnica. La tarjeta muestra los 6 principales según tu posición; la vista de detalle muestra los 16. **Porteros:** conjunto propio (Reflejos, Estirada, Juego de pies, Posicionamiento, Salidas, Saque…).
- **OVR ponderado por posición** (8 perfiles: portero, central, lateral, mediocentro defensivo, mediocentro, mediapunta, extremo, delantero; tabla de pesos transparente definida en la etapa de código y ajustable).
- **Origen de las cifras (mixto):** el cuestionario + IA da una **estimación inicial** ("Estimado"); se refina con partidos, tests y entrenos; puedes **ajustar a mano** dentro de un rango y queda marcado como "Ajustado". La IA propone, el motor valida y limita los números.
- **Decaimiento (sí, suave):** solo la condición física baja tras 14 o más días sin actividad sin justificación, con un piso; **no penaliza descansos prescritos ni lesiones**. Una capa aparte, **"Forma" (±5)**, refleja tu racha reciente sin tocar el OVR base.
- **Rarezas:** bronce → plata → oro → especial → leyenda.
- **Tarjetas especiales por hitos (20 o más):** primer gol, hat-trick, asistidor, portería a cero, 10 partidos registrados, racha de 7 / 30 / 100 / 365 días, semana perfecta, plan de 4 / 8 / 12 semanas completado, retorno tras una lesión, mejor partido, reacción mejorada, "mentalidad de acero" (reinicio rápido tras un error), madrugador, mes sin faltar, cumpleaños, fin de temporada y más.
- **3D:** parallax con el giroscopio (`expo-sensors`), brillo holográfico por GPU. **"Brillo del efecto"** (qué tan fuerte brilla y se mueve cuando inclinas el teléfono): Media por defecto, con deslizador en Ajustes. Respeta "Reducir movimiento" del sistema (una opción de accesibilidad de iOS para quien se marea con animaciones) de forma automática.
- **Animación de apertura:** al abrir un paquete o subir de nivel **y al abrir la app** (≤ 1,5 s, se puede saltar y se vuelve más sutil con el uso).
- **Compartir:** imagen en alta resolución y video corto del efecto. **Historial por temporada** (línea de tiempo de tu tarjeta).
- Diseño propio: sin marca, tipografía ni escudos de EA/FUT; sin fotos de terceros.

### M07 · Gamificación ("Modo Juego") — P0 (racha + XP) / P1 (completo) · G
*Origen: 1.6, 6.6.*
- **Racha de compromiso:** cuenta sesión, descanso activo, check-in o recuperación prescrita. **El descanso prescrito o la lesión nunca rompen la racha.** "Congeladores de racha" que se ganan.
- **XP, niveles y títulos.**
- **Misiones** diarias (3), semanales y de temporada (ciclos de 8–12 semanas con recompensas).
- **Recompensas:** paquetes de tarjetas, temas, marcos, insignias, sonidos y animaciones; cofre diario.
- **Logros** (meta: 100 o más). **Combos** (calentamiento + sesión + recuperación).
- **Retos contra tu "yo del mes pasado".** Ranking con amigos o equipo requiere servidor: P3.
- **Pruebas diarias** cortas (reacción, decisiones) que dan XP.
- **Calendario de actividad** estilo anillos y mapa anual.
- Celebraciones con resorte, háptica y sonido opcional; notificaciones motivacionales a la hora que elijas.
- **Diseño responsable:** sin culpa por romper la racha, sin premios que empujen a entrenar lesionado o agotado, sin compras para ganar ventajas, tope de notificaciones, protección de menores.

### M08 · Modo Partido (etiquetador de video) — P1 · G
*Origen: 4.1–4.11.*
- **Importar el video del partido** (desde Fotos o Archivos; pueden ser varios GB y varias partes): sin duplicarlo si es posible. Ficha del partido: rival, fecha, competición, marcador, local/visitante, clima, césped o sintético, minutos jugados, sustituciones, cambios de posición.
- **Reproductor de análisis:** velocidad 0,25×–2×, saltos de ±5 y ±10 s, cuadro a cuadro, bucle de clip, línea de tiempo con marcas.
- **"Soy yo":** marcas tu dorsal, color de camiseta y posición en un fotograma de referencia (sirve de guía para ti y para la IA).
- **Etiquetado con marca de tiempo** con botones grandes (menú radial de vidrio) y, si quieres, toque en un minicampo para la posición, o por zonas. Deshacer, edición posterior, autoguardado. Alcance: **todas las acciones** (tuyas, del equipo y del rival: marcador, goles, faltas).
- **Eventos:**
  - *Ataque:* gol, asistencia, tiro a puerta, tiro fuera, tiro bloqueado, pase clave, regate ganado/perdido, centro, desmarque, toque en área, conducción progresiva, ocasión clara creada o fallada.
  - *Pase:* completado, fallido, largo, en profundidad, hacia atrás.
  - *Defensa:* entrada ganada/perdida, intercepción, despeje, bloqueo, recuperación, pérdida, duelo ganado/perdido, duelo aéreo, 1v1 defensivo, presión efectiva.
  - *Portero:* parada, salida, blocaje, despeje de puños, pase con el pie, gol encajado, penalti parado.
  - *Balón parado y disciplina:* córner, tiro libre, penalti, saque de banda, falta cometida/recibida, amarilla, roja, fuera de juego.
  - ***Sin balón y mente (nuevo):*** movimiento sin balón (ruptura, apoyo, amplitud, cobertura), **perfilación corporal** (escaneo antes de recibir), **postura y lenguaje corporal** (positivo / neutro / negativo), **reacción al fallo** (presiona, se frena, protesta, levanta la cabeza), comunicación, esfuerzo de recuperación, calidad de la decisión, **tiempo de reacción** (dos marcas: jugada gatillo → respuesta, medido en el video), liderazgo.
- **Resultados:** xG y xA, mapa de calor (de las posiciones etiquetadas), mapa de pases, **mapa de tiros con xG**, resumen post-partido en formato tarjeta, nota 1–10 y esfuerzo percibido, diario de texto, tendencia por partidos, comparación con tus promedios y con la referencia de tu posición, resumen de **reacción al fallo** y de indicadores mentales.
- Clips de cada evento (±8 s) y selección de "mejores jugadas"; exportar el video de resumen es P2.
- **iPad primero:** video grande, paleta lateral y línea de tiempo.
- **GPS** (distancia, sprints) y **pulso** (reloj o banda): opcionales por usuario y apagados por defecto (P2 / P3).

### M09 · Análisis de video con IA — P2 · Pro · Experimental
*Origen: 2.9.*
- Seleccionas **clips de 10–60 s**; la app los recorta y comprime en el dispositivo, los envía por el servicio mínimo a un modelo con visión y recibe un análisis **cualitativo y estructurado**: movimiento sin balón, posición y perfilación, decisiones, reacción al fallo, actitud; con marcas de tiempo, qué hiciste bien, qué mejorar y ejercicios del banco para trabajarlo.
- **"Quién eres tú":** dorsal, color y posición + toque sobre el fotograma. La IA puede equivocarse: botón "no soy yo" y confirmación manual.
- Etiqueta visible: *"análisis cualitativo asistido por IA, no una medición"*. Explicación en texto y voz opcional.
- Cupo mensual con medidor de consumo. Privacidad: permiso explícito, clips borrados tras procesar, no se suben videos de terceros o menores sin consentimiento.
- **No se promete** seguimiento automático de jugadores ni mapas de calor automáticos desde video de cámara fija; queda como investigación (P3: estimación de postura en el dispositivo).

### M10 · Centro Táctico (pizarra) — P1 · G (IA: Pro)
*Origen: 3.1–3.4, 3.7.*
- Campo vectorial con zoom y rotación; **22 fichas + balón + conos**; arrastre fluido; ajuste a zonas.
- **Tipos de juego:** fútbol 11, fútbol 7/8 y futsal.
- **Todas las formaciones** (4-4-2, 4-3-3, 4-2-3-1, 4-1-4-1, 4-5-1, 4-4-1-1, 4-3-2-1, 3-5-2, 3-4-3, 3-4-2-1, 5-3-2, 5-4-1, 3-4-1-2, 4-2-2-2…) y editor para crear la tuya.
- **Dibujo (sin saturar la pantalla; las herramientas aparecen según se necesitan):** flecha de pase, carrera sin balón, conducción, pincel, zonas, texto, conos y porterías, balones extra, números y nombres en fichas, borrador, deshacer/rehacer, rejilla de zonas, línea de fuera de juego, regla de distancias, capas.
- **Animación por fotogramas**, velocidad, bucle, **biblioteca de jugadas**, balón parado (córners, tiros libres, saques de banda), exportar imagen o video, compartir.
- **Coach en la pizarra:** gratis, explicaciones de jugadas incluidas; Pro, le cuentas una jugada por texto o voz y te la dibuja, te la explica y te propone variantes.
- Ficha del rival y plan de partido. iPad: modo horizontal, pantalla dividida y Apple Pencil (P2).

### M11 · Simulador de Decisiones — P2 · G (IA: Pro)
*Origen: 3.5, 3.6.*
- Formatos: **foto congelada "¿qué haces?"**, árbol de consecuencias, cronometrado (tiempo de decisión en ms), visto desde tu posición, modo entrenador, y **escenarios propios creados desde la pizarra**.
- Contenido por posición y fase: salida de balón, progresión, finalización, presión tras pérdida, transición defensiva, repliegue, 1v1 defensivo y ofensivo, balón parado, gestión del marcador. Banco inicial de 60–100 escenarios.
- Evaluación objetiva (valor de la zona de destino × probabilidad de éxito), puntuación y rachas, **repetición espaciada de errores**, dificultad adaptativa, explicación local siempre; Pro: la IA genera variantes y explica a fondo.
- Alimenta Visión, Posicionamiento y XP.

### M12 · Mente: Semáforo Cognitivo y Matchday Zen — P2 · G
*Origen: 5.2, 5.3, 5.6.*
- **Semáforo Cognitivo (mi opinión sobre el celular en la mano):** sí hay que sostener el teléfono, por eso es una **sesión corta de 60–90 s**, opcional, parte del calentamiento o del check-in. Tests: reacción simple, go/no-go, visión periférica, Stroop deportivo, seguimiento de objetos, vigilancia de 3 min, escaneo. Línea base personal, dificultad adaptativa, mediana, consistencia, anticipaciones, omisiones y fatiga.
- **Modo "Estímulo reactivo" (nuevo):** el iPhone o iPad apoyado en un cono funciona como **semáforo de entrenamiento**: muestra colores, flechas o números grandes con sonido, y tú corres hacia el cono o la dirección indicada. Sin tocar la pantalla.
- **Matchday Zen:** respiración 4-7-8, resonancia, activación y caja; háptica guiada; audio; visualización guiada; rutina y **palabra ancla**; **botón de reinicio de 30 s** tras un error; test de ansiedad y confianza antes del partido; diario mental.
- **Bienestar mental:** ánimo diario, estrés de estudio o trabajo como carga extra, alertas de sobrecarga y recursos de apoyo según tu país.

### M13 · Coach (texto y voz) — P1 (local) / P2 (IA) · G (local) / Pro (IA)
*Origen: 5.1, 3.3.*
- **Mi opinión (tu duda de 5.1): sí, un solo Coach** que aparece en toda la app —plan, dolor, video, pizarra, nutrición, mente— además de una pestaña de chat. Tiene personalidad elegible (exigente, motivador, científico, calmado).
- **Gratis:** coach local con mensajes por reglas (resumen del día, "qué toca hoy", preguntas frecuentes, explicaciones fijas).
- **Pro:** chat libre con tu contexto resumido, memoria de preferencias en el dispositivo y **acciones con confirmación** (cambiar el plan, crear una rutina, registrar un check-in, abrir la pizarra).
- **Voz:** el coach habla (voz del sistema) y tú le dictas; en "Empezar ejercicio" funciona manos libres ("siguiente", "pausa").
- **Cuándo habla** (configurable y silenciable): mañana, antes de entrenar, antes y después del partido, tras mala racha, recordatorios de hábitos.
- Seguridad: no diagnostica; nunca recomienda dosis de medicamentos; ante señales de crisis emocional muestra recursos de ayuda; aviso claro de que es una IA.
- P3: IA en el dispositivo (Apple Intelligence) para el coach local en equipos compatibles.

### M14 · Sueño — P1 · G
*Origen: 5.4.*
- Registro diario en un toque (horas + calidad); **hora de dormir y despertar elegida por cada persona**; rutina nocturna con recordatorios; deuda de sueño; consejos según tu calendario de partidos; impacto en la Preparación; cuestionario corto de cronotipo; modo noche. P2: lectura automática desde Apple Salud con reloj. No diagnostica trastornos.

### M15 · Nutrición — P2 · G (IA: Pro)
*Origen: 5.5.*
- **Gratis:** guía simple (antes, durante y después del juego, hidratación), **calculadora de calorías y macros** según tu carga y objetivo (ganar masa, mantener, bajar grasa, energía) con fórmula transparente, **registro de comidas** con base de alimentos incluida según tu país (300–500 alimentos comunes), recordatorios de hidratación, lista de compras, información prudente sobre suplementos, restricciones y alergias.
- **Recetas con macros:** biblioteca incluida (40–80 originales en la primera versión) con filtros por tiempo, presupuesto, tipo de dieta y cocina de tu país. Los números los calcula el motor local.
- **Pro:** menús semanales y recetas generadas por IA con **macros verificados por el motor**, sustituciones. P3: estimación por foto de comida (aproximada) y búsqueda en bases abiertas con internet.
- Salvaguardas: no sustituye a un nutricionista; **sin déficit calórico ni pérdida de peso para menores**; sin conteo obsesivo; señales de alerta de trastornos alimentarios.

### M16 · Modo Entrenador (varios jugadores) — P3 · G con límite / Pro
*Origen: 0.6.*
- **Varios jugadores de distintos equipos** en un mismo dispositivo: equipos, perfiles, plan y tarjeta por jugador, partidos, asistencia, resumen de carga del grupo y alertas.
- Etiquetado de partidos del equipo (varios jugadores).
- Compartir a cada jugador un paquete (plan, tarjeta, informe) por AirDrop o mensajes. Sincronización continua entre entrenador y jugadores: requiere servicio (evaluar iCloud/CloudKit o servidor propio).

### M17 · Compartir, Exportar y Respaldo — P1 · G
*Origen: 6.2, 0.5.*
- Tarjeta (imagen y video), informes en PDF (jugador, partido, lesión, ojeadores o entrenador), exportar pizarra, **copia de seguridad y restauración** (archivo o iCloud Drive).
- **Compartir la app con amigos y equipo por ahora:** TestFlight (enlace o invitación).

### M18 · Sistema transversal (diseño y plataforma) — P0 · G
*Origen: 1.5, 2.8, 7.1.*
- **Liquid Glass de iOS 26, nativo y real:** vidrio del sistema, barra de pestañas nativa, iconos SF Symbols, tipografía SF con tamaño dinámico, gestos nativos (volver deslizando, hojas con alturas, menús al mantener pulsado, tirar para actualizar), físicas de resorte, háptica, safe areas, accesibilidad (VoiceOver, texto grande, contraste, "Reducir transparencia" y "Reducir movimiento").
- **Estilo:** base blanca con grises, **acento naranja**; azul solo como apoyo ocasional; minimalista, tranquilo, sin saturar. El vidrio necesita contenido detrás para lucirse sobre blanco (degradados suaves, tarjetas, imágenes): se diseña así a propósito.
- **iPad:** barra lateral, pantalla dividida, teclado y Apple Pencil donde aporte (pizarra y video).
- Notificaciones locales (check-in, hidratación, sueño, plan, racha) con horas de silencio.
- Ajustes: unidades, idioma, háptica, brillo de la tarjeta, sensibilidad de Preparación, datos y privacidad, exportar y borrar todo.
- Privacidad: datos en el dispositivo y cifrados; claves en Keychain; consentimiento explícito para IA; política de privacidad pública.
- Rendimiento: animaciones a 60/120 fps, arranque en menos de 2 s.

### M19 · Cuenta, Suscripción y Servicio de IA — P1 · mínimo
*Origen: 6.6.*
- Sin cuenta obligatoria para lo gratis; identificador anónimo + "Iniciar sesión con Apple" opcional para restaurar entre dispositivos.
- **Suscripción Pro** mensual/anual con compras de Apple (gestor propuesto: RevenueCat), "Restaurar compras", códigos promocionales para amigos y equipo.
- **Federico: Pro permanente** (concesión manual).
- **Servicio de IA mínimo:** guarda las claves (nunca en la app), verifica la suscripción, limita el uso, enruta al proveedor (Gemini o Claude, según la tarea), no guarda contenido.
- **Modo desarrollador:** tu propia clave en Keychain para probar la IA antes de que exista el servicio.
- La app funciona completa en modo gratis sin internet.

---

## 5. Datos (qué guarda la app)

Persona, Equipo, Temporada, Plan, Sesión, Registro de ejercicio, Check-in, Reporte de dolor, Partido, Evento de partido, Clip, Tarjeta, Logro, Misión, Racha, Registro de comida, Registro de sueño, Rutina propia, Jugada de pizarra, Escenario. Todo como **registro de eventos** (cada cosa es un evento que no se edita; lo calculado se deriva), guardado con SQLite + MMKV en el dispositivo, secretos en Keychain, validación con Zod.

---

## 6. Plataforma, pruebas y entrega (sin Mac)

- **Stack:** TypeScript, React Native + Expo (dev client y EAS), Expo Router, Reanimated, Gesture Handler, Skia, `expo-sqlite`, MMKV, Zod. Solo iOS/iPadOS: diseño para iOS 26 con degradación elegante en iOS más antiguos.
- **Estructura del repositorio:** `app` (pantallas), `core` (cálculos puros con pruebas: carga, xG, xT, OVR, planes), `content` (ejercicios, escenarios, alimentos, recetas en archivos de datos), `docs`.
- **Cómo probamos sin Mac:**
  1. Yo verifico aquí tipos, estilo y pruebas automáticas del `core`, y vistas web para el diseño base.
  2. Tú pruebas en tu iPhone/iPad: primero con **Expo Go** (gratis, con limitaciones), luego con **compilaciones reales en la nube (EAS Build) por TestFlight**.
  3. **El vidrio líquido y la háptica solo se pueden juzgar en tu dispositivo:** habrá rondas de prueba tuyas.
- **Requisitos fuera del código (tuyos):** cuenta de Expo (gratis); **Apple Developer Program (≈ US$99/año)**, necesario para TestFlight, para compartir con amigos/equipo y para cobrar suscripciones; GitHub (ya lo tienes).
- **Compartir con amigos y equipo:** TestFlight (invitados internos y externos por enlace, con una revisión breve de Apple para los externos).

---

## 7. Hoja de ruta por hitos (cada uno termina con algo que puedes probar)

| Hito | Contenido | Prioridad |
|---|---|---|
| **H0** Preparación (tú) | Cuenta de Expo, Apple Developer, Expo Go y TestFlight en tu iPhone/iPad, elegir nombre | — |
| **H1** "Mi primer plan" | Base de diseño Liquid Glass, onboarding con cuestionario, plan local, biblioteca inicial, "Empezar ejercicio", temporizadores, check-in simple, racha + XP, tarjeta estática | **P0 = tu MVP (7.4)** |
| **H2** "Juego y cuerpo" | Tarjeta 3D completa, gamificación completa, Preparación completa, dolor y lesiones, sueño | P1 |
| **H3** "Partido" | Etiquetador de video, resultados, xG, mapa de calor, sin balón y mente, exportar | P1 |
| **H4** "Táctica y mente" | Pizarra, simulador, Semáforo Cognitivo, modo reactivo, Zen | P1–P2 |
| **H5** "IA y nutrición" | Servicio de IA, suscripción, coach, plan IA, análisis de video, nutrición completa, modo entrenador básico | P2–P3 |
| **H6** "Lanzamiento" | Pulido, accesibilidad, rendimiento, material para TestFlight / App Store | P1 |

**Con tus 5 días completos:** el objetivo realista es llegar a H1 temprano y a H4 al final; H5 y H6 pueden pasar de la semana. El ritmo lo marcan los ciclos de prueba en tu dispositivo, no solo la escritura de código.

---

## 8. Riesgos y límites honestos

1. **Alcance enorme.** "Todo funcionando" en 5 días con calidad profesional no es realista; por eso hay hitos: siempre habrá algo usable.
2. **Sin Mac.** Los ciclos de prueba son más lentos (compilaciones en la nube con posibles colas) y dependen de la cuenta de Apple de pago.
3. **Contenido.** 300–500 ejercicios con animación original llevan mucho trabajo; la primera versión trae 80–120 y crece por paquetes.
4. **Salud.** Dolor, lesiones y nutrición son sensibles: reglas locales de alerta, avisos, nada de diagnósticos, protecciones para menores.
5. **Video con IA.** Es lo más experimental y lo más caro; análisis cualitativo, no medición; sin seguimiento automático prometido.
6. **Costo de IA.** Hay que cuadrar el precio de Pro con el costo real de las llamadas.
7. **App Store.** Apple revisa con cuidado apps de salud, IA y suscripciones; exige política de privacidad y compras propias de Apple.
8. **Menores.** Consentimientos y límites en IA, fotos y nutrición.
9. **Marcas.** Sin marcas ni escudos de terceros (EA/FUT, clubes).
10. **Vidrio sobre blanco.** Hay que diseñarlo con contenido detrás.
11. **Dependencias.** Las librerías de Expo/React Native cambian rápido; se fijan versiones.

---

## 9. Supuestos que se confirman al aprobar

1. Solo iPhone y iPad (sin Android).
2. Base blanca con grises, acento naranja, azul solo ocasional.
3. Freemium: nada se bloquea tras el cuestionario; Pro = IA; tú gratis.
4. Se acepta el mini-servicio de IA (cambia el "sin servidores" del Prompt 1).
5. Pagarás Apple Developer (≈ US$99/año) cuando toque compartir con amigos.
6. Tu MVP es plan personalizado + ejercicios + "Empezar ejercicio".
7. Video: primero etiquetado manual, luego análisis cualitativo con IA; sin promesa de seguimiento automático.
8. YouTube: botón que abre la búsqueda del ejercicio (sin incrustar).
9. Preparación: caritas de entrada y anillo de salida.
10. OVR con decaimiento suave y capa "Forma".
11. Tu país se pregunta en el cuestionario (afecta nutrición y recursos de ayuda).
12. Nombre de trabajo "Dorsal".

---

## 10. Glosario (en una línea)

- **ACWR:** compara tu carga de los últimos 7 días con la de los últimos 28 para detectar subidas bruscas.
- **RPE:** cuánto esfuerzo sentiste, de 1 a 10.
- **OVR:** tu nota global de tarjeta.
- **xG / xT:** probabilidad de gol de un tiro / valor de una zona del campo para generar peligro.
- **FIFA 11+:** programa de calentamiento diseñado para reducir lesiones.
- **Nordic (isquios):** ejercicio de fuerza excéntrica para prevenir desgarros de isquiotibiales.
- **Copenhagen:** ejercicio para aductores (ingle).
- **Propiocepción:** trabajo de equilibrio para tobillo y rodilla.
- **Pliometría:** saltos y rebotes para ganar potencia.
- **Háptica:** vibraciones finas del iPhone.
- **Parallax / shader:** efecto de profundidad al inclinar / brillo holográfico calculado por la GPU.
- **Expo Go / TestFlight / EAS:** app de pruebas rápidas / app de Apple para probar versiones reales / servicio que compila en la nube.
- **MVP:** la primera versión que ya sirve.

---

## 11. Nombre y eslogan (candidatos; la disponibilidad en App Store y como marca no está verificada)

| Nombre | Eslogan |
|---|---|
| **Dorsal** *(nombre de trabajo)* | Gánate tu número. |
| **Forma** | Tu mejor versión, cada día. |
| **Racha** | Entrena. Repite. Sube. |
| **Zona** | Entra en tu zona. |
| **Mister** | Tu coach de bolsillo. |
| **Pulso** | Siente tu mejor nivel. |

El nombre visible se puede cambiar después; el identificador interno de la app no, por eso conviene elegir antes de la primera compilación para TestFlight.
