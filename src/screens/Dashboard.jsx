import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { getGroupProgress, GROUPS } from "../groups";
import { T, FONT, FONT_DISPLAY } from "../theme";
import LogModal from "../components/LogModal";

export default function Dashboard({ profile, onSignOut, groups = GROUPS, onProfileUpdate }) {
  const [logs,        setLogs]        = useState([]);
  const [allLogs,     setAllLogs]     = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [showLog,     setShowLog]     = useState(false);
  const [tab,         setTab]         = useState("home");
  const [toast,       setToast]       = useState(null);
  const [expanded,    setExpanded]    = useState(null); // expanded group in leaderboard

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [{ data: myLogs }, { data: profiles }, { data: everyone }] = await Promise.all([
      supabase.from("logs").select("*").eq("user_id", profile.id).order("logged_at", { ascending: false }),
      supabase.from("profiles").select("id,display_name,group_id,avatar_emoji").eq("approved", true).eq("is_admin", false),
      supabase.from("logs").select("*").order("logged_at", { ascending: false }).limit(300)
    ]);
    setLogs(myLogs || []);
    setAllProfiles(profiles || []);
    setAllLogs(everyone || []);
  }

  async function handleLog(entry) {
    const { error } = await supabase.from("logs").insert({
      user_id: profile.id, ...entry, logged_at: new Date().toISOString()
    });
    if (!error) {
      showToastMsg("Reps banked! 🔥");
      fetchData();
    }
    setShowLog(false);
  }

  function showToastMsg(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // My progress across ALL groups I've logged in
  const myLogsByGroup = groups.map(g => {
    const gLogs = logs.filter(l => l.group_id === g.id);
    return { group: g, logs: gLogs, progress: getGroupProgress(g, gLogs) };
  }).filter(({ logs }) => logs.length > 0);

  // Also show primary enrolled group even if no logs yet
  const primaryGroup = groups.find(g => g.id === profile.group_id);
  const hasPrimary   = myLogsByGroup.some(x => x.group.id === profile.group_id);
  if (primaryGroup && !hasPrimary) {
    myLogsByGroup.unshift({ group: primaryGroup, logs: [], progress: getGroupProgress(primaryGroup, []) });
  }

  // Leaderboard grouped by group
  const leaderboardByGroup = groups.map(g => {
    const members = allProfiles.map(p => {
      const pLogs = allLogs.filter(l => l.user_id === p.id && l.group_id === g.id);
      const prog  = getGroupProgress(g, pLogs);
      return { ...p, pct: prog.pct, totalReps: prog.totalReps || 0, steps: prog.steps || 0, plankMins: prog.plankMins || 0 };
    }).filter(p => p.totalReps > 0 || p.steps > 0 || p.group_id === g.id)
      .sort((a, b) => b.pct - a.pct);
    return { group: g, members };
  });

  // Activity feed
  const recentFeed = allLogs.slice(0, 40).map(log => {
    const p  = allProfiles.find(p => p.id === log.user_id);
    const g  = groups.find(g => g.id === log.group_id) || groups.find(g => g.id === p?.group_id);
    const ex = g?.exercises?.find(e => e.id === log.exercise_id);
    return { ...log, userName: p?.display_name || "?", groupColor: g?.color || T.subtle, exLabel: ex?.label || log.exercise_id, exIcon: ex?.icon || "•", groupName: g?.name || "" };
  });

  const TABS = ["home", "leaderboard", "feed"];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: FONT, maxWidth: 520, margin: "0 auto", paddingBottom: 100 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: T.accent, color: "#fff", padding: "12px 28px",
          borderRadius: 30, fontWeight: 700, fontSize: 14, zIndex: 200,
          boxShadow: `0 8px 24px ${T.accent}44`, letterSpacing: 0.5
        }}>{toast}</div>
      )}

      {/* Top bar */}
      <div style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "16px 20px 0", position: "sticky", top: 0, zIndex: 10,
        boxShadow: T.shadow
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ color: T.accent, fontSize: 22, fontWeight: 900, letterSpacing: 2, fontFamily: FONT_DISPLAY }}>REPRALLY</div>
            <div style={{ color: T.muted, fontSize: 12 }}>Hey {profile.display_name} 👋</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {primaryGroup && (
              <div style={{
                background: `${primaryGroup.color}15`, border: `1px solid ${primaryGroup.color}33`,
                borderRadius: 20, padding: "4px 12px",
                color: primaryGroup.color, fontSize: 12, fontWeight: 700
              }}>
                {primaryGroup.icon} Grp {profile.group_id}
              </div>
            )}
            <button onClick={onSignOut} style={{
              background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 8,
              color: T.muted, fontSize: 11, padding: "6px 12px", cursor: "pointer",
              fontFamily: FONT, letterSpacing: 0.5
            }}>Sign Out</button>
          </div>
        </div>
        <div style={{ display: "flex" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "10px 4px", background: "none", border: "none",
              borderBottom: tab === t ? `2px solid ${T.accent}` : "2px solid transparent",
              color: tab === t ? T.text : T.muted,
              fontWeight: tab === t ? 700 : 400, fontSize: 13,
              cursor: "pointer", textTransform: "capitalize", letterSpacing: 0.5,
              fontFamily: FONT, transition: "all 0.15s"
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}>

        {/* ── HOME ── */}
        {tab === "home" && (
          <div>
            {myLogsByGroup.map(({ group: g, logs: gLogs, progress: prog }) => (
              <div key={g.id} style={{
                background: T.card, border: `1.5px solid ${g.color}33`,
                borderRadius: 20, padding: "22px 20px", marginBottom: 16,
                boxShadow: T.shadow
              }}>
                {/* Group header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: `${g.color}15`, border: `1px solid ${g.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                  }}>{g.icon}</div>
                  <div>
                    <div style={{ color: T.text, fontWeight: 800, fontSize: 16, fontFamily: FONT_DISPLAY, letterSpacing: 0.3 }}>
                      Group {g.id} — {g.name}
                    </div>
                    <div style={{ color: g.color, fontSize: 12, fontWeight: 700 }}>{g.tagline}</div>
                  </div>
                  {g.id === profile.group_id && (
                    <span style={{
                      marginLeft: "auto", background: `${g.color}15`, border: `1px solid ${g.color}33`,
                      borderRadius: 12, padding: "3px 10px", color: g.color, fontSize: 11, fontWeight: 700
                    }}>PRIMARY</span>
                  )}
                </div>

                {/* Progress */}
                {g.id === 3 ? (
                  <div>
                    <ProgressBar label="Steps" value={prog.steps || 0} target={g.target_steps || 200000} color={g.color} unit="steps" />
                    <ProgressBar label="Plank" value={prog.plankMins || 0} target={g.target_plank || 60} color={g.color} unit="min" />
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                      <span style={{ color: T.text, fontSize: 42, fontWeight: 900, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>
                        {(prog.totalReps || 0).toLocaleString()}
                      </span>
                      <span style={{ color: T.subtle, fontSize: 15 }}>/ {(g.target || 1000).toLocaleString()} reps</span>
                    </div>
                    <ProgressBar value={prog.totalReps || 0} target={g.target || 1000} color={g.color} unit="reps" hideLabel />
                  </div>
                )}
                <div style={{ color: g.color, fontWeight: 700, fontSize: 14, marginTop: 10 }}>
                  {prog.pct}% complete {prog.pct >= 100 && "🏆"}
                </div>

                {/* Breakdown */}
                {gLogs.length > 0 && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                    {g.exercises.map(ex => {
                      const val = prog.summary?.[ex.id] || 0;
                      if (!val) return null;
                      return (
                        <div key={ex.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "7px 0", borderBottom: `1px solid ${T.bgAlt}`
                        }}>
                          <span style={{ color: T.textMid, fontSize: 14 }}>{ex.icon} {ex.label}</span>
                          <span style={{ color: g.color, fontWeight: 700, fontSize: 14 }}>
                            {val.toLocaleString()} {ex.unitOverride || (ex.id === "steps" ? "steps" : "reps")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* ── Static Group Info Banner ── */}
            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 20, padding: "20px 20px", marginBottom: 16,
              boxShadow: T.shadow
            }}>
              <div style={{ color: T.text, fontWeight: 800, fontSize: 15, fontFamily: FONT_DISPLAY, letterSpacing: 0.5, marginBottom: 16 }}>
                📋 CHALLENGE RULES
              </div>
              {groups.map((g, i) => (
                <div key={g.id} style={{
                  padding: "14px 0",
                  borderBottom: i < groups.length - 1 ? `1px solid ${T.border}` : "none"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${g.color}15`, border: `1px solid ${g.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0
                    }}>{g.icon}</div>
                    <div>
                      <div style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>Group {g.id} — {g.name}</div>
                      <div style={{ color: g.color, fontSize: 11, fontWeight: 600 }}>{g.tagline}</div>
                    </div>
                  </div>
                  <div style={{ color: T.textMid, fontSize: 13, lineHeight: 1.7, paddingLeft: 42 }}>
                    {g.description}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, paddingLeft: 42 }}>
                    {g.exercises.map(ex => (
                      <span key={ex.id} style={{
                        background: T.bgAlt, border: `1px solid ${T.border}`,
                        borderRadius: 6, padding: "3px 9px", color: T.textMid, fontSize: 12
                      }}>{ex.icon} {ex.label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {tab === "leaderboard" && (
          <div>
            <div style={{ color: T.text, fontWeight: 900, fontSize: 26, fontFamily: FONT_DISPLAY, letterSpacing: 0.5, marginBottom: 4 }}>
              LEADERBOARD 🏆
            </div>
            <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Grouped by challenge — % of target completed</div>

            {leaderboardByGroup.map(({ group: g, members }) => (
              <div key={g.id} style={{ marginBottom: 20 }}>
                {/* Group header */}
                <div
                  onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: `${g.color}12`, border: `1.5px solid ${g.color}33`,
                    borderRadius: expanded === g.id ? "14px 14px 0 0" : 14,
                    padding: "14px 16px", cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{g.icon}</span>
                    <div>
                      <div style={{ color: T.text, fontWeight: 800, fontSize: 15, fontFamily: FONT_DISPLAY }}>
                        Group {g.id} — {g.name}
                      </div>
                      <div style={{ color: g.color, fontSize: 12, fontWeight: 600 }}>{members.length} participants</div>
                    </div>
                  </div>
                  <span style={{ color: T.muted, fontSize: 18 }}>{expanded === g.id ? "▲" : "▼"}</span>
                </div>

                {/* Members list */}
                {(expanded === g.id || expanded === null) && members.length > 0 && (
                  <div style={{
                    border: `1.5px solid ${g.color}33`, borderTop: "none",
                    borderRadius: "0 0 14px 14px", overflow: "hidden"
                  }}>
                    {members.map((u, i) => (
                      <div key={u.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "13px 16px",
                        background: u.id === profile.id ? `${g.color}08` : T.card,
                        borderBottom: i < members.length - 1 ? `1px solid ${T.border}` : "none"
                      }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                          background: i === 0 ? `linear-gradient(135deg, ${g.color}, ${g.color}99)` : T.bgAlt,
                          border: `1px solid ${i === 0 ? g.color : T.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: i === 0 ? "#fff" : T.muted, fontWeight: 800, fontSize: 13
                        }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>
                              {u.display_name}
                              {u.id === profile.id && <span style={{ color: T.subtle, fontSize: 11, marginLeft: 6 }}>(you)</span>}
                            </span>
                            <span style={{ color: i === 0 ? g.color : T.textMid, fontWeight: 800, fontSize: 18, fontFamily: FONT_DISPLAY }}>
                              {u.pct}%
                            </span>
                          </div>
                          <div style={{ background: T.bgAlt, borderRadius: 100, height: 5, marginTop: 6, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 100,
                              width: `${u.pct}%`,
                              background: u.pct >= 100 ? "#22c55e" : g.color,
                              transition: "width 0.6s ease"
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(expanded === g.id || expanded === null) && members.length === 0 && (
                  <div style={{
                    border: `1.5px solid ${g.color}22`, borderTop: "none",
                    borderRadius: "0 0 14px 14px", padding: "16px",
                    background: T.card, color: T.subtle, fontSize: 13, textAlign: "center"
                  }}>No entries logged yet for this group</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── FEED ── */}
        {tab === "feed" && (
          <div>
            <div style={{ color: T.text, fontWeight: 900, fontSize: 26, fontFamily: FONT_DISPLAY, letterSpacing: 0.5, marginBottom: 4 }}>
              ACTIVITY FEED
            </div>
            <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>What the crew has been up to</div>
            {recentFeed.length === 0 && (
              <div style={{ color: T.subtle, textAlign: "center", padding: "40px 0", fontSize: 15 }}>
                No activity yet. Be the first to log!
              </div>
            )}
            {recentFeed.map((entry, i) => {
              const dt = new Date(entry.logged_at);
              return (
                <div key={i} style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 14, padding: "14px 16px", marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 12,
                  boxShadow: T.shadow
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: `${entry.groupColor}15`, border: `1px solid ${entry.groupColor}33`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: entry.groupColor
                  }}>{entry.userName[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>{entry.userName}</span>
                      <span style={{ color: T.subtle, fontSize: 12 }}>
                        {dt.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div style={{ color: T.textMid, fontSize: 13, marginTop: 2 }}>
                      {entry.exIcon} {entry.exLabel} —{" "}
                      <span style={{ color: entry.groupColor, fontWeight: 700 }}>
                        {entry.reps.toLocaleString()} {entry.exercise_id === "steps" ? "steps" : entry.exercise_id.includes("plank") ? "min" : "reps"}
                      </span>
                      {entry.groupName && <span style={{ color: T.subtle, fontSize: 11, marginLeft: 6 }}>· {entry.groupName}</span>}
                    </div>
                    {entry.note && <div style={{ color: T.subtle, fontSize: 12, marginTop: 2 }}>"{entry.note}"</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowLog(true)} style={{
        position: "fixed", bottom: 28, right: 24,
        width: 60, height: 60, borderRadius: "50%",
        background: `linear-gradient(135deg, ${T.accent}, #ff7a3d)`,
        border: "none", color: "#fff", fontSize: 28,
        cursor: "pointer",
        boxShadow: `0 8px 28px ${T.accent}55`,
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
      }}>+</button>

      {showLog && (
        <LogModal
          defaultGroupId={profile.group_id}
          groups={groups}
          onLog={handleLog}
          onClose={() => setShowLog(false)}
        />
      )}
    </div>
  );
}

function ProgressBar({ label, value, target, color, unit, hideLabel }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div style={{ marginBottom: 14 }}>
      {!hideLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ color: T.muted, fontSize: 13 }}>{label}</span>
          <span style={{ color: T.text, fontSize: 13, fontWeight: 700 }}>
            {value.toLocaleString()} / {target.toLocaleString()} {unit}
          </span>
        </div>
      )}
      <div style={{ background: T.bgAlt, borderRadius: 100, height: 10, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 100, width: `${pct}%`,
          background: pct >= 100 ? "#22c55e" : color,
          transition: "width 0.6s ease"
        }} />
      </div>
      {!hideLabel && (
        <div style={{ color, fontSize: 12, marginTop: 4, textAlign: "right", fontWeight: 600 }}>{pct}%</div>
      )}
    </div>
  );
}
