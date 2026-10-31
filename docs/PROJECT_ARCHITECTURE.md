# Project architecture

- `frontend/`: React, TypeScript, and Vite browser application.
- `backend/`: Express and TypeScript API.
- `shared/`: contracts and constants used by both applications.
- `docs/`: integration and demonstration documentation.
- `brightloop_core/`: retained Odoo addon from the earlier implementation; it is not wired into the new React/Node scaffold.

The React/Node structure is the selected direction for the current scaffold. Remove or migrate the Odoo addon only as a separate, explicit decision.
