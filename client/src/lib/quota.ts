// 무료 체험 사용량(글 생성 하루 2회 · 가입 후 7일) — 서버 실측 기준.
//   서버(api/auth.js getQuota/useQuota)가 계정별로 카운트하므로 localStorage 조작으로 우회 불가.
//   회원·관리자 공통으로 이 헬퍼만 쓴다(단일 소스). 관리자/유료는 unlimited=true로 통과.

export interface Quota {
  ok: boolean;
  unlimited?: boolean;
  plan?: string;       // "free" | "admin" | "pro" ...
  limit: number;       // 하루 한도(무제한=-1)
  used: number;        // 오늘 사용량
  remain: number;      // 남은 횟수(무제한=-1)
  trialActive: boolean;
  trialDaysLeft: number; // 남은 무료 체험 일수(무제한=-1)
  error?: string;
  code?: string;       // "trial_expired" | "daily_limit"
}

const token = () => localStorage.getItem("ba_token") || "";

async function call(action: "getQuota" | "useQuota"): Promise<Quota> {
  const r = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ action }),
  });
  const d = await r.json();
  return {
    ok: !!d.ok,
    unlimited: !!d.unlimited,
    plan: d.plan,
    limit: typeof d.limit === "number" ? d.limit : 2,
    used: d.used || 0,
    remain: typeof d.remain === "number" ? d.remain : 0,
    trialActive: d.trialActive !== false,
    trialDaysLeft: typeof d.trialDaysLeft === "number" ? d.trialDaysLeft : 0,
    error: d.error,
    code: d.code,
  };
}

/** 오늘 사용량/남은량 조회(차감 없음). 헤더 에너지바·초기 표시용. */
export const getQuota = () => call("getQuota");

/** 글 생성 직전 1회 차감(초과·만료면 ok:false). 성공 후 헤더 갱신 이벤트 발행. */
export async function consumeQuota(): Promise<Quota> {
  const q = await call("useQuota");
  if (q.ok) window.dispatchEvent(new CustomEvent("ba-quota-changed", { detail: q }));
  return q;
}
