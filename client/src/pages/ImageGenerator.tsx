import React, { useState } from 'react';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const generateImage = () => {
    if (!prompt.trim()) return;

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`;

    setImages((prev) => [url, ...prev]);
  };

  return (
    <div className="p-6">
      <h1>이미지 생성 테스트</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="프롬프트 입력"
          style={{ flex: 1, padding: '10px' }}
        />
        <button onClick={generateImage}>생성</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {images.map((url, i) => (
          <img key={i} src={url} alt="" />
        ))}
      </div>
    </div>
  );
}
