---
sketch: 001
name: boards-pin-expand
question: "How should pinned board cards expand to show a tasks preview on the engagement Boards tab?"
winner: "A"
tags: [layout, boards, pin-expand, engagement]
---

# Sketch 001: Boards Tab Pin-Expand Layouts

## Design Question

On the engagement-detail **Boards** tab (BACKLOG-106), each board card has a **pin** icon that expands the card to show a paged preview of that board's tasks (≤25). Multiple pins can coexist. Which layout pattern handles this best?

## How to View

```
open .planning/sketches/001-boards-pin-expand/index.html
```

Toggle pins by clicking the ☆ / ★ icon on each card. Two boards (General + Vetting) start pinned to show the expanded state.

## Variants

- **A: Inline expand-in-place** — single CSS Grid (`repeat(auto-fill, minmax(320px, 1fr))`); pinned cards grow to `grid-column: span 2` and host the tasks-mini table inline; unpinned cards keep their slot at original width. Everything in one flow.
- **B: Left-right split** — narrow left column of compact chip-cards (one per board, always-visible); pinned boards stack on the right wider column as full cards with the tasks-mini table. Outlook reading-pane feel.

## What to Look For

- **Glance-ability:** can you see all boards at a glance, or do pinned ones dominate?
- **Density:** how much vertical scroll for 6 boards with 2-3 pinned?
- **Reflow feel:** pin/unpin a card — does the layout shift feel jarring or natural?
- **Responsive:** click viewport buttons (375 / 768 / 1280) — which holds up better at narrow widths?
- **Pin-as-status:** in A, the pinned card LIVES with the unpinned ones (you can see it in context). In B, pinning MOVES the card to a separate region (clearer "watching" vs "available" semantics, but loses positional context).
- **Future Vetting Board:** Vetting will become a board (BACKLOG-106 scope). How does each layout handle a specialized board type in the same grid?

## Open Questions

- A's column-span jump can feel jumpy with 3+ pins simultaneously — possible mitigations: span 3 only at wider viewports, animate the transition, or fall back to B if user pins 4+ boards.
- B's left chip-column is sticky — at very tall right column heights does that feel right or trap users?
- Both: where does the **drill** icon (↗ navigate to `/boards/:boardId` detail page) go? Currently both put it next to pin in the card-actions cluster. Confirm that's discoverable.

## Notes for Implementation (post-decision)

- Theme tokens used here mirror SME Mart's actual `--zb-*` / `--mat-sys-*` shape — direct port to ngx-library / Material 3 should be 1:1 substitution.
- `board-card` is the shared primitive (BACKLOG-100). It just needs a `pinned` signal-input and a `compact: 'chip' | 'full' | 'expanded'` size mode for B.
- Default-board chip + status pill colors mirror zb/ui task-status conventions (per project memory).
