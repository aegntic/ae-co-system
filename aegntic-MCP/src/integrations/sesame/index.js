/**
 * Sesame CSM Integration
 * 
 * Exports functions for interacting with the Sesame CSM voice synthesis system.
 */

const client = require('./client');
const synthesizer = require('./synthesizer');

module.exports = {
  client,
  synthesize: synthesizer.synthesize,
  initialize: client.initialize,
  shutdown: client.shutdown,
  isInitialized: () => client.isInitialized()
};
