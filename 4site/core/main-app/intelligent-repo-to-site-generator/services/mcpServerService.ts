import { MCPServerConfig, MCPTool, MCPResource, MCPPrompt, RepositoryAnalysis, AurachatMapping } from '../types';

interface MCPGenerationOptions {
  includeTestingTools: boolean;
  includeAnalysisTools: boolean;
  includeDocumentationTools: boolean;
  includeDeploymentTools: boolean;
  customToolsRequests?: string[];
}

class MCPServerService {
  async generateMCPServer(
    repositoryAnalysis: RepositoryAnalysis,
    aurachatMapping: AurachatMapping,
    options: MCPGenerationOptions = {
      includeTestingTools: true,
      includeAnalysisTools: true,
      includeDocumentationTools: true,
      includeDeploymentTools: true
    }
  ): Promise<MCPServerConfig> {
    try {
      const serverName = this.generateServerName(repositoryAnalysis);
      
      // Generate tools based on project analysis
      const tools = await this.generateTools(repositoryAnalysis, aurachatMapping, options);
      
      // Generate resources based on project structure
      const resources = this.generateResources(repositoryAnalysis, aurachatMapping);
      
      // Generate prompts based on project type and recommendations
      const prompts = this.generatePrompts(repositoryAnalysis, aurachatMapping);

      return {
        name: serverName,
        tools,
        resources,
        prompts,
        generated: true
      };
    } catch (error) {
      console.error('MCP server generation failed:', error);
      throw new Error('Failed to generate MCP server configuration');
    }
  }

  private generateServerName(repositoryAnalysis: RepositoryAnalysis): string {
    const { category, complexity } = repositoryAnalysis;
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    return `${category}-${complexity}-project-mcp-${timestamp}`;
  }

  private async generateTools(
    repositoryAnalysis: RepositoryAnalysis,
    aurachatMapping: AurachatMapping,
    options: MCPGenerationOptions
  ): Promise<MCPTool[]> {
    const tools: MCPTool[] = [];
    const { category, frameworks, features, languages } = repositoryAnalysis;

    // Core project tools
    tools.push({
      name: 'analyze_project_structure',
      description: 'Analyze the overall project structure and architecture',
      parameters: {
        path: {
          type: 'string',
          description: 'Root path of the project to analyze'
        },
        depth: {
          type: 'number',
          description: 'Depth of analysis (1-5)',
          default: 3
        }
      }
    });

    tools.push({
      name: 'generate_project_summary',
      description: 'Generate a comprehensive project summary report',
      parameters: {
        include_metrics: {
          type: 'boolean',
          description: 'Include code metrics and statistics',
          default: true
        },
        include_dependencies: {
          type: 'boolean',
          description: 'Include dependency analysis',
          default: true
        }
      }
    });

    // Framework-specific tools
    if (frameworks.includes('React')) {
      tools.push({
        name: 'analyze_react_component',
        description: 'Analyze React component for best practices and performance',
        parameters: {
          component_path: {
            type: 'string',
            description: 'Path to the React component file'
          },
          check_hooks: {
            type: 'boolean',
            description: 'Check for proper hook usage',
            default: true
          },
          check_performance: {
            type: 'boolean',
            description: 'Check for performance issues',
            default: true
          }
        }
      });

      tools.push({
        name: 'generate_react_tests',
        description: 'Generate unit tests for React components',
        parameters: {
          component_path: {
            type: 'string',
            description: 'Path to the component to test'
          },
          test_type: {
            type: 'string',
            enum: ['unit', 'integration', 'snapshot'],
            description: 'Type of test to generate',
            default: 'unit'
          }
        }
      });
    }

    if (frameworks.includes('Next.js')) {
      tools.push({
        name: 'optimize_nextjs_pages',
        description: 'Analyze and optimize Next.js pages for performance',
        parameters: {
          page_path: {
            type: 'string',
            description: 'Path to the Next.js page file'
          },
          check_seo: {
            type: 'boolean',
            description: 'Include SEO optimization checks',
            default: true
          }
        }
      });
    }

    // Language-specific tools
    if (languages.TypeScript > 0) {
      tools.push({
        name: 'validate_typescript_types',
        description: 'Validate TypeScript type definitions and usage',
        parameters: {
          file_path: {
            type: 'string',
            description: 'Path to TypeScript file to validate'
          },
          strict_mode: {
            type: 'boolean',
            description: 'Use strict type checking',
            default: true
          }
        }
      });

      tools.push({
        name: 'generate_typescript_interfaces',
        description: 'Generate TypeScript interfaces from data structures',
        parameters: {
          data_source: {
            type: 'string',
            description: 'Source of data (API response, JSON, etc.)'
          },
          interface_name: {
            type: 'string',
            description: 'Name for the generated interface'
          }
        }
      });
    }

    // Testing tools
    if (options.includeTestingTools && features.includes('Testing')) {
      tools.push({
        name: 'run_test_suite',
        description: 'Run the project test suite with coverage reporting',
        parameters: {
          test_pattern: {
            type: 'string',
            description: 'Test file pattern to run',
            default: '**/*.test.{js,ts,jsx,tsx}'
          },
          coverage: {
            type: 'boolean',
            description: 'Generate coverage report',
            default: true
          }
        }
      });

      tools.push({
        name: 'generate_missing_tests',
        description: 'Identify and generate missing test files',
        parameters: {
          source_directory: {
            type: 'string',
            description: 'Directory to scan for untested files'
          },
          test_framework: {
            type: 'string',
            enum: ['jest', 'vitest', 'mocha', 'cypress'],
            description: 'Testing framework to use'
          }
        }
      });
    }

    // Documentation tools
    if (options.includeDocumentationTools) {
      tools.push({
        name: 'generate_api_docs',
        description: 'Generate API documentation from code comments',
        parameters: {
          source_path: {
            type: 'string',
            description: 'Path to source files'
          },
          output_format: {
            type: 'string',
            enum: ['markdown', 'html', 'json'],
            description: 'Output format for documentation',
            default: 'markdown'
          }
        }
      });

      tools.push({
        name: 'update_readme',
        description: 'Update README.md with current project information',
        parameters: {
          include_badges: {
            type: 'boolean',
            description: 'Include status badges',
            default: true
          },
          include_api_docs: {
            type: 'boolean',
            description: 'Include API documentation links',
            default: true
          }
        }
      });
    }

    // Analysis tools
    if (options.includeAnalysisTools) {
      tools.push({
        name: 'analyze_code_quality',
        description: 'Analyze code quality metrics and issues',
        parameters: {
          directory: {
            type: 'string',
            description: 'Directory to analyze'
          },
          include_complexity: {
            type: 'boolean',
            description: 'Include complexity metrics',
            default: true
          },
          include_duplicates: {
            type: 'boolean',
            description: 'Check for code duplicates',
            default: true
          }
        }
      });

      tools.push({
        name: 'dependency_audit',
        description: 'Audit project dependencies for security and updates',
        parameters: {
          check_vulnerabilities: {
            type: 'boolean',
            description: 'Check for security vulnerabilities',
            default: true
          },
          check_outdated: {
            type: 'boolean',
            description: 'Check for outdated packages',
            default: true
          }
        }
      });
    }

    // Deployment tools
    if (options.includeDeploymentTools && category === 'web') {
      tools.push({
        name: 'prepare_deployment',
        description: 'Prepare project for deployment with optimization',
        parameters: {
          platform: {
            type: 'string',
            enum: ['vercel', 'netlify', 'aws', 'docker'],
            description: 'Deployment platform'
          },
          environment: {
            type: 'string',
            enum: ['development', 'staging', 'production'],
            description: 'Target environment',
            default: 'production'
          }
        }
      });

      tools.push({
        name: 'validate_build',
        description: 'Validate build output and check for issues',
        parameters: {
          build_directory: {
            type: 'string',
            description: 'Path to build output directory',
            default: 'dist'
          },
          check_assets: {
            type: 'boolean',
            description: 'Validate asset loading and optimization',
            default: true
          }
        }
      });
    }

    return tools;
  }

