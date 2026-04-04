import { useState } from "react";
import Layout from "@/components/Layout";
import { IMAGE_AI_OPTIONS } from "@/lib/ai-config";

export default function SettingsPage() {
  const [selectedImageAI, setSelectedImageAI] = useState("gemini");
  const [customDomain, setCustomDomain] = useState(
    localStorage.getItem("custom_domain") || ""
  );

  const handleSaveDomain = () => {
    localStorage.setItem("custom_domain", customDomain);

    // 관리자/다른 페이지에서도 같이 쓰도록
    localStorage.setItem("admin_custom_domain", customDomain);
    localStorage.setItem("blogauto_custom_domain", customDomain);

    alert("도메인 저장 완료");
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">

        {/* 이미지 AI 선택 */}
        <div>
          <h2 className="text-lg font-bold mb-4">이미지 생성 AI 선택</h2>

          {/* 빠른 이동 버튼 */}
          <div className="flex gap-3 mb-4">
            {IMAGE_AI_OPTIONS.map((ai) => (
              <a
                key={ai.id}
                href={ai.link}
                target="_blank"
                className={`px-4 py-2 rounded-lg text-sm ${
                  ai.color === "blue"
                    ? "bg-blue-500/20 text-blue-400"
                    : ai.color === "purple"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {ai.name} API
              </a>
            ))}
          </div>

          {/* 카드 */}
          <div className="grid grid-cols-2 gap-4">
            {IMAGE_AI_OPTIONS.map((ai) => (
              <div
                key={ai.id}
                onClick={() => {
                  setSelectedImageAI(ai.id);
                  localStorage.setItem("image_provider", ai.id);
                }}
                className={`p-5 rounded-xl border cursor-pointer ${
                  selectedImageAI === ai.id
                    ? ai.color === "purple"
                      ? "border-purple-500"
                      : ai.color === "yellow"
                      ? "border-yellow-500"
                      : "border-blue-500"
                    : "border-gray-700"
                }`}
              >
                <div className="font-semibold mb-2">{ai.name}</div>
                <div className="text-sm opacity-70 mb-3">{ai.desc}</div>

                <a
                  href={ai.link}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className={`text-xs underline ${
                    ai.color === "purple"
                      ? "text-purple-400"
                      : ai.color === "yellow"
                      ? "text-yellow-400"
                      : "text-blue-400"
                  }`}
                >
                  키 발급받기
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* 커스텀 도메인 */}
        <div>
          <h2 className="text-lg font-bold mb-2">커스텀 도메인</h2>

          <input
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="https://yourdomain.com"
            className="w-full p-3 rounded-lg bg-black border border-gray-700"
          />

          <button
            onClick={handleSaveDomain}
            className="mt-3 px-4 py-2 bg-green-500 rounded-lg"
          >
            저장
          </button>
        </div>

      </div>
    </Layout>
  );
}
