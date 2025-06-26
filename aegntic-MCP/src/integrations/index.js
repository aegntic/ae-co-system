/**
 * Integrations Registry
 * 
 * Exports all integrations available in the MCP server.
 */

const sesameIntegration = require('./sesame');

module.exports = {
  sesame: sesameIntegration
};
