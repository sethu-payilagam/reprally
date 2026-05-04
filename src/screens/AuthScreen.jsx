import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setLoading(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setErr(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id, display_name: name, email, is_admin: false, approved: false
      });
      setMsg("Account created! Awaiting admin approval before you can log in.");
    }
    setLoading(false);
  }

  const inp = {
    display: "block", width: "100%", marginTop: 8, marginBottom: 18,
    background: "#111", border: "1px solid #222", borderRadius: 10,
    padding: "13px 16px", color: "#fff", fontSize: 15,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit"
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080808",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'Barlow Condensed', sans-serif"
    }}>
      {/* bg texture */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.03,
        backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
        backgroundSize: "20px 20px", pointerEvents: "none"
      }} />

      <div style={{
        width: "100%", maxWidth: 420, position: "relative"
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: "0 auto 14px",
            background: "linear-gradient(135deg, #ff4d00, #ff9500)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32
          }}>🔥</div>
          <div style={{ color: "#fff", fontSize: 36, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>
            RepRally
          </div>
          <div style={{ color: "#ff4d00", fontSize: 13, letterSpacing: 3, marginTop: 4, textTransform: "uppercase" }}>
            Group Fitness Challenge
          </div>
        </div>

        <div style={{
          background: "#0f0f0f", border: "1px solid #1a1a1a",
          borderRadius: 20, padding: "32px 28px",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)"
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex", background: "#080808", borderRadius: 10,
            padding: 4, marginBottom: 28
          }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(null); setMsg(null); }} style={{
                flex: 1, padding: "10px", background: mode === m ? "#ff4d00" : "none",
                border: "none", borderRadius: 8, color: mode === m ? "#fff" : "#555",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
                textTransform: "uppercase", letterSpacing: 1.5,
                fontFamily: "'Barlow Condensed', sans-serif", transition: "all 0.2s"
              }}>{m}</button>
            ))}
          </div>

          {msg && (
            <div style={{
              background: "rgba(5,150,105,0.1)", border: "1px solid #059669",
              borderRadius: 10, padding: "12px 16px", color: "#34d399",
              fontSize: 14, marginBottom: 20
            }}>{msg}</div>
          )}
          {err && (
            <div style={{
              background: "rgba(255,77,0,0.08)", border: "1px solid #ff4d00",
              borderRadius: 10, padding: "12px 16px", color: "#ff7040",
              fontSize: 14, marginBottom: 20
            }}>{err}</div>
          )}

          <form onSubmit={mode === "login" ? handleLogin : handleSignup}>
            {mode === "signup" && (
              <>
                <label style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>Your Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sanjay" required style={inp} />
              </>
            )}
            <label style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required style={inp} />
            <label style={{ color: "#555", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inp, marginBottom: 24 }} />
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "15px",
              background: loading ? "#1a1a1a" : "linear-gradient(135deg, #ff4d00, #ff7a00)",
              color: loading ? "#555" : "#fff",
              border: "none", borderRadius: 12, fontSize: 16,
              fontWeight: 900, cursor: loading ? "default" : "pointer",
              letterSpacing: 2, textTransform: "uppercase",
              fontFamily: "'Barlow Condensed', sans-serif",
              boxShadow: loading ? "none" : "0 8px 24px rgba(255,77,0,0.35)"
            }}>
              {loading ? "..." : mode === "login" ? "Let's Go →" : "Create Account"}
            </button>
          </form>

          {mode === "signup" && (
            <div style={{
              marginTop: 16, padding: "12px 14px",
              background: "#0a0a0a", border: "1px solid #1a1a1a",
              borderRadius: 10, color: "#444", fontSize: 12, textAlign: "center"
            }}>
              New accounts need admin approval before access is granted.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
