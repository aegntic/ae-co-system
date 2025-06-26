// API endpoints for showcase functionality
// This would typically be implemented as serverless functions or API routes

import { supabase } from '../lib/supabase';

export interface ProShowcaseResponse {
  success: boolean;
  data: any[];
  error?: string;
}

// Get Pro showcase sites for the grid
export const getProShowcaseSites = async (
  limit: number = 9,
  excludeSiteId?: string
): Promise<ProShowcaseResponse> => {
  try {
    let query = supabase
      .from('showcase_sites')
      .select(`
        id,
        website_id,
        category,
        likes,
        showcase_views,
        featured,
        website:websites!inner(
          id,
          title,
          description,
          deployment_url,
          custom_domain,
          views,
          status,
          template,
          user_profile:user_profiles!inner(
            id,
            username,
            avatar_url,
            subscription_tier
          )
        )
      `)
      .eq('website.status', 'published')
      .in('website.user_profile.subscription_tier', ['pro', 'business', 'enterprise'])
      .order('featured', { ascending: false })
      .order('likes', { ascending: false })
      .limit(limit);

    if (excludeSiteId) {
      query = query.neq('website_id', excludeSiteId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching Pro showcase sites:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Track showcase interaction
export const trackShowcaseInteraction = async (
  showcaseSiteId: string,
  interactionType: 'view' | 'click' | 'like',
  userId?: string
) => {
  try {
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'showcase_interaction',
        user_id: userId,
        properties: {
          showcase_site_id: showcaseSiteId,
          interaction_type: interactionType,
          timestamp: new Date().toISOString()
        }
      });

    // Update showcase views counter
    if (interactionType === 'view') {
      await supabase.rpc('increment_showcase_views', {
        showcase_id: showcaseSiteId
      });
    }
  } catch (error) {
    console.error('Error tracking showcase interaction:', error);
  }
};

// Example API route handler (for Next.js or similar)
export const showcaseApiHandler = async (req: any, res: any) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { limit = 9, exclude } = req.query;

  try {
    const result = await getProShowcaseSites(
      parseInt(limit as string),
      exclude as string
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      data: [],
      error: 'Internal server error'
    });
  }
};