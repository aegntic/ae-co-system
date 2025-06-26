# Prompt 02: Create Enhanced Types

## Objective
Define types for the enhanced content generation system that provides structured output.

## Target File
- Create new file: `/types/enhanced-types.ts`

## Implementation
Create comprehensive types for enhanced content:

```typescript
export interface ProjectMetadata {
  title: string;
  description: string;
  projectType: 'library' | 'application' | 'tool' | 'framework' | 'other';
  primaryLanguage: string;
  features: string[];
  techStack: string[];
  targetAudience: string[];
  useCases: string[];
  primaryColor?: string;
  secondaryColor?: string;
}

export interface EnhancedSiteContent {
  markdown: string;
  metadata: ProjectMetadata;
  generatedAt: Date;
  aiModel: string;
  confidence: number;
}

export interface ConversionOptions {
  preserveMarkdown?: boolean;
  generateId?: boolean;
  defaultTemplate?: string;
}
```

## Expected Output File
- `enhanced-content-types.ts` - Complete type definitions for enhanced content

## Dependencies
- None (can be executed in parallel with 01-fix-types.md)

## Validation
- Types should be comprehensive enough for all use cases
- Should align with enhancedGeminiService output structure
- No TypeScript errors when imported

## Notes
These types bridge the gap between AI-generated content and UI expectations. They provide:
- Structured metadata for better UI rendering
- Type safety across the conversion pipeline
- Flexibility for future enhancements