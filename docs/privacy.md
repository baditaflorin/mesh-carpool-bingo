# Privacy threat model — mesh-carpool-bingo

## What other peers in the same room can see

- Your name.
- Your claims (item name + your name + timestamp).
- The winner.

## What other peers CANNOT see

- Your card layout. Each phone derives its own card locally; the layout is never published. (Two phones with the same name in the same room would have the same card, but we add a random suffix to prevent that.)
- Your location.
- Your driving direction or speed.

## What the signaling server sees

The room name and encrypted SDP offers/answers.

## What the TURN server sees

Encrypted DTLS/SRTP bytes if peers can't connect directly.
