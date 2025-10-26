# ProTable Integration Prototypes

This experimental example shows how the Pro component architecture described in `arch-design.md` materializes as code. Each folder
 implements the same `ProTable` core and exposes a different integration strategy:

- `hook-ref/` – a hook-first API that returns `{ instance, view }` and can be forwarded through refs.
- `controller-component/` – a controller that wires the core and renders a stateless view component.
- `zustand-bridge/` – a bridge that mirrors the core into a mini-Zustand store to demonstrate external state manager adapters.
- `streaming/` – a hook that enables long-lived streaming commands for server-driven updates.

The folders share a lightweight `shared/` core that hosts the imperative store, mock data loaders, and helper utilities.
