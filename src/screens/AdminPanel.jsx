import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { getGroupProgress, GROUPS } from "../groups";
import { T, FONT, FONT_DISPLAY } from "../theme";

export default function AdminPanel({ profile, onSignOut, groups = GROUPS, onGroupsUpdated }) {
  const [users,       setUsers]       = useState([]);
  const [logs,        setLogs]        = useState([]);
  const [tab,         setTab]         = useState("users");
  const [toast,       setToast]       = useState(null);
  const [groupConfig, setGroupConfig] = useState({});
  const [savingCfg,   setSavingCfg]   = useState(false);

  // Add user form
  const [newName,     setNewName]     = useState("");
  const [newEmail,    setNewEmail]    = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addingUser,  setAddingUser]  = useState(false);

  useEffect(() => { fetchAll(); fetchGroupConfig(); }, []);

  async function fetchAll() {
    const [{ data: profiles }, { data: allLogs }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("logs").select("*").order("logged_at", { ascending: false })
    ]);
    setUsers(profiles || []);
    setLogs(allLogs || []);
  }

  async function fetchGroupConfig() {
    const { data } = await supabase.from("group_config").select("*");
    if (data) {
      const cfg = {};
      data.forEach(row => { cfg[row.id] = row; });
      setGroupConfig(cfg);
    }
  }

  async function saveGroupConfig(groupId, field, value) {
    setSavingCfg(true);
    await supabase.from("group_config")
      .upsert({ id: groupId, [field]: Number(value), updated_at: new Date().toISOString() });
    await fetchGroupConfig();
    onGroupsUpdated && await onGroupsUpdated();
    setSavingCfg(false);
    showToast("Target updated ✓");
  }

  async function toggleApproval(user) {
    await supabase.from("profiles").update({ approved: !user.approved }).eq("id", user.id);
    showToast(user.approved ? `${user.display_name} access revoked` : `${user.display_name} approved ✓`);
    fetchAll();
  }

  async function deleteUser(user) {
    if (!window.confirm(`Remove ${user.display_name} completely? This deletes their profile and all logs.`)) return;
    await supabase.from("logs").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    showToast(`${user.display_name} removed`);
    fetchAll();
  }

  async function addUser(e) {
    e.preventDefault();
    setAddingUser(true);
    const { data, error } = await supabase.auth.signUp({ email: newEmail, password: newPassword });
    if (error) { showToast(`Error: ${error.message}`); setAddingUser(false); return; }
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id, display_name: newName, email: newEmail,
        is_admin: false, approved: true
      });
      showToast(`${newName} added and approved ✓`);
      setNewName(""); setNewEmail(""); setNewPassword("");
      fetchAll();
    }
    setAddingUser(false);
  }

  async function deleteLog(logId) {
    await supabase.from("logs").delete().eq("id", logId);
    showToast("Log deleted");
    fetchAll();
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const stats = groups.map(g => {
    const groupUsers = users.filter(u => u.group_id === g.id && !u.is_admin);
    const groupLogs  = logs.filter(l => groupUsers.some(u => u.id === l.user_id));
    const totalReps  = groupLogs.reduce((s, l) => s + l.reps, 0);
    return { group: g, count: groupUsers.length, totalReps };
  });

  const inp = {
    display: "block", width: "100%", marginTop: 6, marginBottom: 14,
    background: T.cardAlt, border: `1.5px solid ${T.border}`,
    borderRadius: 10, padding: "11px 14px", color: T.text,
    fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: FONT,
  };

  const TABS = ["users", "groups", "logs", "invite"];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: FONT, maxWidth: 600, margin: "0 auto", paddingBottom: 60 }}>

      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: T.accent, color: "#fff", padding: "12px 28px",
          borderRadius: 30, fontWeight: 700, fontSize: 14, zIndex: 200, letterSpacing: 0.5
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "16px 20px 0", position: "sticky", top: 0, zIndex: 10, boxShadow: T.shadow
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ color: T.accent, fontSize: 22, fontWeight: 900, letterSpacing: 2, fontFamily: FONT_DISPLAY }}>REPRALLY</div>
            <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1.5, fontWeight: 600 }}>ADMIN PANEL</div>
          </div>
          <button onClick={onSignOut} style={{
            background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 8,
            color: T.muted, fontSize: 11, padding: "6px 12px", cursor: "pointer", fontFamily: FONT
          }}>Sign Out</button>
        </div>
        <div style={{ display: "flex" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "10px 2px", background: "none", border: "none",
              borderBottom: tab === t ? `2px solid ${T.accent}` : "2px solid transparent",
              color: tab === t ? T.text : T.muted,
              fontWeight: tab === t ? 700 : 400, fontSize: 13,
              cursor: "pointer", textTransform: "capitalize", letterSpacing: 0.5,
              fontFamily: FONT, transition: "all 0.15s"
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px" }}>

        {/* ── USERS ── */}
        {tab === "users" && (
          <div>
            <div style={{ color: T.text, fontWeight: 900, fontSize: 24, fontFamily: FONT_DISPLAY, marginBottom: 6 }}>MANAGE USERS</div>
            <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Approve, revoke or remove members</div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              <StatCard label="Total" value={users.filter(u => !u.is_admin).length} color={T.accent} />
              <StatCard label="Approved" value={users.filter(u => !u.is_admin && u.approved).length} color="#15803d" />
              <StatCard label="Pending" value={users.filter(u => !u.is_admin && !u.approved).length} color="#b45309" />
            </div>

            {users.filter(u => !u.is_admin).map(u => {
              const g    = groups.find(g => g.id === u.group_id);
              const uLogs = logs.filter(l => l.user_id === u.id);
              const prog = g ? getGroupProgress(g, uLogs) : { pct: 0 };
              return (
                <div key={u.id} style={{
                  background: T.card,
                  border: `1px solid ${u.approved ? T.border : T.amberBorder}`,
                  borderRadius: 16, padding: "16px 18px", marginBottom: 10,
                  boxShadow: T.shadow
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>{u.display_name}</div>
                      <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>{u.email}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        {g && (
                          <span style={{ background: `${g.color}12`, border: `1px solid ${g.color}30`, borderRadius: 6, padding: "3px 10px", color: g.color, fontSize: 12, fontWeight: 600 }}>
                            {g.icon} Grp {u.group_id}
                          </span>
                        )}
                        <span style={{
                          background: u.approved ? T.greenBg : T.amberBg,
                          border: `1px solid ${u.approved ? T.greenBorder : T.amberBorder}`,
                          borderRadius: 6, padding: "3px 10px",
                          color: u.approved ? T.green : T.amber, fontSize: 12, fontWeight: 600
                        }}>{u.approved ? "✓ Approved" : "⏳ Pending"}</span>
                        <span style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 10px", color: T.muted, fontSize: 12 }}>
                          {uLogs.length} logs · {prog.pct}%
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                      {!u.approved && (
                        <button onClick={() => toggleApproval(u)} style={{
                          background: T.greenBg, border: `1px solid ${T.greenBorder}`,
                          color: T.green, borderRadius: 8, padding: "7px 14px",
                          cursor: "pointer", fontFamily: FONT, fontWeight: 700, fontSize: 12
                        }}>Approve</button>
                      )}
                      {u.approved && (
                        <button onClick={() => toggleApproval(u)} style={{
                          background: T.amberBg, border: `1px solid ${T.amberBorder}`,
                          color: T.amber, borderRadius: 8, padding: "7px 14px",
                          cursor: "pointer", fontFamily: FONT, fontWeight: 700, fontSize: 12
                        }}>Revoke</button>
                      )}
                      <button onClick={() => deleteUser(u)} style={{
                        background: T.redBg, border: `1px solid ${T.redBorder}`,
                        color: T.red, borderRadius: 8, padding: "7px 14px",
                        cursor: "pointer", fontFamily: FONT, fontWeight: 700, fontSize: 12
                      }}>Remove</button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add user form */}
            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: "20px", marginTop: 16, boxShadow: T.shadow
            }}>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>➕ Add New User</div>
              <form onSubmit={addUser}>
                <label style={{ color: T.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Sanjay" required style={inp} />
                <label style={{ color: T.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Email</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="sanjay@email.com" required style={inp} />
                <label style={{ color: T.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Temp Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="They can reset this later" required minLength={6} style={{ ...inp, marginBottom: 16 }} />
                <button type="submit" disabled={addingUser} style={{
                  width: "100%", padding: "13px",
                  background: addingUser ? T.border : `linear-gradient(135deg, ${T.accent}, #ff7a3d)`,
                  color: addingUser ? T.muted : "#fff",
                  border: "none", borderRadius: 12, fontSize: 15,
                  fontWeight: 700, cursor: addingUser ? "default" : "pointer",
                  fontFamily: FONT_DISPLAY, letterSpacing: 1
                }}>{addingUser ? "Adding..." : "Add & Auto-Approve User"}</button>
              </form>
            </div>
          </div>
        )}

        {/* ── GROUPS ── */}
        {tab === "groups" && (
          <div>
            <div style={{ color: T.text, fontWeight: 900, fontSize: 24, fontFamily: FONT_DISPLAY, marginBottom: 6 }}>GROUP TARGETS</div>
            <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Edit the rep/step targets for each group</div>

            {groups.map(g => {
              const cfg = groupConfig[g.id] || {};
              return (
                <div key={g.id} style={{
                  background: T.card, border: `1.5px solid ${g.color}22`,
                  borderRadius: 18, padding: "20px 20px", marginBottom: 16, boxShadow: T.shadow
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: `${g.color}15`, border: `1px solid ${g.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
                    }}>{g.icon}</div>
                    <div>
                      <div style={{ color: T.text, fontWeight: 800, fontSize: 16, fontFamily: FONT_DISPLAY }}>Group {g.id} — {g.name}</div>
                      <div style={{ color: g.color, fontSize: 12, fontWeight: 600 }}>{g.tagline}</div>
                    </div>
                  </div>

                  {g.id === 3 ? (
                    <div>
                      <TargetField
                        label="Steps Target"
                        value={cfg.target_steps ?? g.target_steps ?? 200000}
                        color={g.color}
                        unit="steps"
                        onSave={val => saveGroupConfig(g.id, "target_steps", val)}
                        saving={savingCfg}
                      />
                      <TargetField
                        label="Plank Target"
                        value={cfg.target_plank ?? g.target_plank ?? 60}
                        color={g.color}
                        unit="minutes"
                        onSave={val => saveGroupConfig(g.id, "target_plank", val)}
                        saving={savingCfg}
                      />
                    </div>
                  ) : (
                    <TargetField
                      label="Rep Target"
                      value={cfg.target ?? g.target ?? 1000}
                      color={g.color}
                      unit="reps"
                      onSave={val => saveGroupConfig(g.id, "target", val)}
                      saving={savingCfg}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── LOGS ── */}
        {tab === "logs" && (
          <div>
            <div style={{ color: T.text, fontWeight: 900, fontSize: 24, fontFamily: FONT_DISPLAY, marginBottom: 6 }}>ALL LOGS</div>
            <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Full history — delete incorrect entries</div>
            {logs.slice(0, 60).map((log, i) => {
              const u  = users.find(u => u.id === log.user_id);
              const g  = groups.find(g => g.id === log.group_id);
              const ex = g?.exercises?.find(e => e.id === log.exercise_id);
              const dt = new Date(log.logged_at);
              return (
                <div key={i} style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 12, padding: "12px 16px", marginBottom: 8,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  boxShadow: T.shadow
                }}>
                  <div>
                    <div style={{ color: T.text, fontSize: 14, fontWeight: 700 }}>
                      {u?.display_name || "?"} — {ex?.icon} {ex?.label || log.exercise_id}
                      {g && <span style={{ color: g.color, fontSize: 12, marginLeft: 6 }}>· {g.name}</span>}
                    </div>
                    <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>
                      {log.reps.toLocaleString()} {log.exercise_id === "steps" ? "steps" : "reps"} · {dt.toLocaleDateString()} {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {log.note && ` · "${log.note}"`}
                    </div>
                  </div>
                  <button onClick={() => deleteLog(log.id)} style={{
                    background: T.redBg, border: `1px solid ${T.redBorder}`,
                    color: T.red, borderRadius: 6, padding: "6px 12px",
                    cursor: "pointer", fontFamily: FONT, fontWeight: 700, fontSize: 12, flexShrink: 0
                  }}>Delete</button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── INVITE ── */}
        {tab === "invite" && (
          <div>
            <div style={{ color: T.text, fontWeight: 900, fontSize: 24, fontFamily: FONT_DISPLAY, marginBottom: 6 }}>INVITE MEMBERS</div>
            <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Share the link or add users directly in the Users tab</div>

            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: "20px", marginBottom: 16, boxShadow: T.shadow
            }}>
              <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
                Shareable Sign-Up Link
              </div>
              <div style={{
                background: T.bgAlt, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: "12px 14px",
                color: T.accent, fontSize: 13, wordBreak: "break-all",
                fontFamily: "monospace", marginBottom: 14
              }}>
                {window.location.origin}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.origin); showToast("Link copied! ✓"); }}
                style={{
                  background: `linear-gradient(135deg, ${T.accent}, #ff7a3d)`,
                  border: "none", borderRadius: 10, padding: "11px 22px",
                  color: "#fff", fontWeight: 700, cursor: "pointer",
                  fontFamily: FONT_DISPLAY, fontSize: 14, letterSpacing: 1
                }}
              >Copy Link</button>
            </div>

            <div style={{
              background: T.amberBg, border: `1px solid ${T.amberBorder}`,
              borderRadius: 12, padding: "14px 16px", color: T.amber, fontSize: 13
            }}>
              💡 <strong>Tip:</strong> Use the <strong>Users tab</strong> to add members directly — they'll be auto-approved and can log in immediately with the credentials you set.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: "14px 16px", boxShadow: T.shadow
    }}>
      <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      <div style={{ color, fontWeight: 900, fontSize: 32, lineHeight: 1.2, marginTop: 4, fontFamily: FONT_DISPLAY }}>{value}</div>
    </div>
  );
}

function TargetField({ label, value, color, unit, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(value);

  function handleSave() {
    onSave(val);
    setEditing(false);
  }

  return (
    <div style={{
      background: T.bgAlt, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: "14px 16px", marginBottom: 12
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
          {!editing && (
            <div style={{ color: color, fontWeight: 900, fontSize: 28, fontFamily: FONT_DISPLAY, lineHeight: 1.2, marginTop: 4 }}>
              {Number(val).toLocaleString()} <span style={{ color: T.muted, fontSize: 14, fontWeight: 400 }}>{unit}</span>
            </div>
          )}
          {editing && (
            <input
              type="number"
              value={val}
              onChange={e => setVal(e.target.value)}
              style={{
                marginTop: 6, background: "#fff", border: `1.5px solid ${color}`,
                borderRadius: 8, padding: "8px 12px", color: T.text,
                fontSize: 20, fontWeight: 800, outline: "none",
                fontFamily: FONT_DISPLAY, width: 160
              }}
              autoFocus
            />
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{
              background: `${color}15`, border: `1px solid ${color}33`,
              color: color, borderRadius: 8, padding: "8px 16px",
              cursor: "pointer", fontFamily: FONT, fontWeight: 700, fontSize: 13
            }}>Edit</button>
          )}
          {editing && (
            <>
              <button onClick={handleSave} disabled={saving} style={{
                background: color, border: "none",
                color: "#fff", borderRadius: 8, padding: "8px 16px",
                cursor: "pointer", fontFamily: FONT, fontWeight: 700, fontSize: 13
              }}>{saving ? "..." : "Save"}</button>
              <button onClick={() => { setEditing(false); setVal(value); }} style={{
                background: T.bgAlt, border: `1px solid ${T.border}`,
                color: T.muted, borderRadius: 8, padding: "8px 12px",
                cursor: "pointer", fontFamily: FONT, fontSize: 13
              }}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
