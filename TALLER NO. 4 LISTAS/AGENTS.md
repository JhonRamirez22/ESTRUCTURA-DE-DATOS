# AGENTS.md — Taller de Listas: Proceso de pedido en restaurante

Guía operativa para el agente que implemente este proyecto. Complementa a `PROMPT-agente.md`
(contexto y enunciado). Este archivo define **cómo** construirlo: arquitectura, estructura de
carpetas, convenciones y criterios de aceptación.

## 1. Resumen del proyecto

Aplicación TypeScript que modela con **listas enlazadas propias** (no `Array`) el proceso de
atención de un pedido en un restaurante, tomado literalmente del diagrama de swimlanes
(Cliente / Mozo / Cocina / Caja) provisto por el taller. Incluye interfaz web (HTML/CSS/TS
compilado) que visualiza el avance del proceso carril por carril.

## 2. Stack

- **TypeScript** en modo `strict`, target `ES2020`, sin frameworks de runtime.
- **Sin dependencias externas de producción.** Única dependencia: `typescript` (dev).
- Bundling: no es necesario un bundler; compilar con `tsc` a `dist/` y cargar los `.js`
  resultantes con `<script type="module">` en `index.html`. Si se prefiere Vite por comodidad de
  desarrollo, debe quedar justificado en el README y seguir siendo opcional (el build final debe
  poder hacerse solo con `tsc`).
- Testing: `node:test` + `node:assert` (built-in de Node, sin instalar runner externo) o, si el
  entorno del agente ya trae Jest/Vitest preconfigurado, usarlo — pero no añadirlo solo para esto.

## 3. Estructura de carpetas

```
/
├── src/
│   ├── data-structures/
│   │   ├── node.ts          # Node<T>
│   │   └── linked-list.ts   # LinkedList<T> genérica, sin lógica de negocio
│   ├── domain/
│   │   ├── process-step.ts  # tipos ProcessStep, Lane
│   │   ├── order-process.ts # OrderProcess (orquesta la(s) LinkedList<ProcessStep>)
│   │   └── receipt.ts       # generación de la Boleta
│   ├── ui/
│   │   ├── render.ts        # pinta el estado de OrderProcess sobre el DOM
│   │   └── controls.ts      # listeners de los botones (avanzar/reiniciar)
│   └── main.ts              # bootstrap: instancia OrderProcess + engancha UI
├── tests/
│   ├── linked-list.test.ts
│   └── order-process.test.ts
├── public/
│   ├── index.html
│   └── styles.css
├── dist/                     # salida de tsc (no versionar)
├── tsconfig.json
├── package.json
└── README.md
```

Regla dura: **`data-structures/` no importa nada de `domain/` ni de `ui/`.** La lista enlazada es
genérica y reutilizable; el conocimiento del restaurante vive solo en `domain/`.

## 4. Modelo de datos (contrato)

```ts
// domain/process-step.ts
type Lane = 'Cliente' | 'Mozo' | 'Cocina' | 'Caja';

interface ProcessStep {
  id: string;
  lane: Lane;
  action: string;
  description: string;
  dependsOn: string[]; // ids de pasos que deben estar completados antes de ejecutar este
}
```

`dependsOn` es la forma de modelar el fork/join del diagrama sin abandonar la lista enlazada:
cada `ProcessStep` sabe qué otros pasos deben haberse completado antes de poder ejecutarse,
aunque su posición física sea la siguiente en su propia lista/carril.

### 4.1 Pasos exactos a instanciar (fieles al diagrama, no renombrar ni fusionar)

| id | lane | action | dependsOn |
|---|---|---|---|
| `solicitar-pedido` | Cliente | Solicitar pedido | `[]` |
| `recoger-pedido` | Mozo | Recoger pedido | `[solicitar-pedido]` |
| `elaborar-pedido` | Cocina | Elaborar pedido | `[recoger-pedido]` |
| `recibir-pedido` | Caja | Recibir pedido | `[recoger-pedido]` |
| `servir-pedido` | Mozo | Servir pedido | `[elaborar-pedido]` |
| `solicitar-cuenta` | Cliente | Solicitar cuenta | `[servir-pedido]` |
| `pedir-cuenta` | Mozo | Pedir cuenta | `[solicitar-cuenta]` |
| `calcular-total` | Caja | Calcular total (emite Boleta) | `[pedir-cuenta, recibir-pedido]` |
| `pagar-pedido` | Cliente | Pagar pedido (Fin) | `[calcular-total]` |

