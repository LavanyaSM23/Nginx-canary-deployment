import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:3001";

export default function User({ onLogout }) {
  const [version, setVersion] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch canary weight and randomly assign version to simulate traffic split
    axios.get(`${API}/weight`)
      .then(res => {
        const weight = res.data.weight; // 0 to 100
        const rand = Math.random() * 100;
        // if rand < weight, they hit canary (v2), else stable (v1)
        if (rand < weight) {
          setVersion("v2.0.0");
        } else {
          setVersion("v1.0.0");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch weight", err);
        setVersion("v1.0.0"); // fallback
        setLoading(false);
      });
  }, []);

  const sendFeedback = (type) => {
    axios.post(`${API}/feedback`, { version, type })
      .then(() => {
        setToast(`Feedback "${type}" recorded for ${version}!`);
        setTimeout(() => setToast(null), 3000);
      })
      .catch(err => console.error("Feedback failed", err));
  };

  if (loading) return <div className="app-container"><span className="loader" style={{width: 40, height: 40}}></span></div>;

  return (
    <div className="app-container">
      <div className="glass-panel" style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
        <div className="header">
          <h2>Dashboard</h2>
          <button onClick={onLogout} className="btn-primary" style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.1)" }}>Logout</button>
        </div>

        <div style={{ margin: "3rem 0" }}>
          <p style={{ color: "#94a3b8", marginBottom: "1rem" }}>You are currently using</p>
          <span className="version-badge" style={{ fontSize: "1.5rem", padding: "1rem 2rem" }}>
            {version}
          </span>
        </div>

        <h3 style={{ marginBottom: "2rem" }}>How is your experience?</h3>
        
        <div className="feedback-grid">
          <button className="btn-good" onClick={() => sendFeedback("good")}>
            👍 Looks Good
          </button>
          <button className="btn-bad" onClick={() => sendFeedback("bad")}>
            👎 Issues Found
          </button>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
