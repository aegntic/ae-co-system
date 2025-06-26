import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import socialVerificationRoutes from './routes/socialVerification.js';
import {
  corsOptions,
  generalRateLimit,
  strictRateLimit,
  helmetConfig,
  additionalSecurityHeaders,
  validateAndSanitizeInput,
  securityMonitoring,
  ipReputationCheck,
  logSecurityEvent
} from './security-middleware.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.API_PORT || 3001;

// Security middleware (order matters!)
app.use(helmetConfig);
app.use(additionalSecurityHeaders);
app.use(securityMonitoring);
app.use(ipReputationCheck);

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// CORS with strict configuration
app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ 
  limit: '1mb', // Reduced from 10mb for security
  verify: (req, res, buf) => {
    // Log large payloads
    if (buf.length > 100000) {
      logSecurityEvent('LARGE_PAYLOAD', {
        size: buf.length,
        endpoint: req.originalUrl
      }, req);
    }
  }
}));

// Rate limiting
app.use('/api/', generalRateLimit);

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
);

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Calculate lead score based on engagement and verification
const calculateLeadScore = (data) => {
  let score = 0;
  
  // Email quality (basic validation)
  if (isValidEmail(data.email)) score += 20;
  
  // Engagement signals
  score += Math.min(data.metadata.timeOnSite / 60, 10); // Up to 10 points for time on site
  score += Math.min(data.metadata.scrollDepth / 10, 10); // Up to 10 points for scroll depth
  score += Math.min(data.metadata.interactionCount * 2, 20); // Up to 20 points for interactions
  score += Math.min(data.metadata.sectionsViewed.length * 5, 25); // Up to 25 points for sections viewed
  
  // Interest signals
  score += data.projectInterests.length * 3; // 3 points per interest
  
  // Social platform connections
  score += data.socialPlatforms.length * 5; // 5 points per platform
  
  // Newsletter opt-in
  if (data.newsletterOptIn) score += 5;
  
  // Device type preference (desktop users typically more engaged)
  if (data.metadata.deviceType === 'desktop') score += 5;
  else if (data.metadata.deviceType === 'tablet') score += 2;
  
  // Referrer quality
  if (data.metadata.referrer && !data.metadata.referrer.includes('direct')) {
    if (data.metadata.referrer.includes('github.com')) score += 10;
    else if (data.metadata.referrer.includes('linkedin.com')) score += 8;
    else if (data.metadata.referrer.includes('twitter.com')) score += 6;
    else score += 3; // Other referrers
  }
  
  return Math.min(Math.round(score), 100); // Cap at 100
};

// Extract additional insights from metadata
const extractInsights = (data) => {
  const insights = {
    userType: 'unknown',
    engagementLevel: 'low',
    devicePreference: data.metadata.deviceType,
    timeZoneRegion: data.metadata.timezone.split('/')[0] || 'unknown',
    browserInfo: data.metadata.userAgent.includes('Chrome') ? 'chrome' : 
                 data.metadata.userAgent.includes('Firefox') ? 'firefox' :
                 data.metadata.userAgent.includes('Safari') ? 'safari' : 'other',
    screenCategory: (() => {
      const [width] = data.metadata.screenResolution.split('x').map(Number);
      if (width >= 2560) return 'large';
      if (width >= 1920) return 'standard';
      if (width >= 1366) return 'medium';
      return 'small';
    })(),
    sessionQuality: 'low'
  };
  
  // Determine user type based on interests and behavior
  if (data.projectInterests.includes('AI/ML') || data.projectInterests.includes('Data Science')) {
    insights.userType = 'data_scientist';
  } else if (data.projectInterests.includes('Web Development') || data.projectInterests.includes('UI/UX Design')) {
    insights.userType = 'frontend_developer';
  } else if (data.projectInterests.includes('Backend Systems') || data.projectInterests.includes('DevOps')) {
    insights.userType = 'backend_developer';
  } else if (data.projectInterests.includes('Mobile Apps')) {
    insights.userType = 'mobile_developer';
  } else if (data.projectInterests.length > 3) {
    insights.userType = 'full_stack_developer';
  }
  
  // Engagement level
  if (data.metadata.timeOnSite > 180 && data.metadata.scrollDepth > 70) {
    insights.engagementLevel = 'high';
  } else if (data.metadata.timeOnSite > 60 && data.metadata.scrollDepth > 40) {
    insights.engagementLevel = 'medium';
  }
  
  // Session quality
  if (insights.engagementLevel === 'high' && data.socialPlatforms.length > 0) {
    insights.sessionQuality = 'high';
  } else if (insights.engagementLevel === 'medium' || data.projectInterests.length > 2) {
    insights.sessionQuality = 'medium';
  }
  
  return insights;
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    supabase: !!process.env.VITE_SUPABASE_URL
  });
});

