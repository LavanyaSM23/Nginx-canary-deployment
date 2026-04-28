import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Chart } from "chart.js/auto";

const API = "http://localhost:3001";

export default function Admin({ onLogout }) {
  const [stats, setStats] = useState({ 
    total: 0, 
    versions: { "v1.0.0": { good: 0, bad: 0 }, "v2.0.0": { good: 0, bad: 0 } } 
  });
  const [weight, setWeight] = useState(20);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const fetchState = () => {
    axios.get(`${API}/weight`).then(res => setWeight(res.data.weight)).catch(console.error);
    axios.get(`${API}/stats`).then(res => setStats(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateWeight = (newWeight) => {
    setWeight(newWeight);
    axios.post(`${API}/set-weight`, { weight: newWeight }).catch(console.error);
  };

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    if (chartRef.current) {
      const v1 = stats.versions["v1.0.0"] || { good: 0, bad: 0 };
      const v2 = stats.versions["v2.0.0"] || { good: 0, bad: 0 };
      
      chartInstance.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: ['v1.0.0 (Stable)', 'v2.0.0 (Canary)'],
          datasets: [
            {
              label: '👍 Good Experience',
              data: [v1.good, v2.good],
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 1
            },
            {
              label: '👎 Issues Found',
              data: [v1.bad, v2.bad],
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderColor: 'rgb(239, 68, 68)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          color: '#e2e8f0',
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: '#e2e8f0' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
              ticks: { color: '#e2e8f0' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
          },
          plugins: {
            legend: { labels: { color: '#e2e8f0' } }
          }
        }
      });
    }
  }, [stats]);

  const v1 = stats.versions["v1.0.0"] || { good: 0, bad: 0 };
  const v2 = stats.versions["v2.0.0"] || { good: 0, bad: 0 };
  const v1Total = v1.good + v1.bad;
  const v2Total = v2.good + v2.bad;
  
  const v1Satisfaction = v1Total ? Math.round((v1.good / v1Total) * 100) : 0;
  const v2Satisfaction = v2Total ? Math.round((v2.good / v2Total) * 100) : 0;

  return (
    <div className="dashboard-container">
      <div className="header">
        <h2>Canary Control Panel</h2>
        <button onClick={onLogout} className="btn-primary" style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.1)" }}>Logout</button>
      </div>

      <div className="card-grid">
        <div className="stat-card">
          <span className="stat-label">Total Feedback</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Stable Route (v1)</span>
          <span className="stat-value">{100 - weight}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Canary Route (v2)</span>
          <span className="stat-value" style={{ color: "#10b981" }}>{weight}%</span>
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: "1.5rem" }}>Traffic Routing Weight</h3>
        <p style={{ color: "#94a3b8" }}>Adjust the percentage of traffic routed to the canary release (v2.0.0).</p>
        
        <input 
          type="range" 
          min="0" max="100" step="5"
          value={weight}
          onChange={(e) => updateWeight(parseInt(e.target.value))}
        />
        
        <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontWeight: "bold" }}>
          <span>v1.0.0: {100 - weight}%</span>
          <span style={{ color: "#10b981" }}>v2.0.0: {weight}%</span>
        </div>
      </div>

      <div className="glass-panel" style={{ height: "400px" }}>
        <h3 style={{ marginBottom: "1.5rem" }}>Version Analytics Comparison</h3>
        <div style={{ height: "300px", position: "relative" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
}
