# ═══════════════════════════════════════════════════════════════
# SNAKE.IO — Multi-stage Dockerfile (Clean & Stable)
# Stage 1: Build React frontend
# Stage 2: Run Node backend + serve frontend
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Build React Frontend ─────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/client

# Install dependencies
COPY client/package.json client/package-lock.json* ./
RUN npm ci

# Copy source and build
COPY client/ ./
RUN npm run build


# ── Stage 2: Production Server ────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend server
COPY server.js ./

# Copy ONLY built frontend from stage 1
COPY --from=frontend-build /app/client/dist ./client/dist

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]