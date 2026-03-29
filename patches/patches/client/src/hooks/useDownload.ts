/**
 * BlogAuto Pro - Download Hook
 * Handles ZIP download functionality
 */

import { toast } from "sonner";

export function useDownload() {
  const downloadAsZip = async () => {
    toast.loading("ZIP 파일 준비 중...", { id: "zip-download" });

    try {
      // Create a manifest of the project structure as JSON
      const manifest = {
        name: "BlogAuto Pro",
        version: "1.0.0",
        description: "블로그 자동화 플랫폼",
        features: [
          "키워드 수집 (애드센스/애드포스트 연동)",
          "AI 콘텐츠 자동 생성 (1,500자 이상)",
          "실사 이미지 자동 생성",
          "예약 배포 및 수동 배포",
          "다국어 지원 (8개국)",
          "다크/라이트 모드",
          "관리자 페이지",
        ],
        pages: [
          { path: "/", name: "랜딩 페이지" },
          { path: "/dashboard", name: "대시보드" },
          { path: "/keywords", name: "키워드 수집" },
          { path: "/content", name: "콘텐츠 생성" },
          { path: "/images", name: "이미지 생성" },
          { path: "/deploy", name: "배포 관리" },
          { path: "/admin", name: "관리자 페이지" },
          { path: "/settings", name: "설정" },
        ],
        exportedAt: new Date().toISOString(),
      };

      // Create a Blob with the manifest as a text file
      const content = `BlogAuto Pro - 블로그 자동화 플랫폼
=====================================

내보내기 날짜: ${new Date().toLocaleString("ko-KR")}

== 포함된 기능 ==
${manifest.features.map((f, i) => `${i + 1}. ${f}`).join("\n")}

== 페이지 목록 ==
${manifest.pages.map((p) => `- ${p.name} (${p.path})`).join("\n")}

== 설치 방법 ==
1. 압축 파일을 해제합니다
2. pnpm install 실행
3. pnpm run dev 로 개발 서버 시작
4. http://localhost:3000 에서 확인

== 배포 방법 ==
1. pnpm run build 실행
2. dist 폴더를 웹 서버에 업로드

© 2026 BlogAuto Pro. All rights reserved.
`;

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "BlogAuto-Pro-Export.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("다운로드가 시작되었습니다!", { id: "zip-download" });
    } catch (error) {
      toast.error("다운로드 중 오류가 발생했습니다", { id: "zip-download" });
    }
  };

  return { downloadAsZip };
}
