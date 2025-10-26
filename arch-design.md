# Pro Component Architecture for LLM-Friendly Admin UI

This document proposes a holistic architecture for building "Pro components"—feature-rich, business-oriented UI blocks that wrap an existing atomic component library while being easy for AI coding assistants to use. The goals are:

- Short, unambiguous prop surfaces that encode domain intent instead of low-level knobs.
- Imperative instance APIs that encapsulate complex wiring and state coordination.
- React integration patterns that keep the component tree declarative for humans yet expose imperative control for automation.
- Enforceable conventions that ensure new Pro components follow the same ergonomics.

The architecture borrows ideas from TanStack Table (e.g., centralized state machines, plugin pipelines, instance-first APIs) and adapts them to the admin dashboard domain.

## 1. Prop Validation & Surface Design

### 1.1 Progressive Intent Layers
Define a schema hierarchy for each Pro component:

1. **Essentials schema** – minimal required props such as data sources, primary identifiers, and high-level behavior flags. Each prop maps to a core business intent (e.g., `mode: "readonly" | "editor"`).
2. **Enhancement schema** – optional capabilities toggles (e.g., `enableBulkActions`, `enableHistory`). These remain shallow booleans or enums to avoid mutually exclusive options.
3. **Escape hatch schema** – guarded, advanced overrides that are rarely exposed to LLMs (e.g., `advanced.columns` array). Include in documentation but flag as "manual review" to discourage automated use.

### 1.2 Schema Authoring with Zod Pipelines

