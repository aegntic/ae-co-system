import { supabase } from './supabase';
import { UltraPlan, User } from '../../shared/types';

export interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  projectTypes: string[];
  price: number;
  rating: number;
  downloads: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  preview: {
    objectives: string[];
    phases: number;
    estimatedDuration: string;
    frameworks: string[];
  };
  features: string[];
  requirements: string[];
  testimonials: Testimonial[];
  createdAt: Date;
  updatedAt: Date;
}

interface Testimonial {
  id: string;
  user: {
    name: string;
    company?: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  results?: string;
  date: Date;
}

interface MarketplaceFilters {
  category?: string;
  projectType?: string;
  priceRange?: { min: number; max: number };
  rating?: number;
  tags?: string[];
  sortBy?: 'popular' | 'newest' | 'rating' | 'price';
}

export class MarketplaceService {
  private static instance: MarketplaceService;
  private templateCache: Map<string, PlanTemplate> = new Map();
  private featuredTemplates: PlanTemplate[] = [];

  private constructor() {
    this.loadFeaturedTemplates();
  }

  static getInstance(): MarketplaceService {
    if (!MarketplaceService.instance) {
      MarketplaceService.instance = new MarketplaceService();
    }
    return MarketplaceService.instance;
  }

  async loadFeaturedTemplates() {
    // Load featured templates on initialization
    const { data } = await supabase
      .from('plan_templates')
      .select('*')
      .eq('featured', true)
      .order('downloads', { ascending: false })
      .limit(6);

    if (data) {
      this.featuredTemplates = data as PlanTemplate[];
    }
  }

  async searchTemplates(
    query: string,
    filters: MarketplaceFilters = {}
  ): Promise<PlanTemplate[]> {
    let queryBuilder = supabase
      .from('plan_templates')
      .select('*')
      .ilike('name', `%${query}%`);

    // Apply filters
    if (filters.category) {
      queryBuilder = queryBuilder.eq('category', filters.category);
    }

    if (filters.projectType) {
      queryBuilder = queryBuilder.contains('projectTypes', [filters.projectType]);
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder = queryBuilder.overlaps('tags', filters.tags);
    }

    if (filters.rating) {
      queryBuilder = queryBuilder.gte('rating', filters.rating);
    }

    if (filters.priceRange) {
      queryBuilder = queryBuilder
        .gte('price', filters.priceRange.min)
        .lte('price', filters.priceRange.max);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'popular':
        queryBuilder = queryBuilder.order('downloads', { ascending: false });
        break;
      case 'newest':
        queryBuilder = queryBuilder.order('createdAt', { ascending: false });
        break;
      case 'rating':
        queryBuilder = queryBuilder.order('rating', { ascending: false });
        break;
      case 'price':
        queryBuilder = queryBuilder.order('price', { ascending: true });
        break;
      default:
        queryBuilder = queryBuilder.order('downloads', { ascending: false });
    }

    const { data, error } = await queryBuilder.limit(50);

    if (error) {
      console.error('Error searching templates:', error);
      return [];
    }

    return data as PlanTemplate[];
  }

  async getTemplate(templateId: string): Promise<PlanTemplate | null> {
    // Check cache first
    if (this.templateCache.has(templateId)) {
      return this.templateCache.get(templateId)!;
    }

    const { data, error } = await supabase
      .from('plan_templates')
      .select(`
        *,
        author:users(id, name, avatar, verified),
        testimonials(*)
      `)
      .eq('id', templateId)
      .single();

    if (error || !data) {
      return null;
    }

    const template = data as PlanTemplate;
    this.templateCache.set(templateId, template);
    return template;
  }

  async purchaseTemplate(templateId: string, userId: string): Promise<{
    success: boolean;
    plan?: UltraPlan;
    error?: string;
  }> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Check if already purchased
      const { data: existing } = await supabase
        .from('user_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('template_id', templateId)
        .single();

      if (existing) {
        return { success: false, error: 'Template already purchased' };
      }

      // Process payment (simplified - in production use Stripe)
      if (template.price > 0) {
        // Create Stripe checkout session
        // For now, we'll simulate free templates
        if (template.price > 0) {
          return { 
            success: false, 
            error: 'Payment processing not implemented. Try free templates.' 
          };
        }
      }

      // Record purchase
      await supabase
        .from('user_templates')
        .insert({
          user_id: userId,
          template_id: templateId,
          purchased_at: new Date().toISOString(),
          price_paid: template.price
        });

      // Increment download count
      await supabase
        .from('plan_templates')
        .update({ downloads: template.downloads + 1 })
        .eq('id', templateId);

      // Generate plan from template
      const plan = await this.generatePlanFromTemplate(template, userId);

      return { success: true, plan };
    } catch (error) {
      console.error('Purchase error:', error);
      return { success: false, error: 'Purchase failed. Please try again.' };
    }
  }

