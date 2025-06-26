# Prompt 03: Fix Gemini Service

## Objective
Update generateSiteContentFromUrl to return SiteData instead of string, integrating with enhancedGeminiService.

## Target File
- `/services/geminiService.ts`

## Current Problem
```typescript
// BROKEN - returns string instead of SiteData
export const generateSiteContentFromUrl = async (repoUrl: string): Promise<string>
```

## Fix Implementation
Replace the function with:

```typescript
import { generateEnhancedSiteContent } from './enhancedGeminiService';
import { convertToSiteData } from '../utils/contentConverter';
import { SiteData } from '../types';

export const generateSiteContentFromUrl = async (repoUrl: string): Promise<SiteData> => {
  try {
    // Parse repository information
    const urlParts = repoUrl.replace(/^https?:\/\//, '').split('/');
    const owner = urlParts[1];
    const repo = urlParts[2];
    
    // Generate enhanced content with structured metadata
    console.log(`Generating enhanced content for ${owner}/${repo}...`);
    const enhancedContent = await generateEnhancedSiteContent(repoUrl);
    
    // Convert to SiteData format expected by UI
    const siteData = convertToSiteData(enhancedContent, repoUrl);
    
    // Add repository-specific metadata
    siteData.owner = owner;
    siteData.repo = repo;
    siteData.repoUrl = repoUrl;
    
    console.log(`Successfully generated site data for ${repo}`);
    return siteData;
  } catch (error) {
    console.error('Error generating site content:', error);
    throw new Error(`Failed to generate content for ${repoUrl}: ${error.message}`);
  }
};

// Keep the original function for backward compatibility
export const generateRawSiteContent = async (repoUrl: string): Promise<string> => {
  const siteData = await generateSiteContentFromUrl(repoUrl);
  return siteData.content;
};
```

## Expected Output File
- `fixed-gemini-service.ts` - Complete updated service file

## Dependencies
- Requires: 01-fix-types.md (SiteData interface)
- Requires: 04-create-converter.md (convertToSiteData function)

## Validation
- Function should return valid SiteData object
- Should handle errors gracefully
- Console logs should show progress
- Repository metadata should be extracted correctly

## Notes
This is the core fix that resolves the type mismatch. It:
- Integrates with the existing enhancedGeminiService
- Provides proper error handling
- Maintains backward compatibility
- Adds helpful logging for debugging