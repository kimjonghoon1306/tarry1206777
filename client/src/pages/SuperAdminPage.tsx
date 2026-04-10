/**
 * BlogAuto Pro - Super Admin Page v6.0
 * (원본 유지 + 수익 대시보드 버튼 추가)
 */

import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Shield, Eye, EyeOff, Copy, Lock,
  RefreshCw, Crown
} from "lucide-react";

import { Input } from "@/components/ui/input";

const SESSION_KEY = "bap_admin_auth";

export default function SuperAdminPage() {
  const [authed, setAuthed] = useState(() => {
    const s = sessionStorage.getItem(SESSION_KEY);
    return !!s && !!localStorage.getItem("ba_token");
  });

  if (!authed) return <AdminGate onAuth={() => setAuthed(true)} />;
  return <AdminDashboard />;
}

// ─────────────────────────────────────────────────────
// 관리자 대시보드
// ─────────────────────────────────────────────────────
function AdminDashboard() {

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  };

  return (
    <Layout>
      <div style={{ padding: 20 }}>

        <h1 style={{ fontSize: 24, fontWeight: 900 }}>슈퍼 관리자</h1>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>

          {/* 기존 버튼 */}
          <button
            onClick={() => window.location.href = "/monetization"}
            style={{
              padding: "10px 16px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8
            }}>
            💰 수익화
          </button>

          {/* ✅ 추가된 버튼 (문제 해결 핵심) */}
          <button
            onClick={() => window.location.href = "/admin-revenue"}
            style={{
              padding: "10px 16px",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 8
            }}>
            📊 수익 대시보드
          </button>

          {/* 기존 유지 */}
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 16px",
              background: "#ccc",
              border: "none",
              borderRadius: 8
            }}>
            로그아웃
          </button>

        </div>
      </div>
    </Layout>
  );
}

// ─────────────────────────────────────────────────────
// 인증 게이트
// ─────────────────────────────────────────────────────
function AdminGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!pw.trim()) return;
    setLoading(true);

    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", userId: "admin", password: pw }),
      });

      const d = await r.json();

      if (d.ok) {
        localStorage.setItem("ba_token", d.token);
        sessionStorage.setItem(SESSION_KEY, d.token);
        onAuth();
      } else {
        alert("비밀번호 틀림");
      }

    } catch {
      alert("에러");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>관리자 로그인</h2>

      <input
        type={show ? "text" : "password"}
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="비밀번호"
      />

      <button onClick={handleSubmit}>
        {loading ? "로딩..." : "로그인"}
      </button>

      <button onClick={() => setShow(!show)}>
        {show ? "숨기기" : "보기"}
      </button>
    </div>
  );
}