Use [Zod](https://github.com/colinhacks/zod) as the first-class validation and documentation engine:

```ts
const baseSchema = z.object({
  mode: z.enum(["readonly", "editor"]).default("readonly"),
  dataSource: z.union([
    z.function().returns(z.promise(z.array(rowSchema))),
    z.object({ resource: z.string(), params: z.record(z.any()).optional() })
  ]),
});

const enhancementsSchema = z.object({
  enableBulkActions: z.boolean().default(false),
  enableHistory: z.boolean().default(false),
});

export const proGridPropsSchema = baseSchema.merge(enhancementsSchema);
```

Key practices:

- **Custom refinement** for exclusivity: use `superRefine` to reject contradictory flags with rich error messages tailored for LLM consumption.
- **Schema-driven docs**: auto-generate Markdown tables from schemas to feed into AI prompts. Include examples that match the default path.
- **Runtime + type validation**: parse props at runtime and re-export `z.infer<typeof proGridPropsSchema>` as the TypeScript type.

### 1.3 Prompt-Oriented Error Surfaces

Structure validation errors as deterministic JSON payloads (e.g., `{ code, message, suggestion }`). Provide a utility `formatLLMError` that transforms Zod issues into actionable hints (“`enableBulkActions` requires `mode: "editor"`.”). This encourages automated retries with corrected props.

## 2. Imperative Instance API

### 2.1 State Core Abstraction

Each Pro component is powered by a **state core**—a pure TypeScript module that:

- Holds the canonical state (`coreState`).
- Exposes imperative commands (e.g., `selectRows`, `openDrawer`, `applyFilter`).
- Emits derived snapshots for React consumption through observable signals.

Example skeleton:

```ts
export type ProGridCore = ReturnType<typeof createProGridCore>;

export function createProGridCore(initialState: GridState, adapters: GridAdapters) {
  const store = createStore(initialState);

  const core = {
    getState: store.getState,
    subscribe: store.subscribe,
    commands: {
      selectRows: (ids: string[]) => store.setState(state => { /* ... */ }),
      openDrawer: (id: string) => store.setState(state => { /* ... */ }),
      // ...
    },
  } as const;

  return core;
}
```

### 2.2 Instance Surface

Expose a stable instance object returned by a hook or forwarded ref:

```ts
export interface ProGridInstance {
  core: ProGridCore;
  api: {
    reload: () => Promise<void>;
    getSelection: () => GridSelection;
    setFilter: (filter: GridFilter) => void;
    focusRow: (id: string) => void;
  };
}
```

Design principles:

- **Stateless commands**: ensure commands derive everything they need from `coreState` to avoid requiring prop-controlled values.
- **Async-safe**: wrap async commands with cancellation tokens (e.g., `AbortController`) to prevent race conditions when AI scripts invoke them rapidly.
- **LLM-friendly grouping**: prefix methods (`select`, `filter`, `export`) to make auto-completion deterministic.

### 2.3 Capability Capsules

For complex vertical features (workflow, history, permissions), ship separate capability modules that can be composed into the core via dependency injection. Each module registers commands and state slices. Example: `withBulkActions(core, options)` adds `api.executeBulkAction`. This keeps the instance surface small and discoverable.

## 3. React Integration Strategies

### 3.1 Hook + Ref Hybrid (Recommended)

- `const { instance, view } = useProGrid(props)` hook orchestrates prop parsing, core creation, and view derivation.
- `instance` is memoized and can be exposed via `forwardRef` to parent components or automation scripts.
- `view` contains memoized data for rendering (rows, columns, derived UI flags).
- Internally rely on `useSyncExternalStore` or Zustand-style stores to bridge the core to React.

Advantages:
- Keeps render tree declarative: `<ProGrid view={view} />` consumes plain props.
- Exposes imperative power via `instance` without leaking implementation details.

### 3.2 Controller Component Pattern

Provide a controller component that manages the instance lifecycle:

```tsx
function ProGridController(props: ProGridProps, ref: React.Ref<ProGridInstance>) {
  const { instance, view } = useProGrid(props);
  useImperativeHandle(ref, () => instance, [instance]);
  return <ProGridRenderer view={view} />;
}
```

The renderer remains stateless. This split keeps testing simple (renderer snapshots) and isolates state management (controller).

### 3.3 Alternative: External State Managers

Evaluate adapters for:

- **Zustand**: minimal store API, pairs well with command pattern. Good for local component state.
- **Jotai**: atomic state, allows fine-grained subscriptions, more complex mental model for AI.
- **Recoil/Redux Toolkit**: overkill unless you need cross-component synchronization.

Recommendation: default to a light store (Zustand-like) embedded within the core. Offer an adapter layer if teams need to plug into Redux for auditing.

### 3.4 Server-Side & Streaming

For AI-driven flows that require server confirmation (e.g., streaming filters), expose `instance.api.observe` methods returning RxJS-style observables or async generators. React can subscribe via `useSubscription` to reflect streaming updates declaratively.

## 4. Enforcing the Pattern

### 4.1 Scaffolding CLI

Ship a `create-pro-component` CLI that:

- Generates the folder structure: `core/`, `hooks/`, `renderer/`, `schemas/`.
- Pre-populates Zod schema files, core factory, instance interface, and renderer stub.
- Adds unit test templates (`core.test.ts`, `schema.test.ts`) and docs skeleton.

This ensures every component starts from the same blueprint.

### 4.2 Lint & Type Rules

- Custom ESLint rules (via `@typescript-eslint/utils`) to forbid direct use of atomic components in Pro component exports; they must go through renderer modules.
- Require every component to export `schema`, `useX`, `XInstance` types via lint checks.
- Type tests using `tsd` to guarantee schema inference matches exported types.

### 4.3 Contract Tests

Implement behavioral tests that simulate AI usage:

- Provide JSON-like prop objects to ensure schema coercion and helpful errors.
- Invoke instance commands sequentially and assert UI state changes via renderer snapshots.
- Use Storybook stories with `play` functions to exercise imperative APIs, capturing them as executable documentation for AI prompts.

### 4.4 Documentation Playbooks

- Maintain Markdown playbooks for each component (e.g., `docs/pro-grid/usage.md`) with canonical usage patterns, command tables, and error codes.
- Auto-sync doc tables with schema and instance definitions via codegen to keep prompts reliable.

## 5. Example Lifecycle

1. **Props Intake**: `useProGrid` receives raw props, parses with `proGridPropsSchema`, and emits standardized configuration + derived defaults.
2. **Core Creation**: `createProGridCore` constructs state, registers capability modules, and returns `core` + command APIs.
3. **React Binding**: Hook subscribes to core snapshots, memoizes `view`, and returns `instance` (`{ core, api }`).
4. **Imperative Usage**: Consumers (human or AI) call `instance.api.setFilter(...)` to update state; React re-renders automatically via store subscription.
5. **Validation Enforcement**: Tests + lint ensure schema coverage, CLI scaffolds new modules, and docs stay in sync.

## 6. Checklist for New Pro Components

- [ ] Define layered Zod schemas with clear defaults and mutually exclusive refinements.
- [ ] Generate schema-driven docs and AI-friendly error messages.
- [ ] Implement a core module exposing `getState`, `subscribe`, and `commands`.
- [ ] Expose an instance object (`{ core, api }`) via a hook + forwarded ref.
- [ ] Render through stateless view components that consume derived `view` data.
- [ ] Add contract tests for schema validation and imperative command flows.
- [ ] Register component with CLI scaffolding config for future updates.

Following this architecture delivers Pro components that remain powerful yet approachable for LLM-driven development, enabling consistent, predictable automation in complex admin interfaces.
