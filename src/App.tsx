import { useEffect, useState } from "react";
import { Bingo } from "./features/bingo/Bingo";
import { SettingsDrawer } from "./features/settings/SettingsDrawer";
import { appConfig } from "./shared/config";

const STORAGE = {
  room: `${appConfig.storagePrefix}:room`,
  name: `${appConfig.storagePrefix}:name`,
};

export function App() {
  const [roomId, setRoomId] = useState(() => localStorage.getItem(STORAGE.room) ?? "default");
  const [myName, setMyName] = useState(() => localStorage.getItem(STORAGE.name) ?? "");
  const [settingsOpen, setSettingsOpen] = useState(!myName);

  useEffect(() => {
    localStorage.setItem(STORAGE.room, roomId);
  }, [roomId]);
  useEffect(() => {
    localStorage.setItem(STORAGE.name, myName);
  }, [myName]);

  return (
    <div className="app-root">
      <Bingo roomId={roomId} myName={myName || "Anonymous"} />

      <button
        type="button"
        className="settings-fab"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        ⚙
      </button>

      <div className="version-badge">
        v{appConfig.version} · {appConfig.commit}
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        roomId={roomId}
        onRoomChange={setRoomId}
        myName={myName}
        onMyNameChange={setMyName}
      />
    </div>
  );
}
