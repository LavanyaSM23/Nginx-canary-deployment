FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --silent
COPY . .
RUN CI=false npm run build
FROM nginx:1.25-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/health.txt || exit 1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
