import React, { useState } from 'react';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setLoading(true);

    try {
      // 서버 없이 안정적으로 이미지 가져오기 (fallback 포함)
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`;

      // 테스트 fetch (실제 요청 확인)
      const res = await fetch(url);

      if (!res.ok) throw new Error('fail');

      setImages((prev) => [url, ...prev]);
    } catch (err) {
      console.error(err);
      alert('이미지 생성 실패 (네트워크 또는 API 문제)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">이미지 생성</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="이미지 설명 입력"
          className="border p-2 flex-1 rounded bg-black text-white"
        />
        <button
          onClick={generateImage}
          className="bg-green-500 text-white px-4 rounded"
        >
          생성
        </button>
      </div>

      {loading && <p>생성중...</p>}

      <div className="grid grid-cols-3 gap-4">
        {images.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt="generated"
            className="rounded"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ))}
      </div>
    </div>
  );
}
