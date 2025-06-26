import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
);

// Aegntic API configuration
const AEGNTIC_API_BASE = process.env.AEGNTIC_API_URL || 'https://api.aegntic.com';
const AEGNTIC_API_KEY = process.env.AEGNTIC_API_KEY || 'placeholder-key';

// Platform verification configurations
const PLATFORM_CONFIGS = {
  github: {
    name: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    apiUrl: 'https://api.github.com/user',
    scopes: ['user:email', 'read:user'],
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET
  },
  linkedin: {
    name: 'LinkedIn',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    apiUrl: 'https://api.linkedin.com/v2/people/~',
    scopes: ['r_liteprofile', 'r_emailaddress'],
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET
  },
  twitter: {
    name: 'Twitter/X',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    apiUrl: 'https://api.twitter.com/2/users/me',
    scopes: ['tweet.read', 'users.read'],
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET
  },
  discord: {
    name: 'Discord',
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    apiUrl: 'https://discord.com/api/users/@me',
    scopes: ['identify', 'email'],
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET
  },
  telegram: {
    name: 'Telegram',
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL
  }
};

// Generate platform-specific verification URL
const generateVerificationUrl = (platform, userEmail, returnUrl) => {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // For telegram, use bot-based verification
  if (platform === 'telegram') {
    const telegramUrl = new URL('https://t.me/' + process.env.TELEGRAM_BOT_USERNAME);
    telegramUrl.searchParams.set('start', `verify_${Buffer.from(userEmail).toString('base64')}`);
    return telegramUrl.toString();
  }

  // For OAuth-based platforms
  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', config.scopes.join(' '));
  authUrl.searchParams.set('state', JSON.stringify({
    email: userEmail,
    platform,
    returnUrl,
    timestamp: Date.now()
  }));
  authUrl.searchParams.set('redirect_uri', `${process.env.BASE_URL}/api/social/callback/${platform}`);

  return authUrl.toString();
};

// Start verification process
router.post('/start-verification', async (req, res) => {
  try {
    const { email, platforms, returnUrl } = req.body;

    if (!email || !platforms || !Array.isArray(platforms)) {
      return res.status(400).json({
        success: false,
        error: 'Email and platforms array are required'
      });
    }

    const verificationUrls = {};
    const verificationSession = {
      email,
      platforms,
      returnUrl,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    // Generate verification URLs for each platform
    for (const platform of platforms) {
      try {
        verificationUrls[platform] = generateVerificationUrl(platform, email, returnUrl);
      } catch (error) {
        console.error(`Failed to generate URL for ${platform}:`, error);
        verificationUrls[platform] = null;
      }
    }

    // Store verification session in database
    const { data: session, error } = await supabase
      .from('social_verification_sessions')
      .insert(verificationSession)
      .select()
      .single();

    if (error) throw error;

    // Send verification request to aegntic
    try {
      await fetch(`${AEGNTIC_API_BASE}/verification/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AEGNTIC_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: verificationSession.sessionId,
          email,
          platforms,
          source: '4site_pro',
          verificationUrls
        })
      });
    } catch (error) {
      console.error('Failed to notify aegntic:', error);
      // Continue without aegntic notification
    }

    res.json({
      success: true,
      sessionId: verificationSession.sessionId,
      verificationUrls
    });

  } catch (error) {
    console.error('Start verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start verification process'
    });
  }
});

// Check verification status
router.post('/verification-status', async (req, res) => {
  try {
    const { email, platforms, sessionId } = req.body;

    // Query verification status from database
    const { data: verifications, error } = await supabase
      .from('user_social_connections')
      .select('platform, verified, verification_data')
      .eq('user_email', email)
      .in('platform', platforms);

    if (error) throw error;

    const verificationResults = {};
    platforms.forEach(platform => {
      const verification = verifications.find(v => v.platform === platform);
      verificationResults[platform] = verification ? verification.verified : false;
    });

    // Also check with aegntic API for real-time status
    try {
      const aegnticResponse = await fetch(`${AEGNTIC_API_BASE}/verification/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AEGNTIC_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, platforms, sessionId })
      });

      if (aegnticResponse.ok) {
        const aegnticData = await aegnticResponse.json();
        // Merge aegntic results with database results
        Object.assign(verificationResults, aegnticData.verifications || {});
      }
    } catch (error) {
      console.error('Failed to check aegntic status:', error);
      // Continue with database results only
    }

    res.json({
      success: true,
      verifications: verificationResults
    });

  } catch (error) {
    console.error('Verification status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check verification status'
    });
  }
});

