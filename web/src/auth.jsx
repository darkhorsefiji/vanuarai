import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { get, setToken } from "./api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(
    () =>
      get("/me")
        .then((d) => setUser(d.user || null))
        .catch(() => setUser(null))
        .finally(() => setReady(true)),
    []
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function loginWithGoogle(credential) {
    const r = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    if (!r.ok) return false;
    const { token } = await r.json();
    setToken(token);
    await refresh();
    return true;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, ready, loginWithGoogle, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

// Role tiers: member < official < village_admin < app_admin (DEV).
// official comes from memberships.role; village_admin from an active body_office;
// app_admin (DEV) from users.is_app_admin. Higher tiers include the lower checks below.
export const isDev = (u) => !!u?.isAppAdmin;
export const isVillageAdmin = (u) =>
  isDev(u) || !!u?.offices?.some((o) => o.office === "village_admin");
export const isOfficialRole = (u) => isDev(u) || u?.role === "official";
