import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import AuthScreen from "./screens/AuthScreen";
import EnrollScreen from "./screens/EnrollScreen";
import Dashboard from "./screens/Dashboard";
import AdminPanel from "./screens/AdminPanel";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  if (loading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;
  if (!profile?.group_id) return <EnrollScreen userId={session.user.id} onComplete={() => fetchProfile(session.user.id)} />;
  if (profile?.is_admin) return <AdminPanel profile={profile} onSignOut={handleSignOut} />;
  return <Dashboard profile={profile} onSignOut={handleSignOut} onProfileUpdate={() => fetchProfile(session.user.id)} />;
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", background: "#080808",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Barlow Condensed', sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
          background: "linear-gradient(135deg, #ff4d00, #ff9500)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, animation: "pulse 1.5s infinite"
        }}>🔥</div>
        <div style={{ color: "#ff4d00", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>REPRALLY</div>
        <div style={{ color: "#333", fontSize: 13, marginTop: 6 }}>Loading your grind...</div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }`}</style>
    </div>
  );
}
