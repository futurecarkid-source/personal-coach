# Inventario Funcional Personalizado Definitivo

**Proyecto:** Dorsal *(nombre de trabajo, ver §11)* · **Plataforma:** iPhone + iPad (iOS 26 y 27) · **Documento:** borrador 2, corregido tras la revisión de 8 revisores (2026-10-08) · **Estado:** pendiente de tu aprobación

> Cómo leerlo: las secciones 0 a 11 están en lenguaje simple. Lo técnico está al final, en los **Anexos A y B**, para quien programa.

---

## 0. Resumen en lenguaje simple

Una app de iPhone y iPad que se ve y se siente como parte de iOS 26 (vidrio líquido real, gestos, iconos y animaciones de Apple). Al terminar un cuestionario te arma un **plan de entrenamiento personal**; cada día entras a un **juego** (racha, misiones, premios, tarjeta 3D) que crea disciplina; cuida tu **cuerpo** (carga, dolor, lesiones, sueño, nutrición) y tu **mente** (reflejos, respiración, rutina); y analiza tus **partidos en video**. Lo básico es gratis y funciona sin internet; la IA es la parte de pago, y para ti es gratis.

---

## 1. Qué cambió respecto a la Estrategia Pro Max (Prompt 1)

| Tema | Prompt 1 | Ahora |
|---|---|---|
| Plataformas | iOS + Android con 3 niveles de vidrio | **Solo iPhone y iPad**, con el aspecto de iOS 26 (y 27). Android queda fuera de la primera etapa |
| Aspecto | Oscuro por defecto | **Claro por defecto** (blanco + grises), acento naranja, vidrio líquido real; el modo oscuro sigue al sistema |
| Eje del producto | Herramientas sueltas conectadas | **Plan personal diario + juego** (racha, premios) como motor del hábito |
| Servidores | Ninguno | **Un mini-servicio** (gratis al inicio) para la IA, para dar y verificar el acceso Pro y, más adelante, las suscripciones. De tu teléfono solo sale lo que tú mandas a la IA (texto, fotos o clips que apruebas) y tu identificador de suscripción. Todo lo demás se queda en tu dispositivo |
| Plan por IA | Opcional con tu clave | **Tú pediste un plan de IA para cada usuario.** En la primera versión el plan lo arma un **motor de reglas** (sin IA): es gratis y funciona sin internet. **El plan por IA lo tienes tú desde el hito H2** y todos los Pro desde H5 |
| Modo Partido | Captura en vivo con dos toques | **Etiquetado sobre video grabado**, con postura, actitud y mente. Alcance: todas las acciones |
| Entrenamientos | Banco offline + planificador | **Eje central**: animación, "Empezar ejercicio", plan |
| Módulos nuevos | — | Lesiones con mapa/foto y seguimiento, sueño, nutrición con macros, coach texto/voz, análisis de video con IA, varios jugadores, juego completo |
| Suscripción | No existía | Freemium: gratis para todos, **Pro** de pago, tú gratis |
| Tarjeta | 6 atributos | **16 atributos** + OVR por posición + decaimiento suave (apagado para menores) |
| GPS | Opcional | Opcional, **apagado por defecto** |
| Pruebas | — | Primero en Expo Go (gratis), luego compilaciones reales por TestFlight |
| Sin cambios | — | ACWR, xG/xT, mapa de calor, Zen con háptica, Semáforo Cognitivo, Pizarra de 22 fichas, Simulador |

---

## 2. Lenguaje y tecnología (tu duda del paréntesis)

- **Lenguaje principal: TypeScript** (JavaScript con reglas estrictas) con **React Native + Expo**. Permite usar componentes nativos de iOS —vidrio, pestañas, iconos de Apple, gestos— sin necesitar un Mac.
- **Python no se usa para las pantallas.** No es un lenguaje para programar apps de iPhone. Instagram y Spotify lo usan sobre todo en sus **servidores**; las apps que ves en el teléfono están hechas con herramientas nativas.
- **Swift/SwiftUI** daría lo más nativo posible, pero necesita Mac y Xcode para compilar y probar. Alternativa: **Expo UI** pinta controles reales de SwiftUI desde TypeScript. Y para lo que solo Apple ofrece, se escriben **módulos Swift pequeños** que se compilan en la nube (ver Anexo A).
- **Versión fijada:** Expo SDK 57. No se actualiza durante el proyecto.

---

## 3. Acceso, precios y reglas de negocio

**Principio (tu queja de otras apps): nada se bloquea al terminar el cuestionario.** Lo que cuesta dinero real (las llamadas de IA) es lo que se paga.

| Gratis para todos | Pro (de pago) |
|---|---|
| Cuestionario y **plan personalizado por reglas** | Plan **adaptativo por IA**, que se reajusta cada semana y por conversación |
| Biblioteca de ejercicios, "Empezar ejercicio", temporizadores | Coach con chat libre y voz, con memoria de tu historial |
| Check-in, Preparación, tarjeta 3D, todo el juego | Seguimiento de dolor conversacional por IA |
| Guía de lesiones, reporte de dolor con reglas locales y seguimiento programado | Análisis de video con IA (cupo mensual) |
| Sueño, nutrición base | Menús y recetas por IA (macros calculados por la app) |
| Modo Partido con etiquetado manual, pizarra, simulador, reflejos, Zen | Explicaciones tácticas y escenarios generados por IA |
| Coach local, varios jugadores en un dispositivo, exportar y respaldo | |

- **Tu cuenta: Pro permanente y gratis.** Desde H2 usas la IA mediante un servicio exclusivo para ti.
- Precios y cupos mensuales: por definir con el costo real (el video es lo más caro).
- **Sin muro de pago** al terminar el cuestionario. **Sin compras** para obtener ventajas del juego.

---

## 4. Inventario por módulo

Leyenda: **P0** primera versión (H1) · **P1** siguiente · **P2** después · **P3** experimental / evaluar. **G** gratis · **Pro** de pago. "Origen" indica la respuesta tuya de la que sale cada módulo. Las cantidades (ejercicios, escenarios, logros…) son **metas, no compromisos**.

### M00 · Onboarding y Cuestionario — P0 (corto) / P1 (completo) · G
*Origen: 0.1–0.6, 1.1, 1.3, 1.4, 2.1, 2.4, 2.5, 5.4, 5.5.*
- **Primera pantalla: rango de edad.** Menores: sin IA, sin fotos a la IA, sin nutrición con objetivo de peso y sin compras (ver §5).
- **Aviso de salud + 3–5 preguntas de aptitud** (tipo PAR-Q; la fuente exacta se verifica) antes de entregar el plan.
- **Cuestionario corto (P0):** posición principal y secundarias, **categoría/nivel** (principiante, amateur, semipro, pro, cantera por edades), objetivos (**se pueden elegir varios**), días y tiempo por semana, equipamiento, zonas con molestia, país, y **"¿Tienes Apple Watch, reloj o banda de pulso?"** (solo si respondes Sí se ofrecen las funciones de pulso y Apple Salud).
- **Autoevaluación de los 6 atributos principales (P0).** P1: los 16, tests físicos (sprint, salto), historial de lesiones, sueño, comida y alergias.
- "Scouting inicial": calcula la tarjeta con **atributos estimados** mediante una fórmula local sobre tus respuestas (etiqueta "Estimado"). La IA los refina cuando esté disponible.
- Sin pantalla de pago al final.

