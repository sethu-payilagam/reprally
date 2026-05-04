import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { getGroup, getGroupProgress, GROUPS } from "../groups";

export default function AdminPanel({ profile, onSignOut }) {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: profiles }, { data: allLogs }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("logs").select("*").order("logged_at", { ascending: false })
    ]);
    setUsers(profiles || []);
    setLogs(allLogs || []);
    setLoading(false);
  }

  async function toggleApproval(user) {
    await supabase.from("profiles").update({ approved: !user.approved }).eq("id", user.id);
    showToast(user.approved ? `${user.display_name} access revoked` : `${user.display_name} approved ✓`);
    fetchAll();
  }

  async function deleteLog(logId) {
    await supabase.from("logs").delete().eq("id", logId);
    showToast("Log entry deleted");
    fetchAll();
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    // Supabase magic link invite
    const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail.trim());
    if (error) {
      // Fallback: just show the signup URL
      showToast(`Share this link: ${window.location.origin}?invite=1`);
    } else {
      showToast(`Invite sent to ${inviteEmail} ✓`);
    }
    setInviteEmail("");
    setInviting(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const stats = GROUPS.map(g => {
    const groupUsers = users.filter(u => u.group_id === g.id && !u.is_admin);
    const groupLogs = logs.filter(l => groupUsers.some(u => u.id === l.user_id));
    const totalReps = groupLogs.reduce((s, l) => s + l.reps, 0);
    return { group: g, count: groupUsers.length, totalReps };
  });

  return (
    <div style={{
      minHeight: "100vh", background: "#080808",
      fontFamily: "'Barlow Condensed', sans-serif", maxWidth: 600, margin: "0 auto",
      paddingBottom: 60
    }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#ff4d00", color: "#fff", padding: "12px 28px",
          borderRadius: 30, fontWeight: 900, fontSize: 14, zIndex: 200, letterSpacing: 1
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{
        background: "#0a0a0a", borderBottom: "1px solid #141414",
        padding: "16px 20px 0", position: "sticky", top: 0, zIndex: 10
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ color: "#ff4d00", fontSize: 20, fontWeight: 900, letterSpacing: 3 }}>REPRALLY</div>
            <div style={{ color: "#ff4d0088", fontSize: 11, letterSpacing: 2 }}>ADMIN PANEL</div>
          </div>
          <button onClick={onSignOut} style={{
            background: "#111", border: "1px solid #1f1f1f", borderRadius: 8,
            color: "#555", fontSize: 11, padding: "6px 12px", cursor: "pointer",
            fontFamily: "inherit", letterSpacing: 1
          }}>SIGN OUT</button>
        </div>
        <div style={{ display: "flex" }}>
          {["overview", "users", "logs", "invite"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "10px 4px", background: "none", border: "none",
              borderBottom: tab === t ? "2px solid #ff4d00" : "2px solid transparent",
              color: tab === t ? "#fff" : "#333",
              fontWeight: tab === t ? 900 : 400, fontSize: 13,
              cursor: "pointer", textTransform: "uppercase", letterSpacing: 1.5,
              fontFamily: "'Barlow Condensed', sans-serif"
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px" }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 24, marginBottom: 20, letterSpacing: 1 }}>
              CHALLENGE OVERVIEW
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <StatCard label="Total Members" value={users.filter(u => !u.is_admin).length} color="#ff4d00" />
              <StatCard label="Approved" value={users.filter(u => !u.is_admin && u.approved).length} color="#22c55e" />
              <StatCard label="Total Logs" value={logs.length} color="#7c3aed" />
              <StatCard label="Pending Approval" value={users.filter(u => !u.is_admin && !u.approved).length} color="#f59e0b" />
            </div>

            {stats.map(({ group: g, count, totalReps }) => (
              <div key={g.id} style={{
                background: "#0d0d0d", border: `1px solid ${g.color}22`,
                borderRadius: 16, padding: "16px 18px", marginBottom: 12
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 18, marginRight: 8 }}>{g.icon}</span>
                    <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>Group {g.id} — {g.name}</span>
                  </div>
                  <span style={{ color: g.color, fontWeight: 900, fontSize: 14 }}>{count} members</span>
                </div>
                <div style={{ color: "#555", fontSize: 13 }}>
                  Combined total: <span style={{ color: g.color, fontWeight: 800 }}>
                    {totalReps.toLocaleString()} {g.id === 3 ? "steps/reps" : "reps"}
                  </span>
                  {g.target && <span style={{ color: "#2a2a2a" }}> · target {g.target.toLocaleString()} per person</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 24, marginBottom: 20, letterSpacing: 1 }}>
              MANAGE USERS
            </div>
            {users.filter(u => !u.is_admin).map(u => {
              const g = getGroup(u.group_id);
              const uLogs = logs.filter(l => l.user_id === u.id);
              const prog = g ? getGroupProgress(g, uLogs) : { pct: 0 };
              return (
                <div key={u.id} style={{
                  background: "#0d0d0d", border: `1px solid ${u.approved ? "#1a1a1a" : "#f59e0b22"}`,
                  borderRadius: 16, padding: "16px 18px", marginBottom: 10
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{u.display_name}</div>
                      <div style={{ color: "#333", fontSize: 12, marginTop: 2 }}>{u.email}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        {g && (
                          <span style={{
                            background: `${g.color}15`, border: `1px solid ${g.color}33`,
                            borderRadius: 6, padding: "3px 10px",
                            color: g.color, fontSize: 12, fontWeight: 700
                          }}>{g.icon} Grp {u.group_id}</span>
                        )}
                        <span style={{
                          background: u.approved ? "#15803d15" : "#f59e0b15",
                          border: `1px solid ${u.approved ? "#15803d33" : "#f59e0b33"}`,
                          borderRadius: 6, padding: "3px 10px",
                          color: u.approved ? "#22c55e" : "#f59e0b",
                          fontSize: 12, fontWeight: 700
                        }}>{u.approved ? "✓ APPROVED" : "⏳ PENDING"}</span>
                        <span style={{
                          background: "#111", border: "1px solid #1a1a1a",
                          borderRadius: 6, padding: "3px 10px", color: "#444", fontSize: 12
                        }}>{uLogs.length} logs · {prog.pct}%</span>
                      </div>
                    </div>
                    <button onClick={() => toggleApproval(u)} style={{
                      background: u.approved ? "#1a0000" : "#001a00",
                      border: `1px solid ${u.approved ? "#3a0000" : "#003a00"}`,
                      color: u.approved ? "#ef4444" : "#22c55e",
                      borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                      fontFamily: "inherit", fontWeight: 700, fontSize: 12, letterSpacing: 1
                    }}>{u.approved ? "REVOKE" : "APPROVE"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LOGS ── */}
        {tab === "logs" && (
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 24, marginBottom: 20, letterSpacing: 1 }}>
              ALL LOGS
            </div>
            {logs.slice(0, 50).map((log, i) => {
              const u = users.find(u => u.id === log.user_id);
              const g = getGroup(u?.group_id);
              const ex = g?.exercises?.find(e => e.id === log.exercise_id);
              const dt = new Date(log.logged_at);
              return (
                <div key={i} style={{
                  background: "#0d0d0d", border: "1px solid #141414",
                  borderRadius: 12, padding: "12px 16px", marginBottom: 8,
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <div style={{ color: "#ddd", fontSize: 14, fontWeight: 700 }}>
                      {u?.display_name || "?"} — {ex?.icon} {ex?.label || log.exercise_id}
                    </div>
                    <div style={{ color: "#333", fontSize: 12, marginTop: 2 }}>
                      {log.reps.toLocaleString()} reps · {dt.toLocaleDateString()} {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {log.note && ` · "${log.note}"`}
                    </div>
                  </div>
                  <button onClick={() => deleteLog(log.id)} style={{
                    background: "#1a0000", border: "1px solid #3a0000",
                    color: "#ef4444", borderRadius: 6, padding: "6px 10px",
                    cursor: "pointer", fontFamily: "inherit", fontSize: 11
                  }}>DEL</button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── INVITE ── */}
        {tab === "invite" && (
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 24, marginBottom: 8, letterSpacing: 1 }}>
              INVITE MEMBERS
            </div>
            <div style={{ color: "#333", fontSize: 14, marginBottom: 24 }}>
              Share the link below or send an email invitation.
            </div>

            {/* Share link */}
            <div style={{
              background: "#0d0d0d", border: "1px solid #1a1a1a",
              borderRadius: 16, padding: "20px 22px", marginBottom: 20
            }}>
              <div style={{ color: "#555", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
                Shareable Sign-Up Link
              </div>
              <div style={{
                background: "#080808", border: "1px solid #1f1f1f",
                borderRadius: 10, padding: "12px 14px",
                color: "#ff4d00", fontSize: 13, wordBreak: "break-all",
                fontFamily: "monospace", marginBottom: 12
              }}>
                {window.location.origin}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.origin); showToast("Link copied!"); }}
                style={{
                  background: "linear-gradient(135deg, #ff4d00, #ff7a00)",
                  border: "none", borderRadius: 10, padding: "11px 22px",
                  color: "#fff", fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 14, letterSpacing: 1
                }}
              >Copy Link</button>
            </div>

            {/* Email invite */}
            <div style={{
              background: "#0d0d0d", border: "1px solid #1a1a1a",
              borderRadius: 16, padding: "20px 22px"
            }}>
              <div style={{ color: "#555", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
                Email Invite (requires Supabase auth setup)
              </div>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="friend@email.com"
                style={{
                  display: "block", width: "100%", marginBottom: 12,
                  background: "#080808", border: "1px solid #1f1f1f",
                  borderRadius: 10, padding: "12px 14px", color: "#fff",
                  fontSize: 14, outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
              <button
                onClick={sendInvite}
                disabled={inviting || !inviteEmail}
                style={{
                  background: inviteEmail ? "linear-gradient(135deg, #ff4d00, #ff7a00)" : "#111",
                  border: "none", borderRadius: 10, padding: "11px 22px",
                  color: inviteEmail ? "#fff" : "#333",
                  fontWeight: 700, cursor: inviteEmail ? "pointer" : "default",
                  fontFamily: "inherit", fontSize: 14, letterSpacing: 1
                }}
              >{inviting ? "Sending..." : "Send Invite"}</button>
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
      background: "#0d0d0d", border: `1px solid ${color}22`,
      borderRadius: 14, padding: "16px 18px"
    }}>
      <div style={{ color: "#333", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color, fontWeight: 900, fontSize: 36, lineHeight: 1.1, marginTop: 6 }}>{value}</div>
    </div>
  );
}
