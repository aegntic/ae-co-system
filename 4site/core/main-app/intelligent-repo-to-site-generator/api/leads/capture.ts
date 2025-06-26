import { supabase } from '../../lib/supabase';

export interface LeadCaptureRequest {
  siteId: string;
  projectType: string;
  template: string;
  email: string;
  projectInterests: string[];
  socialPlatforms: string[];
  newsletterOptIn: boolean;
  metadata: {
    sessionId: string;
    timeOnSite: number;
    scrollDepth: number;
    sectionsViewed: string[];
    interactionCount: number;
    referrer: string;
    userAgent: string;
    timezone: string;
    language: string;
    screenResolution: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
  };
  captureTimestamp: string;
}

export interface LeadCaptureResponse {
  success: boolean;
  leadId?: string;
  message?: string;
  error?: string;
}

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Calculate lead score based on engagement and verification
const calculateLeadScore = (data: LeadCaptureRequest): number => {
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
const extractInsights = (data: LeadCaptureRequest) => {
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

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data: LeadCaptureRequest = await req.json();
    
    // Validate required fields
    if (!data.email || !data.siteId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email and siteId are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    if (!isValidEmail(data.email)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid email format' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate lead score and extract insights
    const leadScore = calculateLeadScore(data);
    const insights = extractInsights(data);

    // Check for existing lead with same email and site
    const { data: existingLead } = await supabase
      .from('waitlist_submissions')
      .select('id')
      .eq('email', data.email)
      .eq('source_site_id', data.siteId)
      .single();

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

      return new Response(JSON.stringify({ 
        success: true, 
        leadId: updatedLead.id,
        message: 'Lead updated successfully' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
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
        visitor_ip: null, // Would be set by edge function in production
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
        conversion_event: 'waitlist_signup'
      });

    // Trigger follow-up automation (webhook to n8n or similar)
    // This would be implemented based on lead score and insights
    if (leadScore > 70) {
      // High-quality lead - trigger immediate follow-up
      console.log('High-quality lead captured:', { 
        leadId: newLead.id, 
        score: leadScore, 
        insights 
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      leadId: newLead.id,
      leadScore,
      message: 'Lead captured successfully' 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Lead capture error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}