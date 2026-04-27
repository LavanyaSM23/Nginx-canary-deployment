import React, { useState, useEffect } from "react";

const API = "http://localhost:3001";

/* ── Toast helper ──────────────────────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}${t.exit ? " exit" : ""}`}>
          <span style={{ fontSize: 18 }}>{t.type === "success" ? "✅" : "❌"}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

export default function User({ username, onLogout }) {
  const [toasts,       setToasts]      = useState([]);
  const [loading,      setLoading]     = useState({ good: false, bad: false });
  const [sessionVer,   setSessionVer]  = useState(null); // Assigned version
  const [isSimulation, setIsSimulation]= useState(true);

  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  // On mount, assign user to a version based on canary weight
  useEffect(() => {
    const assignVersion = async () => {
      try {
        const res = await fetch(`${API}/weight`);
        const data = await res.json();
        
        // Traffic Simulation:
        // if weight is 20%, Math.random() * 100 < 20 will be true 20% of the time.
        const isCanary = (Math.random() * 100) < data.weight;
        setSessionVer(isCanary ? "v2.0.0" : "v1.0.0");
      } catch {
        // Fallback to stable if backend is unreachable
        setSessionVer("v1.0.0");
        setIsSimulation(false);
      }
    };
    
    assignVersion();
  }, []);

  const sendFeedback = async (type) => {
    if (!sessionVer) return;

    setLoading(p => ({ ...p, [type]: true }));
    try {
      await fetch(`${API}/feedback`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type, version: sessionVer }),
      });
      
      addToast(
        type === "good" ? "Thanks for the positive feedback! 🎉" : "Feedback noted — we'll improve! 🔧",
        "success",
      );
    } catch {
      addToast("Failed to send feedback. Please try again.", "error");
    } finally {
      setLoading(p => ({ ...p, [type]: false }));
    }
  };

  return (
    <>
      <Toast toasts={toasts} />

      <div style={styles.page}>
        {/* Header */}
        <header style={styles.header} className="card">
          <div style={styles.headerLeft}>
            <span style={styles.logoIcon}>🐦</span>
            <div>
              <div style={styles.logoText}>Canary Dashboard</div>
              <div style={styles.headerSub}>User View</div>
            </div>
          </div>
          <div style={styles.headerRight}>
            <div className="badge badge-green"><span className="dot dot-green" /> Live</div>
            <div style={styles.userPill}>
              <span>👤</span>
              <span>{username || "User"}</span>
            </div>
            <button id="logout-btn" className="btn btn-ghost btn-sm" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </header>

        {/* Main */}
        <main style={styles.main}>

          {/* Welcome banner */}
          <div className="card anim-fade-up" style={styles.welcomeCard}>
            <div style={styles.welcomeLeft}>
              <div style={styles.welcomeIcon}>🚀</div>
              <div>
                <h1 style={styles.welcomeTitle}>Welcome, {username || "User"}!</h1>
                <p style={styles.welcomeSub}>
                  You're currently experiencing App Version 
                  <span style={sessionVer === "v2.0.0" ? styles.versionBadgeCanary : styles.versionBadgeStable}>
                    {sessionVer || "Loading..."}
                  </span>.
                  Help us improve by sharing your feedback below.
                </p>
                {isSimulation && sessionVer && (
                  <p style={styles.simulationNote}>
                    ℹ️ You were randomly assigned this version based on the current Admin traffic split.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Feedback section - centered and simplified */}
          <div style={styles.feedbackContainer}>
            <div className="card anim-fade-up" style={{ ...styles.feedbackCard, animationDelay: "0.1s" }}>
              <h2 style={styles.sectionTitle}>
                <span>💬</span> How is your experience?
              </h2>
              <p style={styles.sectionSub}>
                Your feedback directly impacts whether this version gets promoted to 100% of users.
              </p>

              <div style={styles.btnGroup}>
                <button
                  id="feedback-good-btn"
                  className="btn btn-success"
                  style={styles.feedbackBtn}
                  onClick={() => sendFeedback("good")}
                  disabled={loading.good || loading.bad || !sessionVer}
                >
                  {loading.good ? (
                    <span style={spinnerStyle} />
                  ) : (
                    <span style={styles.thumbIcon}>👍</span>
                  )}
                  <div>
                    <div style={styles.feedbackBtnTitle}>Looks Great!</div>
                    <div style={styles.feedbackBtnSub}>Everything works perfectly on {sessionVer || "this version"}</div>
                  </div>
                </button>

                <button
                  id="feedback-bad-btn"
                  className="btn btn-danger"
                  style={styles.feedbackBtn}
                  onClick={() => sendFeedback("bad")}
                  disabled={loading.good || loading.bad || !sessionVer}
                >
                  {loading.bad ? (
                    <span style={spinnerStyle} />
                  ) : (
                    <span style={styles.thumbIcon}>👎</span>
                  )}
                  <div>
                    <div style={styles.feedbackBtnTitle}>Something's Wrong</div>
                    <div style={styles.feedbackBtnSub}>Report an issue with {sessionVer || "this version"}</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

const spinnerStyle = {
  display: "inline-block",
  width: 18, height: 18,
  border: "2px solid rgba(255,255,255,0.3)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
};

const styles = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", gap: 0 },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 32px",
    borderRadius: 0,
    borderLeft: "none", borderRight: "none", borderTop: "none",
    position: "sticky", top: 0, zIndex: 100,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { fontSize: 26 },
  logoText: { fontWeight: 800, fontSize: 16 },
  headerSub: { fontSize: 11, color: "var(--text-muted)", marginTop: 1 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  userPill: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 12px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 100,
    fontSize: 13, fontWeight: 500,
  },
  main: { padding: "32px 40px", display: "flex", flexDirection: "column", gap: 32, maxWidth: 800, margin: "0 auto", width: "100%" },

  welcomeCard: {
    padding: "32px 40px",
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
    background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))",
  },
  welcomeLeft: { display: "flex", alignItems: "center", gap: 24 },
  welcomeIcon: { fontSize: 56, animation: "float 3s ease-in-out infinite" },
  welcomeTitle: { fontSize: 26, fontWeight: 800, marginBottom: 8 },
  welcomeSub: { fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 500 },
  versionBadgeStable: {
    display: "inline", background: "rgba(16,185,129,0.2)", color: "var(--green)",
    padding: "2px 8px", borderRadius: 4, fontWeight: 700, fontSize: 14, margin: "0 6px"
  },
  versionBadgeCanary: {
    display: "inline", background: "rgba(139,92,246,0.2)", color: "var(--purple)",
    padding: "2px 8px", borderRadius: 4, fontWeight: 700, fontSize: 14, margin: "0 6px"
  },
  simulationNote: { fontSize: 12, color: "var(--text-muted)", marginTop: 12, fontStyle: "italic" },

  feedbackContainer: { display: "flex", justifyContent: "center" },
  feedbackCard: { padding: "40px", display: "flex", flexDirection: "column", gap: 24, width: "100%" },
  sectionTitle: { fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 },
  sectionSub: { fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 },

  btnGroup: { display: "flex", flexDirection: "column", gap: 16, marginTop: 8 },
  feedbackBtn: {
    padding: "20px 24px",
    borderRadius: "var(--radius-md)",
    display: "flex", alignItems: "center", gap: 20,
    justifyContent: "flex-start",
    textAlign: "left",
  },
  thumbIcon: { fontSize: 32, lineHeight: 1 },
  feedbackBtnTitle: { fontSize: 16, fontWeight: 700 },
  feedbackBtnSub: { fontSize: 13, opacity: 0.8, marginTop: 4 },
};