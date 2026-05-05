import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { loadGroupsWithConfig } from "./groups";
import { T, FONT, FONT_DISPLAY } from "./theme";
import AuthScreen from "./screens/AuthScreen";
import EnrollScreen from "./screens/EnrollScreen";
import Dashboard from "./screens/Dashboard";
import AdminPanel from "./screens/AdminPanel";

export default function App() {
  const [session, setSession]   = useState(null);
  const [profile, setProfile]   = useState(null);
  const [groups,  setGroups]    = useState(null);
  const [loading, setLoading]   = useState(true);

  // Load group config once on startup
  useEffect(() => {
    loadGroupsWithConfig().then(setGroups);
  }, []);

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

  async function refreshGroups() {
    const updated = await loadGroupsWithConfig();
    setGroups(updated);
  }

  if (loading || !groups) return <LoadingScreen />;
  if (!session)            return <AuthScreen />;
  if (!profile?.group_id)  return <EnrollScreen userId={session.user.id} onComplete={() => fetchProfile(session.user.id)} groups={groups} />;
  if (profile?.is_admin)   return <AdminPanel profile={profile} onSignOut={handleSignOut} groups={groups} onGroupsUpdated={refreshGroups} />;
  return <Dashboard profile={profile} onSignOut={handleSignOut} groups={groups} onProfileUpdate={() => fetchProfile(session.user.id)} />;
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
          background: `linear-gradient(135deg, #e85d20, #ff8c52)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28
        }}>🔥</div>
        <div style={{ color: "#e85d20", fontSize: 24, fontWeight: 800, letterSpacing: 2, fontFamily: FONT_DISPLAY }}>REPRALLY</div>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 6 }}>Loading your grind...</div>
      </div>
    </div>
  );
}
