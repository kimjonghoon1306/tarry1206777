/**
 * BlogAuto Pro — 자동 발행 연결 페이지
 *
 * 네이버 블로그 / 티스토리 자동발행은 Publy 앱에서 처리합니다.
 * 이 페이지는 Publy 앱 다운로드/연결 안내 전용입니다.
 *
 * 위치: client/src/pages/NaverPublishPage.tsx
 */

import React from "react";
import Layout from "@/components/Layout";
import { Send, Smartphone, ExternalLink, Sparkles, Zap, Shield, ArrowRight } from "lucide-react";

const PUBLY_URL = "https://publy-bap.vercel.app";

export default function NaverPublishPage() {
  return (
    <Layout>
      <style>{`
        @keyframes float-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 25px) scale(0.9); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 12px 32px rgba(0,255,136,0.25), inset 0 1px 0 rgba(255,255,255,0.4); }
          50% { box-shadow: 0 16px 44px rgba(0,255,136,0.45), inset 0 1px 0 rgba(255,255,255,0.4); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes draw {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
        .publy-card { animation: fade-up 0.6s ease-out backwards; }
        .publy-card:nth-child(1) { animation-delay: 0.05s; }
        .publy-card:nth-child(2) { animation-delay: 0.15s; }
        .publy-card:nth-child(3) { animation-delay: 0.25s; }
        .publy-feature { animation: fade-up 0.5s ease-out backwards; }
        .publy-feature:nth-child(1) { animation-delay: 0.4s; }
        .publy-feature:nth-child(2) { animation-delay: 0.5s; }
        .publy-feature:nth-child(3) { animation-delay: 0.6s; }
        .publy-cta:hover { transform: translateY(-2px); }
        .publy-cta:active { transform: translateY(0); }
        .publy-feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0,255,136,0.4) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .publy-card, .publy-feature, .publy-orb-anim { animation: none !important; }
        }
      `}</style>

      <div
        style={{
          minHeight: "calc(100vh - 60px)",
          padding: "clamp(16px, 4vw, 40px) clamp(12px, 3vw, 32px)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ─── 배경 SVG 그리드 ─── */}
        <svg
          aria-hidden="true"
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.4,
            zIndex: 0,
          }}
        >
          <defs>
            <pattern id="naverpub-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#naverpub-grid)" />
        </svg>

        <div
          style={{
            width: "100%",
            maxWidth: 760,
            display: "flex",
            flexDirection: "column",
            gap: "clamp(16px, 3vw, 24px)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* ─── 메인 히어로 카드 ─── */}
          <div
            className="publy-card"
            style={{
              position: "relative",
              padding: "clamp(28px, 5vw, 48px) clamp(20px, 4vw, 40px)",
              borderRadius: "clamp(20px, 3vw, 28px)",
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--card) 92%, #00ff88 8%) 0%, var(--card) 70%)",
              border: "1px solid color-mix(in srgb, var(--border) 60%, #00ff88 40%)",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.05)",
              overflow: "hidden",
              textAlign: "center",
            }}
          >
            {/* 떠다니는 배경 오브 1 */}
            <div
              className="publy-orb-anim"
              aria-hidden="true"
              style={{
                position: "absolute",
                top: -100,
                right: -80,
                width: 280,
                height: 280,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(0,255,136,0.18) 0%, transparent 70%)",
                animation: "float-orb-1 8s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
            {/* 떠다니는 배경 오브 2 */}
            <div
              className="publy-orb-anim"
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: -120,
                left: -100,
                width: 320,
                height: 320,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(3,199,90,0.14) 0%, transparent 70%)",
                animation: "float-orb-2 10s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />

            {/* 회전하는 SVG 링 - 아이콘 뒤 */}
            <div
              style={{
                position: "relative",
                width: "fit-content",
                margin: "0 auto clamp(16px, 3vw, 24px)",
              }}
            >
              <svg
                aria-hidden="true"
                width="clamp(110px, 22vw, 140px)"
                height="clamp(110px, 22vw, 140px)"
                viewBox="0 0 140 140"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  animation: "spin-slow 18s linear infinite",
                }}
              >
                <circle
                  cx="70"
                  cy="70"
                  r="64"
                  fill="none"
                  stroke="rgba(0,255,136,0.3)"
                  strokeWidth="1.5"
                  strokeDasharray="4 8"
                />
                <circle
                  cx="70"
                  cy="6"
                  r="3"
                  fill="#00ff88"
                />
                <circle
                  cx="134"
                  cy="70"
                  r="2"
                  fill="#00cc66"
                />
              </svg>

              {/* 메인 아이콘 */}
              <div
                style={{
                  position: "relative",
                  width: "clamp(64px, 14vw, 88px)",
                  height: "clamp(64px, 14vw, 88px)",
                  borderRadius: "clamp(18px, 3vw, 24px)",
                  background: "linear-gradient(135deg, #00ff88 0%, #00cc66 100%)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulse-glow 3s ease-in-out infinite",
                  zIndex: 1,
                }}
              >
                <Send
                  style={{
                    width: "clamp(28px, 6vw, 40px)",
                    height: "clamp(28px, 6vw, 40px)",
                    color: "#000",
                  }}
                />
              </div>
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              {/* 라벨 */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 999,
                  background: "rgba(0,255,136,0.1)",
                  border: "1px solid rgba(0,255,136,0.25)",
                  fontSize: "clamp(0.65rem, 1.8vw, 0.75rem)",
                  fontWeight: 700,
                  color: "#00cc66",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                <Sparkles style={{ width: 12, height: 12 }} />
                Naver · Tistory
              </div>

              <h1
                style={{
                  fontSize: "clamp(1.5rem, 5.5vw, 2.4rem)",
                  fontWeight: 900,
                  color: "var(--foreground)",
                  margin: 0,
                  marginBottom: 12,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                자동발행은{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #00ff88, #00cc66, #03C75A)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "shine 4s linear infinite",
                  }}
                >
                  Publy
                </span>{" "}
                앱에서
              </h1>

              <p
                style={{
                  fontSize: "clamp(0.85rem, 2.5vw, 1.02rem)",
                  color: "var(--muted-foreground)",
                  margin: 0,
                  marginBottom: "clamp(20px, 4vw, 28px)",
                  lineHeight: 1.7,
                  maxWidth: 500,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                네이버 블로그 · 티스토리 자동발행은 전용 앱{" "}
                <strong style={{ color: "var(--foreground)" }}>Publy</strong>에서
                진행됩니다.
                <br />내 PC에서 안전하게, 내 계정으로 직접 발행하세요.
              </p>

              {/* CTA 버튼들 */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <a
                  href={PUBLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publy-cta"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding:
                      "clamp(12px, 2.5vw, 14px) clamp(22px, 4.5vw, 32px)",
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #00ff88, #00cc66)",
                    color: "#000",
                    fontSize: "clamp(0.92rem, 2.5vw, 1.02rem)",
                    fontWeight: 800,
                    textDecoration: "none",
                    boxShadow:
                      "0 10px 28px rgba(0,255,136,0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    minHeight: 48,
                  }}
                >
                  <Smartphone style={{ width: 18, height: 18 }} />
                  Publy 앱 열기
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </a>
              </div>
            </div>
          </div>

          {/* ─── 기능 카드 3개 ─── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
              gap: "clamp(10px, 2vw, 14px)",
            }}
          >
            <FeatureCard
              icon={<Zap />}
              title="원클릭 발행"
              desc="제목·본문·태그만 넣으면 끝. 봇이 자동으로 글을 올립니다."
              color="#00ff88"
              delay={0}
            />
            <FeatureCard
              icon={<Shield />}
              title="안전한 본인 PC"
              desc="비밀번호는 내 컴퓨터에만 저장. 외부 서버에 안 보냅니다."
              color="#03C75A"
              delay={0.1}
            />
            <FeatureCard
              icon={<Sparkles />}
              title="네이버·티스토리"
              desc="API 없는 두 플랫폼을 매크로로 자동화. 양쪽 동시 운영."
              color="#00cc66"
              delay={0.2}
            />
          </div>

          {/* ─── 사용 흐름 ─── */}
          <div
            className="publy-card"
            style={{
              padding: "clamp(20px, 4vw, 28px)",
              borderRadius: "clamp(16px, 2.5vw, 20px)",
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
                fontWeight: 800,
                color: "var(--foreground)",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 18,
                  borderRadius: 2,
                  background: "linear-gradient(180deg, #00ff88, #00cc66)",
                }}
              />
              사용 방법
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {[
                { num: 1, text: "Publy 앱 열기 (위 버튼 클릭)" },
                { num: 2, text: "네이버 / 티스토리 계정 한 번만 연결" },
                { num: 3, text: "글 작성 후 발행 — 본인 PC에서 자동 처리" },
              ].map((step) => (
                <div
                  key={step.num}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "clamp(10px, 2vw, 14px)",
                    borderRadius: 12,
                    background: "color-mix(in srgb, var(--muted) 50%, transparent)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #00ff88, #00cc66)",
                      color: "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "0.95rem",
                      boxShadow: "0 4px 10px rgba(0,255,136,0.25)",
                    }}
                  >
                    {step.num}
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(0.85rem, 2.4vw, 0.95rem)",
                      color: "var(--foreground)",
                      fontWeight: 500,
                      lineHeight: 1.5,
                    }}
                  >
                    {step.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── 하단 안내 ─── */}
          <div
            style={{
              textAlign: "center",
              padding: "12px 16px",
              fontSize: "clamp(0.72rem, 2vw, 0.82rem)",
              color: "var(--muted-foreground)",
              lineHeight: 1.6,
            }}
          >
            Publy 앱은 본인 PC에서 안전하게 동작합니다.
            <br />
            데스크톱 환경 (Windows / macOS) 이용을 권장합니다.
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ─── 기능 카드 컴포넌트 ───────────────────────────────────────
function FeatureCard({
  icon,
  title,
  desc,
  color,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="publy-feature publy-feature-card"
      style={{
        padding: "clamp(16px, 3vw, 22px)",
        borderRadius: "clamp(14px, 2vw, 18px)",
        background: "var(--card)",
        border: "1px solid var(--border)",
        transition: "transform 0.25s ease, border-color 0.25s ease",
        animationDelay: `${delay + 0.4}s`,
        cursor: "default",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `color-mix(in srgb, ${color} 18%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          marginBottom: 12,
        }}
      >
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<any>, {
              style: { width: 20, height: 20 },
            })
          : icon}
      </div>
      <div
        style={{
          fontSize: "clamp(0.92rem, 2.4vw, 1rem)",
          fontWeight: 800,
          color: "var(--foreground)",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "clamp(0.78rem, 2.1vw, 0.86rem)",
          color: "var(--muted-foreground)",
          lineHeight: 1.55,
        }}
      >
        {desc}
      </div>
    </div>
  );
}
