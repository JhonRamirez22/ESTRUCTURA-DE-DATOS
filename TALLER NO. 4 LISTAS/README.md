# Taller de Listas Enlazadas — Proceso de Pedido en Restaurante

Aplicación TypeScript que modela con **listas enlazadas implementadas desde cero** el proceso de atención de pedidos en un restaurante, basado en el diagrama de swimlanes (Cliente / Mozo / Cocina / Caja).

## Diagrama de Procesos

```
CLIENTE          MOZO             COCINA           CAJA
─────────        ──────           ──────           ─────
   │                │                │                │
   │ [1] Solicitar  │                │                │
   │     pedido ────►                │                │
   │                │ [2] Recoger    │                │
   │                │     pedido     │                │
   │                │                │                │
   │                ├──── fork ──────┤                │
   │                │                │                │
   │                │                │ [3a] Elaborar  │
   │                │                │      pedido    │
   │                │                │      (N) ──────►
   │                │                │                │ [3b] Recibir
   │                │                │                │      pedido
   │                │                │                │      (espera N)
   │                │                │                │
   │                ├──── join ◄─────┤                │
   │                │                │                │
   │                │ [4] Servir     │                │
   │                │     pedido     │                │
   │                │     (requiere  │                │
   │                │      cocina    │                │
   │                │      lista)    │                │
   │                │                │                │
   │ [5] Solicitar  │                │                │
   │     cuenta ────►                │                │
   │                │ [6] Pedir      │                │
   │                │     cuenta ────┼────────────────►
   │                │                │                │ [7] Calcular
   │                │                │                │     total
   │                │                │                │     (join:
   │                │                │                │      pedir-cuenta
   │                │                │                │      + recibir)
   │                │                │                │     → BOLETA
   │                │                │                │
   │ [8] Pagar      │                │                │
   │     pedido ◄───┼────────────────┼────────────────┘
   │     (FIN)      │                │
   ▼                ▼                ▼                ▼
```

## Stack

- **TypeScript** (modo `strict`, target `ES2020`)
- **Vite** para desarrollo y build
- **HTML5 + CSS3** puro (sin frameworks)
- **Node:test** + **Node:assert** para tests

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

## Build

```bash
npm run build
```

Genera archivos estáticos en `dist/` listos para desplegar.

## Tests

```bash
npm test
```

Ejecuta tests de `LinkedList` y `OrderProcess` con edge cases.

## Despliegue en Vercel

1. Conecta el repositorio a Vercel
2. Configuración automática con `vercel.json`:
   - Build command: `npm run build`
   - Output directory: `dist`
3. O despliega manualmente: `npx vercel`

## Estructura del Proyecto

```
├── src/
│   ├── data-structures/
│   │   ├── node.ts          # Node<T> genérico
│   │   └── linked-list.ts   # LinkedList<T> completa
│   ├── domain/
│   │   ├── process-step.ts  # Lane, ProcessStep, STEPS[]
│   │   ├── order-process.ts # OrderProcess (orquestador)
│   │   └── receipt.ts       # Receipt, generarBoleta()
│   ├── ui/
│   │   ├── render.ts        # Renderizado de carriles
│   │   └── controls.ts      # Listeners de botones
│   └── main.ts              # Bootstrap
├── tests/
│   ├── linked-list.test.ts
│   └── order-process.test.ts
├── public/
│   ├── index.html
│   └── styles.css
├── dist/                    # Build output (Vercel sirve esto)
├── tsconfig.json
├── vite.config.ts
├── package.json
└── vercel.json
```

## Decisión de Modelado: Fork/Join con Listas Enlazadas

El diagrama tiene una **bifurcación (fork)** después de "Recoger pedido" y una **unión (join)** antes de "Calcular total". Se modela así:

1. **Una sola `LinkedList<ProcessStep>`** almacena los 9 pasos en orden secuencial.
2. Cada `ProcessStep` tiene un campo `dependsOn: string[]` que lista los IDs de pasos que deben completarse antes.
3. `OrderProcess.canAdvance()` verifica que todas las dependencias del siguiente paso estén en el historial.

**Trade-off:** Más simple que un grafo explícito. Para 9 pasos, la verificación de dependencias es O(n²) = constante práctica. Un grafo permitiría topological sort pero añade complejidad innecesaria para este alcance.

## Edge Cases Manejados

- `advance()` después de `isFinished()` → lanza error explícito
- `getReceipt()` antes de "calcular-total" → retorna `null`
- `advance()` con dependencias faltantes → lanza error con lista de faltantes
- `reset()` en cualquier punto → estado idéntico al inicial
- `LinkedList` con índice inválido → `RangeError`
- `LinkedList` vacía → `toArray()` retorna `[]`, iteración no lanza

## TODO

<!-- TODO: Agregar persistencia de estado con localStorage para múltiples sesiones -->
<!-- TODO: Soporte para múltiples pedidos concurrentes -->
<!-- TODO: Animaciones de transición entre pasos -->
