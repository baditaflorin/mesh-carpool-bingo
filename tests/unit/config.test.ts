import { describe, expect, it } from "vitest";
import { appConfig } from "../../src/shared/config";

describe("appConfig", () => {
  it("keeps Carpool Bingo's stable identity and canonical endpoints", () => {
    expect(appConfig).toMatchObject({
      appName: "mesh-carpool-bingo",
      storagePrefix: "mesh-carpool-bingo",
      repositoryUrl: "https://github.com/baditaflorin/mesh-carpool-bingo",
      pagesUrl: "https://baditaflorin.github.io/mesh-carpool-bingo/",
    });
    expect(appConfig.description).toContain("road-trip bingo");
    expect(appConfig.accentHex).toMatch(/^#[\da-f]{6}$/i);
    expect(appConfig.signalingUrl).toMatch(/^wss:\/\//);
    expect(appConfig.turnTokenUrl).toMatch(/^https:\/\//);
  });
});
