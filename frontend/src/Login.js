import React, { useState } from "react";

const API = "http://localhost:3001";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      onLogin(data);
    } catch {
      setError("Cannot reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.leftPanel}>
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>🐦</span>
          <span style={styles.logoText}>Canary</span>
        </div>
        <h1 style={styles.heroTitle}>
          Kubernetes<br />
          <span style={styles.heroAccent}>Canary Control</span>
        </h1>
        <p style={styles.heroSub}>
          Manage traffic splits, monitor canary deployments,<br />
          and collect real-time user feedback — all in one place.
        </p>

        <div style={styles.featureList}>
          {[
            { icon: "⚡", label: "Live traffic weight control" },
            { icon: "🐳", label: "Docker container visualizer" },
            { icon: "📊", label: "Real-time feedback analytics" },
            { icon: "☸️",  label: "Kubernetes ingress management" },
          ].map(f => (
            <div key={f.label} style={styles.featureItem}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <span style={styles.featureLabel}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Animated deployment diagram */}
        <div style={styles.diagramWrap}>
          <DiagramPreview />
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={styles.rightPanel}>
        <div className="card anim-scale" style={styles.formCard}>
          <div style={styles.formHeader}>
            <div style={styles.formIcon}>🔐</div>
            <h2 style={styles.formTitle}>Sign in</h2>
            <p style={styles.formSub}>Access your canary dashboard</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form} id="login-form">
            <div className="input-group">
              <label className="input-label" htmlFor="username-input">Username</label>
              <input
                id="username-input"
                className="input"
                type="text"
                placeholder="admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password-input">Password</label>
              <input
                id="password-input"
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              id="login-btn"
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
            >
              {loading ? (
                <><span style={styles.spinner} /> Signing in…</>
              ) : (
                <>Sign in →</>
              )}
            </button>
          </form>

          <div style={styles.hintBox}>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>💡 Hint: </span>
            <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
              Use <span className="mono" style={{ color: "var(--accent-light)" }}>admin / admin</span> for admin access
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Animated mini deployment diagram */
function DiagramPreview() {
  return (
    <div style={diagStyles.wrap}>
      <div style={diagStyles.box}>
        <div style={diagStyles.label}>🌐 Ingress</div>
        <div style={diagStyles.arrows}>
          <div style={diagStyles.arrowLeft}>
            <div style={diagStyles.arrowLine} />
            <span style={diagStyles.pct}>80%</span>
          </div>
          <div style={diagStyles.arrowRight}>
            <div style={{ ...diagStyles.arrowLine, background: "var(--purple)" }} />
            <span style={{ ...diagStyles.pct, color: "var(--purple)" }}>20%</span>
          </div>
        </div>
        <div style={diagStyles.pods}>
          <div style={diagStyles.pod}>
            <span>🟢</span>
            <span style={diagStyles.podLabel}>Stable v1</span>
          </div>
          <div style={{ ...diagStyles.pod, borderColor: "var(--purple)", boxShadow: "0 0 12px var(--purple-glow)" }}>
            <span>🟣</span>
            <span style={diagStyles.podLabel}>Canary v2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const diagStyles = {
  wrap: { display: "flex", justifyContent: "center" },
  box: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "20px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    minWidth: 260,
  },
  label: { fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" },
  arrows: { display: "flex", gap: 32, alignItems: "flex-end" },
  arrowLeft: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  arrowRight: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  arrowLine: { width: 2, height: 28, background: "var(--green)", borderRadius: 1 },
  pct: { fontSize: 11, fontWeight: 700, color: "var(--green)" },
  pods: { display: "flex", gap: 16 },
  pod: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "10px 16px",
    border: "1px solid var(--green)",
    borderRadius: "var(--radius-sm)",
    boxShadow: "0 0 12px var(--green-glow)",
    fontSize: 18,
  },
  podLabel: { fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" },
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
  },
  leftPanel: {
    flex: 1,
    padding: "60px 64px",
    display: "flex",
    flexDirection: "column",
    gap: 32,
    background: "linear-gradient(160deg, rgba(59,130,246,0.06) 0%, transparent 60%)",
    borderRight: "1px solid var(--border)",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { fontSize: 28 },
  logoText: {
    fontSize: 20,
    fontWeight: 800,
    background: "linear-gradient(135deg, var(--accent-light), var(--purple))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: 800,
    lineHeight: 1.15,
    color: "var(--text-primary)",
  },
  heroAccent: {
    background: "linear-gradient(135deg, var(--accent-light), var(--purple))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: 16,
    color: "var(--text-secondary)",
    lineHeight: 1.7,
    maxWidth: 420,
  },
  featureList: { display: "flex", flexDirection: "column", gap: 12 },
  featureItem: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
  },
  featureIcon: { fontSize: 20 },
  featureLabel: { fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" },
  diagramWrap: { marginTop: "auto" },

  rightPanel: {
    width: 480,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  formCard: { width: "100%", padding: 40, display: "flex", flexDirection: "column", gap: 28 },
  formHeader: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" },
  formIcon: {
    width: 56, height: 56,
    background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 26,
  },
  formTitle: { fontSize: 24, fontWeight: 800 },
  formSub: { fontSize: 14, color: "var(--text-secondary)" },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  errorBox: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "12px 16px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "var(--radius-sm)",
    fontSize: 14, color: "#f87171",
  },
  spinner: {
    display: "inline-block",
    width: 16, height: 16,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  hintBox: {
    textAlign: "center",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
  },
};