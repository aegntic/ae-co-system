import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiPlanGenerator } from '../services/ai-plan-generator';
import { authService } from '../services/auth.service';
import { ProjectAnalysis, UltraPlan } from '../../shared/types';

// Mock dependencies
vi.mock('../services/auth.service');
vi.mock('../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn()
    }))
  }
}));

// Mock OpenAI
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}));

// Mock Anthropic
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn()
    }
  }))
}));

describe('AIPlanGenerator', () => {
  const mockAnalysis: ProjectAnalysis = {
    id: 'analysis123',
    name: 'Test Project',
    projectType: 'startup',
    description: 'A test startup project',
    techStack: ['React', 'Node.js', 'PostgreSQL'],
    problems: [
      {
        type: 'scalability',
        description: 'Current architecture cannot handle growth',
        severity: 8,
        impact: 'high'
      }
    ],
    goals: ['Scale to 100k users', 'Improve performance', 'Reduce costs'],
    constraints: {
      budget: 50000,
      timeline: '6 months',
      teamSize: 5
    },
    teamSize: 5,
    currentPhase: 'growth',
    opportunities: []
  };

  const mockOptions = {
    depth: 'standard' as const,
    timeframe: '90days' as const,
    focusAreas: ['growth', 'efficiency'],
    includeFinancials: true,
    includeRisks: true,
    includeMetrics: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.checkSubscriptionLimits).mockResolvedValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      id: 'user123',
      email: 'test@example.com'
    });
  });

  describe('generatePlan', () => {
    it('should generate a comprehensive plan using AI ensemble', async () => {
      // Mock OpenAI response
      const mockOpenAIPlan = {
        name: 'Strategic Growth Plan',
        description: 'AI-generated growth strategy',
        objectives: ['Scale infrastructure', 'Optimize performance'],
        phases: [
          {
            id: 'phase1',
            name: 'Foundation',
            steps: []
          }
        ]
      };

      // Mock Claude response
      const mockClaudePlan = {
        name: 'Comprehensive Growth Strategy',
        description: 'Detailed scaling roadmap',
        objectives: ['Build scalable architecture', 'Implement monitoring'],
        phases: [
          {
            id: 'phase1',
            name: 'Infrastructure Setup',
            steps: []
          }
        ]
      };

      // Setup mocks
      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify(mockOpenAIPlan)
                }
              }]
            })
          }
        }
      };

      const mockAnthropic = {
        messages: {
          create: vi.fn().mockResolvedValue({
            content: [{
              type: 'text',
              text: JSON.stringify(mockClaudePlan)
            }]
          })
        }
      };

      // Replace the AI instances
      (aiPlanGenerator as any).openai = mockOpenAI;
      (aiPlanGenerator as any).anthropic = mockAnthropic;

      // Mock Supabase responses
      const mockSupabase = await import('../services/supabase');
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ error: null })
      } as any);

      const plan = await aiPlanGenerator.generatePlan(mockAnalysis, mockOptions);

      expect(plan).toBeDefined();
      expect(plan.projectId).toBe(mockAnalysis.id);
      expect(plan.objectives).toContain('Scale infrastructure');
      expect(plan.status).toBe('draft');
      expect(plan.priority).toBe('high'); // Due to high severity problems
    });

    it('should check subscription limits before generating', async () => {
      vi.mocked(authService.checkSubscriptionLimits).mockResolvedValue(false);

      await expect(
        aiPlanGenerator.generatePlan(mockAnalysis, mockOptions)
      ).rejects.toThrow('Plan generation limit reached');

      expect(authService.checkSubscriptionLimits).toHaveBeenCalledWith('plans');
    });

    it('should cache generated plans', async () => {
      // Setup successful plan generation
      const mockPlan = { id: 'plan123' } as UltraPlan;
      
      // Mock the private generateWithAIEnsemble method
      const generateSpy = vi.spyOn(aiPlanGenerator as any, 'generateWithAIEnsemble')
        .mockResolvedValue(mockPlan);
      
      // Mock the enhancePlan method
      vi.spyOn(aiPlanGenerator as any, 'enhancePlan')
        .mockResolvedValue(mockPlan);
      
      // Mock savePlan
      vi.spyOn(aiPlanGenerator as any, 'savePlan')
        .mockResolvedValue(undefined);

      // First call - should generate
      const plan1 = await aiPlanGenerator.generatePlan(mockAnalysis, mockOptions);
      expect(generateSpy).toHaveBeenCalledTimes(1);

      // Second call with same params - should use cache
      const plan2 = await aiPlanGenerator.generatePlan(mockAnalysis, mockOptions);
      expect(generateSpy).toHaveBeenCalledTimes(1); // Not called again
      expect(plan1).toBe(plan2); // Same instance
    });
  });

  describe('plan enhancement', () => {
    it('should add industry insights and success patterns', async () => {
      const mockSupabase = await import('../services/supabase');
      
      // Mock industry insights
      vi.mocked(mockSupabase.supabase.from).mockImplementation((table: string) => {
        if (table === 'industry_insights') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                type: 'startup',
                insights: ['Focus on MVP', 'Rapid iteration']
              },
              error: null
            })
          } as any;
        }
        
        if (table === 'success_patterns') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                { pattern: 'Lean approach', success_rate: 0.85 },
                { pattern: 'Customer validation', success_rate: 0.92 }
              ],
              error: null
            })
          } as any;
        }
        
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockResolvedValue({ error: null })
        } as any;
      });

      const basePlan = {
        id: 'plan123',
        projectId: mockAnalysis.id,
        phases: [
          {
            id: 'phase1',
            steps: [
              { id: 'step1', name: 'Build MVP', duration: 30 },
              { id: 'step2', name: 'Launch beta', duration: 7 }
            ]
          }
        ]
      } as any;

      const enhancedPlan = await (aiPlanGenerator as any).enhancePlan(
        basePlan,
        mockAnalysis,
        mockOptions
      );

      expect(enhancedPlan.frameworks).toContain('Lean Startup');
      expect(enhancedPlan.quickWins).toBeDefined();
      expect(enhancedPlan.automationOpportunities).toBeDefined();
    });

    it('should identify quick wins correctly', () => {
      const plan = {
        phases: [
          {
            steps: [
              { name: 'Quick fix', estimatedDuration: 2, estimatedImpact: 8 },
              { name: 'Long project', estimatedDuration: 30, estimatedImpact: 9 },
              { name: 'Easy win', estimatedDuration: 5, estimatedImpact: 7 }
            ]
          }
        ]
      } as any;

      // Mock the private methods
      vi.spyOn(aiPlanGenerator as any, 'estimateDuration')
        .mockImplementation((step: any) => step.estimatedDuration);
      vi.spyOn(aiPlanGenerator as any, 'estimateStepImpact')
        .mockImplementation((step: any) => step.estimatedImpact);

      const quickWins = (aiPlanGenerator as any).identifyQuickWins(plan);

      expect(quickWins).toHaveLength(2); // Only steps with duration <= 7 and impact >= 7
      expect(quickWins[0].name).toBe('Quick fix');
      expect(quickWins[1].name).toBe('Easy win');
    });
  });

  describe('framework selection', () => {
    it('should select appropriate frameworks based on project type', () => {
      const startupFrameworks = (aiPlanGenerator as any).applyFrameworks('startup');
      expect(startupFrameworks).toContain('Lean Startup');
      expect(startupFrameworks).toContain('Business Model Canvas');

      const productFrameworks = (aiPlanGenerator as any).applyFrameworks('product');
      expect(productFrameworks).toContain('Design Thinking');
      expect(productFrameworks).toContain('Agile/Scrum');

      const marketingFrameworks = (aiPlanGenerator as any).applyFrameworks('marketing');
      expect(marketingFrameworks).toContain('AARRR Framework');
      expect(marketingFrameworks).toContain('Growth Loops');
    });
  });

  describe('automation opportunities', () => {
    it('should identify automation opportunities based on problems', () => {
      const analysisWithEfficiency = {
        ...mockAnalysis,
        problems: [
          { type: 'efficiency', description: 'Manual processes', severity: 7, impact: 'high' }
        ]
      };

      const opportunities = (aiPlanGenerator as any).identifyAutomationOpportunities(
        analysisWithEfficiency
      );

      expect(opportunities).toContainEqual(
        expect.objectContaining({
          area: 'Task Automation',
          tools: expect.arrayContaining(['Zapier', 'Make.com'])
        })
      );
    });

    it('should suggest CI/CD for deployment problems', () => {
      const analysisWithDeployment = {
        ...mockAnalysis,
        problems: [
          { type: 'deployment', description: 'Slow releases', severity: 6, impact: 'medium' }
        ]
      };

      const opportunities = (aiPlanGenerator as any).identifyAutomationOpportunities(
        analysisWithDeployment
      );

      expect(opportunities).toContainEqual(
        expect.objectContaining({
          area: 'CI/CD Automation',
          tools: expect.arrayContaining(['GitHub Actions'])
        })
      );
    });
  });

  describe('financial projections', () => {
    it('should generate financial projections when requested', async () => {
      const plan = { id: 'plan123' } as UltraPlan;
      
      const projections = await (aiPlanGenerator as any).generateFinancialProjections(
        plan,
        mockAnalysis
      );

      expect(projections).toHaveProperty('revenue');
      expect(projections).toHaveProperty('costs');
      expect(projections).toHaveProperty('roi');
      expect(projections).toHaveProperty('breakeven');
      expect(projections.roi).toBe(135); // 135% ROI
      expect(projections.breakeven).toBe(6); // 6 months
    });
  });
});