import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

/**
 * Load-bearing cross-peer assertion for the SECOND advertised core action:
 *
 *   "First to a row, column, or diagonal wins. The first phone to detect a win
 *    on its card writes to the shared `winner` map — every phone sees who won."
 *
 * Each phone runs isWin() locally on its OWN card. When a phone detects a win
 * it writes to the shared Y.Map("winner"). We force a win on peer A by claiming
 * every item on A's card (any full row guarantees a win), then assert peer B —
 * which never detected the win itself — still shows the winner banner naming A.
 *
 * This fails if the winner is kept in local state instead of Y.Map("winner"),
 * if the two peers read/write a mismatched winner key, or if the banner never
 * re-renders from the synced doc.
 */

const cardItems = async (page: import("@playwright/test").Page): Promise<string[]> =>
  page.locator(".bingo-cell .bingo-cell-label").allInnerTexts();

test("a win on peer A shows the winner banner naming A on peer B", async ({ browser, baseURL }) => {
  const { context, a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix,
  });
  try {
    await a.evaluate((p) => localStorage.setItem(`${p}:name`, "Alice"), storagePrefix);
    await a.reload();
    await a.getByRole("button", { name: /get my card/i }).click();

    await b.evaluate((p) => localStorage.setItem(`${p}:name`, "Bob"), storagePrefix);
    await b.reload();
    await b.getByRole("button", { name: /get my card/i }).click();

    await expect(a.locator(".bingo-cell")).toHaveCount(25);
    await expect(b.locator(".bingo-cell")).toHaveCount(25);

    // Neither peer has a winner yet.
    await expect(a.locator(".bingo-winner")).toHaveCount(0);
    await expect(b.locator(".bingo-winner")).toHaveCount(0);

    // Claim items on A's card until A completes a line. Claiming the whole card
    // guarantees a win. The winner banner is rendered by a React effect AFTER the
    // claim state updates, so it can appear mid-loop and overlay the grid; once it
    // does, further cell clicks are intercepted — which is itself proof A detected
    // the win. We swallow the intercepted-click error and stop on the banner.
    // FREE is disabled, so we skip it.
    const aLabels = (await cardItems(a)).filter((label) => label !== "FREE");
    const aWinner = a.locator(".bingo-winner");
    for (const label of aLabels) {
      if ((await aWinner.count()) > 0) break;
      await a
        .locator(".bingo-cell")
        .filter({ has: a.getByText(label, { exact: true }) })
        .first()
        .click({ timeout: 2000 })
        .catch(() => {
          // Click intercepted by the winner overlay that just appeared — A has won.
        });
    }
    await expect(aWinner).toBeVisible();

    // Peer B — which never had a winning card itself — sees the banner naming A,
    // proving the winner crossed the mesh via the shared Y.Map("winner").
    const bWinner = b.locator(".bingo-winner");
    await expect(bWinner).toBeVisible();
    await expect(bWinner).toContainText("Alice");
  } finally {
    await cleanup();
    await context.close().catch(() => {});
  }
});