### M01 · Plan Personalizado — P0 (reglas) / P1 (completo) · G · IA: Pro
*Origen: 2.4, 6.6, 7.4.*
- **Motor de reglas (gratis, sin internet):** plan de 4 semanas con vistas **Hoy** y **Semana**; adapta a posición, nivel, objetivos, tiempo y equipamiento; **excluye ejercicios** de las zonas con molestia marcadas; progresión con límites.
- **P1:** calendario, ciclo hasta 12 semanas, alrededor de los días de partido, "¿Por qué este plan?", opciones "más corto / más fácil / descanso", reglas por dolor activo y por Preparación (necesitan los módulos M04 y M05).
- **Plan IA (Pro; para ti desde H2):** la IA elige **solo ejercicios que existen en el banco**; una capa de seguridad valida contraindicaciones y límites antes de mostrarse; reajuste semanal por adherencia, check-ins, partidos y dolor; chat para ajustes ("hoy solo tengo 20 min").
- **La app (o la IA) elige los ejercicios y programas de prevención por persona**; tú no tienes que escogerlos.

### M02 · Entrenamientos — P0 (reducido) · G
*Origen: 2.3–2.7, 5.7.*
- **Meta P0:** 20–30 ejercicios, con **una animación reutilizable por patrón de movimiento** (sentadilla, bisagra, zancada, plancha, salto…) y ficha reducida: nombre, series/repeticiones o tiempo, descanso, 3–5 pasos y un error común.
- **Meta P1:** 80–120 ejercicios con ficha completa (objetivo, músculos, equipamiento, nivel, respiración, progresión/regresión, contraindicaciones). **Meta P2:** 300–500, por paquetes. Categorías: prevención, fuerza, potencia/pliometría, velocidad, agilidad, resistencia, movilidad, técnica con balón, coordinación, cabeceo, portero, core, calentamiento, vuelta a la calma, recuperación, rehabilitación. *Tu "todo" (2.7) se entrega por paquetes, no de golpe.*
- **Animaciones:** maniquí vectorial animado, dibujado en el dispositivo (liviano y sin licencias).
- **"Empezar ejercicio" (P0):** pantalla completa estilo apps de fitness de Apple: animación grande, contador de repeticiones o tiempo, cuenta atrás, descanso automático, siguiente/anterior/saltar, pausa, háptica por fase (en iPhone), pantalla siempre encendida y **esfuerzo percibido (RPE) al final**, con XP. **P1:** voz, sustituir ejercicio, registrar peso y repeticiones reales.
- **Video de YouTube (opcional):** botón "Ver explicación" que abre la búsqueda del ejercicio en YouTube (requiere internet). P1: un enlace concreto por ejercicio, curado, cuando esté verificado.
- Rutinas propias, favoritos, historial, búsqueda y filtros. Funciona sin internet (salvo los videos).

### M03 · Temporizadores — P0 (básicos) / P1 (completo) · G
*Origen: 2.6.*
- **P0:** temporizador y **cronómetro normales** (con vueltas), cuenta atrás.
- **P1:** HIIT, Tabata, EMOM, **intervalos personalizados guardables**, descansos y series, **calentamiento guiado**; avisos por háptica (iPhone), sonido y voz. El aviso al terminar con la app en segundo plano se programa como notificación a hora fija.
- **P2:** Live Activity / Isla Dinámica (solo en compilaciones reales).

### M04 · Check-in diario y Preparación — P0 (simple) / P1 (completo) · G
*Origen: 2.8, 5.6.*
- **P0:** check-in de 20–30 s con **caritas (1–10)**; si el cuerpo no está bien, el plan baja a descanso o versión suave. **RPE** con caritas al terminar cada sesión.
- **P1 — Anillo de Preparación (0–100):** palabra y color suave (Listo / Moderado / Descansa), estilo Apple Fitness. "Detalles": carga aguda/crónica (ACWR), monotonía, tendencia, nivel de confianza; los primeros 28 días dice **"Calibrando"**. El ACWR es un **indicador de cambio de carga**, no un predictor de lesiones.
- Sensibilidad ajustable (estricto / equilibrado ★ / permisivo). Menores: topes más bajos y sin comparaciones de peso o cuerpo. **Las alertas de dolor siempre mandan sobre el anillo.**
- Recordatorio diario a la hora que elijas. P2: lectura de Apple Salud (sueño, pulso en reposo, HRV) si respondiste que tienes reloj.

### M05 · Lesiones y Dolor — P1 · G (reglas locales) / Pro (IA conversacional)
*Origen: 2.1, 2.2.*
- **Guía de lesiones comunes** (isquiotibiales, cuádriceps, aductores/pubalgia, rodilla, tobillo, gemelo, Aquiles, cadera, lumbar, hombro, canillas, fascitis plantar, conmoción, dolor en zonas de crecimiento): al tocar una, **explicación breve** (qué es, señales, prevención, cuándo ir al médico), los ejercicios de prevención recomendados y el botón **"Tengo este dolor"** con la zona ya cargada.
- **"Reportar dolor nuevo":** (1) *dónde*: mapa corporal, **foto propia con marcador** o texto/voz; (2) *cómo*: cuándo empezó, causa, tipo, intensidad 0–10, hinchazón, si puedes apoyar o correr; (3) **filtro de alertas rojas con reglas locales, sin IA** (Anexo B); (4) respuesta: primeros pasos prudentes + ajuste automático del plan + (Pro) IA que pregunta y explica, sin diagnosticar y sin recomendar medicamentos ni dosis.
- **Alertas de urgencia** → pantalla de urgencias, sin ejercicios ni chat de IA encima. **Alerta roja** → se bloquea esa zona hasta que indiques "ya me evaluó un profesional" (con fecha).
- **Seguimiento automático:** a las 24, 48 y 72 h y cada semana la app pregunta "¿Te sigue doliendo? ¿Cuánto?", dibuja la evolución, ajusta el plan y avisa si no mejora (dolor ≥ 7/10, sin mejora en 72 h, reaparece 3 veces…).
- **Retorno al juego por fases** (Anexo B): nadie pasa a contacto o competencia sin criterios cumplidos; en lesiones moderadas, recurrentes, de articulación o de cabeza, hace falta confirmación profesional registrada.
- **Fotos:** se quedan en el dispositivo. Si se envían a la IA: pides el permiso en cada ocasión, **se nombra al proveedor**, se ve una vista previa de lo que sale, se recorta a la zona y se quitan ubicación y datos del archivo. Menores: nunca.
- Historial exportable en PDF para fisioterapeuta o médico. Descargos visibles (Anexo B).

### M06 · Identidad: Tarjeta 3D — P0 (estática) / P1 (3D completa) · G
*Origen: 1.1–1.5.*
- **Datos:** nombre o apodo, número, bandera, **posición, categoría**, club con escudo subido por ti, foto (cámara o galería). P2: recorte automático de fondo (necesita un módulo Swift pequeño).
- **16 atributos:** PAC, SHO, PAS, DRI, DEF, PHY + Visión, Mentalidad, Resistencia, Agilidad, Salto, Juego aéreo, Posicionamiento, Disciplina, Pie débil, Técnica. La tarjeta muestra 6 según tu posición; el detalle muestra los 16. **Porteros:** conjunto propio (Reflejos, Estirada, Juego de pies, Posicionamiento, Salidas, Saque…).
- **OVR ponderado por posición** (8 perfiles; tabla de pesos transparente y ajustable).
- **Origen de las cifras (mixto):** estimación inicial por fórmula (y refinada por IA cuando esté), luego se actualiza con partidos, tests y entrenos; puedes **ajustar a mano** dentro de un rango (queda marcado "Ajustado"). La IA propone; el motor valida y limita los números.
- **Decaimiento (sí, suave):** solo condición física, tras 14 o más días sin actividad sin justificación, con piso, sin mensajes de pérdida. No penaliza descansos prescritos ni lesiones. **Apagado para menores.** Una capa aparte, **"Momento" (±5)**, refleja tu racha reciente.
- **Rarezas:** bronce → plata → oro → especial → leyenda.
- **Tarjetas especiales por hitos (meta: 20 o más):** primer gol, hat-trick, asistidor, portería a cero, 10 partidos registrados, racha de 7 / 30 / 100 / 365 días, semana perfecta, plan de 4 / 8 / 12 semanas completado, retorno tras una lesión, mejor partido, reacción mejorada, "mentalidad de acero" (reinicio rápido tras un error), madrugador, mes sin faltar, cumpleaños, fin de temporada…
- **3D (P1):** parallax con la inclinación del dispositivo y brillo holográfico por GPU. **"Brillo del efecto"** (qué tan fuerte brilla y se mueve cuando inclinas el teléfono): Media, con deslizador en Ajustes. La tarjeta respeta "Reducir movimiento" y "Reducir transparencia" con tratamiento propio (no es automático).
- **Diseño:** la tarjeta es **contenido**, con materiales ricos y degradados; el **vidrio líquido se usa en los controles** que flotan sobre ella (así lo pide Apple).
- **Animación de apertura:** al abrir un paquete o subir de nivel **y al abrir la app** (≤ 1,5 s, saltable, no cuenta en el tiempo de arranque, se vuelve sutil después de la primera semana).
- **Compartir:** imagen en alta resolución (P1). Video del efecto: P3. **Historial por temporada.**
- Diseño propio: sin marca, tipografía ni escudos de EA/FUT; sin fotos de terceros.