  async generatePlanFromTemplate(
    template: PlanTemplate,
    userId: string
  ): Promise<UltraPlan> {
    // Load full template data
    const { data: templateData } = await supabase
      .from('template_plans')
      .select('*')
      .eq('template_id', template.id)
      .single();

    if (!templateData) {
      throw new Error('Template data not found');
    }

    // Create customized plan from template
    const plan: UltraPlan = {
      ...templateData.plan_data,
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${template.name} - Customized`,
      templateId: template.id,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft'
    };

    // Save the plan
    await supabase
      .from('plans')
      .insert({
        ...plan,
        user_id: userId
      });

    return plan;
  }

  async rateTemplate(
    templateId: string,
    userId: string,
    rating: number,
    comment?: string
  ): Promise<boolean> {
    try {
      // Check if user purchased the template
      const { data: purchase } = await supabase
        .from('user_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('template_id', templateId)
        .single();

      if (!purchase) {
        throw new Error('You must purchase a template before rating it');
      }

      // Add testimonial
      await supabase
        .from('testimonials')
        .insert({
          template_id: templateId,
          user_id: userId,
          rating,
          comment,
          date: new Date().toISOString()
        });

      // Update template average rating
      const { data: ratings } = await supabase
        .from('testimonials')
        .select('rating')
        .eq('template_id', templateId);

      if (ratings && ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        
        await supabase
          .from('plan_templates')
          .update({ rating: avgRating })
          .eq('id', templateId);
      }

      return true;
    } catch (error) {
      console.error('Rating error:', error);
      return false;
    }
  }

  async getCategories(): Promise<string[]> {
    const { data } = await supabase
      .from('template_categories')
      .select('name')
      .order('name');

    return data?.map(c => c.name) || [
      'Startup Launch',
      'Product Development',
      'Marketing Campaign',
      'Business Transformation',
      'Team Scaling',
      'Revenue Growth',
      'Digital Transformation',
      'Crisis Management'
    ];
  }

  getFeaturedTemplates(): PlanTemplate[] {
    return this.featuredTemplates;
  }

  async getUserTemplates(userId: string): Promise<PlanTemplate[]> {
    const { data } = await supabase
      .from('user_templates')
      .select(`
        template_id,
        plan_templates(*)
      `)
      .eq('user_id', userId);

    return data?.map(d => d.plan_templates).filter(Boolean) as PlanTemplate[] || [];
  }

  async submitTemplate(
    template: Partial<PlanTemplate>,
    planData: UltraPlan,
    userId: string
  ): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      // Validate user can submit templates (Pro/Enterprise only)
      const user = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (user.data?.subscription_tier === 'free') {
        return { 
          success: false, 
          error: 'Upgrade to Pro to submit templates to the marketplace' 
        };
      }

      // Create template
      const { data: newTemplate, error } = await supabase
        .from('plan_templates')
        .insert({
          ...template,
          author_id: userId,
          status: 'pending_review',
          downloads: 0,
          rating: 0
        })
        .select()
        .single();

      if (error || !newTemplate) {
        throw error;
      }

      // Store plan data
      await supabase
        .from('template_plans')
        .insert({
          template_id: newTemplate.id,
          plan_data: planData
        });

      return { success: true, templateId: newTemplate.id };
    } catch (error) {
      console.error('Submit template error:', error);
      return { success: false, error: 'Failed to submit template' };
    }
  }

  async getPopularSearches(): Promise<string[]> {
    // Return popular search terms
    return [
      'SaaS launch',
      'Product-market fit',
      'Growth hacking',
      'Team scaling',
      'Revenue optimization',
      'Customer acquisition',
      'Digital marketing',
      'Agile transformation'
    ];
  }

  async getSimilarTemplates(templateId: string): Promise<PlanTemplate[]> {
    const template = await this.getTemplate(templateId);
    if (!template) return [];

    const { data } = await supabase
      .from('plan_templates')
      .select('*')
      .neq('id', templateId)
      .contains('tags', template.tags.slice(0, 3))
      .limit(4);

    return data as PlanTemplate[] || [];
  }
}

export const marketplaceService = MarketplaceService.getInstance();