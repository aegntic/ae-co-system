# Prompt 06: Fix Preview Template

## Objective
Update SimplePreviewTemplate to properly display all SiteData fields with an engaging design.

## Target File
- `/components/templates/SimplePreviewTemplate.tsx`

## Implementation
Create a comprehensive preview template:

```typescript
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { SiteData } from '../../types';

interface SimplePreviewTemplateProps {
  siteData: SiteData;
}

export const SimplePreviewTemplate: React.FC<SimplePreviewTemplateProps> = ({ siteData }) => {
  const {
    title,
    description,
    content,
    features = [],
    techStack = [],
    primaryColor = '#3B82F6',
    projectType = 'project',
    owner,
    repo
  } = siteData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <header 
        className="relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 text-white"
        style={{
          background: \`linear-gradient(135deg, \${primaryColor}22 0%, \${primaryColor}11 100%)\`
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="flex items-center gap-2 text-sm mb-4 opacity-80">
            {owner && repo && (
              <>
                <span>{owner}</span>
                <span>/</span>
                <span className="font-semibold">{repo}</span>
              </>
            )}
            <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
              {projectType}
            </span>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            {title}
          </h1>
          
          <p className="text-xl opacity-90 max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>
      </header>

      {/* Features Section */}
      {features.length > 0 && (
        <section className="py-16 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-gray-800">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div 
                    className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">
                    {feature}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tech Stack */}
      {techStack.length > 0 && (
        <section className="py-12 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
              Built With
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {techStack.map((tech, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto prose prose-lg">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="opacity-80">
            Generated with 4site.pro • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};
```

## Expected Output File
- `fixed-preview-template.tsx` - Complete updated preview template

## Dependencies
- Requires: 01-fix-types.md (updated SiteData interface)

## Validation
- Should render all fields from SiteData
- Responsive design on all screen sizes
- Graceful handling of missing optional fields
- Attractive visual design

## Notes
This template is critical for user experience:
- First impression of generated sites
- Shows the value of the platform
- Must handle various content types gracefully
- Should look professional and modern