### M07 · Gamificación ("Modo Juego") — P0 (racha + XP) / P1 (completo) · G
*Origen: 1.6, 6.1, 6.6.*
- **P0:** racha de compromiso y XP.
- **Racha:** cuenta sesión, descanso activo, check-in o recuperación prescrita. **El descanso prescrito o la lesión nunca rompen la racha.** "Congeladores" que se ganan. Menores: la racha cuenta **por semanas**.
- **P1:** niveles y títulos, **misiones** diarias (3), semanales y de temporada (8–12 semanas), recompensas (tarjetas, temas, marcos, insignias, sonidos), cofre diario, logros (meta: 100), combos (calentamiento + sesión + recuperación), retos contra tu "yo del mes pasado", pruebas diarias cortas (reflejos, decisiones), calendario de actividad estilo anillos.
- Ranking con amigos o equipo: P3 (requiere servidor).
- **Diseño responsable:** nada de culpa ni "tu racha está en peligro"; **ninguna recompensa por entrenar con dolor, con alerta roja o con Preparación en rojo**; máximo 1–2 notificaciones al día, silencio nocturno por defecto; **los paquetes no son aleatorios de pago** (si hubiera azar, se declara en la clasificación por edad); sin compras para ganar ventajas.

### M08 · Modo Partido (etiquetador de video) — P1 · G
*Origen: 4.1–4.11, 6.4.*
- **Importar el video** (Fotos o Archivos; partidos de ~10 GB o más, en varias partes): la app guarda **una sola copia controlada**, muestra el espacio disponible y permite borrar el original o conservar solo los clips. Ficha del partido: rival, fecha, competición, marcador, local/visitante, clima, césped o sintético, minutos jugados, sustituciones, cambios de posición.
- **Reproductor de análisis:** velocidad 0,25×–2×, saltos de ±5 y ±10 s, bucle de clip, línea de tiempo con marcas. **Cuadro a cuadro:** requiere un módulo Swift pequeño (P1, a probar). Las marcas se guardan en **segundos** (no en número de cuadro).
- **"Soy yo":** marcas tu dorsal, color de camiseta y posición en un fotograma; es una guía para ti y para el prompt de la IA. **No identifica sola** (con cámaras tácticas los dorsales casi no se leen).
- **Etiquetado con marca de tiempo** con botones grandes (menú radial de vidrio); posición opcional en un minicampo, o por zonas. Deshacer, edición posterior, autoguardado. Alcance: **todas las acciones** (tuyas, del equipo y del rival).
- **Eventos:**
  - *Ataque:* gol, asistencia, tiro a puerta, tiro fuera, tiro bloqueado, pase clave, regate ganado/perdido, centro, desmarque, toque en área, conducción progresiva, ocasión clara creada o fallada.
  - *Pase:* completado, fallido, largo, en profundidad, hacia atrás.
  - *Defensa:* entrada ganada/perdida, intercepción, despeje, bloqueo, recuperación, pérdida, duelo ganado/perdido, duelo aéreo, 1v1 defensivo, presión efectiva.
  - *Portero:* parada, salida, blocaje, despeje de puños, pase con el pie, gol encajado, penalti parado.
  - *Balón parado y disciplina:* córner, tiro libre, penalti, saque de banda, falta cometida/recibida, amarilla, roja, fuera de juego.
  - ***Sin balón y mente:*** movimiento sin balón (ruptura, apoyo, amplitud, cobertura), perfilación corporal (escaneo antes de recibir), postura y lenguaje corporal, **reacción al fallo**, comunicación, esfuerzo de recuperación, calidad de la decisión, **tiempo de reacción** (dos marcas en el video; **resultado aproximado**, con un error de ±2 cuadros) y liderazgo.
- **Resultados:** xG y xA, mapa de calor (de las posiciones etiquetadas), mapa de pases, mapa de tiros con xG, resumen post-partido en formato tarjeta, nota 1–10 y esfuerzo percibido, diario, tendencia por partidos, comparación con tus promedios y con la referencia de tu posición.
- Clips de cada evento (±8 s) y "mejores jugadas"; exportar el video de resumen: P2. **iPad primero:** video grande, paleta lateral y línea de tiempo.
- **GPS** y **pulso:** opcionales, solo si respondiste que tienes reloj, apagados por defecto (P2 / P3).

### M09 · Análisis de video con IA — P2 · Pro · Experimental
*Origen: 2.9, 6.4.*
- **Flujo:** (1) etiquetas el partido en M08; (2) la app te propone **momentos candidatos** a partir de tus marcas; (3) eliges **clips de 10–60 s**; (4) la app los recorta y comprime en el dispositivo, los sube con permiso y recibe un análisis **cualitativo**: movimiento sin balón, posición, perfilación, decisiones, reacción al fallo, actitud; con marcas de tiempo, qué hiciste bien, qué mejorar y ejercicios del banco.
- **Solo Gemini** (acepta video). Claude no acepta video; solo imágenes.
- Etiqueta visible: *"análisis cualitativo asistido por IA, no una medición"*. Explicación en texto y voz opcional. **P1 de este módulo:** prueba con 20 clips que etiquetes tú, para medir cuánto acierta la IA antes de prometer nada; si acierta poco, queda como "resumen del clip y sugerencias".
- **Consentimiento antes de enviar:** confirmas que tienes permiso del equipo o club para analizar ese video; los menores necesitan consentimiento de un adulto; se recomienda enviar recortes centrados en ti.
- Cupo mensual con medidor. Privacidad: el nivel gratuito de Gemini **solo para tus propias pruebas**; para usuarios reales, servicio de pago del proveedor.
- **No se promete** seguimiento automático de jugadores ni mapas de calor automáticos desde video de cámara fija.

### M10 · Centro Táctico (pizarra) — P1 · G · IA: Pro
*Origen: 3.1–3.4.*
- Campo vectorial con zoom y rotación; **22 fichas + balón + conos**; arrastre fluido; ajuste a zonas.
- **Tipos de juego:** fútbol 11, fútbol 7/8 y futsal. **Todas las formaciones** (4-4-2, 4-3-3, 4-2-3-1, 4-1-4-1, 4-5-1, 4-4-1-1, 4-3-2-1, 3-5-2, 3-4-3, 3-4-2-1, 5-3-2, 5-4-1, 3-4-1-2, 4-2-2-2…) y editor para crear la tuya.
- **Dibujo (herramientas que aparecen según se necesitan, sin saturar):** flecha de pase, carrera sin balón, conducción, pincel, zonas, texto, conos y porterías, balones extra, números y nombres, borrador, deshacer/rehacer, rejilla de zonas, línea de fuera de juego, regla de distancias, capas.
- **Animación por fotogramas**, velocidad, bucle, **biblioteca de jugadas**, balón parado, exportar imagen o video, compartir.
- **Coach en la pizarra:** gratis, explicaciones incluidas; Pro, **le cuentas una jugada** por texto o voz y te la dibuja, explica y propone variantes (tú la tienes desde que exista el servicio de IA). También te explica las jugadas que tú dibujes.
- Ficha del rival y plan de partido. iPad: modo horizontal, pantalla dividida y Apple Pencil (dibujo de trazo uniforme, P2; presión, P3).

