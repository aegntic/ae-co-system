import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
);

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || `${process.env.BASE_URL}/auth/github/callback`;

// Exchange authorization code for access token
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.BASE_URL}?auth_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${process.env.BASE_URL}?auth_error=no_code`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.redirect(`${process.env.BASE_URL}?auth_error=${encodeURIComponent(tokenData.error_description)}`);
    }

    // Fetch user data from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const userData = await userResponse.json();

    // Fetch user email (GitHub API requires separate call for email)
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const emailData = await emailResponse.json();
    const primaryEmail = emailData.find(email => email.primary)?.email || userData.email;

    // Store user data in database
    const { data: user, error: dbError } = await supabase
      .from('github_users')
      .upsert({
        github_id: userData.id,
        username: userData.login,
        email: primaryEmail,
        name: userData.name,
        avatar_url: userData.avatar_url,
        html_url: userData.html_url,
        public_repos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        github_created_at: userData.created_at,
        access_token: tokenData.access_token, // Store encrypted in production
        token_scope: tokenData.scope,
        last_login: new Date().toISOString()
      }, {
        onConflict: 'github_id'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.redirect(`${process.env.BASE_URL}?auth_error=database_error`);
    }

    // Generate a session token for the frontend
    const sessionToken = generateSessionToken(user.id);
    
    // Store session in database
    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_at: new Date().toISOString()
      });

    // Parse state to get return URL
    let returnUrl = process.env.BASE_URL;
    if (state) {
      try {
        const stateData = JSON.parse(atob(state));
        returnUrl = stateData.returnUrl || returnUrl;
      } catch (error) {
        console.error('Invalid state parameter:', error);
      }
    }

    // Redirect to frontend with session token and user data
    const redirectUrl = new URL(returnUrl);
    redirectUrl.searchParams.set('auth_success', 'true');
    redirectUrl.searchParams.set('session_token', sessionToken);
    redirectUrl.searchParams.set('github_token', tokenData.access_token);

    res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.redirect(`${process.env.BASE_URL}?auth_error=server_error`);
  }
});

// Webhook handler for GitHub repository events
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    
    // Verify webhook signature (implement based on your security requirements)
    if (!verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.headers['x-github-event'];
    const { action, repository, sender } = req.body;

    // Handle different GitHub events
    switch (event) {
      case 'push':
        await handlePushEvent(req.body);
        break;
      case 'repository':
        if (action === 'created') {
          await handleRepositoryCreated(req.body);
        }
        break;
      case 'pull_request':
        await handlePullRequestEvent(req.body);
        break;
      default:
        console.log(`Unhandled GitHub event: ${event}`);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('GitHub webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle push events to trigger site regeneration
const handlePushEvent = async (payload) => {
  const { repository, commits, pusher } = payload;
  
  // Check if this is a push to main/master branch
  const ref = payload.ref;
  if (!ref.endsWith('/main') && !ref.endsWith('/master')) {
    return; // Ignore pushes to other branches
  }

  // Check if README.md was modified
  const readmeModified = commits.some(commit => 
    commit.added.includes('README.md') || 
    commit.modified.includes('README.md')
  );

  if (!readmeModified) {
    return; // No README changes, no need to regenerate
  }

  // Trigger site regeneration
  await triggerSiteRegeneration({
    repositoryId: repository.id,
    repositoryName: repository.name,
    owner: repository.owner.login,
    branch: ref.split('/').pop(),
    commits,
    pusher
  });

  // Log the regeneration event
  await supabase
    .from('site_regeneration_logs')
    .insert({
      repository_id: repository.id,
      repository_name: repository.full_name,
      trigger_type: 'push',
      trigger_data: {
        ref,
        commits: commits.map(c => ({
          id: c.id,
          message: c.message,
          author: c.author,
          modified: c.modified,
          added: c.added
        }))
      },
      status: 'triggered',
      created_at: new Date().toISOString()
    });
};

// Handle new repository creation
const handleRepositoryCreated = async (payload) => {
  const { repository, sender } = payload;

  // Check if this repository has 4site.pro configuration
  const configExists = await checkFor4SiteConfig(repository.full_name, sender.login);
  
  if (configExists) {
    // Set up automatic deployment for this repository
    await setupAutomaticDeployment(repository, sender);
  }
};

// Handle pull request events
const handlePullRequestEvent = async (payload) => {
  const { action, pull_request, repository } = payload;

  if (action === 'opened' || action === 'synchronize') {
    // Generate preview site for pull request
    await generatePullRequestPreview({
      repositoryId: repository.id,
      pullRequestNumber: pull_request.number,
      headSha: pull_request.head.sha,
      baseSha: pull_request.base.sha,
      owner: repository.owner.login,
      repo: repository.name
    });
  }
};

// Trigger site regeneration
const triggerSiteRegeneration = async (data) => {
  try {
    // Call the site generation service
    const response = await fetch(`${process.env.SITE_GENERATION_SERVICE_URL}/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Site regeneration failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('Site regeneration triggered:', result);

  } catch (error) {
    console.error('Failed to trigger site regeneration:', error);
  }
};

