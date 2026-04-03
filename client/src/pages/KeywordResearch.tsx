import { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function KeywordResearch() {
  const [results, setResults] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // 초기 로드 (기록 불러오기)
  useEffect(() => {
    const saved = localStorage.getItem("datalab_history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // 데이터 저장
  const saveHistory = (data: any) => {
    const prev = JSON.parse(localStorage.getItem("datalab_history") || "[]");
    const updated = [data, ...prev].slice(0, 10);
    localStorage.setItem("datalab_history", JSON.stringify(updated));
    setHistory(updated);
  };

  // 검색 (임시 mock)
  const handleSearch = () => {
    const data = {
      keyword: "예시 키워드",
      ratio: Math.random().toFixed(5),
      date: new Date().toLocaleString(),
    };

    setResults(data);
    saveHistory(data);
  };

  // 초기화
  const handleReset = () => {
    localStorage.removeItem("datalab_history");
    setHistory([]);
    setResults(null);
  };

  return (
    <Layout>
      <div style={{ padding: "20px" }}>
        <h2>데이터랩</h2>

        {/* 검색 버튼 */}
        <button
          onClick={handleSearch}
          style={{
            padding: "10px 16px",
            background: "#22c55e",
            color: "#fff",
            borderRadius: "8px",
            border: "none",
          }}
        >
          검색
        </button>

        {/* 초기화 버튼 */}
        <button
          onClick={handleReset}
          style={{
            marginLeft: "10px",
            padding: "10px 16px",
            background: "#ff4d6d",
            color: "#fff",
            borderRadius: "8px",
            border: "none",
          }}
        >
          데이터 초기화
        </button>

        {/* 현재 결과 */}
        {results && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "#fff",
              color: "#000",
              borderRadius: "10px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            <p>키워드: {results.keyword}</p>
            <p>ratio: {results.ratio}</p>
            <p>{results.date}</p>
          </div>
        )}

        {/* 기록 */}
        <div style={{ marginTop: "30px" }}>
          <h3>최근 기록</h3>

          {history.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setResults(item)}
              style={{
                cursor: "pointer",
                padding: "10px",
                marginTop: "8px",
                background: "#111",
                borderRadius: "8px",
                color: "#fff",
              }}
            >
              {item.keyword} / {item.ratio}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
