# AGENTS.md — Editor de Notas Offline-First (Undo/Redo + Cola de Sincronización)

## 1. Contexto y objetivo

Este proyecto es un taller académico de **Estructuras de Datos: Pilas y Colas**, aplicado
a un caso de estudio real: un editor de notas de texto tipo Notion/Google Docs que funciona
sin conexión y sincroniza cambios cuando vuelve la red.

El agente que implemente esto DEBE:
- Usar **TypeScript en modo estricto**, sin librerías externas para las estructuras de datos
  (Pila y Cola se implementan a mano; son el objetivo pedagógico del taller).
- Entregar código de **calidad producción**: sin pseudocódigo, sin `TODO` sin resolver, sin
  partes "por implementar".
- Priorizar simplicidad sobre abstracciones innecesarias (no usar clases genéricas tipo
  `LinkedList<T>` si un arreglo con índices resuelve el problema de forma clara y eficiente).
- No usar frameworks de UI (React, Vue, etc.). Interfaz en **HTML + CSS + TypeScript vanilla**.
- No usar bundlers pesados innecesarios. Se permite `esbuild`/`tsc --watch` o Vite **solo** si
  simplifica el flujo de desarrollo, nunca como dependencia obligatoria del resultado final
  (el `.html` final debe poder abrirse con un `<script type="module">` compilado a JS plano).

---

## 2. Reglas de negocio (dominio)

### 2.1 Pila de Deshacer/Rehacer (`UndoStack`)

- Cada vez que el usuario modifica el contenido de la nota (on `input`, con debounce de 500ms
  para no apilar cada tecla), se apila un snapshot `{ content: string, timestamp: number }`.
- `Ctrl+Z` / botón "Deshacer":
  - Saca (`pop`) el snapshot actual del historial de undo.
  - Lo empuja (`push`) a la pila de redo.
  - Aplica el snapshot anterior (el nuevo tope de undo) al textarea.
- `Ctrl+Y` / `Ctrl+Shift+Z` / botón "Rehacer":
  - Saca (`pop`) de la pila de redo.
  - Lo aplica y lo vuelve a apilar en undo.
- **Regla crítica**: cualquier edición nueva del usuario (que no sea undo/redo) **vacía la pila
  de redo por completo**. Es el comportamiento estándar de todo editor de texto.
- **Límite de historial**: máximo 50 snapshots en la pila de undo. Al superar el límite, se
  descarta el snapshot más antiguo (el del fondo de la pila). Esto se implementa con un
  arreglo + índice de tope, no con estructuras enlazadas.

### 2.2 Cola de Sincronización (`SyncQueue`)

- Cada cambio "confirmado" (tras el debounce de guardado, 1.5s sin escribir) se encola como
  un job: `{ id: string, content: string, attempts: number, createdAt: number }`.
- La cola es **FIFO**: se procesan en el orden exacto en que se generaron.
- Un "worker" simulado procesa el frente de la cola cada 2 segundos **si hay conexión**
  (simulada con un toggle manual en la UI "Simular offline/online").
- **Reintento**: si el envío falla (simulado con ~20% de probabilidad de fallo aleatorio,
  o forzado por el usuario), el job:
  - Incrementa `attempts`.
  - Si `attempts < 3`: vuelve a insertarse **al frente** de la cola (se reintenta antes que
    los jobs nuevos, para no perder orden de negocio).
  - Si `attempts >= 3`: se descarta y se marca visualmente como "cambio perdido" (edge case
    real: hay que decidir explícitamente qué pasa, no ignorarlo).
- **Cola acotada**: capacidad máxima de 20 jobs pendientes. Si se llena, el job más nuevo se
  rechaza y se notifica al usuario ("cambios sin guardar, revisa tu conexión") en vez de
  perder silenciosamente datos o crecer memoria indefinidamente.
- Si dos jobs consecutivos tienen el mismo origen de nota y el de más atrás en la cola aún
  no se procesó, se puede colapsar en uno solo (mantener el último contenido) — optimización
  simple, no obligatoria, documentar con `TODO:` si no se implementa en la primera iteración.