// OAuth callback handler for platforms
router.get('/callback/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`${process.env.BASE_URL}/verification-failed?error=${oauthError}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.BASE_URL}/verification-failed?error=missing_parameters`);
    }

    // Parse state
    const stateData = JSON.parse(state);
    const { email, returnUrl } = stateData;

    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      return res.redirect(`${process.env.BASE_URL}/verification-failed?error=invalid_platform`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.BASE_URL}/api/social/callback/${platform}`
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to obtain access token');
    }

    // Fetch user profile
    const profileResponse = await fetch(config.apiUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    const profileData = await profileResponse.json();

    // Store verification in database
    const verificationData = {
      user_email: email,
      platform,
      platform_user_id: profileData.id || profileData.sub,
      platform_username: profileData.login || profileData.username || profileData.name,
      platform_profile_url: profileData.html_url || profileData.profile_url,
      verification_data: {
        profile: profileData,
        tokenInfo: {
          scope: tokenData.scope,
          tokenType: tokenData.token_type,
          expiresIn: tokenData.expires_in
        },
        verifiedAt: new Date().toISOString()
      },
      verified: true,
      verified_at: new Date().toISOString()
    };

    const { error: dbError } = await supabase
      .from('user_social_connections')
      .upsert(verificationData, {
        onConflict: 'user_email,platform'
      });

    if (dbError) throw dbError;

    // Notify aegntic of successful verification
    try {
      await fetch(`${AEGNTIC_API_BASE}/verification/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AEGNTIC_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          platform,
          verified: true,
          verificationData
        })
      });
    } catch (error) {
      console.error('Failed to notify aegntic of verification:', error);
    }

    // Redirect to success page
    res.redirect(`${returnUrl || process.env.BASE_URL}/verification-success?platform=${platform}`);

  } catch (error) {
    console.error(`${platform} verification callback error:`, error);
    res.redirect(`${process.env.BASE_URL}/verification-failed?error=verification_failed`);
  }
});

// Telegram webhook handler for bot-based verification
router.post('/telegram-webhook', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.text || !message.from) {
      return res.status(400).json({ success: false });
    }

    // Parse verification command
    const text = message.text.trim();
    if (!text.startsWith('/start verify_')) {
      return res.json({ success: true }); // Ignore non-verification messages
    }

    const encodedEmail = text.split('verify_')[1];
    const email = Buffer.from(encodedEmail, 'base64').toString('utf-8');

    // Store telegram verification
    const verificationData = {
      user_email: email,
      platform: 'telegram',
      platform_user_id: message.from.id.toString(),
      platform_username: message.from.username || message.from.first_name,
      verification_data: {
        profile: message.from,
        chatId: message.chat.id,
        verifiedAt: new Date().toISOString()
      },
      verified: true,
      verified_at: new Date().toISOString()
    };

    const { error: dbError } = await supabase
      .from('user_social_connections')
      .upsert(verificationData, {
        onConflict: 'user_email,platform'
      });

    if (dbError) throw dbError;

    // Send confirmation message to user
    await fetch(`https://api.telegram.org/bot${PLATFORM_CONFIGS.telegram.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text: '✅ Telegram verification completed successfully! You can now close this window and return to 4site.pro.',
        parse_mode: 'Markdown'
      })
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ success: false });
  }
});

// Get user's verified platforms
router.get('/verified-platforms/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const { data: connections, error } = await supabase
      .from('user_social_connections')
      .select('platform, verified, verified_at, platform_username')
      .eq('user_email', email)
      .eq('verified', true);

    if (error) throw error;

    res.json({
      success: true,
      platforms: connections || []
    });

  } catch (error) {
    console.error('Get verified platforms error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verified platforms'
    });
  }
});

// Calculate user's verification score
router.get('/verification-score/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const { data: connections, error } = await supabase
      .from('user_social_connections')
      .select('platform, verified, verification_data')
      .eq('user_email', email)
      .eq('verified', true);

    if (error) throw error;

    let score = 0;
    const platformWeights = {
      github: 25,     // Highest weight for developers
      linkedin: 20,   // Professional credibility
      twitter: 15,    // Community engagement
      discord: 10,    // Tech community
      telegram: 10    // Communication platform
    };

    connections.forEach(connection => {
      score += platformWeights[connection.platform] || 5;
    });

    // Bonus for having multiple platforms
    if (connections.length >= 3) score += 10;
    if (connections.length >= 5) score += 5;

    res.json({
      success: true,
      score: Math.min(score, 100), // Cap at 100
      verifiedPlatforms: connections.length,
      platforms: connections.map(c => c.platform)
    });

  } catch (error) {
    console.error('Verification score calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate verification score'
    });
  }
});

export default router;