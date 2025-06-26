const { shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

class ObsidianIntegrator {
  constructor() {
    this.vaultPath = null;
    this.mindmapsFolder = null;
    this.history = [];
  }

  async setVaultPath(vaultPath) {
    this.vaultPath = vaultPath;
    this.mindmapsFolder = path.join(vaultPath, 'AI Conversations');
    
    // Ensure folder exists
    if (!await existsAsync(this.mindmapsFolder)) {
      await mkdirAsync(this.mindmapsFolder, { recursive: true });
    }
    
    return this.mindmapsFolder;
  }
  
  async addConversation(prompt, responses) {
    if (!this.vaultPath) {
      throw new Error('Vault path not set');
    }
    
    const conversation = {
      prompt,
      responses,
      timestamp: Date.now()
    };
    
    this.history.push(conversation);
    
    return this.generateMindmap(conversation);
  }
  
  async generateMindmap(conversation) {
    if (!this.vaultPath) {
      throw new Error('Vault path not set');
    }
    
    const date = new Date(conversation.timestamp).toISOString().split('T')[0];
    const filename = `${date}-${this.sanitizeFilename(conversation.prompt.substring(0, 30))}.md`;
    const filePath = path.join(this.mindmapsFolder, filename);
    
    // Create mindmap content
    let content = `# ${conversation.prompt}\n\n`;
    content += `## Prompt\n${conversation.prompt}\n\n`;
    
    // Add main branches for each AI
    Object.values(conversation.responses).forEach((response) => {
      content += `## ${response.modelName}\n\n`;
      
      // Process the response text to create sub-branches
      const paragraphs = response.content.split('\n\n');
      paragraphs.forEach((paragraph, i) => {
        if (paragraph.trim()) {
          content += `### Key Point ${i+1}\n${paragraph.trim()}\n\n`;
        }
      });
    });
    
    // Add metadata
    content += `\n---\ntimestamp: ${conversation.timestamp}\n`;
    content += `models: ${Object.values(conversation.responses).map(r => r.modelName).join(', ')}\n`;
    
    // Write file
    await writeFileAsync(filePath, content, 'utf8');
    
    // Open in Obsidian via URI protocol
    const obsidianUri = `obsidian://open?vault=${encodeURIComponent(path.basename(this.vaultPath))}&file=${encodeURIComponent(path.relative(this.vaultPath, filePath))}`;
    shell.openExternal(obsidianUri);
    
    return filePath;
  }
  
  sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  getHistory() {
    return this.history;
  }
}

module.exports = ObsidianIntegrator;
