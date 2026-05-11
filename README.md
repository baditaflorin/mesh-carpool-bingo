# mesh-carpool-bingo

[![Live](https://img.shields.io/badge/live-baditaflorin.github.io%2Fmesh--carpool--bingo-5EFF8A?style=flat-square)](https://baditaflorin.github.io/mesh-carpool-bingo/)
[![Version](https://img.shields.io/github/package-json/v/baditaflorin/mesh-carpool-bingo?style=flat-square&color=6a8a7a)](https://github.com/baditaflorin/mesh-carpool-bingo/blob/main/package.json)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![No backend](https://img.shields.io/badge/backend-none-1a160a?style=flat-square)](docs/adr/0001-deployment-mode.md)

> Peer-to-peer mesh: road-trip bingo. Per-phone unique 5×5 cards, shared claim space across the car. First to a line wins.

**Live:** https://baditaflorin.github.io/mesh-carpool-bingo/

Open the link on every phone in the car. Each player types their name. Each phone gets a unique 5×5 bingo card derived deterministically from `(roomId, playerName)` — so the cards differ but they're reproducible if you reload. The **claim space** is shared: when someone taps "Yellow car" on their phone, every phone sees it claimed.

First to a row, column, or diagonal wins.

## How it works

- **Card generation** — `SHA-256(roomId || playerId)` seeds a Fisher-Yates shuffle of a 40-item pool. Cards are different across phones but reproducible. Center is always `FREE`.
- **Claim space** — a shared `Y.Map<itemName, { by: playerName, at }>`. The first phone to claim an item wins it; once claimed, others see it crossed out (or in their accent color if they own the claim).
- **Win check** — every phone runs `isWin()` locally on its own card whenever the claim map updates. The first phone to detect a win on its card writes to the shared `winner` map (last-write-wins resolves ties cleanly).

## Privacy threat model

See [docs/privacy.md](docs/privacy.md). What's on the wire: your name, your claims (item name + your name + timestamp). No location, no photos.

## Architecture

- **Mode A** — pure GitHub Pages.
- **WebRTC** — Yjs + y-webrtc with self-hosted signaling and TURN.

## Run it locally

```bash
git clone https://github.com/baditaflorin/mesh-carpool-bingo.git
cd mesh-carpool-bingo
npm install
npm run dev
```

## Self-hosted infrastructure

| Repo                                                                   | Endpoint                               | Role                      |
| ---------------------------------------------------------------------- | -------------------------------------- | ------------------------- |
| [signaling-server](https://github.com/baditaflorin/signaling-server)   | `wss://turn.0docker.com/ws`            | y-webrtc protocol fan-out |
| [turn-token-server](https://github.com/baditaflorin/turn-token-server) | `https://turn.0docker.com/credentials` | HMAC TURN creds           |
| [coturn-hetzner](https://github.com/baditaflorin/coturn-hetzner)       | `turn:turn.0docker.com:3479`           | TURN relay                |

## ADRs

- [0001 — Deployment mode](docs/adr/0001-deployment-mode.md)
- [0002 — Deterministic card generation](docs/adr/0002-card-generation.md)
- [0003 — Claim model](docs/adr/0003-claim-model.md)
- [0010 — GitHub Pages publishing](docs/adr/0010-pages-publishing.md)

## License

[MIT](LICENSE) © 2026 Florin Badita
