type Props = {
  myName: string;
  onMyNameChange: (next: string) => void;
};

export function SettingsExtras({ myName, onMyNameChange }: Props) {
  return (
    <>
      <label>
        <span>Your name</span>
        <input
          value={myName}
          onChange={(e) => onMyNameChange(e.target.value)}
          placeholder="Anonymous"
        />
      </label>

      <p className="settings-help">
        Phones in the same Room ID share a claim space. Each phone's card is unique (derived from
        room + name) but the claims are shared.
      </p>
    </>
  );
}
