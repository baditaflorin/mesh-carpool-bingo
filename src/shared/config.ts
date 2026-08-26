export const appConfig = {
  appName: "mesh-carpool-bingo",
  breadcrumbs: false,
  storagePrefix: "mesh-carpool-bingo",
  description:
    "Peer-to-peer mesh: road-trip bingo. Per-phone unique 5x5 cards, shared claim space across the car. First to a line wins.",
  accentHex: "#5eff8a",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
  repositoryUrl: "https://github.com/baditaflorin/mesh-carpool-bingo",
  pagesUrl: "https://baditaflorin.github.io/mesh-carpool-bingo/",
  signalingUrl:
    (import.meta.env.VITE_WEBRTC_SIGNALING as string | undefined) ?? "wss://turn.0docker.com/ws",
  turnTokenUrl:
    (import.meta.env.VITE_TURN_TOKEN_URL as string | undefined) ??
    "https://turn.0docker.com/credentials",
  paypalUrl: "https://www.paypal.com/paypalme/florinbadita",
} as const;
