/**
 * Text-to-Speech Engine
 * 
 * Integrates multiple free and open source TTS solutions
 * for natural language narration in videos
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export interface TTSOptions {
  text: string;
  voiceId?: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm';
  speed?: number;
  pitch?: number;
  engine?: 'coqui' | 'piper' | 'espeak' | 'gtts' | 'silero';
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  engine: string;
  description?: string;
  sample?: string;
}

export class TTSEngine {
  private outputDir: string;
  private coquiApiUrl: string;
  private availableVoices: Map<string, Voice>;

  constructor() {
    this.outputDir = process.env.TTS_OUTPUT_DIR || '/tmp/dailydoco/tts';
    this.coquiApiUrl = process.env.COQUI_API_URL || 'http://localhost:5002';
    this.availableVoices = new Map();
    this.initializeVoices();
  }

  /**
   * Initialize available voices from all engines
   */
  private async initializeVoices(): Promise<void> {
    // Coqui TTS voices
    this.availableVoices.set('coqui-tacotron2', {
      id: 'coqui-tacotron2',
      name: 'Tacotron2 Default',
      language: 'en-US',
      gender: 'female',
      engine: 'coqui',
      description: 'High quality neural TTS voice',
    });

    this.availableVoices.set('coqui-vits', {
      id: 'coqui-vits',
      name: 'VITS Natural',
      language: 'en-US',
      gender: 'neutral',
      engine: 'coqui',
      description: 'Very natural sounding voice with VITS model',
    });

    // Piper voices
    this.availableVoices.set('piper-amy', {
      id: 'piper-amy',
      name: 'Amy',
      language: 'en-US',
      gender: 'female',
      engine: 'piper',
      description: 'Clear and friendly voice',
    });

    this.availableVoices.set('piper-ryan', {
      id: 'piper-ryan',
      name: 'Ryan',
      language: 'en-US',
      gender: 'male',
      engine: 'piper',
      description: 'Professional male voice',
    });

    // Google TTS voices
    this.availableVoices.set('gtts-en-us', {
      id: 'gtts-en-us',
      name: 'Google US English',
      language: 'en-US',
      gender: 'female',
      engine: 'gtts',
      description: 'Google Text-to-Speech voice',
    });

    // Silero voices
    this.availableVoices.set('silero-v3', {
      id: 'silero-v3',
      name: 'Silero V3',
      language: 'en',
      gender: 'neutral',
      engine: 'silero',
      description: 'Fast and lightweight neural voice',
    });
  }

  /**
   * Generate audio from text using specified TTS engine
   */
  async generateAudio(options: TTSOptions): Promise<string> {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const audioId = uuidv4();
    const outputPath = path.join(this.outputDir, `${audioId}.wav`);
    
    // Get voice configuration
    const voiceId = options.voiceId || 'coqui-vits';
    const voice = this.availableVoices.get(voiceId);
    
    if (!voice) {
      throw new Error(`Voice not found: ${voiceId}`);
    }

    // Route to appropriate engine
    switch (voice.engine) {
      case 'coqui':
        return await this.generateCoquiAudio(options, outputPath);
      case 'piper':
        return await this.generatePiperAudio(options, outputPath);
      case 'gtts':
        return await this.generateGTTSAudio(options, outputPath);
      case 'silero':
        return await this.generateSileroAudio(options, outputPath);
      case 'espeak':
        return await this.generateESpeakAudio(options, outputPath);
      default:
        throw new Error(`Unsupported TTS engine: ${voice.engine}`);
    }
  }

  /**
   * Generate audio using Coqui TTS
   */
  private async generateCoquiAudio(
    options: TTSOptions,
    outputPath: string
  ): Promise<string> {
    try {
      // Check if Coqui TTS server is running
      const response = await axios.post(`${this.coquiApiUrl}/api/tts`, {
        text: options.text,
        speaker_idx: 0,
        language_idx: 0,
        style_wav: null,
        reference_wav: null,
        emotion: options.emotion || 'neutral',
        speed: options.speed || 1.0,
      }, {
        responseType: 'arraybuffer',
      });

      await fs.writeFile(outputPath, Buffer.from(response.data));
      return outputPath;
    } catch (error) {
      console.warn('Coqui TTS server not available, falling back to command line');
      
      // Fallback to command line Coqui TTS
      return new Promise((resolve, reject) => {
        const args = [
          '--text', options.text,
          '--out_path', outputPath,
          '--model_name', 'tts_models/en/ljspeech/vits',
        ];

        if (options.speed) {
          args.push('--speed', options.speed.toString());
        }

        const process = spawn('tts', args);
        
        process.on('close', (code) => {
          if (code === 0) {
            resolve(outputPath);
          } else {
            reject(new Error(`Coqui TTS failed with code ${code}`));
          }
        });

        process.on('error', (error) => {
          reject(error);
        });
      });
    }
  }

  /**
   * Generate audio using Piper TTS
   */
  private async generatePiperAudio(
    options: TTSOptions,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const modelPath = `/usr/share/piper-voices/en_US-${options.voiceId?.split('-')[1] || 'amy'}-medium.onnx`;
      
      const args = [
        '--model', modelPath,
        '--output_file', outputPath,
      ];

      if (options.speed) {
        args.push('--length_scale', (1 / options.speed).toString());
      }

      const process = spawn('piper', args);
      
      process.stdin.write(options.text);
      process.stdin.end();

      process.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Piper TTS failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate audio using Google TTS (gTTS)
   */
  private async generateGTTSAudio(
    options: TTSOptions,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        options.text,
        '--output', outputPath,
        '--lang', 'en',
      ];

      if (options.speed && options.speed !== 1.0) {
        args.push('--slow');
      }

      const process = spawn('gtts-cli', args);

      process.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`gTTS failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate audio using Silero TTS
   */
  private async generateSileroAudio(
    options: TTSOptions,
    outputPath: string
  ): Promise<string> {
    // Create Python script for Silero TTS
    const scriptPath = path.join(this.outputDir, 'silero_tts.py');
    const script = `
import torch
import soundfile as sf

device = torch.device('cpu')
model, example_text = torch.hub.load(
    repo_or_dir='snakers4/silero-models',
    model='silero_tts',
    language='en',
    speaker='v3_en'
)
model = model.to(device)

text = """${options.text.replace(/"/g, '\\"')}"""
audio = model.apply_tts(
    text=text,
    speaker='en_0',
    sample_rate=48000,
    put_accent=True,
    put_yo=True
)

sf.write('${outputPath}', audio, 48000)
`;

    await fs.writeFile(scriptPath, script);

    return new Promise((resolve, reject) => {
      const process = spawn('python3', [scriptPath]);

      process.on('close', async (code) => {
        // Clean up script file
        await fs.unlink(scriptPath).catch(() => {});
        
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Silero TTS failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate audio using eSpeak (fallback option)
   */
  private async generateESpeakAudio(
    options: TTSOptions,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        '-w', outputPath,
        '-s', Math.round((options.speed || 1.0) * 175).toString(),
        '-p', Math.round((options.pitch || 1.0) * 50).toString(),
        options.text,
      ];

      const process = spawn('espeak', args);

      process.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`eSpeak failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): Voice[] {
    return Array.from(this.availableVoices.values());
  }

  /**
   * Get voice by ID
   */
  getVoice(voiceId: string): Voice | undefined {
    return this.availableVoices.get(voiceId);
  }

  /**
   * Test TTS engine availability
   */
  async testEngine(engine: string): Promise<boolean> {
    try {
      switch (engine) {
        case 'coqui':
          await axios.get(`${this.coquiApiUrl}/health`);
          return true;
        case 'piper':
          await new Promise((resolve, reject) => {
            const process = spawn('piper', ['--version']);
            process.on('close', (code) => code === 0 ? resolve(true) : reject());
            process.on('error', reject);
          });
          return true;
        case 'gtts':
          await new Promise((resolve, reject) => {
            const process = spawn('gtts-cli', ['--version']);
            process.on('close', (code) => code === 0 ? resolve(true) : reject());
            process.on('error', reject);
          });
          return true;
        case 'espeak':
          await new Promise((resolve, reject) => {
            const process = spawn('espeak', ['--version']);
            process.on('close', (code) => code === 0 ? resolve(true) : reject());
            process.on('error', reject);
          });
          return true;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Get best available engine
   */
  async getBestAvailableEngine(): Promise<string> {
    const engines = ['coqui', 'piper', 'silero', 'gtts', 'espeak'];
    
    for (const engine of engines) {
      if (await this.testEngine(engine)) {
        return engine;
      }
    }
    
    throw new Error('No TTS engine available');
  }
}