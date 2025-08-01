# Remotion Video Generation Guide

## Overview

DailyDoco Pro now uses **Remotion** for programmatic video generation, replacing the traditional video compilation approach. This new system interprets natural language scripts and automatically creates professional videos with:

- 🎬 Programmatic video generation using React components
- 🗣️ Multiple open-source TTS engine support
- 📝 Natural language script interpretation
- 🎨 Dynamic visual elements and transitions
- ⚡ High-performance rendering

## Natural Language Script Format

Write scripts in plain English with visual cues in square brackets:

```
Welcome to my tutorial! [SHOW: logo]

[SHOW: code block]
Here's how to create a function:
```javascript
function hello() {
  return "Hello, World!";
}
```

[TRANSITION: wipe] Now let's move on...

[SHOW: diagram - flowchart]
The system has three components:
1. Input processor
2. Analysis engine  
3. Output generator

[EMPHASIS] This is important!
[EXCITED] And it's amazing!
```

## Visual Cues Reference

### Content Display
- `[SHOW: code block]` - Display syntax-highlighted code
- `[SHOW: text-overlay - "Title" at position]` - Add text overlays
- `[SHOW: diagram - type]` - Show diagrams (flowchart, sequence, architecture)
- `[SHOW: animation - type]` - Display animations (particles, waves, etc.)
- `[SHOW: logo - "Text"]` - Show logo/branding

### Transitions
- `[TRANSITION: fade]` - Fade to black
- `[TRANSITION: wipe]` - Wipe transition
- `[TRANSITION: slide]` - Slide transition
- `[TRANSITION: dissolve]` - Dissolve effect
- `[TRANSITION: flip]` - 3D flip
- `[TRANSITION: zoom]` - Zoom transition

### Emotions/Emphasis
- `[EMPHASIS]` - Emphasize following text
- `[EXCITED]` - Excited tone
- `[CAUTIOUS]` - Cautious/warning tone
- `[CALM]` - Calm delivery

### Camera Effects
- `[FOCUS: area]` - Focus on specific area
- `[ZOOM: in/out]` - Zoom effect
- `[HIGHLIGHT: area]` - Highlight region

## MCP Tool Usage

### Generate Video from Script

```javascript
{
  "name": "generate_video_from_script",
  "arguments": {
    "script": "Your natural language script here...",
    "voiceId": "default", // or specific voice
    "template": "tutorial", // quick_demo, tutorial, deep_dive, etc.
    "resolution": "1080p",
    "fps": 30,
    "style": {
      "primaryColor": "#ff79c6",
      "secondaryColor": "#6272a4",
      "backgroundColor": "#282a36",
      "fontFamily": "Inter",
      "theme": "dark"
    }
  }
}
```

## TTS Voice Options

### Built-in Voices

1. **Default Voice** - Fast, reliable eSpeak
2. **Natural Voice** - gTTS with internet connection
3. **Offline Voice** - Pyttsx3 system voice

### Voice Configuration

```javascript
// Use default voice
"voiceId": "default"

// Use specific engine
"voiceId": "gtts:en"
"voiceId": "espeak:en+f3"
"voiceId": "pyttsx3:0"
```

## Video Templates

- **quick_demo** - 2-3 minute demos, fast pacing
- **tutorial** - 5-10 minute tutorials, moderate pacing
- **deep_dive** - 10+ minute detailed explanations
- **bug_fix** - Quick problem/solution videos
- **presentation** - Formal presentation style

## Component Architecture

### Core Components

1. **RemotionCompiler** - Main orchestrator
   - Parses natural language scripts
   - Manages TTS generation
   - Coordinates video rendering

2. **NaturalLanguageParser** - Script interpreter
   - Extracts visual cues
   - Identifies emotions and transitions
   - Estimates timing

3. **TTSEngine** - Multi-engine TTS
   - Supports 5+ TTS engines
   - Automatic fallback
   - Voice caching

4. **VideoComposition** - Main React component
   - Orchestrates all visual elements
   - Handles transitions
   - Syncs with audio

### Visual Components

- **CodeBlock** - Syntax-highlighted code with animations
- **TextOverlay** - Animated text overlays
- **Diagram** - Flowcharts, architecture diagrams
- **AnimatedGraphic** - Icons, shapes, particles
- **Transition** - Various transition effects

## Performance Optimization

### Rendering Settings

```javascript
// Fast preview
{
  "quality": "preview",
  "fps": 24,
  "resolution": "720p"
}

// High quality
{
  "quality": "production",
  "fps": 60,
  "resolution": "4K"
}
```

### Caching

- TTS audio is cached by content hash
- Rendered segments are reusable
- Templates are pre-compiled

## Docker Configuration

Required dependencies for Remotion:

```dockerfile
# Chrome/Chromium for Remotion
RUN apt-get install -y chromium chromium-sandbox

# TTS engines
RUN apt-get install -y espeak ffmpeg
RUN pip3 install gTTS TTS

# Set Chrome path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

## Troubleshooting

### Common Issues

1. **Chrome not found**
   - Ensure Chromium is installed
   - Set PUPPETEER_EXECUTABLE_PATH

2. **TTS fails**
   - Check internet for gTTS
   - Verify espeak installation
   - Fallback to eSpeak if needed

3. **Slow rendering**
   - Reduce resolution/FPS
   - Enable GPU acceleration
   - Use production build

### Debug Mode

```javascript
// Enable debug logging
const compiler = new RemotionCompiler({ debug: true });

// Test individual components
await compiler.testTTS("Hello world");
await compiler.testParser("[SHOW: code block]");
```

## Best Practices

1. **Script Writing**
   - Keep segments 10-30 seconds
   - Use transitions between major sections
   - Include visual cues every 20-30 seconds

2. **Performance**
   - Pre-generate TTS for long scripts
   - Use appropriate resolution for target platform
   - Cache frequently used assets

3. **Styling**
   - Maintain consistent color scheme
   - Use readable fonts
   - Ensure good contrast

## Examples

### Quick Demo Script

```
Hi! Let me show you this cool feature.

[SHOW: code block]
```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

[TRANSITION: wipe] See how simple that was?
```

### Tutorial Script

```
Welcome to our comprehensive guide on REST APIs!

[SHOW: logo - "REST API Tutorial"]

[TRANSITION: fade] Let's start with the basics.

[SHOW: diagram - architecture]
A REST API consists of:
- Client applications
- HTTP requests
- Server endpoints
- Database layer

[EMPHASIS] Understanding these components is crucial!

[SHOW: code block]
Here's a simple Express endpoint:
```javascript
app.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});
```

[TRANSITION: dissolve] Now you know the basics!
```

## Future Enhancements

- [ ] Real-time preview
- [ ] Custom voice training
- [ ] 3D graphics support
- [ ] Interactive elements
- [ ] Multi-language support
- [ ] Cloud rendering options