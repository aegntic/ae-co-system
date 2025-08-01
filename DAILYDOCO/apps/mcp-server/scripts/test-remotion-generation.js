#!/usr/bin/env node

/**
 * Test script for Remotion video generation
 */

import { RemotionCompiler } from '../dist/tools/remotion-compiler.js';

async function testRemotionGeneration() {
  console.log('🎬 Testing Remotion Video Generation...\n');

  const compiler = new RemotionCompiler();

  // Test script with various visual cues and elements
  const testScript = `
    Welcome to DailyDoco Pro! Today we'll explore the amazing world of automated documentation.

    [SHOW: code block]
    Let's start with a simple function:
    \`\`\`javascript
    function greet(name) {
      return \`Hello, \${name}! Welcome to DailyDoco!\`;
    }
    \`\`\`

    [TRANSITION: wipe] Now, let's look at the architecture.

    [SHOW: diagram - flowchart]
    Our system consists of three main components:
    1. The capture engine that records your screen
    2. The AI processor that analyzes your actions
    3. The video compiler that creates the final output

    [EMPHASIS] This is really important: DailyDoco learns from your personal brand!

    [SHOW: animation - particles]
    We use advanced AI to understand your style and preferences.

    [TRANSITION: dissolve] Let's see it in action!

    [SHOW: text-overlay - "Key Features" at top-center]
    Here are the key features:
    - 99% accurate project analysis
    - AI-powered test audience
    - Personal brand learning
    - Human authenticity engine

    [EXCITED] And the best part? It's all automated!

    [SHOW: logo - "DailyDoco Pro"]
    Thank you for watching! Start documenting like a pro today.
  `;

  const options = {
    script: testScript,
    voiceId: 'default',
    template: 'tutorial',
    resolution: '1080p',
    fps: 30,
    style: {
      primaryColor: '#ff79c6',
      secondaryColor: '#6272a4',
      backgroundColor: '#282a36',
      fontFamily: 'Inter, system-ui, sans-serif',
      theme: 'dark'
    }
  };

  try {
    console.log('📝 Script length:', testScript.length, 'characters\n');
    console.log('🎯 Starting compilation...\n');

    const result = await compiler.compileVideo(options);

    console.log('✅ Video generation completed!\n');
    console.log('📹 Output:', result.outputPath);
    console.log('⏱️  Duration:', result.duration, 'seconds');
    console.log('📊 Segments:', result.segments, 'segments');
    console.log('🎵 Audio files:', result.audioFiles?.length || 0, 'files');
    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testRemotionGeneration().catch(console.error);