# Feynman Quest — Propuesta de producto

**Versión:** 0.1  
**Concepto:** Juego educativo híbrido (puzles casuales + aprendizaje avanzado de física de partículas)  
**Plataforma inicial propuesta:** Móvil, en orientación vertical

> **Aprende el lenguaje del universo, una interacción cada vez.**

## Resumen ejecutivo

**Feynman Quest** es un juego de puzles sobre física de partículas que comienza siendo accesible y evoluciona hacia un laboratorio de diagramas de Feynman. El jugador aprende haciendo: primero reconoce símbolos, después interpreta interacciones y finalmente construye diagramas, detecta errores y descubre por qué determinados procesos son posibles o imposibles.

| Dimensión | Propuesta |
|---|---|
| Público | Adolescentes desde aproximadamente 14 años, adultos curiosos y estudiantes de física |
| Sesiones | Desafíos breves de 2–5 minutos |
| Mecánicas principales | Decode, Build y Debug |
| Primera campaña | 24 niveles distribuidos en cinco capítulos |
| Progresión | De reconocimiento visual a interpretación y construcción de diagramas |
| Profundidad | Capas intuitiva, científica y matemática opcional |

## 1. Bucle principal de juego

Cada nivel presenta un pequeño misterio científico. El jugador interactúa con un diagrama, resuelve el desafío y recibe una explicación visual de lo que acaba de descubrir.

1. **Observa:** ¿Qué sucede en este diagrama?
2. **Experimenta:** Selecciona, conecta o modifica partículas.
3. **Comprende:** Descubre por qué tu solución funciona o falla.
4. **Progresa:** Desbloquea nuevas interacciones y desafíos.

El objetivo es que el aprendizaje ocurra mediante acciones significativas, no solo respondiendo cuestionarios.

### 1.1 Decode — Descifra el diagrama

El jugador recibe un diagrama y debe interpretarlo: identificar partículas, distinguir líneas internas y externas, contar interacciones o determinar qué proceso representa.

**Ejemplo:** «¿Qué partícula se intercambia entre estos dos electrones?»

### 1.2 Build — Construye la interacción

El jugador recibe las partículas iniciales y finales y debe conectarlas mediante vértices y líneas compatibles con las reglas de la teoría.

**Ejemplo:** «Construye un diagrama de primer orden no nulo para la dispersión de dos electrones».

### 1.3 Debug — Encuentra el error

Se presenta un diagrama con un problema físico o de notación. El jugador debe encontrarlo y corregirlo, aprendiendo de la explicación del motor de validación.

**Ejemplo:** «Este vértice QED conecta dos electrones y dos fotones. ¿Qué tiene de incorrecto como vértice fundamental?»

Las tres mecánicas se alternan y combinan en los capítulos para evitar que la experiencia se reduzca a un test de respuestas múltiples.

## 2. Un mismo juego, tres niveles de profundidad

En lugar de separar el juego en versiones fácil y difícil, cada desafío ofrece tres capas de explicación:

### 2.1 Intuitiva

**Pregunta:** «¿Qué estoy viendo?»

**Explicación de ejemplo:** «Dos electrones interactúan electromagnéticamente. El diagrama muestra una contribución a esa interacción mediante el intercambio de un fotón virtual».

### 2.2 Científica

**Pregunta:** «¿Qué significa físicamente?»

**Explicación de ejemplo:** «Es un diagrama de dispersión electrón-electrón (Møller) de orden árbol. Presenta dos vértices QED conectados mediante un propagador fotónico interno».

### 2.3 Matemática (opcional)

**Pregunta:** «¿Cómo se expresa matemáticamente?»

**Explicación de ejemplo:** «Cada vértice QED aporta un factor proporcional a `e`. Con dos vértices, la amplitud es de orden `e²`. Para calcular la amplitud completa de dispersión de electrones idénticos a ese orden, hay que combinar los diagramas relevantes con los signos adecuados».

La capa matemática se desbloquearía gradualmente y **no bloquearía la campaña principal**.

## 3. Progresión educativa: campaña de 24 niveles

| Capítulo | Niveles | Nombre | Objetivos de aprendizaje |
|---|---:|---|---|
| 1 | 1–5 | **El alfabeto cuántico** | Reconocer líneas, flechas, electrones, positrones y fotones. Entender que el dibujo no es una trayectoria literal. |
| 2 | 6–10 | **Las reglas de interacción** | Descubrir vértices QED, conservación de carga y conexiones permitidas. Distinguir un vértice admisible de un proceso completo físicamente realizable. |
| 3 | 11–16 | **Partículas que interactúan** | Combinar dos vértices, interpretar intercambios de fotones y diferenciar líneas internas y externas. |
| 4 | 17–20 | **Múltiples posibilidades** | Reconocer representaciones topológicamente equivalentes y contribuciones distintas a un mismo proceso. |
| 5 | 21–24 | **El desafío final** | Interpretar, construir y justificar soluciones sin instrucciones paso a paso. |

