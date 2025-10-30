# ---------- Build stage ----------
FROM node:18-bullseye AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy all source files
COPY . .

# Build the app
ENV NODE_OPTIONS="--max-old-space-size=8192"
RUN npm run build

# ---------- Production stage ----------
FROM node:18-bullseye AS runner
WORKDIR /app

# Copy package files for production dependencies
COPY package.json package-lock.json ./
RUN npm ci --production --legacy-peer-deps

# Copy built files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/out ./out
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Expose your app port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]