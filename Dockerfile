# syntax=docker/dockerfile:1.7

# Runtime image (single-stage; assumes dist/ is built outside Docker)
FROM node:22-alpine

# Build arguments for versioning
ARG BUILD_NUMBER=0

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Update package.json version with build metadata (kept at runtime; app reads it)
RUN PACKAGE_VERSION=$(node -p "require('./package.json').version") && \
  NEW_VERSION="${PACKAGE_VERSION}+build.${BUILD_NUMBER}" && \
  sed -i "s/\"version\": \".*\"/\"version\": \"${NEW_VERSION}\"/" package.json && \
  echo "Updated version to: ${NEW_VERSION}"

# Install production dependencies only (cached)
RUN --mount=type=cache,target=/root/.npm \
  npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Copy built application (from host build step)
COPY dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app files
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set default port (can be overridden with PORT env var)
ENV PORT=3000

# Expose port
EXPOSE ${PORT}

# Health check - uses PORT env var
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; require('http').get(\`http://localhost:\${port}/health\`, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