### Contenido avanzado posterior al MVP

- **Diagramas con bucles:** autocorrecciones, polarización del vacío y órdenes perturbativos.
- **Otras interacciones:** gluones, bosones W/Z, quarks y bosón de Higgs.
- **Modo matemático:** factores de vértice, propagadores, amplitudes y contribuciones a un cálculo.
- **Sandbox:** dibujar diagramas libremente, experimentar y consultar su validez.

La imagen original compartida, con líneas onduladas y posibles correcciones, podría inspirar un desafío avanzado, una vez añadidos los detalles necesarios para interpretarla sin ambigüedad.

## 4. Ejemplo de nivel completo

### Capítulo 3 · Nivel 12 — «El mensajero invisible»

**Tipo:** Build  
**Objetivo:** Dos electrones entran en una interacción y dos electrones salen. Completar un diagrama de intercambio de un único fotón virtual.

**Disposición visual propuesta:** Cuatro líneas externas de electrón (`e⁻`), dos vértices y un espacio vacío entre ellos. La solución conecta ambos vértices mediante una línea ondulada de fotón virtual (`γ`). La entrada se muestra a la izquierda y la salida a la derecha.

**Secuencia jugable:**

1. Aparecen las cuatro líneas externas y dos vértices incompletos.
2. El jugador elige qué partícula puede conectar esos vértices.
3. Arrastra el fotón al espacio correspondiente.
4. El sistema comprueba las reglas QED aplicables al diagrama.
5. Una animación resalta las líneas y explica el papel del fotón virtual.

**Feedback de éxito:**

> Has construido una contribución válida de orden árbol a la dispersión de electrones. Cada vértice conecta dos líneas fermiónicas y una fotónica.

**Aprendizaje esperado:** El jugador reconoce que el fotón virtual conecta dos vértices QED en una contribución a la dispersión electrón-electrón.

## 5. Gamificación centrada en el aprendizaje

| Elemento | Funcionamiento |
|---|---|
| **Estrellas** | Hasta tres por nivel según comprensión, errores y ayudas utilizadas. |
| **XP** | Desbloquea capítulos y desafíos. |
| **Pistas** | Primero orientan; después muestran la regla pertinente. |
| **Dominio** | Repite conceptos difíciles con diagramas diferentes. |
| **Colección** | Biblioteca personal de partículas, conceptos y procesos descubiertos. |
| **Desafíos finales** | Combinan las mecánicas aprendidas. |

La colección de descubrimientos permite volver a consultar conceptos mediante diagramas interactivos.

**Decisión de diseño:** Evitar temporizadores obligatorios al principio; la comprensión debe tener prioridad sobre la velocidad.

## 6. Alcance del MVP

### Incluido

- **24 niveles** diseñados manualmente.
- Tres mecánicas: **Decode**, **Build** y **Debug**.
- **QED básica**: electrones, positrones y fotones.
- Editor restringido con conexiones magnéticas y piezas arrastrables.
- Validador determinista de soluciones.
- Explicaciones científicas y pistas contextuales.
- Progreso local, estrellas y desbloqueo de capítulos.
- Idioma inicial español, con arquitectura preparada para localización.

### Fuera del MVP

- Editor completamente libre para diagramas arbitrarios.
- Generación automática de niveles mediante IA.
- Bucles y cálculos complejos.
- Multijugador, rankings y cuentas de usuario.
- Resto de las interacciones del Modelo Estándar.

**Objetivo del MVP:** Validar tanto la diversión de manipular diagramas como el aprendizaje real de los conceptos.

## 7. Propuesta de arquitectura técnica

Una primera versión nativa Android podría desarrollarse con **Kotlin + Jetpack Compose**, manteniendo separado el motor físico del renderizado.

```text
┌──────────────────────────────────────────────────┐
│ Game UI                                          │
│ Compose / Canvas · Gestos táctiles · Animaciones │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│ Game Engine                                      │
│ Niveles · Progresión · Pistas · Estados           │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│ Diagram Engine                                   │
│ Grafo · Partículas · Vértices · Reglas            │
└──────────────────────────────────────────────────┘
```

