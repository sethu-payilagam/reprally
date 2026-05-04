import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { getGroup, getGroupProgress, GROUPS } from "../groups";
import LogModal from "../components/LogModal";

export default function Dashboard({ profile, onSignOut, onProfileUpdate }) {
  const [logs, setLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const group = getGroup(profile.group_id);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [{ data: myLogs }, { data: profiles }, { data: everyone }] = await Promise.all([
      supabase.from("logs").select("*").eq("user_id", profile.id).order("logged_at", { ascending: false }),
      supabase.from("profiles").select("id,display_name,group_id,avatar_emoji").eq("approved", true),
      supabase.from("logs").select("*").order("logged_at", { ascending: false }).limit(200)
    ]);
    setLogs(myLogs || []);
    setAllProfiles(profiles || []);
    setAllLogs(everyone || []);
    setLoading(false);
  }

  async function handleLog(entry) {
    const { error } = await supabase.from("logs").insert({
      user_id: profile.id, ...entry, logged_at: new Date().toISOString()
    });
    if (!error) {
      setToast("Reps banked! 🔥");
      setTimeout(() => setToast(null), 2500);
      fetchData();
    }
    setShowLog(false);
  }

  const myProgress = getGroupProgress(group, logs);
  const groupColor = group?.color || "#ff4d00";

  // Leaderboard: across ALL groups
  const leaderboard = allProfiles.map(p => {
    const g = getGroup(p.group_id);
    const pLogs = allLogs.filter(l => l.user_id === p.id);
    const prog = getGroupProgress(g, pLogs);
    return { ...p, pct: prog.pct, group: g };
  }).sort((a, b) => b.pct - a.pct);

  // Recent feed
  const recentFeed = allLogs.slice(0, 30).map(log => {
    const p = allProfiles.find(p => p.id === log.user_id);
    const g = getGroup(p?.group_id);
    const ex = g?.exercises?.find(e => e.id === log.exercise_id);
    return { ...log, userName: p?.display_name || "?", userEmoji: p?.avatar_emoji || "💪", groupColor: g?.color || "#666", exLabel: ex?.label || log.exercise_id, exIcon: ex?.icon || "•" };
  });

  const TABS = ["home", "leaderboard", "feed"];

  return (
    <div style={{
      minHeight: "100vh", background: "#080808",
      fontFamily: "'Barlow Condensed', sans-serif", maxWidth: 520, margin: "0 auto",
      paddingBottom: 100
    }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#ff4d00", color: "#fff", padding: "12px 28px",
          borderRadius: 30, fontWeight: 900, fontSize: 15, zIndex: 200,
          letterSpacing: 1, boxShadow: "0 8px 32px rgba(255,77,0,0.5)"
        }}>{toast}</div>
      )}

      {/* Top bar */}
      <div style={{
        background: "#0a0a0a", borderBottom: "1px solid #141414",
        padding: "16px 20px 0", position: "sticky", top: 0, zIndex: 10
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ color: "#ff4d00", fontSize: 20, fontWeight: 900, letterSpacing: 3 }}>REPRALLY</div>
            <div style={{ color: "#333", fontSize: 12, letterSpacing: 1 }}>
              Hey {profile.display_name} 👋
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              background: `${groupColor}18`, border: `1px solid ${groupColor}44`,
              borderRadius: 20, padding: "4px 12px",
              color: groupColor, fontSize: 12, fontWeight: 700, letterSpacing: 1
            }}>
              {group?.icon} GRP {profile.group_id}
            </div>
            <button onClick={onSignOut} style={{
              background: "#111", border: "1px solid #1f1f1f", borderRadius: 8,
              color: "#444", fontSize: 11, padding: "6px 10px", cursor: "pointer",
              fontFamily: "inherit", letterSpacing: 1
            }}>OUT</button>
          </div>
        </div>
        <div style={{ display: "flex" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "10px 4px", background: "none", border: "none",
              borderBottom: tab === t ? `2px solid ${groupColor}` : "2px solid transparent",
              color: tab === t ? "#fff" : "#444",
              fontWeight: tab === t ? 900 : 400, fontSize: 14,
              cursor: "pointer", textTransform: "uppercase", letterSpacing: 1.5,
              fontFamily: "'Barlow Condensed', sans-serif", transition: "all 0.15s"
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}>

        {/* ── HOME ── */}
        {tab === "home" && (
          <div>
            {/* Big progress ring card */}
            <div style={{
              background: "#0d0d0d", border: `1px solid ${groupColor}22`,
              borderRadius: 20, padding: "28px 24px", marginBottom: 16,
              position: "relative", overflow: "hidden"
            }}>
              <div style={{
                position: "absolute", top: -30, right: -30, width: 160, height: 160,
                borderRadius: "50%", background: `radial-gradient(circle, ${groupColor}12 0%, transparent 70%)`
              }} />
              <div style={{ color: "#444", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
                Your Progress — Group {profile.group_id}: {group?.name}
              </div>

              {group?.id === 3 ? (
                <div>
                  <ProgressBar label="Steps" value={myProgress.steps || 0} target={200000} color={groupColor} unit="steps" />
                  <ProgressBar label="Plank" value={myProgress.plankMins || 0} target={60} color={groupColor} unit="min" />
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                    <span style={{ color: "#fff", fontSize: 52, fontWeight: 900, lineHeight: 1 }}>
                      {(myProgress.totalReps || 0).toLocaleString()}
                    </span>
                    <span style={{ color: "#333", fontSize: 18 }}>/ {group?.target?.toLocaleString()}</span>
                  </div>
                  <ProgressBar label="" value={myProgress.totalReps || 0} target={group?.target || 1000} color={groupColor} unit="reps" hideLabel />
                </div>
              )}

              <div style={{ color: groupColor, fontSize: 18, fontWeight: 900, marginTop: 14, letterSpacing: 1 }}>
                {myProgress.pct}% complete
                {myProgress.pct >= 100 && " 🏆 CRUSHED IT!"}
              </div>
            </div>

            {/* Breakdown by exercise */}
            {group && (
              <div style={{
                background: "#0d0d0d", border: "1px solid #141414",
                borderRadius: 20, padding: "20px 22px", marginBottom: 16
              }}>
                <div style={{ color: "#333", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
                  Breakdown
                </div>
                {group.exercises.map(ex => {
                  const val = myProgress.summary?.[ex.id] || 0;
                  return (
                    <div key={ex.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 0", borderBottom: "1px solid #0f0f0f"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{ex.icon}</span>
                        <div>
                          <div style={{ color: val > 0 ? "#ddd" : "#3a3a3a", fontSize: 15, fontWeight: 700 }}>{ex.label}</div>
                          {ex.note && <div style={{ color: "#2a2a2a", fontSize: 11 }}>{ex.note}</div>}
                        </div>
                      </div>
                      <div style={{ color: val > 0 ? groupColor : "#222", fontWeight: 900, fontSize: 18 }}>
                        {val > 0 ? val.toLocaleString() : "—"}
                        <span style={{ color: "#2a2a2a", fontSize: 12, marginLeft: 4 }}>
                          {ex.unitOverride || (group.id === 3 && ex.id === "steps" ? "steps" : "reps")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent personal logs */}
            <div style={{
              background: "#0d0d0d", border: "1px solid #141414",
              borderRadius: 20, padding: "20px 22px"
            }}>
              <div style={{ color: "#333", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
                Your Recent Logs
              </div>
              {logs.length === 0 && (
                <div style={{ color: "#2a2a2a", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
                  No logs yet. Hit + to add your first entry!
                </div>
              )}
              {logs.slice(0, 8).map((log, i) => {
                const ex = group?.exercises?.find(e => e.id === log.exercise_id);
                const dt = new Date(log.logged_at);
                return (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0", borderBottom: "1px solid #0f0f0f"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{ex?.icon || "•"}</span>
                      <div>
                        <div style={{ color: "#ccc", fontSize: 14, fontWeight: 700 }}>{ex?.label || log.exercise_id}</div>
                        <div style={{ color: "#333", fontSize: 12 }}>{log.note || dt.toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ color: groupColor, fontWeight: 900, fontSize: 16 }}>
                      {log.reps.toLocaleString()}
                      <span style={{ color: "#2a2a2a", fontSize: 11, marginLeft: 4 }}>
                        {ex?.unitOverride || (log.exercise_id === "steps" ? "steps" : "reps")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {tab === "leaderboard" && (
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 26, letterSpacing: 1, marginBottom: 4 }}>
              LEADERBOARD 🏆
            </div>
            <div style={{ color: "#333", fontSize: 13, marginBottom: 20 }}>
              % of monthly target completed
            </div>
            {leaderboard.map((u, i) => (
              <div key={u.id} style={{
                background: u.id === profile.id ? "#0f0f0f" : "#0a0a0a",
                border: `1px solid ${u.id === profile.id ? (u.group?.color || "#ff4d00") + "33" : "#141414"}`,
                borderRadius: 16, padding: "16px 18px", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 14
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: i === 0 ? "linear-gradient(135deg, #ff4d00,#ff9500)" : i === 1 ? "#1a1a1a" : "#111",
                  border: i < 3 ? "none" : "1px solid #1a1a1a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 900, fontSize: 14
                }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
                        {u.display_name}
                        {u.id === profile.id && <span style={{ color: "#444", fontSize: 12, marginLeft: 6 }}>(you)</span>}
                      </span>
                      <div style={{ color: u.group?.color || "#555", fontSize: 11, letterSpacing: 1, marginTop: 2 }}>
                        GRP {u.group_id} — {u.group?.name}
                      </div>
                    </div>
                    <div style={{ color: i === 0 ? "#ff9500" : "#fff", fontWeight: 900, fontSize: 22 }}>
                      {u.pct}%
                    </div>
                  </div>
                  <div style={{ background: "#111", borderRadius: 100, height: 4, marginTop: 10, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 100, width: `${u.pct}%`,
                      background: u.pct >= 100 ? "#22c55e" : u.group?.color || "#ff4d00",
                      transition: "width 0.6s ease"
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FEED ── */}
        {tab === "feed" && (
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 26, letterSpacing: 1, marginBottom: 4 }}>
              ACTIVITY FEED
            </div>
            <div style={{ color: "#333", fontSize: 13, marginBottom: 20 }}>What the crew has been up to</div>
            {recentFeed.map((entry, i) => {
              const dt = new Date(entry.logged_at);
              return (
                <div key={i} style={{
                  background: "#0a0a0a", border: "1px solid #141414",
                  borderRadius: 14, padding: "14px 16px", marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 12
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: `${entry.groupColor}18`, border: `1px solid ${entry.groupColor}33`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                  }}>{entry.userEmoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#ddd", fontWeight: 800, fontSize: 15 }}>{entry.userName}</span>
                      <span style={{ color: "#2a2a2a", fontSize: 12 }}>
                        {dt.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div style={{ color: "#555", fontSize: 13, marginTop: 3 }}>
                      {entry.exIcon} {entry.exLabel} —{" "}
                      <span style={{ color: entry.groupColor, fontWeight: 800 }}>
                        {entry.reps.toLocaleString()} {entry.exercise_id === "steps" ? "steps" : "reps"}
                      </span>
                    </div>
                    {entry.note && <div style={{ color: "#2a2a2a", fontSize: 12, marginTop: 2 }}>"{entry.note}"</div>}
                  </div>
                </div>
              );
            })}
            {recentFeed.length === 0 && (
              <div style={{ color: "#2a2a2a", textAlign: "center", padding: "40px 0", fontSize: 15 }}>
                No activity yet. Be the first to log!
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowLog(true)}
        style={{
          position: "fixed", bottom: 28, right: 24,
          width: 62, height: 62, borderRadius: "50%",
          background: "linear-gradient(135deg, #ff4d00, #ff7a00)",
          border: "none", color: "#fff", fontSize: 30,
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(255,77,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
        }}
      >+</button>

      {showLog && (
        <LogModal group={group} onLog={handleLog} onClose={() => setShowLog(false)} />
      )}
    </div>
  );
}

function ProgressBar({ label, value, target, color, unit, hideLabel }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div style={{ marginBottom: 16 }}>
      {!hideLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ color: "#555", fontSize: 13 }}>{label}</span>
          <span style={{ color: "#ddd", fontSize: 13, fontWeight: 700 }}>
            {value.toLocaleString()} / {target.toLocaleString()} {unit}
          </span>
        </div>
      )}
      <div style={{ background: "#111", borderRadius: 100, height: 10, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 100, width: `${pct}%`,
          background: pct >= 100 ? "#22c55e" : `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: "width 0.6s ease"
        }} />
      </div>
      {!hideLabel && (
        <div style={{ color: color, fontSize: 12, marginTop: 4, textAlign: "right" }}>{pct}%</div>
      )}
    </div>
  );
}
