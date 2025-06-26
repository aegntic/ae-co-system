import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { 
  ProjectAnalysis, 
  UltraPlan, 
  PlanStep, 
  Milestone,
  RiskAssessment,
  ResourceAllocation,
  SubscriptionTier 
} from '../../shared/types';
import { authService } from './auth.service';
import { supabase } from './supabase';

interface PlanGenerationOptions {
  depth: 'quick' | 'standard' | 'comprehensive';
  timeframe: '30days' | '90days' | '6months' | '1year';
  focusAreas: string[];
  includeFinancials: boolean;
  includeRisks: boolean;
  includeMetrics: boolean;
}

export class AIPlanGenerator {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private planCache: Map<string, UltraPlan> = new Map();
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Note: In production, use a backend API
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true // Note: In production, use a backend API
    });
  }

  async generatePlan(
    analysis: ProjectAnalysis,
    options: PlanGenerationOptions
  ): Promise<UltraPlan> {
    // Check subscription limits
    const canGenerate = await authService.checkSubscriptionLimits('plans');
    if (!canGenerate) {
      throw new Error('Plan generation limit reached. Upgrade to Pro for unlimited plans.');
    }

    // Check cache first
    const cacheKey = this.getCacheKey(analysis, options);
    if (this.planCache.has(cacheKey)) {
      return this.planCache.get(cacheKey)!;
    }

    // Track AI usage
    await authService.trackUsage('aiCalls', { feature: 'planGeneration' });

    try {
      // Generate plan using AI ensemble
      const plan = await this.generateWithAIEnsemble(analysis, options);
      
      // Validate and enhance plan
      const enhancedPlan = await this.enhancePlan(plan, analysis, options);
      
      // Save to database
      await this.savePlan(enhancedPlan);
      
      // Cache the plan
      this.planCache.set(cacheKey, enhancedPlan);
      
      // Track successful generation
      await authService.trackUsage('plans', { 
        projectType: analysis.projectType,
        depth: options.depth
      });

      return enhancedPlan;
    } catch (error) {
      console.error('Plan generation error:', error);
      throw new Error('Failed to generate plan. Please try again.');
    }
  }

  private async generateWithAIEnsemble(
    analysis: ProjectAnalysis,
    options: PlanGenerationOptions
  ): Promise<UltraPlan> {
    // Use both OpenAI and Claude for better results
    const [openaiPlan, claudePlan] = await Promise.all([
      this.generateWithOpenAI(analysis, options),
      this.generateWithClaude(analysis, options)
    ]);

    // Merge best aspects of both plans
    return this.mergePlans(openaiPlan, claudePlan, analysis);
  }

  private async generateWithOpenAI(
    analysis: ProjectAnalysis,
    options: PlanGenerationOptions
  ): Promise<Partial<UltraPlan>> {
    const prompt = this.buildPrompt(analysis, options);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert strategic planner specializing in ${analysis.projectType} projects. 
                    Create actionable, specific plans that deliver results in ${options.timeframe}.
                    Use the First Principles approach to break down complex problems.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}');
  }

  private async generateWithClaude(
    analysis: ProjectAnalysis,
    options: PlanGenerationOptions
  ): Promise<Partial<UltraPlan>> {
    const prompt = this.buildPrompt(analysis, options);
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `As an expert strategic planner, create a comprehensive plan for this ${analysis.projectType} project.
                  
                  ${prompt}
                  
                  Return a structured JSON plan following the UltraPlan schema.`
      }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(content || '{}');
  }

  private buildPrompt(analysis: ProjectAnalysis, options: PlanGenerationOptions): string {
    return `
    Project Analysis:
    - Name: ${analysis.name}
    - Type: ${analysis.projectType}
    - Description: ${analysis.description}
    - Tech Stack: ${analysis.techStack.join(', ')}
    - Key Problems: ${analysis.problems.map(p => `${p.type}: ${p.description} (Severity: ${p.severity})`).join('\n')}
    - Goals: ${analysis.goals.join(', ')}
    - Constraints: ${JSON.stringify(analysis.constraints)}
    - Team Size: ${analysis.teamSize}
    
    Generation Options:
    - Depth: ${options.depth}
    - Timeframe: ${options.timeframe}
    - Focus Areas: ${options.focusAreas.join(', ')}
    - Include Financials: ${options.includeFinancials}
    - Include Risks: ${options.includeRisks}
    - Include Metrics: ${options.includeMetrics}
    
    Create a strategic plan that includes:
    1. Executive summary with clear objectives
    2. Detailed roadmap with phases and milestones
    3. Specific action steps with owners and deadlines
    4. Resource allocation and budget estimates
    5. Risk assessment and mitigation strategies
    6. Success metrics and KPIs
    7. Implementation timeline with dependencies
    
    The plan should be:
    - Actionable and specific (no generic advice)
    - Achievable within the specified timeframe
    - Aligned with the project's goals and constraints
    - Optimized for ${analysis.teamSize} team members
    - Include quick wins for early momentum
    `;
  }

  private async mergePlans(
    openaiPlan: Partial<UltraPlan>,
    claudePlan: Partial<UltraPlan>,
    analysis: ProjectAnalysis
  ): Promise<UltraPlan> {
    // Intelligent merging of both AI outputs
    const mergedPlan: UltraPlan = {
      id: this.generatePlanId(),
      projectId: analysis.id,
      name: openaiPlan.name || claudePlan.name || `Strategic Plan for ${analysis.name}`,
      description: this.selectBest(openaiPlan.description, claudePlan.description),
      objectives: this.mergeObjectives(openaiPlan.objectives, claudePlan.objectives),
      phases: this.mergePhases(openaiPlan.phases, claudePlan.phases),
      milestones: this.mergeMilestones(openaiPlan.milestones, claudePlan.milestones),
      risks: this.mergeRisks(openaiPlan.risks, claudePlan.risks),
      resources: this.mergeResources(openaiPlan.resources, claudePlan.resources),
      metrics: this.mergeMetrics(openaiPlan.metrics, claudePlan.metrics),
      timeline: this.mergeTimeline(openaiPlan.timeline, claudePlan.timeline),
      budget: this.mergeBudget(openaiPlan.budget, claudePlan.budget),
      status: 'draft',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: authService.getCurrentUser()?.id || '',
      version: 1,
      tags: this.extractTags(analysis),
      priority: this.calculatePriority(analysis),
      estimatedImpact: this.estimateImpact(analysis),
      actualImpact: null
    };

    return mergedPlan;
  }

  private async enhancePlan(
    plan: UltraPlan,
    analysis: ProjectAnalysis,
    options: PlanGenerationOptions
  ): Promise<UltraPlan> {
    // Add industry-specific insights
    const industryInsights = await this.getIndustryInsights(analysis.projectType);
    
    // Add competitor analysis if relevant
    const competitorInsights = await this.getCompetitorInsights(analysis);
    
    // Add financial projections if requested
    if (options.includeFinancials) {
      plan.financialProjections = await this.generateFinancialProjections(plan, analysis);
    }
    
    // Add success patterns from similar projects
    const successPatterns = await this.getSuccessPatterns(analysis.projectType);
    
    // Enhance with proven frameworks
    plan.frameworks = this.applyFrameworks(analysis.projectType);
    
    // Add quick wins
    plan.quickWins = this.identifyQuickWins(plan);
    
    // Add automation opportunities
    plan.automationOpportunities = this.identifyAutomationOpportunities(analysis);

    return plan;
  }

  private async getIndustryInsights(projectType: string): Promise<any> {
    // Fetch industry-specific insights from database
    const { data } = await supabase
      .from('industry_insights')
      .select('*')
      .eq('type', projectType)
      .single();
    
    return data;
  }

  private async getCompetitorInsights(analysis: ProjectAnalysis): Promise<any> {
    // Analyze competitor strategies
    return {
      topCompetitors: [],
      differentiators: [],
      marketGaps: []
    };
  }

  private async generateFinancialProjections(
    plan: UltraPlan,
    analysis: ProjectAnalysis
  ): Promise<any> {
    // Generate financial projections based on plan
    return {
      revenue: this.projectRevenue(plan, analysis),
      costs: this.projectCosts(plan, analysis),
      roi: this.calculateROI(plan, analysis),
      breakeven: this.calculateBreakeven(plan, analysis)
    };
  }

  private async getSuccessPatterns(projectType: string): Promise<any> {
    // Fetch success patterns from similar projects
    const { data } = await supabase
      .from('success_patterns')
      .select('*')
      .eq('project_type', projectType)
      .order('success_rate', { ascending: false })
      .limit(5);
    
    return data;
  }

  private applyFrameworks(projectType: string): string[] {
    const frameworks: { [key: string]: string[] } = {
      'startup': ['Lean Startup', 'Business Model Canvas', 'OKRs', 'Jobs-to-be-Done'],
      'product': ['Design Thinking', 'Agile/Scrum', 'RICE Prioritization', 'North Star Metric'],
      'marketing': ['AARRR Framework', 'Content Marketing Matrix', 'Growth Loops', 'CAC/LTV'],
      'enterprise': ['Balanced Scorecard', 'SWOT Analysis', 'McKinsey 7S', 'Blue Ocean Strategy']
    };

    return frameworks[projectType] || ['SMART Goals', 'PDCA Cycle', 'Risk Matrix'];
  }

  private identifyQuickWins(plan: UltraPlan): PlanStep[] {
    // Identify steps that can be completed quickly with high impact
    return plan.phases
      .flatMap(phase => phase.steps)
      .filter(step => {
        const duration = this.estimateDuration(step);
        const impact = this.estimateStepImpact(step);
        return duration <= 7 && impact >= 7; // 7 days or less, impact 7/10 or higher
      })
      .slice(0, 5); // Top 5 quick wins
  }

  private identifyAutomationOpportunities(analysis: ProjectAnalysis): any[] {
    const opportunities = [];

    // Check for repetitive tasks
    if (analysis.problems.some(p => p.type === 'efficiency')) {
      opportunities.push({
        area: 'Task Automation',
        tools: ['Zapier', 'Make.com', 'n8n'],
        estimatedTimeSaved: '10+ hours/week'
      });
    }

    // Check for data processing needs
    if (analysis.techStack.some(tech => ['python', 'data', 'analytics'].includes(tech.toLowerCase()))) {
      opportunities.push({
        area: 'Data Pipeline Automation',
        tools: ['Airflow', 'Prefect', 'Dagster'],
        estimatedTimeSaved: '20+ hours/week'
      });
    }

    // Check for deployment needs
    if (analysis.problems.some(p => p.type === 'deployment')) {
      opportunities.push({
        area: 'CI/CD Automation',
        tools: ['GitHub Actions', 'GitLab CI', 'CircleCI'],
        estimatedTimeSaved: '5+ hours/week'
      });
    }

    return opportunities;
  }

  private async savePlan(plan: UltraPlan): Promise<void> {
    const { error } = await supabase
      .from('plans')
      .insert({
        ...plan,
        user_id: authService.getCurrentUser()?.id
      });

    if (error) {
      console.error('Error saving plan:', error);
      throw new Error('Failed to save plan');
    }
  }

  // Helper methods
  private getCacheKey(analysis: ProjectAnalysis, options: PlanGenerationOptions): string {
    return `${analysis.id}-${JSON.stringify(options)}`;
  }

  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private selectBest(option1?: string, option2?: string): string {
    // Select the more detailed/comprehensive option
    if (!option1) return option2 || '';
    if (!option2) return option1;
    return option1.length > option2.length ? option1 : option2;
  }

  private mergeObjectives(obj1?: string[], obj2?: string[]): string[] {
    const combined = [...(obj1 || []), ...(obj2 || [])];
    return [...new Set(combined)].slice(0, 5); // Top 5 unique objectives
  }

  private mergePhases(phases1?: any[], phases2?: any[]): any[] {
    // Intelligent phase merging logic
    const allPhases = [...(phases1 || []), ...(phases2 || [])];
    return this.deduplicateAndOptimize(allPhases);
  }

  private mergeMilestones(m1?: Milestone[], m2?: Milestone[]): Milestone[] {
    const allMilestones = [...(m1 || []), ...(m2 || [])];
    return this.deduplicateAndOptimize(allMilestones);
  }

  private mergeRisks(r1?: RiskAssessment[], r2?: RiskAssessment[]): RiskAssessment[] {
    const allRisks = [...(r1 || []), ...(r2 || [])];
    return this.deduplicateAndOptimize(allRisks);
  }

  private mergeResources(res1?: ResourceAllocation[], res2?: ResourceAllocation[]): ResourceAllocation[] {
    const allResources = [...(res1 || []), ...(res2 || [])];
    return this.consolidateResources(allResources);
  }

  private mergeMetrics(m1?: any, m2?: any): any {
    return {
      kpis: [...(m1?.kpis || []), ...(m2?.kpis || [])].slice(0, 7),
      targets: { ...(m1?.targets || {}), ...(m2?.targets || {}) },
      tracking: m1?.tracking || m2?.tracking || 'weekly'
    };
  }

  private mergeTimeline(t1?: any, t2?: any): any {
    return {
      start: new Date(),
      end: this.calculateEndDate(t1, t2),
      criticalPath: this.identifyCriticalPath(t1, t2)
    };
  }

  private mergeBudget(b1?: any, b2?: any): any {
    return {
      total: Math.max(b1?.total || 0, b2?.total || 0),
      breakdown: this.consolidateBudgetBreakdown(b1?.breakdown, b2?.breakdown),
      contingency: 0.2 // 20% contingency
    };
  }

  private deduplicateAndOptimize(items: any[]): any[] {
    // Remove duplicates and optimize order
    const seen = new Set();
    return items.filter(item => {
      const key = JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private consolidateResources(resources: ResourceAllocation[]): ResourceAllocation[] {
    // Consolidate similar resources
    const consolidated: { [key: string]: ResourceAllocation } = {};
    
    resources.forEach(resource => {
      const key = resource.type;
      if (consolidated[key]) {
        consolidated[key].quantity += resource.quantity;
        consolidated[key].cost += resource.cost;
      } else {
        consolidated[key] = { ...resource };
      }
    });

    return Object.values(consolidated);
  }

  private calculateEndDate(t1?: any, t2?: any): Date {
    const end = new Date();
    end.setMonth(end.getMonth() + 3); // Default 3 months
    return end;
  }

  private identifyCriticalPath(t1?: any, t2?: any): string[] {
    // Identify critical path items
    return [];
  }

  private consolidateBudgetBreakdown(b1?: any, b2?: any): any {
    return {
      ...b1,
      ...b2
    };
  }

  private extractTags(analysis: ProjectAnalysis): string[] {
    const tags = [analysis.projectType];
    if (analysis.teamSize <= 5) tags.push('small-team');
    else if (analysis.teamSize <= 20) tags.push('medium-team');
    else tags.push('large-team');
    
    return tags;
  }

  private calculatePriority(analysis: ProjectAnalysis): 'low' | 'medium' | 'high' | 'critical' {
    const severityScore = analysis.problems.reduce((sum, p) => sum + p.severity, 0);
    if (severityScore >= 8) return 'critical';
    if (severityScore >= 6) return 'high';
    if (severityScore >= 4) return 'medium';
    return 'low';
  }

  private estimateImpact(analysis: ProjectAnalysis): {
    revenue?: number;
    timeSaved?: number;
    qualityImprovement?: number;
  } {
    return {
      revenue: this.estimateRevenueImpact(analysis),
      timeSaved: this.estimateTimeSaved(analysis),
      qualityImprovement: this.estimateQualityImprovement(analysis)
    };
  }

  private estimateRevenueImpact(analysis: ProjectAnalysis): number {
    // Estimate based on project type and size
    return 100000; // Placeholder
  }

  private estimateTimeSaved(analysis: ProjectAnalysis): number {
    // Estimate hours saved per month
    return 100; // Placeholder
  }

  private estimateQualityImprovement(analysis: ProjectAnalysis): number {
    // Estimate quality improvement percentage
    return 25; // Placeholder
  }

  private estimateDuration(step: PlanStep): number {
    // Estimate duration in days
    return 7; // Placeholder
  }

  private estimateStepImpact(step: PlanStep): number {
    // Estimate impact on scale of 1-10
    return 8; // Placeholder
  }

  private projectRevenue(plan: UltraPlan, analysis: ProjectAnalysis): any {
    return {
      month1: 0,
      month3: 10000,
      month6: 50000,
      month12: 200000
    };
  }

  private projectCosts(plan: UltraPlan, analysis: ProjectAnalysis): any {
    return {
      development: 50000,
      marketing: 20000,
      operations: 15000,
      total: 85000
    };
  }

  private calculateROI(plan: UltraPlan, analysis: ProjectAnalysis): number {
    return 135; // 135% ROI
  }

  private calculateBreakeven(plan: UltraPlan, analysis: ProjectAnalysis): number {
    return 6; // 6 months
  }
}

export const aiPlanGenerator = new AIPlanGenerator();