// Lead capture endpoint with enhanced security
app.post('/api/leads/capture', strictRateLimit, validateAndSanitizeInput, async (req, res) => {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.email || !data.siteId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and siteId are required' 
      });
    }

    // Validate email format
    if (!isValidEmail(data.email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Calculate lead score and extract insights
    const leadScore = calculateLeadScore(data);
    const insights = extractInsights(data);

    // Check for existing lead with same email and site
    const { data: existingLead, error: checkError } = await supabase
      .from('waitlist_submissions')
      .select('id')
      .eq('email', data.email)
      .eq('source_site_id', data.siteId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingLead) {
      // Update existing lead with new data
      const { data: updatedLead, error } = await supabase
        .from('waitlist_submissions')
        .update({
          project_interests: data.projectInterests,
          social_platforms_connected: data.socialPlatforms,
          newsletter_opt_in: data.newsletterOptIn,
          visitor_metadata: {
            ...data.metadata,
            insights,
            lastUpdate: new Date().toISOString()
          },
          lead_score: leadScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLead.id)
        .select()
        .single();

      if (error) throw error;

      return res.json({ 
        success: true, 
        leadId: updatedLead.id,
        message: 'Lead updated successfully' 
      });
    }

    // Create new lead submission
    const { data: newLead, error } = await supabase
      .from('waitlist_submissions')
      .insert({
        email: data.email,
        source_site_id: data.siteId,
        project_type: data.projectType,
        template_used: data.template,
        project_interests: data.projectInterests,
        social_platforms_connected: data.socialPlatforms,
        newsletter_opt_in: data.newsletterOptIn,
        visitor_metadata: {
          ...data.metadata,
          insights,
          captureTimestamp: data.captureTimestamp
        },
        lead_score: leadScore,
        conversion_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Track visitor behavior separately for analytics
    await supabase
      .from('visitor_tracking')
      .insert({
        session_id: data.metadata.sessionId,
        site_id: data.siteId,
        visitor_ip: req.ip,
        user_agent: data.metadata.userAgent,
        referrer_url: data.metadata.referrer,
        behavior_data: {
          timeOnSite: data.metadata.timeOnSite,
          scrollDepth: data.metadata.scrollDepth,
          sectionsViewed: data.metadata.sectionsViewed,
          interactionCount: data.metadata.interactionCount,
          projectInterests: data.projectInterests,
          socialPlatforms: data.socialPlatforms,
          insights
        },
        visit_duration: data.metadata.timeOnSite,
        pages_viewed: 1,
        conversion_event: 'waitlist_signup',
        device_type: data.metadata.deviceType,
        screen_resolution: data.metadata.screenResolution,
        timezone: data.metadata.timezone,
        language: data.metadata.language
      });

    // Log high-quality leads for immediate follow-up
    if (leadScore > 70) {
      console.log('🔥 High-quality lead captured:', { 
        leadId: newLead.id, 
        email: data.email,
        score: leadScore, 
        insights,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({ 
      success: true, 
      leadId: newLead.id,
      leadScore,
      message: 'Lead captured successfully' 
    });

  } catch (error) {
    console.error('Lead capture error:', error);
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Analytics endpoint for site owners
app.get('/api/leads/analytics/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    
    const { data: analytics, error } = await supabase
      .rpc('get_site_lead_analytics', { site_uuid: siteId });
    
    if (error) throw error;
    
    res.json({ success: true, data: analytics });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// Site generation endpoint
app.post('/api/generate', generalRateLimit, validateAndSanitizeInput, async (req, res) => {
  try {
    const { repoUrl, mode = 'auto' } = req.body;
    
    if (!repoUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Repository URL is required' 
      });
    }

    // Import the AI service
    const aiService = await import('../services/geminiService.js');
    const generateSiteFromRepo = aiService.generateSiteFromRepo;
    
    // Generate the site
    const result = await generateSiteFromRepo(repoUrl, { mode });
    
    res.json({ 
      success: true, 
      data: result 
    });

  } catch (error) {
    console.error('Site generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Site generation failed' 
    });
  }
});

// Mount social verification routes with rate limiting
app.use('/api/social', strictRateLimit, socialVerificationRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Lead Capture API Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📧 Lead capture: http://localhost:${PORT}/api/leads/capture`);
});

export default app;