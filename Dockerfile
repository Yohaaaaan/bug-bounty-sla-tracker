FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
COPY frontend/ /frontend/
ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/server.js"]
