# Prompt 09: Create Comprehensive Tests

## Objective
Create test suite to validate all fixes work correctly together.

## Target File
- Create new file: `/tests/integration/site-generation.test.ts`

## Implementation
Create comprehensive integration tests:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateSiteContentFromUrl } from '../../services/geminiService';
import { convertToSiteData } from '../../utils/contentConverter';
import { SiteData } from '../../types';
import { deployToGitHubPages } from '../../services/githubPagesService';

describe('Site Generation Integration Tests', () => {
  let testRepoUrl: string;
  let generatedSiteData: SiteData;

  beforeAll(() => {
    testRepoUrl = 'https://github.com/aegntic/aegnticdotai';
  });

  describe('Content Generation', () => {
    it('should generate SiteData from repository URL', async () => {
      const siteData = await generateSiteContentFromUrl(testRepoUrl);
      
      // Validate structure
      expect(siteData).toBeDefined();
      expect(typeof siteData).toBe('object');
      expect(siteData).not.toBe(null);
      
      // Validate required fields
      expect(siteData.id).toBeDefined();
      expect(siteData.title).toBeDefined();
      expect(siteData.description).toBeDefined();
      expect(siteData.content).toBeDefined();
      expect(siteData.template).toBeDefined();
      expect(siteData.createdAt).toBeInstanceOf(Date);
      
      // Validate new fields
      expect(Array.isArray(siteData.features)).toBe(true);
      expect(Array.isArray(siteData.techStack)).toBe(true);
      expect(siteData.features.length).toBeGreaterThan(0);
      expect(siteData.techStack.length).toBeGreaterThan(0);
      
      // Validate repository metadata
      expect(siteData.owner).toBe('aegntic');
      expect(siteData.repo).toBe('aegnticdotai');
      expect(siteData.repoUrl).toBe(testRepoUrl);
      
      generatedSiteData = siteData;
    }, 30000); // 30 second timeout for AI generation

    it('should generate repository-specific content', async () => {
      expect(generatedSiteData.title.toLowerCase()).toContain('aegntic');
      expect(generatedSiteData.description).toBeTruthy();
      expect(generatedSiteData.content).toContain('aegntic');
      
      // Should not be generic React content
      expect(generatedSiteData.title).not.toBe('React');
      expect(generatedSiteData.content).not.toContain('Facebook');
    });

    it('should handle different repository types', async () => {
      const testUrls = [
        'https://github.com/facebook/react',
        'https://github.com/vercel/next.js',
        'https://github.com/microsoft/vscode'
      ];

      for (const url of testUrls) {
        const siteData = await generateSiteContentFromUrl(url);
        expect(siteData).toBeDefined();
        expect(siteData.projectType).toBeDefined();
        expect(['library', 'application', 'tool', 'framework', 'other']).toContain(siteData.projectType);
      }
    }, 60000);
  });

  describe('Content Conversion', () => {
    it('should convert enhanced content to SiteData', () => {
      const enhancedContent = {
        markdown: '# Test Project',
        metadata: {
          title: 'Test Project',
          description: 'A test project',
          projectType: 'library' as const,
          primaryLanguage: 'TypeScript',
          features: ['Feature 1', 'Feature 2'],
          techStack: ['React', 'TypeScript'],
          targetAudience: ['Developers'],
          useCases: ['Testing'],
          primaryColor: '#3B82F6'
        },
        generatedAt: new Date(),
        aiModel: 'gemini-pro',
        confidence: 0.95
      };

      const siteData = convertToSiteData(enhancedContent, testRepoUrl);

      expect(siteData.id).toBeDefined();
      expect(siteData.title).toBe('Test Project');
      expect(siteData.description).toBe('A test project');
      expect(siteData.features).toEqual(['Feature 1', 'Feature 2']);
      expect(siteData.techStack).toEqual(['React', 'TypeScript']);
      expect(siteData.template).toBe('documentation');
      expect(siteData.primaryColor).toBe('#3B82F6');
    });
  });

  describe('UI Component Validation', () => {
    it('should have all required fields for SimplePreviewTemplate', () => {
      const requiredFields = [
        'title',
        'description',
        'content',
        'features',
        'techStack',
        'primaryColor',
        'projectType'
      ];

      requiredFields.forEach(field => {
        expect(generatedSiteData).toHaveProperty(field);
      });
    });
  });

  describe('Deployment Preparation', () => {
    it('should generate valid static site files', () => {
      // This would test the static site generation logic
      const mockSiteData: SiteData = {
        id: 'test-id',
        title: 'Test Site',
        description: 'Test Description',
        content: '# Test Content',
        template: 'simple',
        createdAt: new Date(),
        features: ['Feature 1'],
        techStack: ['React'],
        primaryColor: '#3B82F6'
      };

      // Test that deployment function accepts correct data
      expect(() => {
        deployToGitHubPages({
          token: 'mock-token',
          owner: 'test-owner',
          repo: 'test-repo',
          siteData: mockSiteData
        });
      }).not.toThrow();
    });
  });
});

describe('Error Handling', () => {
  it('should handle invalid repository URLs', async () => {
    const invalidUrls = [
      'not-a-url',
      'https://gitlab.com/some/repo',
      'github.com/missing-protocol',
      'https://github.com/invalid'
    ];

    for (const url of invalidUrls) {
      await expect(generateSiteContentFromUrl(url)).rejects.toThrow();
    }
  });

  it('should handle missing GitHub token', async () => {
    await expect(
      deployToGitHubPages({
        token: '',
        owner: 'test',
        repo: 'test',
        siteData: {} as SiteData
      })
    ).rejects.toThrow();
  });
});
```

## Expected Output File
- `site-generation-integration-tests.ts` - Complete test suite

## Dependencies
- All previous fixes must be implemented
- Vitest test framework

## Validation
- All tests should pass
- Coverage should be comprehensive
- Tests should catch regressions

## Notes
These tests ensure:
- The fix actually works
- Repository-specific content is generated
- All components work together
- Error handling is robust
- No regressions occur