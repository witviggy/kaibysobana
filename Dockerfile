# Multi-stage Build for Single Container Deployment

# Stage 1: Build Frontend
FROM node:20-alpine as frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
# Important: Set API URL to relative path for monolith deployment
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Build Backend & Serve
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install

# Copy backend source code
COPY backend/ .

# Copy built frontend assets to backend's public folder
COPY --from=frontend-build /app/dist ./public

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
