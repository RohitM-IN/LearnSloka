# Stage 1 — Build the app
FROM node:20-alpine AS builder

# Enable pnpm
RUN corepack enable

# Create app directory
WORKDIR /app

# Copy lockfile and package.json first (better caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the app
COPY . .

# Build for production
RUN pnpm run build

# Stage 2 — Serve with Nginx
FROM nginx:stable-alpine

# Copy build output to nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
