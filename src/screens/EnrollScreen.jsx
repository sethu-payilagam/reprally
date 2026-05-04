import { useState } from "react";
import { supabase } from "../supabaseClient";
import { GROUPS } from "../groups";

export default function EnrollScreen({ userId, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleJoin() {
    if (!selected) return;
    setSaving(true);
    await supabase.from("profiles").update({ group_id: selected }).eq("id", userId);
    setSaving(false);
    onComplete();
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#080808", padding: "24px 20px 48px",
      fontFamily: "'Barlow Condensed', sans-serif"
    }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36, paddingTop: 20 }}>
          <div style={{ color: "#ff4d00", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
            Welcome to RepRally
          </div>
          <div style={{ color: "#fff", fontSize: 30, fontWeight: 900, letterSpacing: 1 }}>
            Choose Your Challenge
          </div>
          <div style={{ color: "#444", fontSize: 14, marginTop: 8 }}>
            Pick the group that matches your fitness level. You're in this for the month!
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {GROUPS.map(g => (
            <div
              key={g.id}
              onClick={() => setSelected(g.id)}
              style={{
                background: selected === g.id ? "#0f0f0f" : "#0a0a0a",
                border: `1.5px solid ${selected === g.id ? g.color : "#1a1a1a"}`,
                borderRadius: 18, padding: "20px 22px", cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: selected === g.id ? `0 0 0 1px ${g.color}22, 0 8px 32px ${g.color}15` : "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: `${g.color}18`, border: `1px solid ${g.color}33`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24
                }}>{g.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: 0.5 }}>
                      Group {g.id} — {g.name}
                    </span>
                    {selected === g.id && (
                      <span style={{
                        background: g.color, color: "#fff", fontSize: 10,
                        padding: "2px 8px", borderRadius: 20, fontWeight: 700, letterSpacing: 1
                      }}>SELECTED</span>
                    )}
                  </div>
                  <div style={{ color: g.color, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                    {g.tagline}
                  </div>
                  <div style={{ color: "#555", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                    {g.description}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {g.exercises.map(ex => (
                      <span key={ex.id} style={{
                        background: "#111", border: "1px solid #1f1f1f",
                        borderRadius: 6, padding: "4px 10px",
                        color: "#666", fontSize: 12
                      }}>{ex.icon} {ex.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleJoin}
          disabled={!selected || saving}
          style={{
            marginTop: 28, width: "100%", padding: "16px",
            background: selected ? "linear-gradient(135deg, #ff4d00, #ff7a00)" : "#111",
            color: selected ? "#fff" : "#333",
            border: "none", borderRadius: 14, fontSize: 18,
            fontWeight: 900, cursor: selected ? "pointer" : "default",
            letterSpacing: 2, textTransform: "uppercase",
            fontFamily: "'Barlow Condensed', sans-serif",
            boxShadow: selected ? "0 8px 28px rgba(255,77,0,0.35)" : "none",
            transition: "all 0.2s"
          }}
        >{saving ? "Joining..." : selected ? `Join Group ${selected} — ${GROUPS.find(g=>g.id===selected)?.name} →` : "Select a Group"}</button>
      </div>
    </div>
  );
}
