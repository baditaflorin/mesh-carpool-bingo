export const ITEM_POOL = [
  "Yellow car",
  "Red truck",
  "Motorcycle",
  "Out-of-state plate",
  "Tow truck",
  "School bus",
  "RV / motorhome",
  "Police car",
  "Convertible",
  "Billboard with a typo",
  "Cow in a field",
  "Horse",
  "Farm tractor",
  "Hay bales",
  "Wind turbine",
  "Solar panels",
  "Bird on a wire",
  "Lake or river",
  "Bridge",
  "Tunnel",
  "Construction zone",
  "Speed-camera sign",
  "Toll booth",
  "Roadkill",
  "Hitchhiker",
  "Bumper sticker that makes you laugh",
  "Out-of-place car (sports car on dirt road, etc.)",
  "Roof-rack bike",
  "Camper trailer",
  "Vanity license plate",
  "License plate from your home state",
  "License plate from a neighbouring state",
  "Yellow caution flag",
  "Roadside food stand",
  "Big rig with logo you recognise",
  "Driver waving at another driver",
  "Sleeping passenger (not in your car)",
  "Dog with head out window",
  "Rest area sign",
  "Mile marker ending in 00",
] as const;

export type Item = (typeof ITEM_POOL)[number];

const CENTER = "FREE";

export async function generateCard(roomId: string, playerId: string): Promise<string[]> {
  const seedBytes = new TextEncoder().encode(`${roomId}::${playerId}`);
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", seedBytes.buffer as ArrayBuffer),
  );
  // Use the digest as the seed for a Fisher-Yates shuffle.
  const stream: number[] = [];
  let ctr = 0;
  while (stream.length < ITEM_POOL.length * 4) {
    const buf = new Uint8Array(digest.length + 4);
    buf.set(digest, 0);
    new DataView(buf.buffer).setUint32(digest.length, ctr++, false);
    const h = new Uint8Array(await crypto.subtle.digest("SHA-256", buf.buffer as ArrayBuffer));
    for (const b of h) stream.push(b);
  }
  const items = ITEM_POOL.slice() as string[];
  for (let i = items.length - 1; i > 0; i--) {
    const r =
      ((stream[i * 4] ?? 0) << 24) |
      ((stream[i * 4 + 1] ?? 0) << 16) |
      ((stream[i * 4 + 2] ?? 0) << 8) |
      (stream[i * 4 + 3] ?? 0);
    const j = Math.abs(r) % (i + 1);
    const tmp = items[i] as string;
    items[i] = items[j] as string;
    items[j] = tmp;
  }
  const picked = items.slice(0, 25);
  picked[12] = CENTER; // center is always FREE
  return picked;
}

export function isWin(claimed: boolean[]): boolean {
  // 5×5 lines: 5 rows, 5 cols, 2 diagonals
  for (let r = 0; r < 5; r++) {
    if (claimed.slice(r * 5, r * 5 + 5).every(Boolean)) return true;
  }
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every((r) => claimed[r * 5 + c])) return true;
  }
  if ([0, 6, 12, 18, 24].every((i) => claimed[i])) return true;
  if ([4, 8, 12, 16, 20].every((i) => claimed[i])) return true;
  return false;
}
