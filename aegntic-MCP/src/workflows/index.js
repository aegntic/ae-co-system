/**
 * Workflow Manager
 * 
 * Manages n8n workflow templates and integration.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../core/utils/logger');
const config = require('../core/config');

/**
 * Load workflow templates from the templates directory
 */
async function loadWorkflowTemplates() {
    try {
        const templatesDir = path.join(__dirname, 'templates');
        const files = await fs.readdir(templatesDir);
        
        const templates = {};
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(templatesDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const workflowTemplate = JSON.parse(content);
                
                templates[workflowTemplate.id] = workflowTemplate;
            }
        }
        
        logger.info(`Loaded ${Object.keys(templates).length} workflow templates`);
        return templates;
    } catch (error) {
        logger.error('Error loading workflow templates:', error);
        return {};
    }
}

/**
 * Create a new workflow in n8n based on a template
 */
async function createWorkflowFromTemplate(templateId, data = {}) {
    try {
        const templates = await loadWorkflowTemplates();
        
        if (!templates[templateId]) {
            throw new Error(`Template ${templateId} not found`);
        }
        
        const template = templates[templateId];
        
        // Apply customizations to the template based on data
        const workflow = {
            ...template,
            name: data.name || template.name
            // Additional customization would go here
        };
        
        logger.info(`Created workflow from template ${templateId}`);
        return workflow;
    } catch (error) {
        logger.error(`Error creating workflow from template ${templateId}:`, error);
        throw error;
    }
}

module.exports = {
    loadWorkflowTemplates,
    createWorkflowFromTemplate
};
