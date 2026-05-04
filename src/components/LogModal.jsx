import { useState } from "react";

export default function LogModal({ group, onLog, onClose }) {
  const [exerciseId, setExerciseId] = useState(group?.exercises?.[0]?.id || "");
  const [reps, setReps] = useState("");
  const [note, setNote] = useState("");

  const ex = group?.exercises?.find(e => e.id === exerciseId);
  const isSteps = exerciseId === "steps";
  const isMinutes = ex?.unitOverride === "min";
  const unitLabel = isSteps ? "steps" : isMinutes ? "minutes" : "reps";

  function handleSubmit() {
    if (!reps || Number(reps) <= 0) return;
    onLog({ exercise_id: exerciseId, reps: Number(reps), note });
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 100, padding: "0 0 0 0"
    }} onClick={onClose}>
      <div style={{
        background: "#0f0f0f", borderRadius: "20px 20px 0 0",
        width: "100%", maxWidth: 520,
        border: "1px solid #1a1a1a", borderBottom: "none",
        fontFamily: "'Barlow Condensed', sans-serif",
        paddingBottom: "env(safe-area-inset-bottom, 20px)"
      }} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 40, height: 4, background: "#222", borderRadius: 2 }} />
        </div>

        <div style={{ padding: "16px 24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: 1 }}>LOG WORKOUT</div>
            <button onClick={onClose} style={{
              background: "#1a1a1a", border: "none", borderRadius: "50%",
              width: 32, height: 32, color: "#555", fontSize: 18,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}>×</button>
          </div>

          {/* Exercise picker */}
          <div style={{ color: "#444", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Exercise
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
            {group?.exercises?.map(ex => (
              <div
                key={ex.id}
                onClick={() => setExerciseId(ex.id)}
                style={{
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                  border: exerciseId === ex.id
                    ? `1.5px solid ${group.color}`
                    : "1.5px solid #1a1a1a",
                  background: exerciseId === ex.id ? `${group.color}12` : "#0a0a0a",
                  transition: "all 0.15s"
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{ex.icon}</div>
                <div style={{ color: exerciseId === ex.id ? "#fff" : "#666", fontSize: 14, fontWeight: 700 }}>
                  {ex.label}
                </div>
                {ex.note && (
                  <div style={{ color: "#2a2a2a", fontSize: 11, marginTop: 3 }}>{ex.note}</div>
                )}
              </div>
            ))}
          </div>

          {/* Amount */}
          <div style={{ color: "#444", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            How many {unitLabel}?
          </div>
          <input
            type="number"
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder={isSteps ? "e.g. 8500" : isMinutes ? "e.g. 5" : "e.g. 50"}
            style={{
              display: "block", width: "100%", marginBottom: 18,
              background: "#080808", border: "1px solid #1f1f1f",
              borderRadius: 12, padding: "14px 16px", color: "#fff",
              fontSize: 22, fontWeight: 900, outline: "none",
              boxSizing: "border-box", fontFamily: "inherit",
              letterSpacing: 1
            }}
          />

          {/* Note */}
          <div style={{ color: "#444", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Note (optional)
          </div>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder='e.g. "Morning session, OTF class"'
            style={{
              display: "block", width: "100%", marginBottom: 22,
              background: "#080808", border: "1px solid #1f1f1f",
              borderRadius: 12, padding: "13px 16px", color: "#fff",
              fontSize: 14, outline: "none",
              boxSizing: "border-box", fontFamily: "inherit"
            }}
          />

          <button
            onClick={handleSubmit}
            disabled={!reps || Number(reps) <= 0}
            style={{
              width: "100%", padding: "16px",
              background: reps && Number(reps) > 0
                ? `linear-gradient(135deg, ${group?.color || "#ff4d00"}, ${group?.color || "#ff4d00"}cc)`
                : "#111",
              color: reps && Number(reps) > 0 ? "#fff" : "#333",
              border: "none", borderRadius: 14, fontSize: 18,
              fontWeight: 900, cursor: reps && Number(reps) > 0 ? "pointer" : "default",
              letterSpacing: 2, textTransform: "uppercase",
              fontFamily: "'Barlow Condensed', sans-serif",
              boxShadow: reps && Number(reps) > 0
                ? `0 8px 24px ${group?.color || "#ff4d00"}44`
                : "none",
              transition: "all 0.2s"
            }}
          >
            {reps && Number(reps) > 0
              ? `Bank ${Number(reps).toLocaleString()} ${unitLabel} 🔥`
              : `Enter ${unitLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
