#!/usr/bin/env bun

/**
 * Zero-Cost Video Generation with Better Free Models
 * Uses Llama 3.3, Qwen 2.5, and Gemma 27B for superior quality
 * Pollinations.ai for images (no API key required!)
 * Edge-TTS for professional voice synthesis
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Ensure directories exist
const publicDir = join(process.cwd(), 'public');
const cacheDir = join(publicDir, '.cache');
if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

// Zero-cost configuration with better models
const FREE_CONFIG = {
  models: {
    script: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'qwen/qwen-2.5-72b-instruct:free', 
      'google/gemma-2-27b:free',
      'mistralai/mistral-7b-instruct:free' // Fallback
    ]
  },
  
  voices: {
    professional: 'en-US-AriaNeural',     // Female professional
    energetic: 'en-US-GuyNeural',         // Male energetic
    trustworthy: 'en-US-JennyNeural',     // Female trustworthy
    technical: 'en-US-RyanNeural'         // Male technical
  },
  
  imageStyle: {
    prefix: 'professional screenshot, modern UI, dark theme, purple gradient,',
    suffix: ', high quality, 4k, clean design, minimalist'
  }
};

// Generate script with free models
async function generateScriptFree(prompt: string): Promise<string> {
  console.log('📝 Generating script with free models...');
  
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
  
  // Try each model until one works
  for (const model of FREE_CONFIG.models.script) {
    try {
      console.log(`   Trying ${model}...`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dailydoco.pro',
          'X-Title': 'DailyDoco Pro'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert video script writer. Create structured, engaging scripts with clear scene breakdowns.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success with ${model}`);
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
  
  // Fallback to cached script
  console.log('   Using cached script...');
  return getCachedScript();
}

// Generate images with Pollinations.ai (100% free, no API key!)
async function generateImagesFree(scenes: any[]): Promise<string[]> {
  console.log('🎨 Generating images with Pollinations.ai (FREE)...');
  
  const images: string[] = [];
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const prompt = `${FREE_CONFIG.imageStyle.prefix} ${scene.visual} ${FREE_CONFIG.imageStyle.suffix}`;
    
    // Pollinations.ai - completely free, no limits!
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    
    // Download image
    const imagePath = join(cacheDir, `scene-${i}.png`);
    try {
      await execAsync(`curl -s "${imageUrl}" -o "${imagePath}"`);
      images.push(imagePath);
      console.log(`   ✅ Scene ${i + 1} image generated`);
    } catch (error) {
      console.log(`   ⚠️  Scene ${i + 1} failed, using placeholder`);
      images.push(await createPlaceholder(scene, i));
    }
  }
  
  return images;
}

// Generate voice with Edge-TTS (Microsoft's free TTS)
async function generateVoiceFree(text: string, voice: string = 'energetic'): Promise<string> {
  console.log('🎙️ Generating voice with Edge-TTS (FREE)...');
  
  const voiceId = FREE_CONFIG.voices[voice] || FREE_CONFIG.voices.energetic;
  const outputPath = join(cacheDir, 'narration.mp3');
  
  try {
    // Edge-TTS command
    const command = `edge-tts --voice "${voiceId}" --rate "+5%" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;
    await execAsync(command);
    console.log(`   ✅ Voice generated with ${voiceId}`);
    return outputPath;
  } catch (error) {
    console.log('   ❌ Edge-TTS failed, trying alternative...');
    return generateVoiceFallback(text);
  }
}

// Fallback voice generation
async function generateVoiceFallback(text: string): Promise<string> {
  const outputPath = join(cacheDir, 'narration.mp3');
  
  // Try system TTS
  if (process.platform === 'darwin') {
    await execAsync(`say -o "${outputPath}" "${text}"`);
  } else {
    // Use espeak or festival on Linux
    await execAsync(`espeak "${text}" -w "${outputPath}"`);
  }
  
  return outputPath;
}

// Compose video with FFmpeg
async function composeVideoFree(images: string[], audioPath: string): Promise<string> {
  console.log('🎬 Composing video with FFmpeg (FREE)...');
  
  const outputPath = join(publicDir, 'demo-video-free.mp4');
  const duration = 90; // seconds
  const imageDuration = duration / images.length;
  
  // Create concat file for images
  const concatFile = join(cacheDir, 'concat.txt');
  const concatContent = images.map(img => 
    `file '${img}'\nduration ${imageDuration}`
  ).join('\n');
  writeFileSync(concatFile, concatContent);
  
  // FFmpeg command with crossfade transitions
  const command = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -i "${audioPath}" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p" \
    -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -shortest \
    "${outputPath}"`;
  
  await execAsync(command);
  console.log(`   ✅ Video composed: ${outputPath}`);
  
  return outputPath;
}

// Create placeholder image with Canvas
async function createPlaceholder(scene: any, index: number): Promise<string> {
  const { createCanvas } = await import('@napi-rs/canvas');
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');
  
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
  gradient.addColorStop(0, '#1e293b');
  gradient.addColorStop(0.5, '#7c3aed');
  gradient.addColorStop(1, '#3b82f6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1920, 1080);
  
  // Text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(scene.title || `Scene ${index + 1}`, 960, 540);
  
  // Save
  const outputPath = join(cacheDir, `placeholder-${index}.png`);
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(outputPath, buffer);
  
  return outputPath;
}

// Get cached script
function getCachedScript(): string {
  return `
[SCENE 1: Problem (0-15s)]
Visual: Developer drowning in documentation tasks
Narration: Every sprint, documentation dies. Your brilliant code goes undocumented.

[SCENE 2: Solution (15-30s)]
Visual: DailyDoco Pro dashboard with AI actively documenting
Narration: DailyDoco Pro watches your workflow and creates documentation automatically.

[SCENE 3: Features (30-60s)]
Visual: Split screen showing AI predicting, capturing, narrating
Narration: AI predicts important moments, captures perfectly, and narrates like a human.

[SCENE 4: Results (60-75s)]
Visual: Dashboard showing 12,000+ teams, 127 hours saved
Narration: Join thousands of teams saving over 100 hours monthly.

[SCENE 5: CTA (75-90s)]
Visual: Logo with website URL
Narration: DailyDoco Pro. Documentation that writes itself. Start free at dailydoco.pro.
`;
}

// Parse script into scenes
function parseScript(script: string): any[] {
  const scenes = [];
  const sceneMatches = script.match(/\[SCENE[^\]]+\][^[]+/g) || [];
  
  for (const match of sceneMatches) {
    const titleMatch = match.match(/\[SCENE[^\]]+\]/);
    const visualMatch = match.match(/Visual:\s*([^\n]+)/);
    const narrationMatch = match.match(/Narration:\s*([^\n]+)/);
    
    scenes.push({
      title: titleMatch ? titleMatch[0] : '',
      visual: visualMatch ? visualMatch[1] : '',
      narration: narrationMatch ? narrationMatch[1] : ''
    });
  }
  
  return scenes;
}

// Main generation function
export async function generateFreeVideo() {
  console.log('🚀 Starting ZERO-COST video generation...\n');
  console.log('💰 Total cost: $0.00\n');
  
  try {
    // 1. Generate script
    const scriptPrompt = `Create a 90-second video script for DailyDoco Pro with 5 scenes. 
    Include Visual: and Narration: for each scene.`;
    const script = await generateScriptFree(scriptPrompt);
    writeFileSync(join(publicDir, 'free-video-script.txt'), script);
    
    // 2. Parse scenes
    const scenes = parseScript(script);
    console.log(`\n📋 Parsed ${scenes.length} scenes`);
    
    // 3. Generate images (FREE with Pollinations.ai)
    const images = await generateImagesFree(scenes);
    
    // 4. Generate narration
    const fullNarration = scenes.map(s => s.narration).join(' ');
    const audioPath = await generateVoiceFree(fullNarration);
    
    // 5. Compose video
    const videoPath = await composeVideoFree(images, audioPath);
    
    // 6. Generate metadata
    const metadata = {
      title: 'DailyDoco Pro - Zero Cost Demo',
      duration: 90,
      scenes: scenes.length,
      created_at: new Date().toISOString(),
      cost: {
        script: '$0.00 (free models)',
        images: '$0.00 (Pollinations.ai)',
        voice: '$0.00 (Edge-TTS)',
        video: '$0.00 (FFmpeg)',
        total: '$0.00'
      },
      services: {
        script: 'OpenRouter Free Models',
        images: 'Pollinations.ai (no API key!)',
        voice: 'Microsoft Edge-TTS',
        video: 'FFmpeg'
      }
    };
    
    writeFileSync(
      join(publicDir, 'free-video-metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log('\n✨ Zero-cost video generation complete!');
    console.log(`📹 Video: ${videoPath}`);
    console.log('💰 Total cost: $0.00');
    console.log('\n🎯 Professional quality, zero cost!');
    
    return { success: true, videoPath, metadata };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

// CLI execution
if (import.meta.main) {
  generateFreeVideo();
}