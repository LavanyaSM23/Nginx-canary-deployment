import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      setLoading(false);
      if (username === "admin" && password === "admin") {
        onLogin("admin");
      } else if (username && password) {
        onLogin("user");
      } else {
        setError("Please enter username and password");
      }
    }, 800);
  };

  return (
    <div className="app-container">
      <div className="glass-panel login-panel" style={{ padding: 0 }}>
        <div className="login-illustration">
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>🐦 Canary Dashboard</h2>
          <p style={{ color: "#94a3b8", textAlign: "center", marginBottom: "2rem" }}>
            A Kubernetes Canary Deployment Control Panel with real-time feedback analytics.
          </p>
          <div style={{ padding: "1.5rem", background: "rgba(0,0,0,0.3)", borderRadius: "12px", width: "100%", fontFamily: "monospace", color: "#60a5fa" }}>
            Admin Login:<br />
            User: admin<br />
            Pass: admin<br />
            <br />
            User Login:<br />
            Any other credentials
          </div>
        </div>
        <div className="login-form">
          <h2 style={{ marginBottom: "2rem" }}>Welcome Back</h2>
          
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8" }}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Enter your username"
            />
            
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8" }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter your password"
            />
            
            {error && <div style={{ color: "#ef4444", marginBottom: "1rem" }}>{error}</div>}
            
            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
              {loading ? <span className="loader"></span> : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