### M11 · Simulador de Decisiones — P2 · G · IA: Pro
*Origen: 3.5, 3.6.*
- Formatos: **foto congelada "¿qué haces?"**, árbol de consecuencias, cronometrado (tiempo de decisión), visto desde tu posición, modo entrenador, y **escenarios propios creados desde la pizarra**.
- Contenido por posición y fase: salida de balón, progresión, finalización, presión tras pérdida, transición defensiva, repliegue, 1v1 defensivo y ofensivo, balón parado, gestión del marcador. Meta: 60–100 escenarios.
- Evaluación objetiva (valor de la zona de destino × probabilidad de éxito), puntuación y rachas, **repetición espaciada de errores**, dificultad adaptativa, explicación local siempre; Pro: la IA genera variantes y explica a fondo.
- Alimenta Visión, Posicionamiento y XP.

### M12 · Mente: Reflejos (Semáforo Cognitivo) y Matchday Zen — P2 · G
*Origen: 5.2, 5.3, 5.6.*
- **Reflejos (Semáforo Cognitivo) — mi opinión sobre el celular en la mano:** sí hay que sostenerlo, por eso es una **sesión corta de 60–90 s**, opcional, parte del calentamiento o del check-in. Tests: reacción simple, go/no-go, visión periférica, Stroop deportivo, seguimiento de objetos, vigilancia de 3 min, escaneo. Línea base personal y dificultad adaptativa. **Es entrenamiento, no una evaluación clínica**: no detecta conmociones ni sirve para decidir un retorno al juego.
- **Modo "Estímulo reactivo" (nuevo):** el iPhone o iPad apoyado en un cono funciona como **semáforo de entrenamiento**: muestra colores, flechas o números grandes con sonido, y tú corres hacia el cono o dirección indicada, sin tocar la pantalla.
- **Matchday Zen:** respiración 4-7-8, resonancia, activación y caja; háptica guiada **solo en iPhone** (el iPad no tiene motor de vibración; ahí queda visual y sonido); audio; visualización guiada; rutina y **palabra ancla**; **botón de reinicio de 30 s** tras un error; test de ansiedad y confianza antes del partido; diario mental.
- **Bienestar mental:** ánimo diario, estrés de estudio o trabajo como carga extra, alertas de sobrecarga y **recursos de ayuda según tu país** (tabla mantenida y con fecha de verificación; nunca números escritos de memoria).

### M13 · Coach (texto y voz) — P1 (local) / P2 (IA) · G (local) / Pro (IA)
*Origen: 5.1, 3.3.*
- **Mi opinión (tu duda de 5.1): sí, un solo Coach** que aparece en toda la app —plan, dolor, video, pizarra, nutrición, mente— más una pestaña de chat. Personalidad elegible (exigente, motivador, científico, calmado).
- **Gratis:** coach local con mensajes por reglas (resumen del día, "qué toca hoy", preguntas frecuentes, explicaciones fijas).
- **Pro (y tú desde H2):** chat libre con tu contexto resumido, memoria de preferencias en el dispositivo y **acciones con confirmación** (cambiar el plan, crear una rutina, registrar un check-in, abrir la pizarra). Etiqueta permanente "Respuesta generada por IA; puede contener errores y no es consejo médico".
- **Voz:** el coach habla con la voz del sistema (funciona en pruebas rápidas). **Dictarle y comandos manos libres** ("siguiente", "pausa") solo en compilaciones reales (P2); micrófono solo cuando lo uses.
- **Cuándo habla** (configurable y silenciable): mañana, antes de entrenar, antes y después del partido, tras mala racha, hábitos.
- Seguridad: no diagnostica; no recomienda medicamentos ni dosis; ante señales de crisis emocional muestra recursos de ayuda.
- P3: IA en el dispositivo (Apple Intelligence) para el coach local, en equipos compatibles.

### M14 · Sueño — P1 · G
*Origen: 5.4.*
- Registro diario en un toque (horas + calidad); **hora de dormir y despertar elegida por cada persona**; rutina nocturna con recordatorios; deuda de sueño; consejos según tu calendario de partidos; impacto en la Preparación; cuestionario corto de cronotipo; modo noche. P2: lectura desde Apple Salud con reloj. No diagnostica trastornos del sueño.

### M15 · Nutrición — P2 · G (IA: Pro)
*Origen: 5.5.*
- **Mayores de 18 — Gratis:** guía simple (antes, durante y después del juego, hidratación), **calculadora de calorías y macros** según carga y objetivo (ganar masa, mantener, energía; bajar grasa solo con déficit moderado y un piso de energía), **registro de comidas** con base de alimentos según tu país (meta: 300–500), recordatorios de hidratación, lista de compras, información prudente sobre suplementos, restricciones y alergias.
- **Menores de 18:** **sin objetivo de bajar peso o grasa, sin conteo de calorías ni macros, sin gráficos de peso**; solo guía por comidas y platos, hidratación y recetas.
- **Recetas con macros:** biblioteca incluida (meta: 40–80 originales en la primera versión) con filtros por tiempo, presupuesto, tipo de dieta y cocina de tu país. Los números los calcula la app.
- **Pro:** menús semanales y recetas por IA con **macros verificados por la app**, sustituciones. P3: estimación por foto de comida y búsqueda en bases abiertas con internet.
- **Alertas de trastornos alimentarios:** ante señales, la app oculta objetivos y números de comida, no premia entrenar más y te dirige a un profesional y a la línea de ayuda de tu país.
- No sustituye a un nutricionista.

### M16 · Varios jugadores (Modo Entrenador) — P2 · G · sin tope para ti
*Origen: 0.6.*
- **Varios jugadores de distintos equipos en un mismo dispositivo:** equipos, perfiles, plan y tarjeta por jugador, partidos, asistencia, resumen de carga del grupo y alertas. Etiquetado de partidos del equipo.
- Compartir a cada jugador un paquete (plan, tarjeta, informe) por AirDrop o mensajes (archivo).
- **Sincronización continua entre entrenador y jugadores: P3.** No se hará con iCloud/CloudKit porque Apple prohíbe guardar datos de salud personal en iCloud; requeriría servidor propio.
- Para otros usuarios, el límite de jugadores gratis o Pro se define después.

### M17 · Compartir, Exportar y Respaldo — P1 · G
*Origen: 6.2, 0.5.*
- Tarjeta (imagen), informes en PDF (jugador, partido, lesión, ojeadores o entrenador), exportar pizarra.
- **Copia de seguridad = un archivo cifrado que tú guardas donde quieras** (Archivos, AirDrop). **No hay respaldo automático en iCloud con datos de salud** (norma de Apple).
- Compartir la app con amigos y equipo: TestFlight (ver §6).

