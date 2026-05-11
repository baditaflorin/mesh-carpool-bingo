---
status: accepted
date: 2026-05-11
---

# 0002 — Deterministic card generation

## Context

Every phone needs a unique 5×5 card from a 40-item pool. If two phones in the same room had the same card the game would be boring. If a phone's card changed on reload mid-trip, players would feel cheated.

## Decision

Card is a pure function of `(roomId, playerId)`:

```ts
seed     = SHA-256(roomId || "::" || playerId)
shuffled = FisherYates(pool, prng_seeded_by(seed))
card     = shuffled[0..24]   // center slot 12 is overwritten with FREE
```

`playerId` is `${playerName}|${random-6-hex}`, mixed once at App mount and persisted in component state. (We use a random suffix so two players named "Alex" in the same car don't get the same card.)

## Consequences

- **Same card across reloads** for a given `(room, player)`.
- **Different cards** for different players, even in the same room.
- **No phone-to-phone agreement needed** on card layout; just on the item pool, which is in code.
- **The "Anonymous" default name + random suffix** means two unnamed phones get different cards.

## Alternatives considered

- **Random card each session.** Rejected — refreshing your phone would invalidate your spotted-but-unclaimed items.
- **One card per phone, broadcast in the room.** Adds coordination and a "what if two phones generate the same card at the same instant" race. The deterministic derivation is simpler.