// Check if repository has 4site.pro configuration
const checkFor4SiteConfig = async (repoFullName, token) => {
  try {
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/contents/.4site/config.json`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    return response.ok;
  } catch (error) {
    return false;
  }
};

// Set up automatic deployment for repository
const setupAutomaticDeployment = async (repository, user) => {
  try {
    // Store repository configuration
    await supabase
      .from('repository_deployments')
      .insert({
        repository_id: repository.id,
        repository_name: repository.full_name,
        owner_github_id: user.id,
        owner_username: user.login,
        deployment_status: 'active',
        auto_deploy: true,
        deployment_url: `https://${user.login}.github.io/${repository.name}/`,
        created_at: new Date().toISOString()
      });

    console.log(`Automatic deployment set up for ${repository.full_name}`);
  } catch (error) {
    console.error('Failed to set up automatic deployment:', error);
  }
};

// Generate pull request preview
const generatePullRequestPreview = async (data) => {
  try {
    // Generate preview URL
    const previewUrl = `https://preview-${data.pullRequestNumber}.${data.owner}.4site.pro`;

    // Store preview information
    await supabase
      .from('pull_request_previews')
      .upsert({
        repository_id: data.repositoryId,
        pull_request_number: data.pullRequestNumber,
        head_sha: data.headSha,
        preview_url: previewUrl,
        status: 'generating',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'repository_id,pull_request_number'
      });

    // Trigger preview generation
    await fetch(`${process.env.SITE_GENERATION_SERVICE_URL}/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      body: JSON.stringify({
        ...data,
        previewUrl
      })
    });

  } catch (error) {
    console.error('Failed to generate pull request preview:', error);
  }
};

// Generate session token
const generateSessionToken = (userId) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return Buffer.from(`${userId}:${timestamp}:${random}`).toString('base64');
};

// Verify webhook signature
const verifyWebhookSignature = (payload, signature) => {
  // Implement HMAC verification based on GitHub webhook secret
  // This is a simplified version - implement proper crypto verification
  const expectedSignature = `sha256=${process.env.GITHUB_WEBHOOK_SECRET}`;
  return signature === expectedSignature; // Simplified - use proper crypto.timingSafeEqual
};

// Get user repositories with 4site.pro configuration
router.get('/repositories/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Fetch user's repositories
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch repositories' });
    }

    const repositories = await response.json();

    // Check which repositories have 4site.pro configuration
    const enrichedRepos = await Promise.all(
      repositories.map(async (repo) => {
        const has4SiteConfig = await checkFor4SiteConfig(repo.full_name, token);
        
        // Get deployment info from database
        const { data: deployment } = await supabase
          .from('repository_deployments')
          .select('*')
          .eq('repository_id', repo.id)
          .single();

        return {
          ...repo,
          has4SiteConfig,
          deployment: deployment || null,
          deploymentUrl: deployment?.deployment_url || `https://${username}.github.io/${repo.name}/`
        };
      })
    );

    res.json({
      success: true,
      repositories: enrichedRepos
    });

  } catch (error) {
    console.error('Get repositories error:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Trigger manual site regeneration
router.post('/regenerate/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user has access to repository
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!repoResponse.ok) {
      return res.status(404).json({ error: 'Repository not found or access denied' });
    }

    const repository = await repoResponse.json();

    // Trigger regeneration
    await triggerSiteRegeneration({
      repositoryId: repository.id,
      repositoryName: repository.name,
      owner: repository.owner.login,
      branch: repository.default_branch,
      trigger: 'manual',
      requester: owner
    });

    res.json({
      success: true,
      message: 'Site regeneration triggered',
      repository: repository.full_name
    });

  } catch (error) {
    console.error('Manual regeneration error:', error);
    res.status(500).json({ error: 'Failed to trigger regeneration' });
  }
});

export default router;