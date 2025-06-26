import { Octokit } from '@octokit/rest';
import { z } from 'zod';

export interface GitHubRepo {
  owner: string;
  repo: string;
  branch?: string;
}

export interface RepoMetadata {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  isPrivate: boolean;
  htmlUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  language: string | null;
  languages: Record<string, number>;
  topics: string[];
  starsCount: number;
  forksCount: number;
  watchersCount: number;
  sizeKb: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  sha: string;
  encoding: string;
  type: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
      request: {
        timeout: 10000, // 10 second timeout
      },
    });
  }

  /**
   * Parse GitHub URL into owner and repo
   */
  parseGitHubUrl(url: string): GitHubRepo {
    const urlSchema = z.string().url();
    const validatedUrl = urlSchema.parse(url);
    
    const match = validatedUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    
    const [, owner, repo, branch] = match;
    
    // Remove .git suffix if present
    const cleanRepo = repo.replace(/\.git$/, '');
    
    return {
      owner: owner.trim(),
      repo: cleanRepo.trim(),
      branch: branch?.trim(),
    };
  }

  /**
   * Fetch repository metadata
   */
  async getRepositoryMetadata(owner: string, repo: string): Promise<RepoMetadata> {
    try {
      const [repoResponse, languagesResponse] = await Promise.all([
        this.octokit.repos.get({ owner, repo }),
        this.octokit.repos.listLanguages({ owner, repo }).catch(() => ({ data: {} })),
      ]);

      const repoData = repoResponse.data;
      
      return {
        id: repoData.id,
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        isPrivate: repoData.private,
        htmlUrl: repoData.html_url,
        cloneUrl: repoData.clone_url,
        defaultBranch: repoData.default_branch,
        language: repoData.language,
        languages: languagesResponse.data,
        topics: repoData.topics || [],
        starsCount: repoData.stargazers_count,
        forksCount: repoData.forks_count,
        watchersCount: repoData.watchers_count,
        sizeKb: repoData.size,
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        pushedAt: repoData.pushed_at,
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found or is private`);
      }
      if (error.status === 403) {
        throw new Error('GitHub API rate limit exceeded or insufficient permissions');
      }
      throw new Error(`Failed to fetch repository metadata: ${error.message}`);
    }
  }

  /**
   * Fetch file content from repository
   */
  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<FileContent | null> {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: ref || undefined,
      });

      if (Array.isArray(response.data) || response.data.type !== 'file') {
        return null;
      }

      const fileData = response.data;
      
      // Decode base64 content
      let content = '';
      if (fileData.encoding === 'base64' && fileData.content) {
        content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      }

      return {
        path: fileData.path,
        content,
        size: fileData.size,
        sha: fileData.sha,
        encoding: fileData.encoding,
        type: fileData.type,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return null; // File not found
      }
      throw new Error(`Failed to fetch file ${path}: ${error.message}`);
    }
  }

  /**
   * Fetch README.md content
   */
  async getReadmeContent(owner: string, repo: string, ref?: string): Promise<FileContent | null> {
    // Try different README file names
    const readmeFiles = [
      'README.md',
      'readme.md',
      'Readme.md',
      'README.MD',
      'README.txt',
      'README.rst',
      'README',
    ];

    for (const filename of readmeFiles) {
      const content = await this.getFileContent(owner, repo, filename, ref);
      if (content) {
        return content;
      }
    }

    return null;
  }

  /**
   * Fetch multiple important files for analysis
   */
  async getImportantFiles(owner: string, repo: string, ref?: string): Promise<FileContent[]> {
    const importantFiles = [
      'README.md',
      'PLANNING.md',
      'TASKS.md',
      'package.json',
      'composer.json',
      'requirements.txt',
      'Cargo.toml',
      'go.mod',
      'pom.xml',
      'Gemfile',
      'setup.py',
      'pyproject.toml',
      '.github/workflows',
      'docker-compose.yml',
      'Dockerfile',
    ];

    const files: FileContent[] = [];
    
    for (const filePath of importantFiles) {
      try {
        const content = await this.getFileContent(owner, repo, filePath, ref);
        if (content) {
          files.push(content);
        }
      } catch (error) {
        // Ignore individual file errors and continue
      }
    }

    return files;
  }

  /**
   * Get repository file tree
   */
  async getRepositoryTree(owner: string, repo: string, ref?: string): Promise<any[]> {
    try {
      const response = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: ref || 'HEAD',
        recursive: 'true',
      });

      return response.data.tree;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository tree: ${error.message}`);
    }
  }

  /**
   * Check if repository exists and is accessible
   */
  async isRepositoryAccessible(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.repos.get({ owner, repo });
      return true;
    } catch (error: any) {
      if (error.status === 404 || error.status === 403) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(username: string): Promise<any> {
    try {
      const response = await this.octokit.users.getByUsername({ username });
      return response.data;
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`User ${username} not found`);
      }
      throw new Error(`Failed to fetch user info: ${error.message}`);
    }
  }

  /**
   * Validate GitHub webhook signature
   */
  static validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const computedSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')}`;
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  }
}