import { useState } from "react";
import { GROUPS } from "../groups";
import { T, FONT, FONT_DISPLAY } from "../theme";

export default function LogModal({ defaultGroupId, groups = GROUPS, onLog, onClose }) {
  const [groupId,    setGroupId]    = useState(defaultGroupId || groups[0]?.id);
  const [exerciseId, setExerciseId] = useState(null);
  const [reps,       setReps]       = useState("");
  const [note,       setNote]       = useState("");

  const group   = groups.find(g => g.id === Number(groupId)) || groups[0];
  const exId    = exerciseId || group?.exercises?.[0]?.id;
  const ex      = group?.exercises?.find(e => e.id === exId);
  const isSteps = exId === "steps";
  const isMins  = ex?.unitOverride === "min";
  const unit    = isSteps ? "steps" : isMins ? "minutes" : "reps";

  function handleGroupChange(newGroupId) {
    setGroupId(Number(newGroupId));
    setExerciseId(null); // reset exercise when group changes
  }

  function handleSubmit() {
    if (!reps || Number(reps) <= 0) return;
    onLog({ exercise_id: exId, reps: Number(reps), note, group_id: group.id });
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 100
    }} onClick={onClose}>
      <div style={{
        background: T.card, borderRadius: "20px 20px 0 0",
        width: "100%", maxWidth: 520,
        border: `1px solid ${T.border}`, borderBottom: "none",
        fontFamily: FONT,
        paddingBottom: "env(safe-area-inset-bottom, 20px)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.12)"
      }} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 40, height: 4, background: T.border, borderRadius: 2 }} />
        </div>

        <div style={{ padding: "16px 24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ color: T.text, fontWeight: 800, fontSize: 20, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>LOG WORKOUT</div>
            <button onClick={onClose} style={{
              background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: "50%",
              width: 32, height: 32, color: T.muted, fontSize: 18,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}>×</button>
          </div>

          {/* Group selector */}
          <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
            Which Group?
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {groups.map(g => (
              <div key={g.id} onClick={() => handleGroupChange(g.id)} style={{
                padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                border: `2px solid ${groupId === g.id ? g.color : T.border}`,
                background: groupId === g.id ? `${g.color}10` : T.cardAlt,
                transition: "all 0.15s", display: "flex", alignItems: "center", gap: 8
              }}>
                <span style={{ fontSize: 18 }}>{g.icon}</span>
                <div>
                  <div style={{ color: groupId === g.id ? T.text : T.muted, fontSize: 13, fontWeight: 700 }}>
                    Group {g.id}
                  </div>
                  <div style={{ color: groupId === g.id ? g.color : T.subtle, fontSize: 11 }}>{g.name}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Exercise picker */}
          <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
            Exercise
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {group?.exercises?.map(e => (
              <div key={e.id} onClick={() => setExerciseId(e.id)} style={{
                padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                border: `2px solid ${exId === e.id ? group.color : T.border}`,
                background: exId === e.id ? `${group.color}10` : T.cardAlt,
                transition: "all 0.15s"
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{e.icon}</div>
                <div style={{ color: exId === e.id ? T.text : T.textMid, fontSize: 13, fontWeight: 700 }}>{e.label}</div>
                {e.note && <div style={{ color: T.subtle, fontSize: 11, marginTop: 2 }}>{e.note}</div>}
              </div>
            ))}
          </div>

          {/* Amount */}
          <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
            How many {unit}?
          </div>
          <input
            type="number"
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder={isSteps ? "e.g. 8500" : isMins ? "e.g. 5" : "e.g. 50"}
            style={{
              display: "block", width: "100%", marginBottom: 16,
              background: T.cardAlt, border: `1.5px solid ${T.border}`,
              borderRadius: 12, padding: "14px 16px", color: T.text,
              fontSize: 22, fontWeight: 800, outline: "none",
              boxSizing: "border-box", fontFamily: FONT_DISPLAY, letterSpacing: 1
            }}
          />

          {/* Note */}
          <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
            Note (optional)
          </div>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder='e.g. "Morning session, OTF class"'
            style={{
              display: "block", width: "100%", marginBottom: 20,
              background: T.cardAlt, border: `1.5px solid ${T.border}`,
              borderRadius: 12, padding: "13px 16px", color: T.text,
              fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: FONT
            }}
          />

          <button onClick={handleSubmit} disabled={!reps || Number(reps) <= 0} style={{
            width: "100%", padding: "15px",
            background: reps && Number(reps) > 0
              ? `linear-gradient(135deg, ${group?.color || T.accent}, ${group?.color || T.accent}cc)`
              : T.border,
            color: reps && Number(reps) > 0 ? "#fff" : T.muted,
            border: "none", borderRadius: 14, fontSize: 17,
            fontWeight: 800, cursor: reps && Number(reps) > 0 ? "pointer" : "default",
            letterSpacing: 1.5, textTransform: "uppercase", fontFamily: FONT_DISPLAY,
            boxShadow: reps && Number(reps) > 0 ? `0 6px 20px ${group?.color || T.accent}44` : "none",
            transition: "all 0.2s"
          }}>
            {reps && Number(reps) > 0
              ? `Bank ${Number(reps).toLocaleString()} ${unit} 🔥`
              : `Enter ${unit}`}
          </button>
        </div>
      </div>
    </div>
  );
}
