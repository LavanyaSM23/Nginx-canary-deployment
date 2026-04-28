<<<<<<< HEAD
# Nginx-canary-deployment
=======
<<<<<<< HEAD
# canary-deployment
=======
# 🐦 Canary Dashboard

A **Kubernetes Canary Deployment Control Panel** with a beautiful dark dashboard UI, Docker integration, and real-time feedback analytics.

---

## 📐 Architecture

```
 Browser
    │
    ▼
┌─────────────────────────────┐
│     React Frontend (port 80)│  ← nginx-served SPA
└──────────────┬──────────────┘
               │ API calls
               ▼
┌─────────────────────────────┐
│   Node/Express Backend      │  ← port 3001
│   GET  /weight              │
│   POST /set-weight          │
│   POST /feedback            │
│   GET  /stats               │
│   GET  /health              │
└──────────────┬──────────────┘
               │ kubectl annotate
               ▼
┌─────────────────────────────┐
│  Kubernetes NGINX Ingress   │
│  canary-weight annotation   │
└──────┬──────────────┬───────┘
       │ 80%          │ 20%
       ▼              ▼
  [Stable v1]    [Canary v2]
   nginx pod      nginx pod
```

---

## 🚀 Quick Start

### Option 1 — Local Development

```bash
# Terminal 1 — Backend
cd backend
npm install
npm start          # http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm install
npm start          # http://localhost:3000
```

**Login:** `admin / admin` → Admin Dashboard | Any other credentials → User View

---

### Option 2 — Docker Compose (recommended)

```bash
# Build and start all services
docker-compose up --build

# Services:
#   Frontend   → http://localhost:80
#   Backend    → http://localhost:3001
#   Stable pod → http://localhost:8081
#   Canary pod → http://localhost:8082
```

```bash
# Stop everything
docker-compose down

# Rebuild a single service
docker-compose up --build backend
```

---

### Option 3 — Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check resources
kubectl get deployments
kubectl get services
kubectl get ingress

# Update canary weight to 30%
kubectl annotate ingress nginx-ingress-canary \
  nginx.ingress.kubernetes.io/canary-weight="30" --overwrite
```

---

## 🗂️ Project Structure

```
canary-dashboard-project/
├── frontend/
│   ├── src/
│   │   ├── App.js          # Routing: login → user/admin
│   │   ├── Login.js        # Login page with concept diagram
│   │   ├── Admin.js        # Admin dashboard (weight, chart, topology)
│   │   ├── User.js         # User feedback page + docker panel
│   │   └── index.css       # Global dark design system
│   ├── Dockerfile          # Multi-stage: React build → nginx
│   └── nginx.conf          # SPA routing + API proxy
│
├── backend/
│   ├── server.js           # Express API
│   └── Dockerfile          # Node 18 Alpine + non-root user
│
├── k8s/
│   ├── ingress-canary.yaml # Stable + Canary ingress objects
│   ├── deployment-stable.yaml
│   ├── deployment-canary.yaml
│   └── service.yaml
│
├── nginx-stable/html/      # Simulated stable pod page
├── nginx-canary/html/      # Simulated canary pod page
└── docker-compose.yml      # All 4 services
```

---

## 🔑 Credentials

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin    | Admin |
| *any*    | *any*    | User  |

---

## 🐳 Docker Images

| Service        | Image          | Port |
|----------------|----------------|------|
| frontend       | nginx:1.25     | 80   |
| backend        | node:18-alpine | 3001 |
| nginx-stable   | nginx:1.25     | 8081 |
| nginx-canary   | nginx:1.25     | 8082 |

---

## ⚙️ API Reference

| Method | Endpoint      | Description                 |
|--------|---------------|-----------------------------|
| GET    | /health       | Backend health + uptime     |
| GET    | /weight       | Current canary weight       |
| POST   | /set-weight   | Update canary weight        |
| POST   | /login        | Authenticate user           |
| POST   | /feedback     | Submit good/bad feedback    |
| GET    | /stats        | Feedback totals + %         |
>>>>>>> c941d949 (Initial commit)
>>>>>>> 29edeac3 (initial commit)
