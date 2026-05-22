# Sketch Manifest

## Design Direction

Pre-implementation visual prototyping for SME Mart UI surfaces. Mockups follow the actual SME Mart theme (dark mode forced, `--zb-*` / `--mat-sys-*` tokens, Material 3 surface conventions) so the winning pattern ports 1:1 into Angular 21 + ngx-library.

## Reference Points

- SME Mart's current shipped surfaces (`/engagements/:id`, `/project/:id/boards`)
- zb/ui's task-list view (for tables + row actions)
- ngx-library primitives (`zb-remote-table`, `zb-simple-panel`, `zb-resource-status`, `zb-chip-colors`)
- Material 3 surface elevation + state-layer conventions

## Sketches

| # | Name | Design Question | Winner | Tags |
|---|------|----------------|--------|------|
| 001 | boards-pin-expand | How should pinned board cards expand to show a tasks preview on the engagement Boards tab? (BACKLOG-106) | **A** — inline expand-in-place (CSS Grid + `grid-column: span 2`) | layout, boards, pin-expand, engagement |