### Modelo conceptual

Los diagramas se representan como **grafos tipados**:

- **Nodos:** vértices de interacción y extremos externos.
- **Aristas:** líneas de partículas con tipo y propiedades.
- **Validación:** comparación estructural y comprobación de reglas físicas.
- **Renderizado:** posición, curvatura, estilo y animaciones independientes del significado del grafo.

Para el MVP no hace falta generar o reconocer cualquier diagrama imaginable. Basta con validar las soluciones previstas y sus variaciones visuales admitidas.

### Tres niveles de validación

1. **Estructural:** las líneas y los vértices están conectados correctamente.
2. **Teórica:** cada vértice respeta las reglas de QED y las condiciones de conservación pertinentes.
3. **Física/cinemática:** cuando el nivel lo exige, el proceso completo es compatible con las leyes de conservación y las condiciones cinemáticas.

**Precisión científica importante:** Un diagrama formalmente admisible no garantiza automáticamente que un proceso pueda ocurrir con las partículas externas propuestas. Además, un diagrama de Feynman representa una contribución a una amplitud de probabilidad, **no una fotografía de las trayectorias reales** de las partículas. Es recomendable revisar los contenidos con una persona formada en física de partículas.

## 8. Validación con usuarios

| Hipótesis | Cómo medirla |
|---|---|
| Se entiende sin conocimientos previos | Porcentaje que completa los primeros cinco niveles sin ayuda. |
| Construir diagramas es divertido | Porcentaje que inicia voluntariamente el siguiente nivel. |
| Se produce aprendizaje real | Comparar pruebas conceptuales breves antes y después de jugar. |
| La dificultad progresa adecuadamente | Errores y pistas utilizados por nivel. |
| Existe interés en profundizar | Uso voluntario de las explicaciones científica y matemática. |

**Objetivos preliminares de diseño, no resultados observados:**

- Que al menos el **75 %** de las personas probadoras complete el tutorial.
- Que la mayoría pueda interpretar un diagrama sencillo nuevo tras completar el tercer capítulo.

## 9. Referencias y posicionamiento

Existen herramientas y juegos relacionados que conviene estudiar como referencias de producto y de rigor científico:

| Proyecto | Qué ofrece | Enlace |
|---|---|---|
| **FeynCraft** | Juego de navegador y trabajo académico sobre creación y validación de diagramas. | https://www.alphaxiv.org/abs/2510.14082 |
| **FeynGame** | Editor y modo de juego para crear y verificar diagramas en distintos modelos. | https://ippog-resources-portal.web.cern.ch/project-30/ |
| **Tutti Quantum** | Juego de cartas y herramienta educativa sobre interacciones de partículas. | https://epfl-ecal-lab.ch/2022/12/tutti-quantum/ |
| **FeynLab** | Ejercicios de lectura, construcción y validación. | https://diffy.ai/games/feynlab |

**Posicionamiento propuesto:** No competir primordialmente en sofisticación científica con estas herramientas, sino en una **experiencia de puzles móvil, accesible, visualmente cuidada y con una progresión pedagógica excelente**.

Los enlaces se incluyen como referencias de exploración; conviene revisar su estado y funcionalidades antes de definir un análisis competitivo definitivo.

## 10. Plan de desarrollo recomendado

### Fase 1 — Prototipo de interacción

Construir un único nivel **Build** con piezas arrastrables, validación y respuesta visual. Comprobar que manipular diagramas resulta satisfactorio.

### Fase 2 — Vertical slice

Completar cinco niveles del primer capítulo con interfaz, tutorial, explicaciones y progresión.

### Fase 3 — Motor reutilizable

Introducir modelos de vértices, validación de grafos, reglas QED y las tres mecánicas de juego.

### Fase 4 — MVP

Completar los 24 niveles, guardado local, sonido, accesibilidad y pruebas con personas sin formación científica.

## 11. Próximo entregable propuesto

Crear un **Game Design Document (GDD) v1** y la especificación completa de los **primeros cinco niveles**, incluyendo:

- Pantallas y componentes.
- Interacciones táctiles.
- Diagramas y soluciones correctas.
- Errores habituales.
- Pistas y textos de aprendizaje.
- Animaciones y efectos de respuesta.
- Condiciones de éxito y desbloqueo.

---

**Principio rector:** *Conectar correctamente tres líneas en un vértice debería resultar tan satisfactorio como resolver un puzle de lógica. Si la interacción es divertida, la física aporta profundidad para expandir el juego sin inventar reglas artificiales.*
