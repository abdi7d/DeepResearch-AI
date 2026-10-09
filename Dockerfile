# Multi-stage build for DeepResearch AI

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy backend source
COPY backend/ ./

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 3000

# Start the server with tsx
CMD ["tsx", "server.ts"]