Esta tabla es la fuente de verdad. Si el agente decide usar varias `LinkedList` (una por carril,
por ejemplo) en vez de una sola, `dependsOn` sigue siendo el mecanismo de sincronización entre
listas — no se debe perder esta relación.

### 4.2 Estructura de datos genérica (contrato mínimo)

```ts
class LinkedList<T> {
  append(value: T): void;
  insertAt(index: number, value: T): void;
  removeAt(index: number): T | null;
  find(predicate: (value: T) => boolean): T | null;
  toArray(): T[];
  get size(): number;
  [Symbol.iterator](): Iterator<T>;
}
```

### 4.3 `OrderProcess` (contrato mínimo)

```ts
class OrderProcess {
  currentStep(): ProcessStep | null;
  canAdvance(): boolean;      // valida dependsOn del siguiente paso
  advance(): ProcessStep;     // lanza error si !canAdvance() o si ya terminó
  isFinished(): boolean;
  reset(): void;
  getReceipt(): Receipt | null; // solo disponible tras ejecutar 'calcular-total'
  history(): ProcessStep[];
}
```

## 5. Edge cases obligatorios (con test que los cubra)

1. `LinkedList.removeAt` / `insertAt` con índice negativo o mayor a `size` → error controlado,
   no `undefined` silencioso.
2. `LinkedList` vacía: `toArray()` devuelve `[]`, iterar no lanza.
3. `OrderProcess.advance()` llamado después de `isFinished() === true` → lanza error explícito.
4. `OrderProcess.advance()` hacia `servir-pedido` antes de completar `elaborar-pedido` → lanza
   error explícito (no debe avanzar silenciosamente).
5. `OrderProcess.getReceipt()` antes de `calcular-total` → devuelve `null`, no lanza ni inventa
   datos.
6. `OrderProcess.reset()` en mitad del proceso deja el estado idéntico al inicial (mismo primer
   paso, historial vacío).

## 6. Frontend — criterios de "no genérico"

- Paleta y tipografía propias del dominio (restaurante/servicio), no defaults de framework.
- Los 4 carriles se ven como carriles (columnas con encabezado de rol), no como una lista vertical
  única de tarjetas.
- El paso activo se distingue con algo más que un cambio de color plano (borde, icono de estado,
  o transición), y el estado "esperando notificación" de Caja debe verse visualmente distinto de
  "ejecutando".
- La Boleta se muestra como un documento (formato recibo), no como un `<pre>{JSON}</pre>`.
- Responsive básico: debe verse correctamente en una ventana de escritorio típica; no es
  obligatorio mobile-first para este taller.

## 7. Comandos esperados en `package.json`

```json
{
  "scripts": {
    "build": "tsc",
    "test": "node --test dist-tests/",
    "start": "tsc && open public/index.html"
  }
}
```
(Ajustar `start` según el SO objetivo; documentar en README cómo servir `public/` si el agente
prefiere un servidor estático simple en vez de abrir el archivo directamente.)

## 8. Definición de "hecho"

- `tsc` compila sin errores en modo `strict`.
- Todos los tests de la sección 5 pasan.
- Ejecutando `index.html`, se puede recorrer el proceso completo paso a paso desde
  "Solicitar pedido" hasta "Pagar pedido", viendo los 4 carriles, y al llegar a
  "Calcular total" se muestra la Boleta.
- Ningún `TODO` corresponde a una funcionalidad pedida en el enunciado — solo a mejoras futuras
  fuera de alcance (p. ej. persistencia, múltiples pedidos concurrentes).
- README explica cómo correr build, tests y la app, y documenta la decisión de modelado de
  fork/join tomada en `domain/order-process.ts`.
