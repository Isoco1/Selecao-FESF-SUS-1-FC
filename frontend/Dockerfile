# ── Frontend Next.js — Multi-stage build ──────────────────────────────────────

# ── Estágio 1: Instalar dependências ──────────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Estágio 2: Build ──────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# URLs da API injetadas em build-time (acessadas pelo navegador do usuário)
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Estágio 3: Runner (imagem mínima com standalone) ──────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Apenas os artefatos necessários para o servidor standalone
COPY --from=builder /app/public                    ./public
COPY --from=builder /app/.next/standalone          ./
COPY --from=builder /app/.next/static              ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
