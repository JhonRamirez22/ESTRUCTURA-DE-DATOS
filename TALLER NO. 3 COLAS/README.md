# Editor de Notas Offline-First

Taller académico de **Estructuras de Datos: Pilas y Colas** aplicado a un caso de uso real: un editor de notas tipo Notion/Google Docs que funciona sin conexión y sincroniza cambios cuando vuelve la red.

## Estructuras de datos implementadas

### Pila (Stack)
- **Ubicación**: `src/data-structures/stack.ts`
- **Implementación**: Arreglo nativo + índice de tope
- **Complejidad**: push/pop/peek = O(1) amortizado
- **Uso**: Pila de deshacer/rehacer (máximo 50 snapshots)

### Cola (Queue)
- **Ubicación**: `src/data-structures/queue.ts`
- **Implementación**: Arreglo circular con punteros head/tail
- **Complejidad**: enqueue/dequeue/enqueueFront = O(1)
- **Uso**: Cola de sincronización offline (máximo 20 jobs)

## Cómo correr

### Requisitos
- Node.js 18+ (para tests)
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### Compilar
```bash
# Instalar TypeScript globalmente (si no lo tienes)
npm install -g typescript

# Compilar el proyecto
cd "TALLER NO. 3 COLAS"
npm run build
```

### Abrir en el navegador
1. Abre `index.html` directamente en tu navegador
2. O usa un servidor local:
```bash
# Con Python
python -m http.server 8000

# Con Node (npx)
npx serve .

# Luego abre http://localhost:8000
```

### Ejecutar tests
```bash
npm test
```

## Funcionalidades

### Editor (Pilas)
- **Deshacer** (Ctrl+Z): Retrocede al estado anterior
- **Rehacer** (Ctrl+Y / Ctrl+Shift+Z): Avanza al estado siguiente
- **Límite de historial**: Máximo 50 snapshots (el más antiguo se descarta)
- **Regla crítica**: Escribir después de deshacer vacía el redo completamente

### Sincronización (Colas)
- **Worker cada 2s**: Procesa jobs pendientes si hay conexión
- **Reintento**: Si falla, el job vuelve al frente (máximo 3 intentos)
- **Cola acotada**: Máximo 20 jobs pendientes
- **Persistencia**: La cola se guarda en localStorage
- **Simulación**: Toggle online/offline y botón para forzar fallo

## Edge cases cubiertos

| # | Caso | Comportamiento |
|---|------|----------------|
| 1 | Deshacer con pila vacía | No hace nada, botón deshabilitado |
| 2 | Rehacer con pila vacía | No hace nada, botón deshabilitado |
| 3 | Escribir después de deshacer | Redo se vacía completamente |
| 4 | Superar 50 snapshots | Se descarta el más antiguo |
| 5 | Cola llena (20 jobs) | Nuevo job rechazado, toast de advertencia |
| 6 | Job falla 3 veces | Se descarta, toast de "cambio perdido" |
| 7 | Reconexión con cola pendiente | Se procesan en orden FIFO |
| 8 | Reintento de job fallido | Vuelve al frente de la cola |
| 9 | Recargar página | Cola y contenido persistidos en localStorage |
| 10 | Debounce rápido | No se genera un job por cada tecla |

## Arquitectura

```
/
├── index.html                    ← Layout 2 columnas
├── tsconfig.json                 ← TypeScript estricto
├── package.json                  ← Scripts de build/test
├── styles/
│   └── main.css                  ← Paleta de colores, grid responsive
├── src/
│   ├── data-structures/
│   │   ├── stack.ts              ← Stack<T> (arreglo + topIndex)
│   │   └── queue.ts              ← Queue<T> (arreglo circular)
│   ├── editor.ts                 ← Lógica textarea + undo/redo
│   ├── sync-worker.ts            ← Worker de sincronización
│   ├── ui.ts                     ← Actualización del DOM
│   └── main.ts                   ← Punto de entrada
├── tests/
│   ├── stack.test.ts             ← Tests de la pila
│   └── queue.test.ts             ← Tests de la cola
└── README.md
```

## Decisiones de diseño

1. **Por qué no linked list**: Un arreglo con índices es O(1) y más simple para este caso
2. **Por qué no Array.shift()**: Es O(n) por reindexación; el arreglo circular es O(1)
3. **Por qué debounce separado**: Undo (500ms) y sync (1.5s) tienen ritmos diferentes
4. **Por qué localStorage**: Suficiente para una nota; IndexedDB sería over-engineering
