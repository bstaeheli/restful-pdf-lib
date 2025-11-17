# Use Node.js LTS version
FROM node:20-alpine AS builder

# Build arguments for versioning
ARG BUILD_NUMBER=0

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Update package.json version with build metadata
RUN PACKAGE_VERSION=$(node -p "require('./package.json').version") && \
    NEW_VERSION="${PACKAGE_VERSION}+build.${BUILD_NUMBER}" && \
    sed -i "s/\"version\": \".*\"/\"version\": \"${NEW_VERSION}\"/" package.json && \
    echo "Updated version to: ${NEW_VERSION}"

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

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