---

## 3. Contratos de las estructuras de datos

Implementar en `src/data-structures/`:

```
src/data-structures/stack.ts
src/data-structures/queue.ts
```

### `Stack<T>`
```typescript
interface Stack<T> {
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  isEmpty(): boolean;
  size(): number;
  clear(): void;
}
```
- Implementación con arreglo nativo (`Array.prototype.push/pop`), O(1) amortizado.
- No usar librerías externas ni linked list: un arreglo es la solución correcta y simple aquí.

### `Queue<T>`
```typescript
interface Queue<T> {
  enqueue(item: T): boolean;   // false si la cola está llena (bounded)
  dequeue(): T | undefined;
  enqueueFront(item: T): boolean; // para reintentos, ver regla 2.2
  peek(): T | undefined;
  isEmpty(): boolean;
  isFull(): boolean;
  size(): number;
}
```
- **No usar `Array.shift()` en el hot path** si la cola puede crecer mucho (O(n) por
  reindexación). Implementar con **dos punteros / índice circular sobre arreglo** o con un
  arreglo que se compacta periódicamente. Justificar la elección elegida en un comentario
  breve (el "por qué", no el "qué").
- `enqueueFront` es una operación especial para reinsertar reintentos sin romper el
  invariante de capacidad máxima.

---

## 4. Edge cases obligatorios (a probar explícitamente)

| # | Caso | Comportamiento esperado |
|---|------|--------------------------|
| 1 | Deshacer con pila de undo vacía | No hace nada, botón se deshabilita visualmente |
| 2 | Rehacer con pila de redo vacía | No hace nada, botón se deshabilita visualmente |
| 3 | Escribir después de deshacer | Pila de redo se vacía completamente |
| 4 | Superar 50 snapshots de undo | Se descarta el más antiguo, no crece indefinidamente |
| 5 | Cola de sync llena (20 jobs) | Nuevo job se rechaza, se notifica al usuario |
| 6 | Job falla 3 veces | Se descarta y se marca como "cambio perdido" |
| 7 | Reconexión con cola pendiente | Se procesan en orden FIFO original |
| 8 | Reintento de job fallido | Vuelve al frente, se procesa antes que jobs nuevos |
| 9 | Cerrar/recargar con cola pendiente | Persistir cola en `localStorage`, restaurar al cargar |
| 10 | Debounce de escritura muy rápida | No se genera un snapshot/job por cada tecla |

---

## 5. Arquitectura de archivos

```
/
├── index.html
├── src/
│   ├── data-structures/
│   │   ├── stack.ts
│   │   └── queue.ts
│   ├── editor.ts          # lógica del textarea + integración con UndoStack
│   ├── sync-worker.ts     # simula el envío al "servidor" + integración con SyncQueue
│   ├── ui.ts              # actualiza DOM: estado de botones, badges de la cola, toasts
│   └── main.ts            # punto de entrada, wiring de todo
├── styles/
│   └── main.css
├── tests/
│   ├── stack.test.ts
│   └── queue.test.ts
└── AGENTS.md
```

- **Sin frameworks**. Manipulación de DOM directa (`document.querySelector`, etc.), con
  funciones puras donde sea posible para facilitar testing.
- Tests con `node:test` + `node:assert` (nativo de Node.js, sin instalar Jest/Vitest) salvo
  que el usuario ya tenga un runner configurado en el proyecto.

---

## 6. Especificación de interfaz (HTML + CSS)

### 6.1 Layout (`index.html`)

Tres zonas visibles simultáneamente, en un layout de grid de 2 columnas (responsive: 1
columna en mobile, breakpoint 768px):

**Columna izquierda — Editor:**
- `<textarea id="editor">` grande, fuente monoespaciada, autofocus.
- Barra superior con: botón "Deshacer" (↩), botón "Rehacer" (↪), contador de caracteres,
  indicador de estado de guardado (`Guardando... / Guardado / Sin conexión`).