  private generateResources(
    repositoryAnalysis: RepositoryAnalysis,
    aurachatMapping: AurachatMapping
  ): MCPResource[] {
    const resources: MCPResource[] = [];
    const { category, frameworks } = repositoryAnalysis;

    // Core project resources
    resources.push({
      uri: 'file://package.json',
      name: 'Package Configuration',
      description: 'Project dependencies and scripts configuration',
      mimeType: 'application/json'
    });

    resources.push({
      uri: 'file://README.md',
      name: 'Project Documentation',
      description: 'Main project documentation and setup instructions'
    });

    // Source code resources
    if (category === 'web') {
      resources.push({
        uri: 'file://src/',
        name: 'Source Code',
        description: 'Main application source code directory',
        mimeType: 'text/typescript'
      });

      if (frameworks.includes('React')) {
        resources.push({
          uri: 'file://src/components/',
          name: 'React Components',
          description: 'Reusable React component library',
          mimeType: 'text/tsx'
        });
      }

      resources.push({
        uri: 'file://public/',
        name: 'Static Assets',
        description: 'Public static files and assets'
      });
    }

    // Configuration resources
    resources.push({
      uri: 'file://tsconfig.json',
      name: 'TypeScript Configuration',
      description: 'TypeScript compiler configuration',
      mimeType: 'application/json'
    });

    if (frameworks.includes('Next.js')) {
      resources.push({
        uri: 'file://next.config.js',
        name: 'Next.js Configuration',
        description: 'Next.js framework configuration',
        mimeType: 'text/javascript'
      });
    }

    if (frameworks.includes('Vite')) {
      resources.push({
        uri: 'file://vite.config.ts',
        name: 'Vite Configuration',
        description: 'Vite build tool configuration',
        mimeType: 'text/typescript'
      });
    }

    // Testing resources
    resources.push({
      uri: 'file://tests/',
      name: 'Test Files',
      description: 'Project test suite and test utilities',
      mimeType: 'text/typescript'
    });

    // Documentation resources
    resources.push({
      uri: 'file://docs/',
      name: 'Documentation',
      description: 'Extended project documentation and guides'
    });

    // Build resources
    resources.push({
      uri: 'file://dist/',
      name: 'Build Output',
      description: 'Compiled and optimized build artifacts'
    });

    return resources;
  }

