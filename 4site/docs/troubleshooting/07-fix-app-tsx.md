# Prompt 07: Fix App.tsx

## Objective
Update App.tsx to properly handle the site generation flow and show preview with deployment options.

## Target File
- `/App.tsx`

## Key Changes
1. Show actual site preview instead of just success message
2. Add GitHub Pages deployment option
3. Remove Vercel and download options
4. Proper error handling

## Implementation
Update the success state handling:

```typescript
// In the App component, update the success modal section:

{step === 'success' && siteData && (
  <>
    {/* Full Screen Preview */}
    <div className="fixed inset-0 bg-white z-40">
      <SimplePreviewTemplate siteData={siteData} />
    </div>

    {/* Floating Action Panel */}
    <div className="fixed bottom-8 right-8 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm">
        <h3 className="text-lg font-semibold mb-2">Your site is ready!</h3>
        <p className="text-sm text-gray-600 mb-4">
          Deploy to GitHub Pages or edit the content
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleGitHubPagesDeployment}
            className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <GitHubIcon className="w-5 h-5" />
            Deploy to GitHub Pages
          </button>
          
          <button
            onClick={handleEdit}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Edit Content
          </button>
          
          <button
            onClick={handleRetry}
            className="w-full px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            Generate New Site
          </button>
        </div>
      </div>
    </div>
  </>
)}

// Add the deployment handler:
const handleGitHubPagesDeployment = async () => {
  setIsDeploying(true);
  try {
    if (!user?.githubToken || !siteData.repo || !siteData.owner) {
      throw new Error('Missing GitHub authentication or repository information');
    }

    const deploymentUrl = await deployToGitHubPages({
      token: user.githubToken,
      owner: siteData.owner,
      repo: siteData.repo,
      siteData: siteData
    });

    toast.success(\`Site deployed! Visit: \${deploymentUrl}\`);
    window.open(deploymentUrl, '_blank');
  } catch (error) {
    console.error('Deployment error:', error);
    toast.error('Failed to deploy to GitHub Pages');
  } finally {
    setIsDeploying(false);
  }
};

// Update the generation handler to properly set siteData:
const handleGenerate = async () => {
  try {
    setIsGenerating(true);
    setError(null);
    
    if (!repoUrl) {
      throw new Error('Please enter a repository URL');
    }

    // Generate site data with proper type
    const data = await generateSiteContentFromUrl(repoUrl);
    
    if (!data || typeof data === 'string') {
      throw new Error('Invalid response from content generator');
    }
    
    setSiteData(data);
    setStep('success');
    
    // Track successful generation
    if (user) {
      await trackActivity('site_generated', {
        repoUrl,
        userId: user.id,
        template: data.template
      });
    }
  } catch (err) {
    console.error('Generation error:', err);
    setError(err.message || 'Failed to generate site');
    setStep('error');
  } finally {
    setIsGenerating(false);
  }
};
```

## Expected Output File
- `fixed-app-component.tsx` - Updated App.tsx with proper preview and deployment

## Dependencies
- Requires: 03-fix-gemini-service.md (fixed generateSiteContentFromUrl)
- Requires: 06-fix-preview-template.md (SimplePreviewTemplate)
- Requires: 08-add-github-pages.md (deployToGitHubPages function)

## Validation
- Site preview should show immediately after generation
- Deployment panel should float over preview
- GitHub Pages deployment should work
- Error handling should be comprehensive

## Notes
This fixes the core user experience issue:
- Users see their generated site immediately
- Clear call-to-action for deployment
- Simplified options (no Vercel/download)
- Better error messages