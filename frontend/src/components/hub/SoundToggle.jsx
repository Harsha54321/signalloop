import React, { useEffect, useState } from "react";
import { isSoundOn, setSoundOn, onSoundChange } from "../../utils/sfx";

export default function SoundToggle() {
  const [on, setOn] = useState(isSoundOn());

  useEffect(() => onSoundChange(setOn), []);

  return (
    <button
      type="button"
      className="sl-iconbtn"
      onClick={() => setSoundOn(!on)}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      title={on ? "Sound on" : "Sound off"}
    >
      {on ? "🔊" : "🔇"}
    </button>
  );
}
