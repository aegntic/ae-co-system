import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { 
  UnifiedUser, 
  UnifiedSession, 
  CrossPlatformProject, 
  AuthenticationConfig,
  ConversionEvent
} from '../auth/unified-auth.types';

export class UnifiedAuthService {
  private supabase: SupabaseClient;
  private config: AuthenticationConfig;

  constructor(config: AuthenticationConfig) {
    this.config = config;
    this.supabase = createClient(config.supabase_url, config.supabase_service_key);
  }

  /**
   * Single Sign-On Implementation
   */
  async createUnifiedSession(email: string, password: string, platform: 'foursitepro' | 'dailydoco'): Promise<UnifiedSession> {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      throw new Error(`Authentication failed: ${authError?.message}`);
    }

    // Get unified user profile
    const userProfile = await this.getUnifiedUserProfile(authData.user.id);
    
    // Generate cross-platform JWT tokens
    const accessToken = this.generateAccessToken(userProfile, platform);
    const refreshToken = this.generateRefreshToken(userProfile.id);

    // Calculate platform permissions
    const platformPermissions = await this.calculatePlatformPermissions(userProfile.id);

    // Update user's last seen
    await this.updateUserLastSeen(userProfile.id, platform);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: userProfile,
      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      platform_permissions: platformPermissions
    };
  }

  async signUpUnified(
    email: string, 
    password: string, 
    name: string, 
    platform: 'foursitepro' | 'dailydoco',
    referralCode?: string
  ): Promise<UnifiedSession> {
    // Create Supabase user
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          platform_origin: platform
        }
      }
    });

    if (authError || !authData.user) {
      throw new Error(`Sign up failed: ${authError?.message}`);
    }

    // Create unified user profile
    const userProfile = await this.createUnifiedUserProfile({
      id: authData.user.id,
      email: authData.user.email!,
      name: name,
      subscription_tier: 'free',
      platform_access: {
        foursitepro: platform === 'foursitepro',
        dailydoco: platform === 'dailydoco',
        aegnt27: false
      },
      referral_code: this.generateReferralCode(),
      referred_by: referralCode
    });

    // Track conversion event
    await this.trackConversionEvent({
      user_id: userProfile.id,
      event_type: 'signup',
      source_platform: platform,
      metadata: {
        referral_source: referralCode
      },
      timestamp: new Date().toISOString()
    });

    // Create session
    return await this.createUnifiedSession(email, password, platform);
  }

  /**
   * Cross-Platform Session Validation
   */
  async validateCrossPlatformSession(token: string, targetPlatform: 'foursitepro' | 'dailydoco'): Promise<UnifiedUser | null> {
    try {
      const decoded = jwt.verify(token, this.config.jwt_secret) as any;
      
      // Check if user has access to target platform
      const userProfile = await this.getUnifiedUserProfile(decoded.userId);
      
      if (!userProfile.platform_access[targetPlatform]) {
        // Auto-grant access for seamless experience
        await this.grantPlatformAccess(userProfile.id, targetPlatform);
        userProfile.platform_access[targetPlatform] = true;
      }

      return userProfile;
    } catch (error) {
      console.error('Session validation failed:', error);
      return null;
    }
  }

  /**
   * Project Continuity System
   */
  async shareProjectCrossPlatform(
    userId: string, 
    projectData: Omit<CrossPlatformProject, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<CrossPlatformProject> {
    const project: CrossPlatformProject = {
      id: this.generateProjectId(),
      user_id: userId,
      ...projectData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store in database
    const { data, error } = await this.supabase
      .from('cross_platform_projects')
      .insert(project)
      .select()
      .single();

    if (error) {
      throw new Error(`Project sharing failed: ${error.message}`);
    }

    return data;
  }

  async getUserProjects(userId: string, platform?: 'foursitepro' | 'dailydoco'): Promise<CrossPlatformProject[]> {
    let query = this.supabase
      .from('cross_platform_projects')
      .select('*')
      .eq('user_id', userId);

    if (platform) {
      query = query.eq('platform_origin', platform);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Automated Tutorial Generation Pipeline
   */
  async triggerTutorialGeneration(request: import('../auth/unified-auth.types').TutorialGenerationRequest): Promise<string> {
    // Store tutorial generation request
    const { data, error } = await this.supabase
      .from('tutorial_generation_requests')
      .insert({
        ...request,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Tutorial generation request failed: ${error.message}`);
    }

    // Trigger DailyDoco MCP server for processing
    // This would integrate with the capture engine
    await this.enqueueTutorialGeneration(data.id);

    // Track conversion event
    await this.trackConversionEvent({
      user_id: request.user_id,
      event_type: 'tutorial_generated',
      source_platform: 'foursitepro',
      target_platform: 'dailydoco',
      metadata: {
        project_id: request.project_id
      },
      timestamp: new Date().toISOString()
    });

    return data.id;
  }

  /**
   * Cross-Platform Analytics
   */
  async trackConversionEvent(event: ConversionEvent): Promise<void> {
    const { error } = await this.supabase
      .from('conversion_events')
      .insert(event);

    if (error) {
      console.error('Failed to track conversion event:', error);
    }
  }

  async getFlyWheelMetrics(userId: string, timeframe: '24h' | '7d' | '30d' | '90d'): Promise<import('../auth/unified-auth.types').FlyWheelMetrics> {
    const timeframeDays = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    const since = new Date();
    since.setDate(since.getDate() - timeframeDays[timeframe]);

    // Query conversion events and calculate metrics
    const { data: events, error } = await this.supabase
      .from('conversion_events')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', since.toISOString());

    if (error) {
      throw new Error(`Failed to fetch metrics: ${error.message}`);
    }

    // Calculate flywheel metrics
    const websitesCreated = events?.filter(e => e.event_type === 'website_created').length || 0;
    const tutorialsGenerated = events?.filter(e => e.event_type === 'tutorial_generated').length || 0;
    const tutorialConversionRate = websitesCreated > 0 ? tutorialsGenerated / websitesCreated : 0;

    return {
      user_id: userId,
      timeframe,
      metrics: {
        websites_created: websitesCreated,
        tutorials_generated: tutorialsGenerated,
        tutorial_conversion_rate: tutorialConversionRate,
        tutorial_views: 0, // Would come from YouTube analytics
        new_users_from_tutorials: 0, // Would be calculated from referral tracking
        viral_coefficient: 0, // Would be calculated from user acquisition data
        foursitepro_to_dailydoco_conversion: events?.filter(e => 
          e.source_platform === 'foursitepro' && e.target_platform === 'dailydoco'
        ).length || 0,
        dailydoco_to_foursitepro_conversion: events?.filter(e => 
          e.source_platform === 'dailydoco' && e.target_platform === 'foursitepro'
        ).length || 0,
        lifetime_value: 0, // Would be calculated from subscription data
        revenue_per_tutorial: 0, // Would be calculated from revenue attribution
        cost_per_acquisition: 0 // Would be calculated from marketing spend
      }
    };
  }

  /**
   * Private Helper Methods
   */
  private async getUnifiedUserProfile(userId: string): Promise<UnifiedUser> {
    const { data, error } = await this.supabase
      .from('unified_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`User not found: ${error.message}`);
    }

    return data;
  }

  private async createUnifiedUserProfile(userProfile: Omit<UnifiedUser, 'created_at' | 'last_seen_at'>): Promise<UnifiedUser> {
    const profile: UnifiedUser = {
      ...userProfile,
      created_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('unified_users')
      .insert(profile)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return data;
  }

  private generateAccessToken(user: UnifiedUser, platform: string): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        platform,
        tier: user.subscription_tier
      },
      this.config.jwt_secret,
      { expiresIn: this.config.jwt_expires_in }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.config.jwt_secret,
      { expiresIn: this.config.refresh_token_expires_in }
    );
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private generateProjectId(): string {
    return 'proj_' + Math.random().toString(36).substring(2, 15);
  }

  private async calculatePlatformPermissions(userId: string) {
    // This would query actual usage data
    return {
      foursitepro: {
        websites_created: 0,
        can_remove_branding: false,
        can_use_custom_domain: false,
        api_access: false
      },
      dailydoco: {
        videos_generated: 0,
        capture_sessions: 0,
        ai_test_audience_access: false,
        advanced_editing: false
      }
    };
  }

  private async updateUserLastSeen(userId: string, platform: string): Promise<void> {
    await this.supabase
      .from('unified_users')
      .update({ 
        last_seen_at: new Date().toISOString(),
        [`last_seen_${platform}`]: new Date().toISOString()
      })
      .eq('id', userId);
  }

  private async grantPlatformAccess(userId: string, platform: 'foursitepro' | 'dailydoco'): Promise<void> {
    await this.supabase
      .from('unified_users')
      .update({ 
        [`platform_access.${platform}`]: true 
      })
      .eq('id', userId);
  }

  private async enqueueTutorialGeneration(requestId: string): Promise<void> {
    // This would integrate with a job queue (Redis/BullMQ) to trigger DailyDoco processing
    console.log(`Enqueuing tutorial generation for request ${requestId}`);
  }
}