- Los botones de undo/redo se deshabilitan (`disabled`, opacidad reducida) cuando la pila
  correspondiente está vacía — reflejar el estado real, no solo visual.

**Columna derecha — Panel de la cola de sincronización (visualización pedagógica):**
- Lista vertical de "tarjetas" representando cada job en la cola, en orden (el primero en
  la lista = frente de la cola = próximo a procesar).
- Cada tarjeta muestra: fragmento del contenido, número de intentos, timestamp relativo
  ("hace 3s").
- Toggle "Simular offline/online" (checkbox estilizado como switch).
- Botón "Forzar fallo del próximo envío" (para poder demostrar el edge case de reintento
  en vivo, sin depender del azar).
- Badge con contador `X / 20` jobs en cola, cambia a color de advertencia cuando `X >= 16`.

**Notificaciones:**
- Toast no bloqueante (esquina inferior derecha) para: "cola llena", "cambio perdido tras
  3 intentos", "reconectado, sincronizando N cambios pendientes".

### 6.2 Estilo (`styles/main.css`)

- CSS puro, sin preprocesadores, usando **custom properties** (`:root { --color-primary: ... }`)
  para la paleta, así el agente puede ajustar tema sin tocar reglas dispersas.
- Paleta sugerida (neutra, legible, sin depender de imágenes externas):
  - Fondo: `#f5f6fa` · Texto: `#1e1e2e` · Acento: `#4f46e5` · Éxito: `#22c55e` ·
    Advertencia: `#f59e0b` · Error: `#ef4444`.
- Usar `flexbox`/`grid` nativos, sin frameworks de CSS (Tailwind/Bootstrap quedan fuera:
  el taller es de estructuras de datos, no de CSS frameworks).
- Transiciones sutiles (`transition: opacity .15s ease`) al agregar/quitar tarjetas de la
  cola, para que el flujo FIFO sea visualmente claro (nueva tarjeta entra abajo, sale por
  arriba al procesarse).
- Accesibilidad mínima: contraste AA, `aria-live="polite"` en el indicador de estado de
  guardado y en los toasts, botones con `aria-label` cuando solo llevan ícono.

---

## 7. No funcionales

- **Performance**: operaciones de pila/cola en O(1). No usar `Array.shift()`/`Array.unshift()`
  sin justificar el trade-off si la cola puede tener más de ~50 elementos.
- **Seguridad**: sanitizar el contenido del editor antes de insertarlo en el DOM si en algún
  punto se renderiza como HTML (usar `textContent`, nunca `innerHTML` con contenido del
  usuario).
- **Persistencia mínima**: `localStorage` para no perder la cola de sync ni el contenido
  actual de la nota al recargar. Es la única "dependencia" externa permitida (API nativa
  del navegador).
- **Mantenibilidad**: cada estructura de datos y cada módulo de UI debe poder probarse de
  forma aislada (sin depender del DOM real donde no haga falta).

---

## 8. Criterios de aceptación (Definition of Done)

- [ ] `Stack<T>` y `Queue<T>` implementados y con tests cubriendo los 10 edge cases de la
      sección 4.
- [ ] Editor funcional: escribir, deshacer, rehacer, con límite de 50 snapshots.
- [ ] Cola de sync visible, con simulación de offline/online y fallo forzado funcionando.
- [ ] Persistencia en `localStorage` verificada (recargar la página no pierde datos).
- [ ] Interfaz responsive (probar en viewport de 375px y 1440px).
- [ ] Sin errores en consola, sin `any` implícitos en TypeScript (`strict: true` en
      `tsconfig.json`).
- [ ] README corto con instrucciones de cómo correr el proyecto localmente.

---

## 9. Fuera de alcance (explícito, para no over-engineerizar)

- No implementar backend real: el "servidor" de sincronización es una función simulada
  (`Promise` con `setTimeout` y probabilidad de fallo).
- No implementar autenticación, multi-usuario ni colaboración en tiempo real.
- No implementar múltiples notas/documentos: una sola nota es suficiente para demostrar
  el concepto.
- No usar IndexedDB (localStorage es suficiente para el volumen de datos de este taller).
