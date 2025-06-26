# 🚀 Zero-Cost Video Generation Setup

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
# Edge-TTS (Microsoft's free TTS)
pip install edge-tts

# FFmpeg (if not installed)
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Check installation
edge-tts --list-voices | grep en-US
ffmpeg -version
```

### 2. Test Free Services
```bash
# Test script generation (using existing OpenRouter key)
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{"model":"meta-llama/llama-3.3-70b-instruct:free","messages":[{"role":"user","content":"Hi"}]}'

# Test image generation (NO API KEY NEEDED!)
curl "https://image.pollinations.ai/prompt/beautiful%20sunset" -o test.jpg

# Test voice generation
edge-tts --text "Hello DailyDoco" --voice "en-US-AriaNeural" --write-media test.mp3
```

### 3. Run Video Generation
```bash
cd /home/tabs/ae-co-system/DAILYDOCO/apps/web-dashboard
bun run src/scripts/generate-free-video.ts
```

## n8n Setup

### 1. Import Workflow
1. Open n8n (http://localhost:5678)
2. Create new workflow
3. Import from JSON: `n8n-workflows/zero-cost-video-generation.json`
4. Add OpenRouter credentials (HTTP Header Auth)

### 2. Configure Credentials
```yaml
Name: OpenRouter API
Auth Type: Header Auth
Header Name: Authorization
Header Value: Bearer YOUR_OPENROUTER_API_KEY
```

### 3. Test Workflow
- Click "Execute Workflow" 
- Check each node's output
- Video will be saved to `/tmp/output.mp4`

## Service Details

### Free Script Models (OpenRouter)
| Model | Quality | Speed | Best For |
|-------|---------|-------|----------|
| llama-3.3-70b:free | ⭐⭐⭐⭐⭐ | Medium | Best overall quality |
| qwen-2.5-72b:free | ⭐⭐⭐⭐⭐ | Fast | Structured output |
| gemma-2-27b:free | ⭐⭐⭐⭐ | Fast | Quick iterations |

### Free Image Generation
- **Pollinations.ai**: Unlimited, no API key, instant
- **Image URL**: `https://image.pollinations.ai/prompt/YOUR_PROMPT`
- **No rate limits**, no sign up, just works!

### Free Voice Options
```bash
# List all Edge-TTS voices
edge-tts --list-voices

# Recommended voices:
# en-US-AriaNeural (Female, Professional)
# en-US-GuyNeural (Male, Energetic)
# en-US-JennyNeural (Female, Friendly)
# en-US-RyanNeural (Male, Technical)
```

## Cost Breakdown
```
Script:  $0.00 (Free OpenRouter models)
Images:  $0.00 (Pollinations.ai)
Voice:   $0.00 (Edge-TTS)
Video:   $0.00 (FFmpeg)
---------------------------------
TOTAL:   $0.00 per video
```

## Troubleshooting

### Edge-TTS not working?
```bash
# Reinstall
pip uninstall edge-tts
pip install --upgrade edge-tts

# Test
edge-tts --text "Test" --write-media test.mp3
```

### FFmpeg issues?
```bash
# Check version (need 4.0+)
ffmpeg -version

# Simple test
ffmpeg -f lavfi -i color=c=blue:s=1920x1080:d=5 test.mp4
```

### n8n connection issues?
- Ensure n8n is running: `n8n start`
- Check webhook URL: `http://localhost:5678/webhook/WORKFLOW_ID`
- Verify file permissions for `/tmp/` directory

## Production Tips

1. **Cache generated assets** to avoid regenerating
2. **Use webhook queues** in n8n for multiple requests
3. **Set up CDN** for serving videos (Cloudflare R2 free tier)
4. **Monitor usage** even though it's free
5. **Backup workflows** regularly

## 🎉 You're Ready!
Generate unlimited professional videos at zero cost!