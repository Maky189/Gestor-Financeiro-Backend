FROM node:18-alpine AS base

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ["node","-e","require('net').createConnection(process.env.PORT||3000).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"]

CMD ["node", "src/app.js"]
