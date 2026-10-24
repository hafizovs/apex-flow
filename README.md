## Live demo

https://hafizovs.github.io/apex-flow/

# ApexFlow

Cyberpunk Minimal SaaS project board — Angular 22 standalone, Signals, OnPush, zoneless. Mock REST via HTTP interceptor.

## About

ApexFlow is a Cyberpunk Minimal SaaS project board built with Angular 22 standalone components, Signals, OnPush, and zoneless change detection. Sign-in and board data go through a mock REST API behind an HTTP interceptor. Authenticated users get a kanban; analytics and team admin open only for the roles allowed to see them.

## Capabilities

- Public login and registration, with demo Admin, Manager, and Developer accounts
- Kanban for any authenticated user, including keyboard drag-and-drop
- Analytics for admin and manager; team admin for admin only
- RU/EN locale, dark/light theme, and a help drawer

## Functionality

- Sign in or register, then open `/board` to create tasks and move cards between columns
- Open `/analytics` as admin or manager, and `/team` only as admin
- Delete any task as admin or manager; as a developer, delete only tasks assigned to you
- Reset the demo as admin
- Press `N` for a new task, `Space` / arrow keys / `Enter` to pick up and drop a focused card, and `Escape` to close overlays or cancel a drag

## Scripts

```bash
npm install
npm start          # http://localhost:4200
npm test
npm run build
```

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@apexflow.dev` | `Admin123!` |
| Manager | `manager@apexflow.dev` | `Manager123!` |
| Developer | `dev@apexflow.dev` | `Dev12345!` |

## Routes & RBAC

| Route | Access |
|-------|--------|
| `/login`, `/register` | Public (guest) |
| `/board` | Any authenticated user |
| `/analytics` | `admin`, `manager` |
| `/team` | `admin` only |

| Action | admin | manager | developer |
|--------|-------|---------|-----------|
| Sidebar: Board | ✓ | ✓ | ✓ |
| Sidebar: Analytics | ✓ | ✓ | ✗ |
| Sidebar: Team | ✓ | ✗ | ✗ |
| Create task | ✓ | ✓ | ✓ |
| Delete task | any | any | own assignee only |
| Demo reset | ✓ | ✗ | ✗ |

## Hotkeys

| Key | Action |
|-----|--------|
| `?` | Toggle help drawer |
| `G` | Toggle locale RU/EN |
| `T` | Toggle theme dark/light |
| `N` | Open new task modal (on `/board`) |
| `Escape` | Close modal/drawer/help; cancel DnD |
| `Space` | Pick up / drop focused kanban card |
| `←` / `→` | Move drop target between columns |
| `Enter` | Drop card into focused column |

Hotkeys are ignored when focus is in `input` / `textarea` / `select` / `contenteditable`, except `Escape`.
