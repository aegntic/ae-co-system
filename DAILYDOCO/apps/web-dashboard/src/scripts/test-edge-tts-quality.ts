#!/usr/bin/env bun

/**
 * Test Edge-TTS Quality - 10 Second Sample
 * Honest assessment of what's actually achievable
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Test configuration
const TEST_CONFIG = {
  voices_to_test: [
    'en-US-AriaNeural',      // Professional female
    'en-US-AndrewNeural',    // Confident male  
    'en-US-JennyNeural',     // Trustworthy female
    'en-US-BrianNeural'      // Casual male
  ],
  test_script: "Every sprint, the same story repeats. [pause] Brilliant code gets written, features ship perfectly. But documentation? It dies faster than a 404 error.",
  output_dir: 'public/voice-tests'
};

// Ensure test directory exists
const testDir = join(process.cwd(), TEST_CONFIG.output_dir);
if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true });

async function testVoiceQuality() {
  console.log('🎙️ Testing Edge-TTS Voice Quality - Honest Assessment\n');
  
  const testScript = TEST_CONFIG.test_script.replace('[pause]', '... ');
  const scriptFile = join(testDir, 'test-script.txt');
  writeFileSync(scriptFile, testScript);
  
  console.log('Testing script:');
  console.log(`"${testScript}"\n`);
  
  for (const voice of TEST_CONFIG.voices_to_test) {
    console.log(`Testing ${voice}...`);
    
    const outputFile = join(testDir, `test-${voice.replace('en-US-', '').replace('Neural', '')}.wav`);
    
    try {
      // Generate voice sample
      await execAsync(`edge-tts --voice "${voice}" --file "${scriptFile}" --write-media "${outputFile}"`);
      
      // Get file info
      const stats = await execAsync(`ffprobe -v quiet -print_format json -show_format "${outputFile}"`);
      const info = JSON.parse(stats.stdout);
      const durationSec = parseFloat(info.format.duration);
      const fileSizeMB = (parseInt(info.format.size) / 1024 / 1024).toFixed(2);
      
      console.log(`   ✅ Generated: ${durationSec.toFixed(1)}s, ${fileSizeMB}MB`);
      
      // Basic audio quality check
      const audioInfo = await execAsync(`ffprobe -v quiet -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,bit_rate "${outputFile}"`);
      console.log(`   📊 Quality: ${audioInfo.stdout.trim()}`);
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 Test Summary:');
  console.log('   📁 Files saved to:', testDir);
  console.log('   🎧 Listen to samples to judge quality');
  console.log('   ⚖️  Decision: Keep best voice or abandon narration');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Listen to all 4 samples');
  console.log('   2. Pick least offensive voice (if any)');
  console.log('   3. If all still suck, go with visual-only video');
  
  return {
    success: true,
    testDirectory: testDir,
    voicesTested: TEST_CONFIG.voices_to_test.length,
    message: 'Voice quality test complete - human judgment required'
  };
}

// CLI execution
if (import.meta.main) {
  testVoiceQuality();
}