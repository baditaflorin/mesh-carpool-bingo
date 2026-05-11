---
status: accepted
date: 2026-05-11
---

# 0003 — Claim model

## Context

When phone A claims "Yellow car," does phone B's identical-named cell also flip? Should ownership matter? Can you un-claim?

## Decision

- **Claims are by item name**, not by `(item, player)`. The shared map is `Y.Map<itemName, { by, at }>`.
- **First-to-claim wins the item.** When you tap a cell, if no entry exists for that item in the shared map, you write `{ by: yourName, at: Date.now() }`. If an entry already exists, your tap is a no-op (silent — the cell visually shows the existing claim).
- **Owners can un-claim.** Tapping your own claim deletes it. Others' claims you cannot delete.
- **Your card's cells visually reflect** the shared claim regardless of who claimed it. If you have "Cow in a field" and your sister claimed it on her card, it shows as claimed on your card too, with her name. This is the point of the game — phones share the spotting work.
- **Win detection runs locally** on every phone for its own card. The first phone to detect a 5-in-a-line writes the winner. Yjs's last-write-wins on `winner.first` resolves ties cleanly.

## Consequences

- Two phones can have "Yellow car" on their cards; whichever taps first owns it on the shared map, but **both phones get the cell flipped**. This is what people actually want — the car was spotted; both players should benefit.
- A malicious player could spam-claim every item, but social pressure handles this in a car. The reset button is always available.

## Alternatives considered

- **Per-player private claims.** Rejected — defeats the "we're all spotting together" feel.
- **First-claim takes the win point, others don't flip.** Rejected — slow phones lose every race; bad UX.
