/**
 * Sesame CSM Integration Tests
 * 
 * Tests for the Sesame CSM voice synthesis integration.
 */

const { jest } = require('@jest/globals');
const path = require('path');
const fs = require('fs');

// Mock the child_process module
jest.mock('child_process', () => ({
  spawn: jest.fn(() => ({
    stdout: {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          // Simulate ready message
          callback(Buffer.from('READY'));
        }
        return this;
      })
    },
    stderr: {
      on: jest.fn(() => this)
    },
    on: jest.fn(() => this),
    stdin: {
      write: jest.fn()
    },
    kill: jest.fn()
  }))
}));

// Mock the logger
jest.mock('../../../../src/core/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}));

// Mock the config
jest.mock('../../../../src/core/config', () => ({
  sesame: {
    modelPath: '/mock/model/path',
    audioOutputDir: '/mock/audio/output',
    defaultVoice: 'default',
    sampleRate: 22050
  }
}));

describe('Sesame CSM Integration', () => {
  let sesameClient;
  let synthesizer;
  
  beforeEach(() => {
    // Reset modules between tests
    jest.resetModules();
    
    // Import the modules
    sesameClient = require('../../../../src/integrations/sesame/client');
    synthesizer = require('../../../../src/integrations/sesame/synthesizer');
  });
  
  test('Client should initialize successfully', async () => {
    // Mock fs.existsSync
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    
    const result = await sesameClient.initialize();
    expect(result).toBeTruthy();
    expect(sesameClient.isInitialized()).toBeTruthy();
  });
  
  test('Synthesizer should require text input', async () => {
    await expect(synthesizer.synthesize('')).rejects.toThrow('Text is required');
    await expect(synthesizer.synthesize(null)).rejects.toThrow('Text is required');
  });
  
  test('Synthesizer should generate audio with valid input', async () => {
    // Mock client.sendRequest
    jest.spyOn(sesameClient, 'sendRequest').mockResolvedValue({
      status: 'success',
      path: '/mock/audio/path.wav',
      duration: 1.5
    });
    
    // Mock fs.mkdirSync
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    
    const result = await synthesizer.synthesize('Hello world');
    
    expect(result).toEqual({
      success: true,
      audioPath: '/mock/audio/path.wav',
      duration: 1.5
    });
  });
  
  test('Client should clean up resources on shutdown', async () => {
    // Mock the process
    sesameClient.process = {
      kill: jest.fn()
    };
    sesameClient.initialized = true;
    
    await sesameClient.shutdown();
    
    expect(sesameClient.process.kill).toHaveBeenCalled();
    expect(sesameClient.initialized).toBeFalsy();
  });
});