### M18 · Sistema transversal (diseño y plataforma) — P0 (base) · G
*Origen: 1.5, 2.8, 6.3, 6.5, 7.1.*
- **Liquid Glass de iOS 26 (y 27), nativo y real:** barra de pestañas, cabeceras, botones, hojas y menús del sistema heredan el vidrio; en las piezas propias se usa el vidrio de Expo. Iconos SF Symbols, tipografía del sistema con tamaño dinámico, gestos nativos (volver deslizando, hojas con alturas, menús al mantener pulsado, tirar para actualizar), físicas de resorte, safe areas, VoiceOver, texto grande y contraste. Se respeta el ajuste de iOS Claro/Tintado del vidrio.
- **En iOS anterior a 26:** respaldo con desenfoque estándar.
- **Estilo:** base blanca con grises, **acento naranja**, grafito y un azul profundo solo como apoyo; minimalista, tranquilo, sin saturar. El vidrio necesita contenido detrás para lucirse sobre blanco (degradados suaves, tarjetas, imágenes): se diseña así a propósito.
- **iPhone vs iPad:** háptica **solo en iPhone**. iPad: barra lateral adaptable, pantalla dividida, teclado y Apple Pencil donde aporte.
- Notificaciones locales (check-in, hidratación, sueño, plan, racha) con horas de silencio.
- Ajustes: unidades, idioma, háptica, brillo de la tarjeta, sensibilidad de Preparación, datos y privacidad, exportar y **borrar todo**. Idioma: español primero, inglés después (6.5).
- Metas de rendimiento: animaciones fluidas a 60/120 fps y arranque en pocos segundos (metas, no compromisos).

### M19 · Cuenta, Suscripción y Servicio de IA — P1 (servicio solo para ti, H2) / P2 (suscripciones, H5)
*Origen: 6.6.*
- Sin cuenta obligatoria para lo gratis; identificador anónimo + "Iniciar sesión con Apple" opcional. **Si hay cuenta: botón "Borrar cuenta y datos del servidor"** dentro de la app.
- **H2 — Servicio de IA solo para ti:** guarda las claves de IA (nunca en la app), verifica tu código de acceso, limita el uso, enruta a Gemini o Claude según la tarea y no guarda contenido. Así tienes el plan IA y el coach IA pronto.
- **H5 — Suscripción Pro** mensual/anual con compras de Apple (gestor propuesto: RevenueCat), **"Restaurar compras"** visible, precio y renovación visibles antes de pagar, códigos de oferta para amigos y equipo, y tu acceso Pro permanente. Requiere aceptar el contrato de Apps de pago y completar datos bancarios y fiscales en App Store Connect.
- **Modo desarrollador:** una clave propia en el Keychain para pruebas, **solo en compilaciones de desarrollo** (nunca en TestFlight).
- Cuenta de demostración Pro para la revisión de Apple.
- La app funciona completa en modo gratis sin internet.

---

## 5. Seguridad, salud, menores y App Store (nuevo)

- **Qué es la app:** herramienta de entrenamiento y bienestar; **no diagnostica ni trata**. Se evitan en la tienda palabras como "diagnóstico", "tratamiento" o "terapia".
- **Descargos en el lugar de uso** (no solo en la política): al empezar, al reportar dolor, ante alerta roja, bajo cada respuesta de IA, en nutrición, al enviar fotos a la IA y en funciones para menores (Anexo B).
- **Antes de publicar**, revisión por un **fisioterapeuta o médico deportivo** (alertas, fases de retorno), un **nutricionista deportivo** (umbrales de menores) y un **abogado** (política de privacidad, consentimiento por país). Las reglas y textos viven en archivos de contenido con fecha y fuente.
- **Menores de edad:** no se inscribe en la categoría Infantil de Apple. Para menores: sin IA con fotos o video, sin nutrición con objetivo de peso ni conteo de calorías, sin compras, sin decaimiento ni "Momento", racha por semanas, sin notificaciones entre las 21:00 y las 07:00 por defecto, sin rankings públicos, sin chat entre usuarios. La edad de consentimiento depende del país (13 a 16): si no se puede determinar, se aplica la más alta. Se responde con exactitud el cuestionario de clasificación por edad de Apple (incluye chatbot de IA y, si hay azar en los paquetes, esa categoría).
- **Privacidad:** el contenido que vaya a la IA se envía solo con tu permiso, nombrando al proveedor, con vista previa. Los datos de salud no se usan para publicidad ni se guardan en iCloud. Política de privacidad en una dirección web estable **antes del primer TestFlight externo**. Etiqueta de privacidad de la App Store con los proveedores nombrados.
- **Notas para el revisor de Apple:** explican que la app no diagnostica, las reglas locales de alerta y cómo probar la IA con la cuenta de demostración.

---

## 6. Cómo se construye, se prueba y se comparte (sin Mac)

**Escalera de pruebas**
1. **Expo Go (gratis):** sin pagar a Apple, en tu iPhone y iPad. Permite juzgar el **vidrio líquido**, la **háptica (iPhone)**, la base de datos, las notificaciones locales, el video y la voz del coach (hablar). Limitación: solo abre la última versión de Expo Go de la App Store, y **hay información contradictoria sobre si hoy abre nuestra versión (SDK 57)**: se comprueba en tu iPhone el primer día. Si no abriera, plan B: una Expo Go propia por TestFlight (requiere el pago de Apple).
2. **Compilaciones reales por TestFlight (requiere Apple Developer de pago):** necesarias para dictado de voz, compras reales, Apple Salud, módulos Swift propios (cuadro a cuadro, recorte de fondo), widgets y Live Activities.
3. **Cuota gratuita de compilación en la nube:** unas **15 compilaciones de iOS al mes**, en cola de baja prioridad. Para no gastarlas, los cambios de pantalla y lógica se publican como **actualizaciones** (sin recompilar); solo se recompila cuando cambia el código nativo.
4. **Compartir:** TestFlight permite hasta **100 testers internos** (personas que aceptan una invitación como usuarios del equipo de App Store Connect; sin revisión) y hasta **10.000 externos** por correo o enlace público (el primer build de cada versión pasa por una revisión de Apple sin plazo garantizado). Cada build caduca a los 90 días.

**Quién hace qué:** yo escribo el código y lo verifico aquí (tipos, estilo, pruebas automáticas). Las compilaciones las lanzo yo desde la nube, con una llave de acceso que tú configuras en los ajustes del entorno (nunca en el chat). El **vidrio, la háptica y el iPad solo se juzgan en tus dispositivos**: habrá rondas de prueba tuyas.

**Lista H0 (para ti, todo desde el iPhone o iPad):**
1. **Inscríbete hoy en el Apple Developer Program (~US$99/año).** La aprobación puede tardar de horas a varias semanas; usa tu nombre legal exacto y activa la verificación en dos pasos.
2. Crea tu **cuenta gratuita de Expo** (expo.dev), instala **Expo Go** e inicia sesión; instala **TestFlight**.
3. **Ajusta el acceso de red del entorno:** hoy el entorno bloquea `api.expo.dev` y los servidores de Apple. En el menú del entorno en la nube (barra de título de la sesión → Editar → Network access), permite al menos los dominios de Expo y de Apple App Store Connect (lista exacta en el Anexo A).
4. Crea un **token de acceso de Expo** (expo.dev → Configuración → Access tokens) y guárdalo en los ajustes del entorno como secreto (nunca en el chat); te diré el nombre exacto de la variable.
5. Elige el **nombre** (por defecto, Dorsal) antes de la primera compilación: el identificador interno de la app no se puede cambiar después.
6. Más adelante (H5): contrato de Apps de pago y datos bancarios y fiscales.
- **Primer inicio de sesión de Apple:** generar los certificados la primera vez puede requerir tu Apple ID con verificación en dos pasos en una sesión supervisada. **Nunca me pases tu contraseña por el chat.** Se acordará el método seguro en H0 (idealmente con una llave de API de App Store Connect).

---

## 7. Hoja de ruta por hitos

Cada hito termina con algo que puedes probar. **"Hito principal" = donde se entrega el módulo; entre paréntesis, dónde se completa.**

