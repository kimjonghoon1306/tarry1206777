import React, { useState } from "react";

export default function KeywordResearch() {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState([]);

  const handleSearch = () => {
    if (!keyword) return;
    // 임시 데이터 (복구용)
    setResult([{ keyword, value: Math.floor(Math.random() * 100) }]);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>키워드 수집기</h2>

      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="키워드 입력"
        style={{ padding: "8px", marginRight: "10px" }}
      />

      <button onClick={handleSearch}>검색</button>

      <div style={{ marginTop: "20px" }}>
        {result.map((item, idx) => (
          <div key={idx}>
            {item.keyword} : {item.value}
          </div>
        ))}
      </div>
    </div>
  );
}
