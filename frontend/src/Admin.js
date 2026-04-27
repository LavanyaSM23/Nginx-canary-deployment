import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chart } from "chart.js/auto";

const API = "http://localhost:3001";

/* ── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}${t.exit ? " exit" : ""}`}>
          <span style={{ fontSize: 18 }}>
            {t.type === "success" ? "✅" : t.type === "info" ? "ℹ️" : "❌"}
          </span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

export default function Admin({ username, onLogout }) {
  const [weight,    setWeight]   = useState(20);
  const [pendingW,  setPendingW] = useState(20);
  const [stats,     setStats]    = useState({ 
    global: { good: 0, bad: 0, total: 0, goodPct: 0, badPct: 0 },
    versions: {} 
  });
  const [health,    setHealth]   = useState(null);
  const [uptime,    setUptime]   = useState(0);
  const [version,   setVersion]  = useState("1.0.0");
  const [saving,    setSaving]   = useState(false);
  const [toasts,    setToasts]   = useState([]);
  const [lastSync,  setLastSync] = useState(null);
  
  const chartRef    = useRef(null);
  const chartInst   = useRef(null);

  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  const loadAll = useCallback(async () => {
    try {
      const [sRes, wRes, hRes] = await Promise.all([
        fetch(`${API}/stats`),
        fetch(`${API}/weight`),
        fetch(`${API}/health`),
      ]);
      const [s, w, h] = await Promise.all([sRes.json(), wRes.json(), hRes.json()]);
      setStats(s);
      setWeight(w.weight);
      
      // Only sync pending weight on initial load or if it matches exactly (not currently sliding)
      setPendingW(prev => (prev === weight ? w.weight : prev));
      
      setHealth(h.status);
      setUptime(h.uptime || 0);
      setVersion(h.version || "1.0.0");
      setLastSync(new Date().toLocaleTimeString());
    } catch {
      setHealth("error");
    }
  }, [weight]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 5000);
    return () => clearInterval(interval);
  }, [loadAll]);

  /* Chart — rebuild only when stats change */
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; }
    
    // Extract version data
    const versions = Object.keys(stats.versions || {}).sort();
    const goodData = versions.map(v => stats.versions[v].good);
    const badData = versions.map(v => stats.versions[v].bad);

    chartInst.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: versions.length ? versions.map(v => v === "v2.0.0" ? `${v} (Canary)` : `${v} (Stable)`) : ["v1.0.0 (Stable)", "v2.0.0 (Canary)"],
        datasets: [
          {
            label: '👍 Positive',
            data: goodData.length ? goodData : [0, 0],
            backgroundColor: "rgba(16,185,129,0.85)",
            borderColor: "rgba(16,185,129,1)",
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: '👎 Negative',
            data: badData.length ? badData : [0, 0],
            backgroundColor: "rgba(239,68,68,0.85)",
            borderColor: "rgba(239,68,68,1)",
            borderWidth: 1,
            borderRadius: 4,
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { 
            beginAtZero: true,
            ticks: { precision: 0, color: "#94a3b8" },
            grid: { color: "rgba(255,255,255,0.05)" }
          },
          x: {
            ticks: { color: "#94a3b8", font: { family: "Inter", weight: "bold" } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#f1f5f9", font: { family: "Inter", size: 13 }, usePointStyle: true, padding: 20 },
          },
          tooltip: {
            backgroundColor: "#0d1826",
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            titleColor: "#f1f5f9",
            bodyColor: "#94a3b8",
            padding: 12,
          },
        },
      },
    });
    return () => { if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; } };
  }, [stats]);

  const updateWeight = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${API}/set-weight`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ weight: pendingW }),
      });
      const data = await res.json();
      if (data.success) {
        setWeight(data.weight);
        addToast(`✅ Canary weight updated to ${data.weight}%`, "success");
      } else {
        addToast("Failed to update weight.", "error");
      }
    } catch {
      addToast("Cannot reach backend. Is it running?", "error");
    } finally {
      setSaving(false);
    }
  };

  const formatUptime = (s) => {
    if (s < 60)   return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  };

  const global = stats.global || { good: 0, bad: 0, total: 0, goodPct: 0, badPct: 0 };

  return (
    <>
      <Toast toasts={toasts} />

      <div style={styles.page}>
        {/* Header */}
        <header style={styles.header} className="card">
          <div style={styles.headerLeft}>
            <span style={{ fontSize: 26 }}>🐦</span>
            <div>
              <div style={styles.logoText}>Canary Dashboard</div>
              <div style={styles.headerSub}>Admin Control Panel</div>
            </div>
          </div>
          <div style={styles.headerRight}>
            {health === "ok"
              ? <div className="badge badge-green"><span className="dot dot-green" /> Backend Online</div>
              : <div className="badge badge-red"><span className="dot dot-red" /> Backend Offline</div>}
            {lastSync && (
              <div style={styles.syncLabel}>Synced {lastSync}</div>
            )}
            <div style={styles.userPill}>
              <span>👑</span><span>{username || "Admin"}</span>
            </div>
            <button id="admin-logout-btn" className="btn btn-ghost btn-sm" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </header>

        <main style={styles.main}>

          {/* Stats row */}
          <div className="grid-4">
            {[
              { label: "Canary Weight", value: `${weight}%`, sub: "Current traffic to v2.0.0", icon: "⚡", color: "var(--accent)" },
              { label: "👍 Positive Total",   value: global.good,   sub: `${global.goodPct ?? 0}% of global`, icon: "✅", color: "var(--green)" },
              { label: "👎 Negative Total",   value: global.bad,    sub: `${global.badPct ?? 0}% of global`,  icon: "❌", color: "var(--red)" },
              { label: "Uptime",        value: formatUptime(uptime), sub: `API v${version}`, icon: "🕐", color: "var(--purple)" },
            ].map((s, i) => (
              <div
                key={s.label}
                className="card stat-card anim-fade-up"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div style={styles.statIcon}>{s.icon}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Middle row — Weight control + Chart */}
          <div style={styles.midRow}>

            {/* Weight slider */}
            <div className="card anim-fade-up" style={{ ...styles.sliderCard, animationDelay: "0.3s" }}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}><span>⚡</span> Canary Traffic Weight</h2>
                  <p style={styles.cardSub}>Adjust what percentage of users are assigned to <strong style={{color:"var(--purple)"}}>v2.0.0 (Canary)</strong></p>
                </div>
                <div className="badge badge-blue">K8s Ingress</div>
              </div>

              <div style={styles.weightDisplay}>
                <div style={styles.weightBig}>
                  <span style={{ color: "var(--accent)" }}>{pendingW}</span>
                  <span style={styles.weightUnit}>%</span>
                </div>
                <div style={styles.weightSplit}>
                  <div style={styles.splitItem}>
                    <span className="dot dot-green" />
                    <span>v1.0.0 (Stable): {100 - pendingW}%</span>
                  </div>
                  <div style={styles.splitItem}>
                    <span className="dot dot-blue" />
                    <span style={{color: "var(--purple)", fontWeight: 700}}>v2.0.0 (Canary): {pendingW}%</span>
                  </div>
                </div>
              </div>

              {/* Visual split bar */}
              <div style={styles.splitBarWrap}>
                <div style={{ ...styles.splitBarSeg, width: `${100 - pendingW}%`, background: "var(--green)" }}>
                  {100 - pendingW > 12 && <span style={styles.splitBarLabel}>v1.0.0</span>}
                </div>
                <div style={{ ...styles.splitBarSeg, width: `${pendingW}%`, background: "var(--purple)" }}>
                  {pendingW > 12 && <span style={styles.splitBarLabel}>v2.0.0</span>}
                </div>
              </div>

              <input
                id="weight-slider"
                type="range"
                min="0"
                max="100"
                step="5"
                value={pendingW}
                onChange={e => setPendingW(Number(e.target.value))}
                style={{ margin: "8px 0" }}
              />

              <div style={styles.sliderRow}>
                <div style={styles.tickRow}>
                  {[0, 25, 50, 75, 100].map(v => (
                    <button
                      key={v}
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPendingW(v)}
                      style={{ fontSize: 12, padding: "5px 10px" }}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
                <button
                  id="update-weight-btn"
                  className="btn btn-primary"
                  onClick={updateWeight}
                  disabled={saving || pendingW === weight}
                >
                  {saving ? <span style={spinnerStyle} /> : "⚡"} Update Weight
                </button>
              </div>

              {pendingW !== weight && (
                <div style={styles.pendingBadge}>
                  ⚠️ Unsaved change: {weight}% → {pendingW}%
                </div>
              )}
            </div>

            {/* Version Feedback Chart */}
            <div className="card anim-fade-up" style={{ ...styles.chartCard, animationDelay: "0.4s" }}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}><span>📊</span> Version Feedback Analytics</h2>
                  <p style={styles.cardSub}>Compare user satisfaction between versions</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={loadAll} id="refresh-stats-btn">↻ Refresh</button>
              </div>

              {global.total === 0 ? (
                <div style={styles.emptyChart}>
                  <div style={styles.emptyIcon}>📭</div>
                  <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No feedback received yet.</p>
                </div>
              ) : (
                <div style={{ position: "relative", height: 250, marginTop: 10 }}>
                  <canvas ref={chartRef} />
                </div>
              )}
              
              {/* Detailed Version Stats */}
              {global.total > 0 && stats.versions && (
                <div style={styles.versionStatsGrid}>
                  {Object.keys(stats.versions).sort().map(ver => {
                    const vStats = stats.versions[ver];
                    const vTotal = vStats.good + vStats.bad;
                    const vGoodPct = vTotal ? Math.round((vStats.good / vTotal) * 100) : 0;
                    return (
                      <div key={ver} style={styles.versionStatBox}>
                        <div style={styles.vStatHeader}>
                          <span style={styles.vStatName}>{ver}</span>
                          <span style={styles.vStatTotal}>{vTotal} responses</span>
                        </div>
                        <div style={styles.vStatRow}>
                          <span style={{color: "var(--green)"}}>👍 {vStats.good}</span>
                          <span style={{color: "var(--red)"}}>👎 {vStats.bad}</span>
                        </div>
                        <div className="progress-bar-wrap" style={{ height: 6 }}>
                          <div className="progress-bar-fill" style={{ width: `${vGoodPct}%`, background: "var(--green)" }} />
                        </div>
                        <div style={{fontSize: 11, color: "var(--text-muted)", textAlign: "right", marginTop: 4}}>{vGoodPct}% positive</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Docker deployment visualizer */}
          <div className="card anim-fade-up" style={{ ...styles.dockerCard, animationDelay: "0.5s" }}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}><span>🐳</span> Docker Deployment Topology</h2>
                <p style={styles.cardSub}>Live view of your containerized canary deployment architecture</p>
              </div>
              <div className="badge badge-purple">docker-compose</div>
            </div>

            <div style={styles.topology}>
              {/* Internet */}
              <div style={styles.topoBox}>
                <div style={styles.topoIcon}>🌐</div>
                <div style={styles.topoLabel}>Internet</div>
                <div style={styles.topoSub}>User Requests</div>
              </div>

              <ArrowDown label="100%" color="var(--text-secondary)" />

              {/* Ingress */}
              <div style={{ ...styles.topoBox, borderColor: "rgba(245,158,11,0.5)", boxShadow: "0 0 20px rgba(245,158,11,0.1)" }}>
                <div style={styles.topoIcon}>☸️</div>
                <div style={styles.topoLabel}>NGINX Ingress</div>
                <div style={styles.topoSub} className="mono">nginx.local</div>
              </div>

              {/* Fork */}
              <div style={styles.forkRow}>
                <div style={styles.forkBranch}>
                  <ArrowDown label={`${100 - weight}%`} color="var(--green)" />
                  {/* Stable container */}
                  <div style={{ ...styles.topoBox, borderColor: "rgba(16,185,129,0.5)", boxShadow: "0 0 20px rgba(16,185,129,0.1)" }}>
                    <div style={styles.dockerBadge}>🟢 Stable</div>
                    <div style={styles.topoIcon}>📦</div>
                    <div style={styles.topoLabel} className="mono">nginx:stable</div>
                    <div style={styles.topoSub}>Port 80</div>
                    <div style={{ ...styles.podChip, background: "rgba(16,185,129,0.15)", color: "var(--green)" }}>
                      v1.0.0 · Production
                    </div>
                  </div>
                  <div style={styles.serviceBox}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>nginx-service:80</span>
                  </div>
                </div>

                <div style={styles.forkLine} />

                <div style={styles.forkBranch}>
                  <ArrowDown label={`${weight}%`} color="var(--purple)" />
                  {/* Canary container */}
                  <div style={{ ...styles.topoBox, borderColor: "rgba(139,92,246,0.5)", boxShadow: "0 0 20px rgba(139,92,246,0.1)" }}>
                    <div style={styles.dockerBadge}>🟣 Canary</div>
                    <div style={styles.topoIcon}>📦</div>
                    <div style={styles.topoLabel} className="mono">nginx:canary</div>
                    <div style={styles.topoSub}>Port 80</div>
                    <div style={{ ...styles.podChip, background: "rgba(139,92,246,0.15)", color: "var(--purple)" }}>
                      v2.0.0 · Canary
                    </div>
                  </div>
                  <div style={styles.serviceBox}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>nginx-canary-service:80</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}

function ArrowDown({ label, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0" }}>
      <div style={{ width: 2, height: 28, background: color, borderRadius: 1 }} />
      <div style={{ fontSize: 11, fontWeight: 700, color }}>{label}</div>
      <div style={{ width: 2, height: 28, background: color, borderRadius: 1 }} />
    </div>
  );
}

const spinnerStyle = {
  display: "inline-block",
  width: 16, height: 16,
  border: "2px solid rgba(255,255,255,0.3)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
};

const styles = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 32px",
    borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none",
    position: "sticky", top: 0, zIndex: 100,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logoText: { fontWeight: 800, fontSize: 16 },
  headerSub: { fontSize: 11, color: "var(--text-muted)", marginTop: 1 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  syncLabel: { fontSize: 12, color: "var(--text-muted)" },
  userPill: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 12px", background: "var(--bg-card)",
    border: "1px solid var(--border)", borderRadius: 100,
    fontSize: 13, fontWeight: 500,
  },

  main: {
    padding: "32px 40px",
    display: "flex", flexDirection: "column", gap: 24,
    maxWidth: 1400, margin: "0 auto", width: "100%",
  },

  statIcon: { fontSize: 22, marginBottom: 4 },

  midRow: { display: "grid", gridTemplateColumns: "1.2fr 1.2fr", gap: 24 },
  sliderCard: { padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 },
  chartCard:  { padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 },
  dockerCard: { padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 },

  cardHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
  cardTitle:  { fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  cardSub:    { fontSize: 13, color: "var(--text-secondary)" },

  weightDisplay: { display: "flex", alignItems: "baseline", justifyContent: "space-between" },
  weightBig:  { fontSize: 56, fontWeight: 900, lineHeight: 1 },
  weightUnit: { fontSize: 28, fontWeight: 700, color: "var(--text-secondary)", marginLeft: 4 },
  weightSplit: { display: "flex", flexDirection: "column", gap: 8 },
  splitItem:  { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" },

  splitBarWrap: { display: "flex", height: 32, borderRadius: "var(--radius-sm)", overflow: "hidden", gap: 2 },
  splitBarSeg: {
    height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
    minWidth: 0,
  },
  splitBarLabel: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)" },

  sliderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  tickRow:   { display: "flex", gap: 6 },
  pendingBadge: {
    padding: "8px 14px",
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.3)",
    borderRadius: "var(--radius-sm)",
    fontSize: 13, color: "var(--yellow)", fontWeight: 500,
  },

  emptyChart: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 8, padding: "40px 0",
  },
  emptyIcon: { fontSize: 36 },
  
  versionStatsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" },
  versionStatBox: { padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" },
  vStatHeader: { display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" },
  vStatName: { fontSize: 14, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" },
  vStatTotal: { fontSize: 11, color: "var(--text-muted)" },
  vStatRow: { display: "flex", gap: 16, fontSize: 13, fontWeight: 600, marginBottom: 8 },

  /* Topology */
  topology: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 0, padding: "8px 0",
  },
  topoBox: {
    padding: "16px 24px",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    textAlign: "center",
    background: "rgba(255,255,255,0.03)",
    minWidth: 160,
    display: "flex", flexDirection: "column", gap: 4, alignItems: "center",
  },
  topoIcon:  { fontSize: 28 },
  topoLabel: { fontSize: 14, fontWeight: 700 },
  topoSub:   { fontSize: 11, color: "var(--text-muted)" },
  dockerBadge: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
  podChip: { padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, marginTop: 4 },
  forkRow: { display: "flex", gap: 80, alignItems: "flex-start" },
  forkBranch: { display: "flex", flexDirection: "column", alignItems: "center" },
  forkLine: { display: "none" },
  serviceBox: {
    marginTop: 8,
    padding: "4px 12px",
    border: "1px dashed var(--border)",
    borderRadius: 100,
    fontSize: 11, color: "var(--text-muted)",
  },
};