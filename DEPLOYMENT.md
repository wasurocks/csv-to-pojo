# GitHub Pages Deployment Guide

This guide will help you deploy the CSV to POJO web application to GitHub Pages.

## 🚀 Quick Deployment Steps

### 1. Push to GitHub Repository

```bash
# Add all files and commit
git add .
git commit -m "Add GitHub Pages deployment configuration"
git push origin main
```

### 2. Enable GitHub Pages

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under "Source", select **GitHub Actions**
4. The workflow will automatically trigger on the next push

### 3. Update Documentation

After successful deployment, update the README.md:

-   Replace `username` with your GitHub username in the live demo URL
-   The final URL will be: `https://yourusername.github.io/csv-to-pojo/`

## 📁 Files Created for Deployment

-   `.github/workflows/deploy-pages.yml` - GitHub Actions workflow
-   `public/.nojekyll` - Disables Jekyll processing
-   Updated `webpack.config.js` - Handles GitHub Pages subdirectory paths
-   Updated `package.json` - Added build:pages script

## 🔧 How It Works

1. **Trigger**: Push to main branch triggers the GitHub Action
2. **Build**:
    - Installs Node.js dependencies
    - Runs tests to ensure quality
    - Builds with `GITHUB_PAGES=true` for correct asset paths
3. **Deploy**: Uploads build artifacts to GitHub Pages
4. **Live**: Application becomes available at the GitHub Pages URL

## 🧪 Testing Locally

Before deployment, you can test the GitHub Pages build locally:

```bash
# Test GitHub Pages specific build
npm run build:pages

# Serve the built files
cd dist && python3 -m http.server 8000
# Visit http://localhost:8000
```

## ⚠️ Troubleshooting

### Build Fails

-   Check that all tests pass: `npm test`
-   Verify build works locally: `npm run build:pages`

### 404 Errors on GitHub Pages

-   Ensure `.nojekyll` file is present in the build output
-   Check that the repository name matches the webpack publicPath configuration

### Assets Not Loading

-   Verify the publicPath in webpack.config.js matches your repository name
-   Check that GITHUB_PAGES environment variable is set during build

## 🔄 Automatic Updates

Every push to the main branch will automatically:

1. Run the test suite
2. Build the application
3. Deploy to GitHub Pages

No manual intervention needed after the initial setup!
