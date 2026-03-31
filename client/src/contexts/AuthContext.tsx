import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";
import { userSet, clearUserLocalCache, SETTINGS_KEYS } from "@/lib/user-storage";

interface User { id:string; name:string; email:string; role:"admin"|"user"; }
interface AuthCtx {
  user: User|null;
  token: string|null;
  isAdmin: boolean;
  loading: boolean;
  login: (userId:string, password:string) => Promise<boolean>;
  logout: () => void;
  saveSettings: (settings:Record<string,string>) => Promise<void>;
  loadSettings: () => Promise<Record<string,string>>;
}
const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children:ReactNode }) {
  const [user, setUser] = useState<User|null>(() => {
    try { return JSON.parse(localStorage.getItem("ba_user")||"null"); } catch { return null; }
  });
  const [token, setToken] = useState<string|null>(() => localStorage.getItem("ba_token"));
  const [loading, setLoading] = useState(false);

  const login = async (userId:string, password:string) => {
    setLoading(true);
    try {
      const r = await fetch("/api/auth", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ action:"login", userId, password }),
      });
      const d = await r.json();
      if (!d.ok) { toast.error(d.error); return false; }

      setUser(d.user);
      setToken(d.token);
      localStorage.setItem("ba_user", JSON.stringify(d.user));
      localStorage.setItem("ba_token", d.token);

      // 로그인 후 서버 설정 → 회원별 userSet으로 저장
      const sr = await fetch("/api/auth", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${d.token}`},
        body:JSON.stringify({ action:"loadSettings" }),
      });
      const sd = await sr.json();
      if (sd.ok && sd.settings) {
        Object.entries(sd.settings).forEach(([k,v]) => {
          userSet(k, v as string); // 회원별 키로 저장
        });
      }
      return true;
    } catch { toast.error("네트워크 오류"); return false; }
    finally { setLoading(false); }
  };

  const logout = async () => {
    // 서버 세션 종료
    await fetch("/api/auth", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
      body:JSON.stringify({ action:"logout" }),
    }).catch(() => {});

    // 현재 유저 로컬 캐시 제거 (API 키 등 민감 정보 포함)
    clearUserLocalCache();

    setUser(null);
    setToken(null);
    localStorage.removeItem("ba_user");
    localStorage.removeItem("ba_token");
  };

  const saveSettings = async (settings:Record<string,string>) => {
    if (!token) return;
    await fetch("/api/auth", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
      body:JSON.stringify({ action:"saveSettings", settings }),
    });
  };

  const loadSettings = async (): Promise<Record<string,string>> => {
    if (!token) return {};
    const r = await fetch("/api/auth", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
      body:JSON.stringify({ action:"loadSettings" }),
    });
    const d = await r.json();
    return d.settings||{};
  };

  return (
    <Ctx.Provider value={{ user, token, isAdmin: user?.role==="admin", loading, login, logout, saveSettings, loadSettings }}>
      {children}
    </Ctx.Provider>
  );
}
export const useAuth = () => useContext(Ctx);
