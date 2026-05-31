import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

/**
 * Load-bearing cross-peer assertion for the ADVERTISED core action:
 *
 *   "the claim space is shared: when someone taps 'Yellow car' on their
 *    phone, every phone sees it claimed."
 *
 * Each phone draws a DIFFERENT 5x5 card from the same 40-item pool, but the
 * claim space is a shared Y.Map<itemName, {by, at}>. So we read both rendered
 * cards, pick an item that appears on BOTH, claim it on peer A, and assert
 * peer B's cell for that same item flips to "claimed" and shows A's name as
 * the claimer.
 *
 * This fails if a claim is written to local React state instead of the shared
 * Y.Map("claims"), if the two peers read/write mismatched keys, or if the
 * claim never re-renders from the synced doc.
 */

const cardItems = async (page: import("@playwright/test").Page): Promise<string[]> =>
  page.locator(".bingo-cell .bingo-cell-label").allInnerTexts();

test("a claim on peer A appears claimed (with A's name) on peer B", async ({
  browser,
  baseURL,
}) => {
  const { context, a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix,
  });
  try {
    // openTwoPeers shares ONE localStorage origin across both pages. App.tsx
    // reads `name` into React state ONCE at mount, so we can still give the two
    // peers DISTINCT names by setting + reloading SEQUENTIALLY: A reads "Alice"
    // and keeps it in state; then B's setItem("Bob") + reload only affects B
    // (A has already latched "Alice"). This lets us assert the claimer's name
    // crosses the mesh AND that the receiving peer does NOT mistake it for its
    // own claim.
    await a.evaluate((p) => localStorage.setItem(`${p}:name`, "Alice"), storagePrefix);
    await a.reload();
    await a.getByRole("button", { name: /get my card/i }).click();

    await b.evaluate((p) => localStorage.setItem(`${p}:name`, "Bob"), storagePrefix);
    await b.reload();
    await b.getByRole("button", { name: /get my card/i }).click();

    // Wait for both cards to render (25 cells each).
    await expect(a.locator(".bingo-cell")).toHaveCount(25);
    await expect(b.locator(".bingo-cell")).toHaveCount(25);

    // Find an item present on BOTH cards (excluding FREE) so the claim is
    // visible on peer B's grid.
    const aItems = await cardItems(a);
    const bItems = await cardItems(b);
    const shared = aItems.find((i) => i !== "FREE" && bItems.includes(i));
    expect(shared, "expected at least one shared item across the two cards").toBeTruthy();
    const item = shared as string;

    // Exact-text cell locators (item names can be substrings of one another,
    // e.g. "License plate from …", so filter on an exact-text label child).
    const cellFor = (page: import("@playwright/test").Page) =>
      page
        .locator(".bingo-cell")
        .filter({ has: page.getByText(item, { exact: true }) })
        .first();
    const bCell = cellFor(b);

    // Peer B's cell for the shared item is initially unclaimed.
    await expect(bCell).not.toHaveClass(/claimed/);

    // Peer A taps to claim it.
    await cellFor(a).click();

    // Peer B — the OPPOSITE phone — now sees the item claimed, attributed to
    // Alice, and NOT owned by Bob (no "mine" class).
    await expect(bCell).toHaveClass(/claimed/);
    await expect(bCell.locator(".bingo-cell-claimer")).toHaveText("Alice");
    await expect(bCell).not.toHaveClass(/mine/);

    // Live both ways: peer A un-claims → peer B's cell clears again, proving
    // B re-reads the synced Y.Map rather than caching a stale claim.
    await cellFor(a).click();
    await expect(bCell).not.toHaveClass(/claimed/);
  } finally {
    await cleanup();
    await context.close().catch(() => {});
  }
});
