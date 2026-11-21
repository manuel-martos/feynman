# Feynman Quest

> Aprende el lenguaje del universo, una interacción cada vez.

Feynman Quest es un juego de puzles para móvil sobre física de partículas. Empieza siendo accesible y acaba convirtiéndose en un laboratorio de diagramas de Feynman. El jugador **descifra** diagramas, los **construye** con piezas arrastrables y **depura** errores, mientras un validador determinista explica por qué cada solución funciona o falla.

**Jugar:** https://manuel-martos.github.io/feynman/ (PWA, instalable y disponible sin conexión)

Propuesta de producto: [docs/feynman_quest_propuesta_producto.md](docs/feynman_quest_propuesta_producto.md)

## Qué incluye el MVP

- **34 niveles** en 7 capítulos, que combinan las tres mecánicas: Decode, Build y Debug.
- **QED con electrones, positrones y fotones**:
  - Capítulos 1–5, orden árbol: Møller, Bhabha, aniquilación, Compton y creación de pares.
  - Capítulo 6, orden superior: radiación de frenado, desintegración del positronio en tres fotones, recuento de diagramas y bosones idénticos.
  - Capítulo 7, bucles: polarización del vacío, g−2 de Schwinger, dispersión luz–luz, teorema de Furry y la caja de Møller.
- **Ver en el tiempo**: cualquier diagrama se reproduce como una historia. Las líneas se dibujan de izquierda a derecha y las partículas recorren el diagrama con el signo de su carga. Cada vértice se explica con su balance de carga. Se puede reproducir o avanzar paso a paso, en la pantalla de resultado, en la Colección y en algunos retos.
- **Editor restringido**: arrastras entre puntos y la línea se engancha al más cercano. También se puede conectar con dos toques o con el teclado.
- **Validador en tres capas**: estructural, teórica (vértice QED, flujo de carga) y física (cinemática), más los objetivos propios de cada nivel (canal s/t/u, contribución distinta).
- **Tres capas de explicación**: intuitiva, científica y matemática. La matemática se desbloquea al completar el capítulo 1.
- **Progresión**: estrellas (según errores y pistas, nunca según el tiempo), XP, rangos, desbloqueo de capítulos y guardado local.
- **Colección** con 34 conceptos y diagramas.
- **Modo Dominio**: repaso con diagramas generados por el motor, siempre distintos y siempre correctos.
- **Pistas en dos niveles**: la primera orienta y la segunda muestra la regla.
- **Sonido sintetizado, vibración, accesibilidad** (ARIA, teclado, movimiento reducido) y **PWA offline**.
- **Métricas locales de prueba con usuarios**, exportables en JSON desde Ajustes. Están pensadas para validar las hipótesis de la sección 8 de la propuesta.

## Arquitectura

```
src/
  engine/     Diagram Engine — TS puro, sin dependencias de UI
              grafo tipado · validador · topología (canales, equivalencia, bucles) ·
              enumeradores de árbol · línea temporal (lectura del diagrama en el tiempo)
  game/       Game Engine — tipos de nivel, puntuación, progreso (zustand + localStorage)
  content/    Contenido por idioma (es/) — niveles, conceptos, mensajes del validador, generador de práctica
  ui/         React — DiagramView (SVG), DiagramEditor, StepPlayer, pantallas
```

- Los diagramas son **grafos tipados**: nodos (externos o vértices) y aristas (fermión con flecha, o fotón). La geometría es solo de presentación.
- La equivalencia topológica usa las particiones de hojas (*splits*) que inducen las líneas internas. Así, dos dibujos distintos del mismo diagrama se reconocen como iguales.
- Los **enumeradores** generan todos los diagramas de orden árbol, tanto para 2→2 como para cualquier número de partículas externas. Los tests los usan para verificar las afirmaciones científicas del contenido: por ejemplo, que Møller tiene canales t y u, que e⁻e⁻→e⁻e⁻γ tiene 8 diagramas, que e⁻e⁺→γγγ tiene 6 y que γγ→γγ no tiene ninguno de orden árbol.
- Los **bucles** se permiten nivel a nivel (`loops`). El validador aplica también el **teorema de Furry**: un bucle de electrones con un número impar de fotones se anula.
- **Localización**: los textos de interfaz y contenido viven en `src/content/<locale>/`. Para añadir un idioma basta con crear una carpeta y registrarla en `src/content/index.ts`.

**Decisión técnica:** la propuesta sugería Kotlin + Compose. Para el MVP se eligió una PWA (React + TypeScript + Vite) para validar cuanto antes y en cualquier dispositivo. El motor es TypeScript puro y está separado de la UI, así que es portable a una app nativa si los datos de las pruebas lo justifican.

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # tests del motor, la puntuación y la integridad del contenido (Vitest)
npm run build      # build de producción + service worker
npm run e2e        # smoke tests en viewport móvil (Playwright)
```

Cada push a `main` pasa por typecheck, tests unitarios y E2E, y se despliega en GitHub Pages.

## Rigor científico

Cada nivel Build tiene una solución de referencia que se valida en los tests, y cada diagrama Debug debe fallar con el error esperado. Aun así, como recomienda la propuesta, conviene que una persona formada en física de partículas revise el contenido antes de hacer pruebas con usuarios.