| Hito | Módulos | Prioridad |
|---|---|---|
| **H0** Preparación (tú) | Lista H0 de §6 | — |
| **H1a** "Mi primer plan" | M00 corto · M01 por reglas · M02 reducido · M03 básico · M18 base | **P0 = tu MVP (7.4)** |
| **H1b** "Mi juego" | M04 simple · M06 tarjeta estática · M07 racha + XP | P0 |
| **H2** "Cuerpo y plan IA para ti" | M04 completo · M05 · M14 · M17 · M13 local + IA para ti · M19 (servicio solo para ti) · (completa M03, M06 3D, M07, M01 con IA) | P1 |
| **H3** "Partido" | M08 | P1 |
| **H4** "Táctica y mente" | M10 · M11 · M12 · M16 (varios jugadores en un dispositivo) | P1–P2 |
| **H5** "Pro y nutrición" | M19 (suscripciones) · M15 · M09 (experimental) | P2–P3 |
| **H6** "Lanzamiento" | Pulido, accesibilidad, rendimiento, material para TestFlight y App Store | P1 |

**Con tus 5 días completos:** meta realista (es una estimación, no una promesa) → **H1a y H1b funcionando de verdad** y **gran parte de H2** en tu iPhone; H3 en curso. **H4 a H6 llegan después.** El ritmo lo marcan los ciclos de prueba en tu dispositivo, la aprobación de Apple y tu cuota de uso, no solo la escritura de código. Lo no terminado al día 5 se entrega como maqueta marcada como tal, nunca como función falsa.

---

## 8. Riesgos y límites honestos

1. **Alcance enorme.** "Todo funcionando" en 5 días con calidad profesional no es realista; hay hitos para que siempre haya algo usable.
2. **Sin Mac.** Ciclos de prueba más lentos y dependencia de la cuenta de pago de Apple (cuya aprobación puede tardar).
3. **Entorno bloqueado.** Sin abrir el acceso de red a Expo y Apple, no puedo lanzar compilaciones (H0, punto 3).
4. **Expo Go.** Su disponibilidad para nuestra versión no está confirmada; se comprueba el primer día.
5. **Contenido.** 300–500 ejercicios animados llevan mucho trabajo; P0 trae 20–30.
6. **Salud.** Dolor, lesiones y nutrición son sensibles: reglas locales, descargos, revisión profesional antes de publicar.
7. **Video con IA.** Experimental y caro. Solo Gemini. Primero se mide cuánto acierta.
8. **Costo de IA.** Hay que cuadrar el precio de Pro con el costo real; cupos por usuario.
9. **App Store.** Revisión estricta de apps de salud, IA y suscripciones; privacidad, borrado de cuenta y restaurar compras son obligatorios.
10. **Menores.** Reglas más estrictas por ley y por Apple.
11. **Marcas.** Sin marcas ni escudos de terceros (EA/FUT, clubes).
12. **Vidrio sobre blanco.** Se diseña con contenido detrás.
13. **Versiones.** Se fija Expo SDK 57; no se migra a la 58 durante el proyecto.
14. **iPad.** No tiene vibración: la háptica es solo del iPhone.

---

## 9. Decisiones delegadas y supuestos que se confirman al aprobar

**Decisiones que dejaste en mis manos**

| Tu respuesta | Mi decisión | Motivo |
|---|---|---|
| 1.5.2 "No sé qué significa" (intensidad del brillo) | Media por defecto, con deslizador | Se ve bien sin marear |
| 1.5.6 "No entendí" (reducir movimiento) | Se respeta el ajuste del sistema | Es accesibilidad de iOS |
| 1.5.7 "No sé" (exportar imagen/video) | Imagen sí (P1), video después (P3) | El video del efecto no tiene solución integrada |
| 2.3 "No entendí" (programas de prevención) | La app/IA los elige por persona, con explicación | No tienes que decidirlo |
| 2.8 (semáforo/caritas) | Caritas para entrar, anillo para ver | Más elegante y claro |
| 5.1 / 5.2 ("qué opinas") | Un solo Coach; Reflejos como sesión corta + modo reactivo | Ver M13 y M12 |
| 7.2 "No sé" (prioridades) | Plan → ejercicios → check-in → juego → tarjeta → dolor → partido → táctica → mente → nutrición | Ver §7 |
| 7.3 "No la he revisado bien" | **Pendiente: revísalo al aprobar** | — |

**Supuestos (se confirman con tu aprobación)**
1. Solo iPhone y iPad (sin Android).
2. Base blanca con grises, acento naranja, grafito y azul profundo solo como apoyo. Modo oscuro automático.
3. Freemium: nada se bloquea tras el cuestionario; Pro = IA; tú gratis.
4. En la primera versión el plan lo arma un motor de reglas; **la IA llega para ti en H2** y para todos en H5.
5. Se acepta el mini-servicio de IA (cambia el "sin servidores" del Prompt 1).
6. Pagarás Apple Developer (~US$99/año) y lo iniciarás hoy.
7. Tu MVP es plan personalizado + ejercicios + "Empezar ejercicio".
8. Video: primero etiquetado manual; luego análisis cualitativo con IA, sin promesa de seguimiento automático.
9. YouTube: botón que abre la búsqueda del ejercicio; enlaces curados después.
10. OVR con decaimiento suave y capa "Momento"; apagados para menores.
11. Tu país se pregunta en el cuestionario.
12. Nombre de trabajo "Dorsal".
13. Varios jugadores en un solo dispositivo (H4); sincronización entre dispositivos queda para después.

---

## 10. Glosario (en una línea)

- **ACWR:** compara tu carga de los últimos 7 días con la de los últimos 28 para detectar subidas bruscas.
- **RPE:** cuánto esfuerzo sentiste, de 1 a 10.
- **OVR:** tu nota global de tarjeta.
- **xG / xT:** probabilidad de gol de un tiro / valor de una zona del campo para generar peligro.
- **FIFA 11+:** programa de calentamiento diseñado para reducir lesiones.
- **Nordic (isquios):** ejercicio de fuerza para prevenir desgarros de isquiotibiales. **Copenhagen:** ejercicio para aductores (ingle). **Propiocepción:** equilibrio de tobillo y rodilla. **Pliometría:** saltos y rebotes para ganar potencia.
- **Háptica:** vibraciones finas del iPhone.
- **Parallax / shader:** efecto de profundidad al inclinar / brillo holográfico calculado por la GPU.
- **Expo Go / TestFlight / EAS:** app de pruebas rápidas / app de Apple para probar versiones reales / servicio que compila en la nube.
- **Keychain:** caja fuerte del iPhone para claves y contraseñas.
- **Microciclo:** la organización de una semana de entrenamiento alrededor del partido.
- **Monotonía:** qué tan parecidos son tus días de carga (muy parecidos = más riesgo).
- **Live Activity:** información en vivo en la pantalla bloqueada y en la Isla Dinámica.
- **Beta App Review:** la revisión de Apple para probadores externos.
- **MVP:** la primera versión que ya sirve.

---

## 11. Nombre y eslogan (candidatos; la disponibilidad en App Store y como marca no está verificada)

| Nombre | Eslogan |
|---|---|
| **Dorsal** *(nombre de trabajo)* | Gánate tu número. |
| **Racha** | Entrena. Repite. Sube. |
| **Zona** | Entra en tu zona. |
| **Mister** | Tu coach de bolsillo. |
| **Pulso** | Siente tu mejor nivel. |
| **Forma** | Tu mejor versión, cada día. *(coincide con la palabra "forma" de la app; por eso la capa interna se llama "Momento")* |

El nombre visible se puede cambiar después; el identificador interno no. Conviene elegir antes de la primera compilación para TestFlight.

---

# Anexo A · Técnico (para el desarrollador)

