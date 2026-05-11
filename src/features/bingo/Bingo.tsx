import { useEffect, useMemo, useState } from "react";
import { createRoomSync } from "../sync/yjsRoom";
import { maybeFetchTurnCredentials } from "../sync/iceConfig";
import { generateCard, isWin } from "./items";

type ClaimRec = { by: string; at: number };

type Props = {
  roomId: string;
  myName: string;
};

export function Bingo({ roomId, myName }: Props) {
  const [armed, setArmed] = useState(false);
  const [card, setCard] = useState<string[]>([]);
  const [claims, setClaims] = useState<Record<string, ClaimRec>>({});
  const [winner, setWinner] = useState<string | null>(null);
  const myId = useMemo(() => `${myName}|${crypto.randomUUID().slice(0, 6)}`, [myName]);

  const mesh = useMemo(() => {
    if (!armed) return null;
    const room = createRoomSync(roomId);
    const yClaims = room.doc.getMap<ClaimRec>("claims");
    const yWinner = room.doc.getMap<{ name: string }>("winner");
    return { room, yClaims, yWinner };
  }, [armed, roomId]);

  useEffect(() => {
    if (!armed) return;
    void maybeFetchTurnCredentials();
  }, [armed]);

  useEffect(() => {
    return () => {
      mesh?.room.provider?.destroy();
    };
  }, [mesh]);

  useEffect(() => {
    if (!armed) return;
    void (async () => {
      const c = await generateCard(roomId, myId);
      setCard(c);
    })();
  }, [armed, roomId, myId]);

  useEffect(() => {
    if (!mesh) return undefined;
    const refresh = () => {
      setClaims(Object.fromEntries(mesh.yClaims.entries()));
      const w = mesh.yWinner.get("first");
      setWinner(w?.name ?? null);
    };
    mesh.yClaims.observe(refresh);
    mesh.yWinner.observe(refresh);
    refresh();
    return () => {
      mesh.yClaims.unobserve(refresh);
      mesh.yWinner.unobserve(refresh);
    };
  }, [mesh]);

  const claimedFlags = card.map((item) => item === "FREE" || item in claims);

  // Detect a win
  useEffect(() => {
    if (!mesh || winner) return;
    if (card.length === 0) return;
    if (isWin(claimedFlags)) {
      mesh.yWinner.set("first", { name: myName });
    }
  }, [mesh, winner, claimedFlags, card.length, myName]);

  const onClaim = (item: string) => {
    if (!mesh) return;
    if (item === "FREE") return;
    if (item in claims) return;
    mesh.yClaims.set(item, { by: myName, at: Date.now() });
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const onUnclaim = (item: string) => {
    if (!mesh) return;
    if (claims[item]?.by !== myName) return;
    mesh.yClaims.delete(item);
  };

  const onReset = () => {
    if (!mesh) return;
    mesh.room.doc.transact(() => {
      mesh.yClaims.clear();
      mesh.yWinner.clear();
    });
  };

  if (!armed) {
    return (
      <div className="bingo-arm">
        <h1>mesh-carpool-bingo</h1>
        <p>
          Road-trip bingo. Each phone gets a unique 5×5 card derived from this room + your name.
          Spot something? Tap to claim. Claims are shared across all phones in the car — first to a
          row, column, or diagonal wins snacks at the next stop.
        </p>
        <button type="button" className="bingo-arm-button" onClick={() => setArmed(true)}>
          Get my card as <strong>{myName}</strong>
        </button>
      </div>
    );
  }

  return (
    <div className="bingo-stage">
      <div className="bingo-hud">
        <span>{myName}</span>
        <span>{Object.keys(claims).length} / 40 spotted</span>
      </div>

      <div className="bingo-grid">
        {card.map((item, i) => {
          const claim = claims[item];
          const claimed = claimedFlags[i];
          const mine = claim?.by === myName;
          return (
            <button
              key={i}
              type="button"
              className={`bingo-cell ${claimed ? "claimed" : ""} ${mine ? "mine" : ""} ${item === "FREE" ? "free" : ""}`}
              onClick={() => (mine ? onUnclaim(item) : onClaim(item))}
              disabled={item === "FREE"}
            >
              <span className="bingo-cell-label">{item}</span>
              {claimed && item !== "FREE" && claim && (
                <span className="bingo-cell-claimer">{claim.by}</span>
              )}
            </button>
          );
        })}
      </div>

      {winner && (
        <div className="bingo-winner">
          <h2>🎉 {winner} wins!</h2>
          <p>5 in a line. Snacks at the next stop.</p>
          <button type="button" onClick={onReset}>
            New round
          </button>
        </div>
      )}

      <button type="button" className="bingo-reset" onClick={onReset}>
        Reset round
      </button>
    </div>
  );
}
