import React, { useState } from 'react';

interface ImageItem {
  url: string;
  status: 'done' | 'error';
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);

  const generateImage = () => {
    if (!prompt.trim()) return;

    setLoading(true);

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    const newImage: ImageItem = {
      url,
      status: 'done',
    };

    setImages((prev) => [newImage, ...prev]);

    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">이미지 생성</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="이미지 설명 입력"
          className="border p-2 flex-1 rounded"
        />
        <button
          onClick={generateImage}
          className="bg-black text-white px-4 rounded"
        >
          생성
        </button>
      </div>

      {loading && <p>생성중...</p>}

      <div className="grid grid-cols-2 gap-4">
        {images.map((image, idx) => (
          <img
            key={idx}
            src={image.url}
            alt="generated"
            className="rounded"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ))}
      </div>
    </div>
  );
}
