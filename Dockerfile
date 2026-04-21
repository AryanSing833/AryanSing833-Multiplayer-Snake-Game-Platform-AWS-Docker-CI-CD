# ---------- FRONTEND BUILD ----------
FROM node:20-alpine AS frontend-build

WORKDIR /app/client

# Install deps
COPY client/package*.json ./
RUN npm ci

# Copy frontend code
COPY client/ ./

# Optional: set API URL (only if needed)
ENV VITE_API_URL=http://51.20.184.90

# Build frontend
RUN npm run build


# ---------- BACKEND ----------
FROM node:20-alpine

WORKDIR /app

# Install backend deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy backend code
COPY server.js ./

# Copy built frontend
COPY --from=frontend-build /app/client/dist ./client/dist

# Expose backend port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]