**Versiones verificadas el 2026-10-08 (instalar siempre con `npx expo install`)**
- Expo SDK 57 (`expo` 57.0.27), React Native 0.86.3, React 19.2.3, `react-native-reanimated` 4.5.1 + `react-native-worklets` 0.10.1, `react-native-gesture-handler` ~2.32.0, `@shopify/react-native-skia` 2.6.2, `expo-router` ~57.0.25, `expo-glass-effect` ~57.0.4, `expo-haptics` ~57.0.3, `expo-symbols` 57.0.3 (beta), `@expo/ui` ~57.0.22, `expo-secure-store` ~57.0.4, `expo-notifications` ~57.0.22. La New Architecture es la única desde SDK 55. Mínimo de iOS: 16.4. SDK 58 está en beta (exige iOS 27 para UIScene): **no migrar**.
- Apple exige compilar con el SDK de iOS 26 desde el 2026-04-28 y con el de iOS 27 desde abril de 2027; las imágenes de EAS lo cumplen. iOS 27 se publicó el 2026-09-14.

**Stack**
- TypeScript estricto, Expo Router, Reanimated, Gesture Handler, Skia, Zod. **Almacenamiento: `expo-sqlite` (incluye `expo-sqlite/kv-store`)**; se **descarta MMKV** (no corre en Expo Go; exige compilación nativa) para simplificar. Secretos en `expo-secure-store`. Registro de eventos inmutable; lo calculado se deriva.
- Estructura: `app` (pantallas), `core` (cálculos puros con pruebas: carga, xG, xT, OVR, planes), `content` (ejercicios, escenarios, alimentos, recetas, alertas y recursos de ayuda en archivos con fecha y fuente), `docs`.
- Pruebas en Linux: `tsc`, `npx expo lint`, Jest con `jest-expo` + `@testing-library/react-native` (no `react-test-renderer`; los tests fuera de la carpeta `app/`), vista web con `npx expo start --web` y Playwright.

**Liquid Glass y UI (hallazgos)**
- Solo las piezas respaldadas por UIKit heredan el vidrio (NativeTabs, cabeceras y botones del native stack, `formSheet`, menús, `RefreshControl`, alertas). Lo dibujado en JS o Skia no. Para piezas propias: `GlassView` / `GlassContainer` de `expo-glass-effect` (solo iOS 26+; en versiones anteriores cae a una vista normal, así que se usa `isLiquidGlassAvailable()` y un respaldo con `BlurView`; `opacity: 0` desactiva el vidrio; llamar antes a `isGlassEffectAPIAvailable()`).
- **NativeTabs** está en estado **alpha** en SDK 54–57 (`expo-router/unstable-native-tabs`; estable en SDK 58) y no admite pestañas dinámicas ni anidadas. Su funcionamiento en Expo Go no está verificado: probar el primer día. En iPad hace falta `sidebarAdaptable`.
- **Expo UI** (`@expo/ui/swift-ui`): controles SwiftUI reales desde TypeScript, estable desde SDK 56 y disponible en Expo Go.
- Reglas de Apple: vidrio solo en la capa de controles y navegación, no en el contenido; con moderación, sin apilar vidrio sobre vidrio. Sobre fondos blancos lisos apenas se distingue: dar contenido detrás.
- Accesibilidad: "Reducir movimiento" es automático solo en animaciones `withTiming`/`withSpring` de Reanimated; el parallax por sensor y los shaders de Skia se manejan a mano (`AccessibilityInfo.isReduceMotionEnabled`, `isReduceTransparencyEnabled`). Claro/Tintado (iOS 26.1) y el control de transparencia (iOS 27) los elige el usuario.
- `app.json`: `ios.supportsTablet: true`, `userInterfaceStyle: "automatic"`, `ios.requireFullScreen: false`, `orientation: "default"`; `ThemeProvider` alrededor de la app para el modo oscuro; evaluar `UIDesignRequiresCompatibility` solo como salida de emergencia.
- Parallax: usar la **orientación** del dispositivo (`DeviceMotion.rotation` de `expo-sensors` o `useAnimatedSensor(SensorType.ROTATION)` de Reanimated), no el giroscopio crudo (mide velocidad angular).
- Háptica: `impactAsync`, `notificationAsync`, `selectionAsync`; no hay háptica continua; **el iPad no vibra**. Opcional: `react-native-pulsar` (compilación nativa) para patrones más ricos en Zen.
- 120 Hz: comprobar en dispositivo (puede requerir `CADisableMinimumFrameRateDuration`).

**Módulos nativos propios previstos (Swift, Expo Modules API, se compilan en EAS; no corren en Expo Go)**
1. Cuadro a cuadro de video (`AVPlayerItem.step(byCount:)`).
2. Recorte de fondo de la foto (Vision, `VNGenerateForegroundInstanceMaskRequest`, iOS 17+).
3. Recorte/compresión de clips (`AVAssetExportSession`; `ffmpeg-kit` está retirado).
4. Opcionales: presión del Apple Pencil, grabación de video de la tarjeta, estimación de postura (Vision).

**Video**
- `expo-video`: usar `player.currentTime = t ± n` para los saltos (`seekBy` es impreciso); miniaturas con `generateThumbnailsAsync` bajo demanda (`expo-video-thumbnails` está en desuso). Videos de iPhone pueden ser HEVC/VFR: medir con tiempos de presentación.
- Importar: el selector de Fotos entrega un archivo temporal; copiar una sola vez al contenedor de la app (clon APFS barato). Veo entrega MP4 del *follow-cam* (~7,5 GB/h, estimación).
- Gemini: 263 tokens/s de video, 1 fps por defecto (un clip de 60 s ≈ 15,8 mil tokens); File API 2 GB por archivo. El nombre del modelo se lee de configuración remota (cambia rápido). Subida directa con URL firmada (no por el Worker).
- Tiempo de reacción por video: ±1 cuadro por marca (33 ms a 30 fps).

**IA, servicio y suscripciones**
- Servicio: Cloudflare Workers (plan gratis: 100 mil solicitudes/día, 10 ms de CPU). La app envía un token firmado; el Worker consulta el entitlement `pro` por REST de RevenueCat (caché corta), aplica límite por usuario (binding Rate Limiting) y reenvía con la clave como secreto. Nunca confiar en un "es_pro" que mande la app.
- Precios por millón de tokens (entrada/salida): Claude Haiku 5.5 US$0,10/0,50 · Sonnet 5.5 US$2/10 · Opus 5.5 US$4/20; caché de lectura 0,1× (0,05× en Sonnet y Opus 5.5); Batch −50%. Gemini 3 Flash (preview) US$0,50/3. Video por clip de 60 s: ~US$0,005–0,015 (estimación propia).
- El nivel gratuito de Gemini puede usar los datos para mejorar productos: solo para tus pruebas con datos propios. Usuarios reales: nivel de pago o Claude.
- RevenueCat: gratis hasta US$2.500 de ingresos mensuales rastreados, luego 1%. Acceso permanente: entitlement promocional "lifetime". Compras reales exigen compilación nativa (en Expo Go solo vista previa). Apple Small Business Program: comisión 15% si se inscribe.
- Apple: Restore Purchases obligatorio; suscripciones de al menos 7 días; borrado de cuenta si hay cuenta; Sign in with Apple opcional; Offer Codes para regalar Pro.
- EAS gratis: 15 builds de iOS al mes; EAS Update para cambios de JS. Credenciales: `EXPO_TOKEN`; llave de App Store Connect API (desde eas-cli 20.2.0 permite compilaciones no interactivas; la primera generación de certificados puede pedir login de Apple).
- **Dominios a permitir en el entorno (mínimo, a confirmar):** `api.expo.dev`, `expo.dev`, `docs.expo.dev`, `u.expo.dev`, `api.appstoreconnect.apple.com`, `appstoreconnect.apple.com`, `idmsa.apple.com`, `developer.apple.com`, `developerservices2.apple.com`, `api.cloudflare.com`, `api.revenuecat.com`.
- Alternativa sin abrir red: GitHub Actions con `eas update` y el secreto `EXPO_TOKEN`.

