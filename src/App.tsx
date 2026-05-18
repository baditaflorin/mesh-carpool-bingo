import { useEffect, useState } from "react";
import { MeshShell } from "@baditaflorin/mesh-common";
import { Bingo } from "./features/bingo/Bingo";
import { SettingsExtras } from "./features/settings/SettingsExtras";
import { appConfig } from "./shared/config";

const STORAGE = {
  room: `${appConfig.storagePrefix}:room`,
  name: `${appConfig.storagePrefix}:name`,
};

export function App() {
  const [roomId, setRoomId] = useState(() => localStorage.getItem(STORAGE.room) ?? "default");
  const [myName, setMyName] = useState(() => localStorage.getItem(STORAGE.name) ?? "");

  useEffect(() => {
    localStorage.setItem(STORAGE.room, roomId);
  }, [roomId]);
  useEffect(() => {
    localStorage.setItem(STORAGE.name, myName);
  }, [myName]);

  // On first load with no name set, pop open MeshShell's settings drawer so the
  // user can enter their name (preserves the pre-migration behavior).
  useEffect(() => {
    if (myName) return;
    const id = requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(".mesh-settings-fab")?.click();
    });
    return () => cancelAnimationFrame(id);
    // Only run once on mount; we intentionally don't react to myName changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MeshShell
      config={appConfig}
      roomId={roomId}
      onRoomChange={setRoomId}
      settingsExtras={<SettingsExtras myName={myName} onMyNameChange={setMyName} />}
    >
      <Bingo roomId={roomId} myName={myName || "Anonymous"} />
    </MeshShell>
  );
}
