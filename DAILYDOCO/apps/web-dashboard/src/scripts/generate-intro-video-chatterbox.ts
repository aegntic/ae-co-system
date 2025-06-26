#!/usr/bin/env bun

/**
 * DailyDoco Pro 90-Second Intro Video Generator
 * Enhanced with Coqui TTS (Chatterbox) for Professional Voice Synthesis
 * Version 3.0 - Production Ready
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  video: {
    duration: 90,
    width: 1920,
    height: 1080,
    fps: 30,
    quality: 'high',
    format: 'mp4'
  },
  
  voice: {
    model: 'tts_models/en/ljspeech/tacotron2-DDC',
    speed: 1.0,
    pitch: 0,
    volume: 0.8
  },
  
  output: {
    directory: 'public/intro-video-output',
    videoFile: 'dailydoco-intro-2025-chatterbox.mp4',
    audioFile: 'narration-chatterbox.wav',
    scriptFile: 'script-final.txt'
  },
  
  assets: {
    backgroundMusic: 'public/background-tech.mp3', // Optional
    logoFile: 'public/dailydoco-logo.png'
  }
};

interface VideoGenerationResult {
  success: boolean;
  videoPath?: string;
  audioPath?: string;
  duration?: number;
  fileSize?: number;
  voiceQuality?: number;
  processingTime?: number;
  error?: string;
}

class ChatterboxVideoGenerator {
  private outputDir: string;
  private startTime: number;

  constructor() {
    this.outputDir = join(process.cwd(), CONFIG.output.directory);
    this.startTime = Date.now();
    
    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateVideo(): Promise<VideoGenerationResult> {
    try {
      console.log('🚀 Starting DailyDoco Pro Intro Video Generation');
      console.log('📁 Output directory:', this.outputDir);
      
      // Step 1: Prepare script
      const script = await this.prepareScript();
      console.log('✅ Script prepared:', script.length, 'characters');
      
      // Step 2: Generate voice with Coqui TTS
      const audioResult = await this.generateVoiceNarration(script);
      console.log('✅ Voice generated:', audioResult.duration, 'seconds');
      
      // Step 3: Generate background visuals
      const visualsResult = await this.generateVisuals();
      console.log('✅ Visuals prepared');
      
      // Step 4: Compose final video
      const videoResult = await this.composeVideo(audioResult, visualsResult);
      console.log('✅ Video composed');
      
      // Step 5: Final quality validation
      const validation = await this.validateVideo(videoResult.path);
      
      const processingTime = Date.now() - this.startTime;
      
      return {
        success: true,
        videoPath: videoResult.path,
        audioPath: audioResult.path,
        duration: audioResult.duration,
        fileSize: videoResult.size,
        voiceQuality: validation.audioQuality,
        processingTime
      };
      
    } catch (error) {
      console.error('❌ Video generation failed:', error);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - this.startTime
      };
    }
  }

  private async prepareScript(): Promise<string> {
    const scriptPath = join(process.cwd(), 'public/intro-video-script-2025.txt');
    
    if (existsSync(scriptPath)) {
      return readFileSync(scriptPath, 'utf-8');
    }
    
    // Enhanced 2025 script with latest DailyDoco features
    const script = `Every sprint, the same story repeats. Brilliant code gets written, features ship perfectly. But documentation? It dies faster than a 404 error.

What if your code could document itself while you work? Meet DailyDoco Pro - the AI documentation platform that captures, analyzes, and transforms your development workflow into professional video documentation.

Watch as DailyDoco intelligently records your screen, understands your code context, and generates narrated tutorials automatically. Our aegnt-27 engine ensures every video feels authentically human, not robotic.

From local privacy-first processing to enterprise team collaboration, DailyDoco scales with your needs. Compatible with VS Code, GitHub, and your entire development stack.

Stop letting great code go undocumented. Start your free trial at dailydoco.pro and transform how your team shares knowledge.

DailyDoco Pro. Documentation that writes itself.`;

    const finalScriptPath = join(this.outputDir, CONFIG.output.scriptFile);
    writeFileSync(finalScriptPath, script);
    
    return script;
  }

  private async generateVoiceNarration(script: string): Promise<{path: string, duration: number}> {
    console.log('🎙️ Generating professional voice narration with Coqui TTS...');
    
    const scriptFile = join(this.outputDir, 'temp-script.txt');
    const audioOutput = join(this.outputDir, CONFIG.output.audioFile);
    
    // Write script to temporary file for TTS
    writeFileSync(scriptFile, script);
    
    // Generate voice using Coqui TTS with our environment
    const ttsCommand = `cd ${dirname(process.cwd())} && source chatterbox-env/bin/activate && tts --text "${script.replace(/"/g, '\\"')}" --model_name "${CONFIG.voice.model}" --out_path "${audioOutput}"`;
    
    console.log('🔄 Running TTS synthesis...');
    const ttsResult = await execAsync(ttsCommand, { 
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      timeout: 300000 // 5 minute timeout
    });
    
    // Get audio duration
    const probeResult = await execAsync(`ffprobe -v quiet -print_format json -show_format "${audioOutput}"`);
    const audioInfo = JSON.parse(probeResult.stdout);
    const duration = parseFloat(audioInfo.format.duration);
    
    // Enhance audio quality with normalization
    const enhancedAudio = join(this.outputDir, 'narration-enhanced.wav');
    await execAsync(`ffmpeg -i "${audioOutput}" -af "volume=${CONFIG.voice.volume},highpass=f=80,lowpass=f=8000" -ar 44100 -y "${enhancedAudio}"`);
    
    return {
      path: enhancedAudio,
      duration: duration
    };
  }

  private async generateVisuals(): Promise<{backgroundPath: string, logoPath: string}> {
    console.log('🎨 Generating visual assets...');
    
    // Generate modern tech background using Pollinations.ai
    const backgroundPrompt = "modern tech workspace with code on screens, professional developer environment, dark theme, clean minimal design, 4k quality";
    const backgroundUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(backgroundPrompt)}?width=1920&height=1080&seed=42&enhance=true`;
    
    const backgroundPath = join(this.outputDir, 'background.jpg');
    
    // Download background image
    await execAsync(`curl -s "${backgroundUrl}" -o "${backgroundPath}"`);
    
    // Create animated background with subtle motion
    const animatedBg = join(this.outputDir, 'animated-background.mp4');
    await execAsync(`ffmpeg -loop 1 -i "${backgroundPath}" -vf "scale=1920:1080,zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))':d=25:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080" -t 95 -r 30 -pix_fmt yuv420p -y "${animatedBg}"`);
    
    // Prepare logo overlay (if exists)
    const logoPath = join(process.cwd(), CONFIG.assets.logoFile);
    
    return {
      backgroundPath: animatedBg,
      logoPath: existsSync(logoPath) ? logoPath : null
    };
  }

  private async composeVideo(audio: {path: string, duration: number}, visuals: {backgroundPath: string, logoPath: string}): Promise<{path: string, size: number}> {
    console.log('🎬 Composing final video...');
    
    const outputVideo = join(this.outputDir, CONFIG.output.videoFile);
    
    // Compose video with professional effects
    let ffmpegCommand = `ffmpeg -i "${visuals.backgroundPath}" -i "${audio.path}"`;
    
    // Add logo overlay if available
    if (visuals.logoPath) {
      ffmpegCommand += ` -i "${visuals.logoPath}"`;
    }
    
    // Video filters for professional look
    let videoFilters = [
      'scale=1920:1080',
      'format=yuv420p'
    ];
    
    // Add logo overlay filter if logo exists
    if (visuals.logoPath) {
      videoFilters.push('[2:v]scale=200:-1[logo]');
      videoFilters.push('[0:v][logo]overlay=W-w-30:30');
    }
    
    // Add text overlays for key sections
    const textOverlays = [
      "drawtext=text='DailyDoco Pro':fontfile=/System/Library/Fonts/Arial.ttf:fontsize=72:fontcolor=white:x=(w-text_w)/2:y=h/2-50:enable='between(t,0,3)'",
      "drawtext=text='AI-Powered Documentation':fontfile=/System/Library/Fonts/Arial.ttf:fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h/2+50:enable='between(t,0,3)'"
    ];
    
    videoFilters = videoFilters.concat(textOverlays);
    
    ffmpegCommand += ` -vf "${videoFilters.join(',')}"`;
    ffmpegCommand += ` -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 192k`;
    ffmpegCommand += ` -shortest -y "${outputVideo}"`;
    
    console.log('🔄 Running video composition...');
    await execAsync(ffmpegCommand, {
      maxBuffer: 1024 * 1024 * 50, // 50MB buffer
      timeout: 600000 // 10 minute timeout
    });
    
    // Get file size
    const stats = await execAsync(`ls -la "${outputVideo}"`);
    const size = parseInt(stats.stdout.split(/\s+/)[4]);
    
    return {
      path: outputVideo,
      size: size
    };
  }

  private async validateVideo(videoPath: string): Promise<{audioQuality: number, videoQuality: number, duration: number}> {
    console.log('🔍 Validating video quality...');
    
    // Analyze video properties
    const probeResult = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`);
    const videoInfo = JSON.parse(probeResult.stdout);
    
    const duration = parseFloat(videoInfo.format.duration);
    const audioStream = videoInfo.streams.find(s => s.codec_type === 'audio');
    const videoStream = videoInfo.streams.find(s => s.codec_type === 'video');
    
    // Calculate quality scores
    const audioQuality = audioStream ? Math.min(100, (parseInt(audioStream.bit_rate) / 1000)) : 0;
    const videoQuality = videoStream ? Math.min(100, (parseInt(videoStream.width) * parseInt(videoStream.height)) / 20000) : 0;
    
    return {
      audioQuality,
      videoQuality,
      duration
    };
  }
}

// CLI execution
async function main() {
  console.log('🎬 DailyDoco Pro Intro Video Generator v3.0');
  console.log('🎙️ Powered by Coqui TTS for Professional Voice Synthesis\\n');
  
  const generator = new ChatterboxVideoGenerator();
  const result = await generator.generateVideo();
  
  if (result.success) {
    console.log('\\n🎉 Video Generation Complete!');
    console.log('📁 Video Path:', result.videoPath);
    console.log('⏱️  Duration:', result.duration, 'seconds');
    console.log('📊 File Size:', (result.fileSize / 1024 / 1024).toFixed(2), 'MB');
    console.log('🎙️ Voice Quality:', result.voiceQuality + '%');
    console.log('⚡ Processing Time:', (result.processingTime / 1000).toFixed(1), 'seconds');
    console.log('\\n🔗 Ready for upload to:', 'https://dailydoco.pro');
  } else {
    console.error('\\n❌ Video Generation Failed');
    console.error('Error:', result.error);
    console.error('Processing Time:', (result.processingTime / 1000).toFixed(1), 'seconds');
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}