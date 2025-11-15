# GitHub Actions CI/CD

This project uses GitHub Actions for automated testing, building, and publishing Docker images to GitHub Container Registry (GHCR).

## Pipeline Overview

The pipeline automatically runs on:
- **Push** to `main` or `develop` branches
- **Tags** matching `v*.*.*` pattern (e.g., v1.0.0)
- **Pull Requests** to `main` branch

## Workflow Jobs

### 1. Test Job

Runs automated tests and builds TypeScript code:
- ✅ Checkout code
- ✅ Setup Node.js 20
- ✅ Install dependencies
- ✅ Run ESLint (linter)
- ✅ Run Jest tests
- ✅ Build TypeScript

### 2. Build and Push Job

Builds and publishes Docker image (only after tests pass):
- ✅ Multi-platform build (linux/amd64, linux/arm64)
- ✅ Pushes to GitHub Container Registry
- ✅ Creates multiple tags:
  - `latest` (for main branch)
  - `main`, `develop` (branch names)
  - `v1.0.0`, `v1.0`, `v1` (semantic versions)
  - `main-abc1234` (branch-sha)
- ✅ Docker layer caching for faster builds
- ✅ Build provenance attestation

## Docker Image Location

Images are published to:

```
ghcr.io/<your-username>/restful-pdf-lib:latest
ghcr.io/<your-username>/restful-pdf-lib:main
ghcr.io/<your-username>/restful-pdf-lib:v1.0.0
```

## Setup

### Enable GitHub Container Registry

No setup needed! The pipeline uses `GITHUB_TOKEN` which is automatically provided by GitHub Actions.

### Make Container Public (Optional)

After the first build:
1. Go to your GitHub profile → Packages
2. Click on `restful-pdf-lib`
3. Click "Package settings"
4. Under "Danger Zone" → "Change package visibility" → Make public

### Create a Release

To trigger a version tag build:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Using the Docker Image

### Pull from GHCR

```bash
# Pull latest version
docker pull ghcr.io/<your-username>/restful-pdf-lib:latest

# Pull specific version
docker pull ghcr.io/<your-username>/restful-pdf-lib:v1.0.0

# Run the container
docker run -p 3000:3000 \
  -e API_SECRET=your-secret-here \
  ghcr.io/<your-username>/restful-pdf-lib:latest
```

### For Private Packages

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u <your-username> --password-stdin

# Pull image
docker pull ghcr.io/<your-username>/restful-pdf-lib:latest
```

## Workflow File

The workflow is defined in `.github/workflows/docker-publish.yml`.

### Key Features:

- **Concurrent builds** prevented with `concurrency` group
- **Conditional execution** - build job only runs after tests pass
- **Multi-platform** support using Docker Buildx
- **Smart tagging** based on branch, tag, or SHA
- **Layer caching** for faster subsequent builds

## Monitoring

View pipeline status:
```
https://github.com/<your-username>/restful-pdf-lib/actions
```

Check published packages:
```
https://github.com/<your-username>?tab=packages
```

## Troubleshooting

### Build Fails

- Check Actions tab for error logs
- Ensure all tests pass locally: `npm test`
- Verify Docker builds locally: `docker build .`

### Image Not Visible

- Wait a few minutes after first push
- Check package visibility settings
- Verify workflow completed successfully

### Pull Access Denied

- For private packages, authenticate first
- Check package visibility settings
- Ensure token has correct permissions
