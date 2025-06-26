# Prompt 04: Create Content Converter

## Objective
Create utility functions to convert EnhancedSiteContent to SiteData format.

## Target File
- Create new file: `/utils/contentConverter.ts`

## Implementation
Create a comprehensive converter:

```typescript
import { EnhancedSiteContent, ProjectMetadata } from '../types/enhanced-types';
import { SiteData } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function convertToSiteData(
  enhanced: EnhancedSiteContent, 
  repoUrl: string
): SiteData {
  const { markdown, metadata } = enhanced;
  
  // Generate a unique ID for the site
  const id = uuidv4();
  
  // Determine template based on project type
  const template = determineTemplate(metadata.projectType);
  
  // Extract primary color or use default
  const primaryColor = metadata.primaryColor || generateColorFromTitle(metadata.title);
  
  return {
    id,
    title: metadata.title,
    description: metadata.description,
    content: markdown,
    template,
    createdAt: new Date(),
    features: metadata.features,
    techStack: metadata.techStack,
    projectType: metadata.projectType,
    primaryColor,
    repoUrl,
  };
}

function determineTemplate(projectType: string): string {
  const templateMap = {
    'library': 'documentation',
    'application': 'showcase',
    'tool': 'product',
    'framework': 'documentation',
    'other': 'simple'
  };
  
  return templateMap[projectType] || 'simple';
}

function generateColorFromTitle(title: string): string {
  // Generate a consistent color based on title
  const colors = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#8B5CF6', // violet
    '#F59E0B', // amber
    '#EF4444', // red
    '#6366F1', // indigo
  ];
  
  const hash = title.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
}

export function extractRepoInfo(repoUrl: string): { owner: string; repo: string } {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }
  
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, '')
  };
}
```

## Expected Output File
- `content-converter-utils.ts` - Complete converter utility file

## Dependencies
- Requires: 01-fix-types.md (SiteData interface)
- Requires: 02-fix-enhanced-types.md (EnhancedSiteContent types)

## Validation
- Converter should handle all metadata fields
- Template selection should be logical
- Color generation should be deterministic
- Repository parsing should handle various URL formats

## Notes
This converter is crucial for:
- Bridging the gap between AI output and UI expectations
- Providing sensible defaults for missing data
- Ensuring consistent data structure
- Making the system more maintainable