**Extras de iOS**
- Widgets y Live Activities: `expo-widgets` (estable desde SDK 56) o `@bacons/apple-targets`; solo en compilaciones. App de Apple Watch propia: P3 (Swift aparte). Apple Salud: `@kingstinct/react-native-healthkit` (compilación nativa; solo lectura; datos agregados a la IA, nunca crudos). Dictado: `expo-speech-recognition` (comunitario; compilación nativa; revisar idiomas y modo sin conexión). Voz del coach: `expo-speech`. Apple Intelligence (Foundation Models): P3, depende de dispositivo, idioma y activación. CloudKit con compartición entre usuarios: descartado (módulo propio + norma de Apple sobre salud). Pencil: llega como toque normal; presión requiere código nativo.

**Datos (entidades)**
Persona, Equipo, Temporada, Plan, Sesión, Registro de ejercicio, Check-in, Reporte de dolor, Partido, Evento de partido (tiempo en segundos), Clip, Tarjeta, Logro, Misión, Racha, Registro de comida, Registro de sueño, Rutina propia, Jugada de pizarra, Escenario.

---

# Anexo B · Reglas de seguridad (borrador; **requiere revisión de un profesional humano antes de publicar**)

**Mensaje base de las alertas:** "Estas señales justifican que te evalúe un profesional. Esto no es un diagnóstico."

**Reglas locales de alerta (sin IA)**
- **R1 Urgencias inmediatas:** deformidad visible, hueso expuesto, miembro frío/pálido/azulado o sin pulso, pérdida de sensibilidad o fuerza repentina, dolor intenso que no cede, sospecha de lesión de cuello o columna tras un impacto, dificultad para respirar o dolor en el pecho.
- **R2 Tobillo/pie (inspirada en las reglas de Ottawa):** dolor en la zona de los maléolos más dolor al presionar el borde posterior o la punta del maléolo interno o externo, o no poder dar 4 pasos seguidos (justo después y ahora); dolor en el mediopié más dolor al presionar el escafoides o la base del quinto metatarsiano → consulta para evaluar posible fractura.
- **R3 Rodilla (inspirada en Ottawa):** tras un golpe, si hay edad ≥ 55, dolor al presionar solo la rótula o la cabeza del peroné, no poder flexionar la rodilla a 90° o no poder dar 4 pasos → consulta. Además: chasquido o bloqueo, sensación de que se sale, hinchazón inmediata tras un giro.
- **R4 Articulación/hueso:** no poder apoyar, hinchazón grande en menos de 2 h, moretón extenso, dolor puntual al presionar hueso, sensación de "crack" → consulta y no entrenar esa zona.
- **R5 Músculo:** sensación de desgarro con "pelotazo", hueco palpable, incapacidad de contraer, hematoma grande → consulta.
- **R6 Lumbar (prioridad alta):** dolor lumbar o ciática con entumecimiento en la entrepierna, genitales o glúteos, pérdida de control o retención de orina o heces, debilidad o entumecimiento que empeora en una o ambas piernas, ciática en ambas piernas → **urgencias el mismo día**.
- **R7 Lumbar (consulta pronta):** trauma importante reciente, fiebre o malestar general, antecedente de cáncer o pérdida de peso sin explicación, uso de corticoides o inmunosupresores, dolor en reposo o nocturno constante, dolor lumbar persistente en adolescente deportista. Solo "consulta", nunca diagnóstico.
- **R8 Cabeza/conmoción (consenso de Ámsterdam 2022):** golpe en cabeza, cara o cuello, o golpe al cuerpo que sacude la cabeza, con cualquier síntoma (dolor de cabeza, mareo, confusión, visión borrosa, náuseas, sensibilidad a luz o ruido, sentirse "raro") → parar de inmediato, no volver a jugar ni entrenar ese día, no quedarse solo y evaluación médica. **Urgencias** si hay pérdida de conciencia, convulsión, dolor o sensibilidad en el cuello, dolor de cabeza intenso o creciente, vómitos repetidos, confusión o somnolencia creciente, visión doble o pérdida de visión, debilidad u hormigueo en brazos o piernas, o agitación creciente.
- **R9 Sistémicas:** fiebre con dolor articular o muscular, articulación caliente, roja e hinchada, dolor de pantorrilla con hinchazón y calor, dolor en el pecho, desmayo o palpitaciones durante el esfuerzo → urgencias o consulta.
- **R10 Persistencia:** dolor ≥ 7/10 en cualquier momento, que no mejora en 72 h, que empeora en 24–48 h o que reaparece 3 veces en la misma zona → consulta antes de volver a cargar la zona.
- **R11 Estrés repetido:** dolor localizado en hueso que aparece al saltar o correr y no cede con 1–2 semanas de descanso → consulta (posible lesión por estrés).
- Las banderas rojas de lumbalgia tienen evidencia débil de exactitud; por eso solo producen "consulta". Las reglas de Ottawa son ayudas clínicas: la app nunca dice "tienes/no tienes fractura".

**Retorno al juego por fases (orientativo; marco: continuo de retorno al deporte, consenso 2016)**
- **F1 Control del dolor:** dolor en reposo ≤ 2/10, hinchazón estable o decreciente, camina sin cojera.
- **F2 Movilidad:** rango casi simétrico con el lado sano, sin dolor al final del rango.
- **F3 Fuerza:** fuerza y control cercanos al lado sano (referencia habitual ~90%, valor convencional), sin dolor en pruebas de carga básica.
- **F4 Carrera:** trote sin dolor ni cojera; una variable a la vez.
- **F5 Cambios de dirección y salto:** aterrizajes y cortes controlados, sin dolor ni inestabilidad.
- **F6 Contacto:** entrenamiento de equipo sin contacto, luego contacto progresivo.
- **F7 Competencia:** partidos por minutos limitados.
- Reglas: se pasa de fase solo si el dolor durante y 24 h después es ≤ 2/10 y no hay más hinchazón; si empeora, se retrocede una fase; **el tiempo mínimo de cada tejido lo define el profesional, no la app**; lesiones con alerta roja, recurrentes, de cabeza o de articulación grande exigen autorización profesional registrada. La confianza y el miedo a relesionarse cuentan como criterio.

**Descargos propuestos**
- **D1 (primera apertura):** "Dorsal es una herramienta de entrenamiento y bienestar. No es un dispositivo médico, no diagnostica ni trata lesiones o enfermedades y no reemplaza a un médico, fisioterapeuta o nutricionista. Consulta a un profesional antes de empezar o cambiar tu entrenamiento, sobre todo si tienes una lesión, una condición médica o eres menor de edad."
- **D2 (reportar dolor):** "Esto te ayuda a decidir próximos pasos, no es un diagnóstico. Si el dolor es fuerte, no mejora o tienes alguna de estas señales, busca atención presencial."
- **D3 (alerta roja):** "Por lo que cuentas, te recomendamos que te evalúe un profesional (urgencias si [señal]). No entrenes esa zona hasta entonces. En una emergencia llama al número de emergencias de tu país."
- **D4 (cada respuesta de IA):** "Respuesta generada por IA. Puede contener errores y no es consejo médico."
- **D5 (nutrición):** "Orientación general de alimentación deportiva; no sustituye a un nutricionista. Si estás preocupado por tu peso o tu relación con la comida, habla con un profesional."
- **D6 (foto/IA):** "Vas a enviar esta imagen a [proveedor] para que la IA la analice. Se envía sin ubicación ni datos del archivo, [no se guarda / se guarda X días]. Puedes cancelar."
- **D7 (menores):** "Esta función requiere el permiso de un padre, madre o tutor."
- Los descargos no sustituyen a las salvaguardas reales: Apple y los reguladores miran el comportamiento de la app.