  private generatePrompts(
    repositoryAnalysis: RepositoryAnalysis,
    aurachatMapping: AurachatMapping
  ): MCPPrompt[] {
    const prompts: MCPPrompt[] = [];
    const { category, frameworks, complexity } = repositoryAnalysis;

    // Core project prompts
    prompts.push({
      name: 'project_review',
      description: 'Comprehensive project review and analysis',
      template: `Please review this ${category} project and provide insights on:

Architecture: {{architecture}}
Complexity: ${complexity}
Frameworks: ${frameworks.join(', ')}

Focus on:
1. Code quality and maintainability
2. Performance optimization opportunities
3. Security considerations
4. Best practices adherence

Project structure:
{{project_structure}}

Recommendations:
{{recommendations}}`,
      arguments: {
        architecture: { description: 'Project architecture description' },
        project_structure: { description: 'Current project structure analysis' },
        recommendations: { description: 'Current recommendations from analysis' }
      }
    });

    prompts.push({
      name: 'code_improvement',
      description: 'Suggest improvements for specific code files',
      template: `Analyze this code file and suggest improvements:

File: {{file_path}}
Code:
{{code_content}}

Please provide:
1. Code quality assessment
2. Performance improvements
3. Best practices suggestions
4. Refactoring opportunities
5. Security considerations

Consider the project context:
- Category: ${category}
- Frameworks: ${frameworks.join(', ')}
- Complexity: ${complexity}`,
      arguments: {
        file_path: { description: 'Path to the code file being analyzed' },
        code_content: { description: 'Content of the code file' }
      }
    });

    // Framework-specific prompts
    if (frameworks.includes('React')) {
      prompts.push({
        name: 'react_component_review',
        description: 'Review React component for best practices',
        template: `Review this React component for best practices and optimization:

Component: {{component_name}}
Code:
{{component_code}}

Check for:
1. Proper hook usage
2. Performance optimization (memo, useMemo, useCallback)
3. Accessibility features
4. TypeScript usage
5. Testing considerations
6. Props validation
7. State management patterns

Provide specific, actionable improvements.`,
        arguments: {
          component_name: { description: 'Name of the React component' },
          component_code: { description: 'React component source code' }
        }
      });

      prompts.push({
        name: 'react_performance_audit',
        description: 'Audit React app for performance issues',
        template: `Perform a performance audit of this React application:

{{app_description}}

Components to analyze:
{{component_list}}

Focus on:
1. Bundle size optimization
2. Render performance
3. Memory usage
4. Network requests
5. Code splitting opportunities
6. Lazy loading implementation

Provide prioritized recommendations with implementation details.`,
        arguments: {
          app_description: { description: 'Description of the React application' },
          component_list: { description: 'List of components to analyze' }
        }
      });
    }

    // Testing prompts
    prompts.push({
      name: 'test_strategy',
      description: 'Generate testing strategy for the project',
      template: `Create a comprehensive testing strategy for this ${category} project:

Project details:
- Frameworks: ${frameworks.join(', ')}
- Complexity: ${complexity}
- Features: {{features}}

Provide:
1. Testing pyramid strategy
2. Unit testing approach
3. Integration testing plan
4. E2E testing scenarios
5. Performance testing considerations
6. Recommended testing tools
7. Coverage goals and metrics

Include specific examples for key components.`,
      arguments: {
        features: { description: 'List of project features to test' }
      }
    });

    // Documentation prompts
    prompts.push({
      name: 'documentation_generator',
      description: 'Generate project documentation',
      template: `Generate comprehensive documentation for this project:

Project: {{project_name}}
Description: {{project_description}}
Architecture: {{architecture}}

Create:
1. Getting Started guide
2. API documentation
3. Development setup
4. Deployment instructions
5. Contributing guidelines
6. Troubleshooting section

Use clear, beginner-friendly language with code examples.`,
      arguments: {
        project_name: { description: 'Name of the project' },
        project_description: { description: 'Brief project description' },
        architecture: { description: 'Project architecture overview' }
      }
    });

    // Deployment prompts
    if (category === 'web') {
      prompts.push({
        name: 'deployment_guide',
        description: 'Generate deployment guide for web application',
        template: `Create a deployment guide for this web application:

Tech stack:
- Frameworks: ${frameworks.join(', ')}
- Category: ${category}

Deployment target: {{deployment_platform}}

Include:
1. Prerequisites and requirements
2. Environment variable setup
3. Build process optimization
4. Platform-specific configuration
5. CI/CD pipeline setup
6. Monitoring and logging setup
7. Performance optimization for production
8. Security considerations

Provide step-by-step instructions with commands.`,
        arguments: {
          deployment_platform: { description: 'Target deployment platform' }
        }
      });
    }

    return prompts;
  }
}

// Singleton instance
const mcpServerService = new MCPServerService();

export { mcpServerService };
export type { MCPServerConfig, MCPGenerationOptions };