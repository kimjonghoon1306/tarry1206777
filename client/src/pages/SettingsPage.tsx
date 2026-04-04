<div className="grid grid-cols-2 gap-4">

  {/* Replicate */}
  <div
    onClick={() => onSelect("replicate")}
    className={`relative rounded-xl p-5 cursor-pointer border transition ${
      selected === "replicate"
        ? "border-yellow-400 bg-yellow-500/10"
        : "border-gray-700 hover:border-yellow-400/50"
    }`}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center text-black font-bold">
        R
      </div>
      <div>
        <div className="font-semibold">Replicate</div>
        <div className="text-xs text-yellow-400">일부 무료 후 유료</div>
      </div>
    </div>

    <div className="text-sm opacity-70 mb-3">
      Stable Diffusion 기반 다양한 모델 사용 가능
    </div>

    <a
      href="https://replicate.com/account/api-tokens"
      target="_blank"
      onClick={(e) => e.stopPropagation()}
      className="inline-block text-xs text-yellow-400 underline"
    >
      키 발급받기
    </a>
  </div>

  {/* Gemini */}
  <div
    onClick={() => onSelect("gemini")}
    className={`relative rounded-xl p-5 cursor-pointer border transition ${
      selected === "gemini"
        ? "border-blue-400 bg-blue-500/10"
        : "border-gray-700 hover:border-blue-400/50"
    }`}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">
        G
      </div>
      <div>
        <div className="font-semibold">Gemini Image</div>
        <div className="text-xs text-blue-400">일부 무료 후 유료</div>
      </div>
    </div>

    <div className="text-sm opacity-70 mb-3">
      Google AI 이미지 생성 (텍스트 + 이미지 지원)
    </div>

    <a
      href="https://aistudio.google.com/app/apikey"
      target="_blank"
      onClick={(e) => e.stopPropagation()}
      className="inline-block text-xs text-blue-400 underline"
    >
      키 발급받기
    </a>
  </div>

</div>
