# Voice Synthesis API

The AegnticMCP Voice Synthesis API provides endpoints for text-to-speech conversion using Sesame CSM. This API allows you to synthesize speech from text, manage voice models, and convert audio formats.

## Base URL

All API endpoints are relative to the base URL:

```
http://[server-address]/api/voice
```

## Endpoints

### Synthesize Speech

Convert text to speech using the specified voice model.

**URL**: `/synthesize`

**Method**: `POST`

**Auth Required**: Yes

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| text | string | Yes | The text to convert to speech |
| voice | string | No | The voice model to use (default: "default") |
| format | string | No | Output audio format: "wav", "mp3", or "ogg" (default: "wav") |

#### Success Response

**Code**: `200 OK`

**Content Example**:

```json
{
  "success": true,
  "audioUrl": "/media/generated/audio/speech_1711967418253_3842.mp3",
  "duration": 2.4
}
```

#### Error Response

**Code**: `400 BAD REQUEST`

**Content Example**:

```json
{
  "success": false,
  "error": "Text is required for speech synthesis"
}
```

**Code**: `500 INTERNAL SERVER ERROR`

**Content Example**:

```json
{
  "success": false,
  "error": "Failed to synthesize speech",
  "message": "Error details..."
}
```

#### Sample Request

```bash
curl -X POST http://localhost:9100/api/voice/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test of the voice synthesis system.",
    "voice": "default",
    "format": "mp3"
  }'
```

### List Voice Models

Get a list of available voice models.

**URL**: `/models`

**Method**: `GET`

**Auth Required**: Yes

#### Success Response

**Code**: `200 OK`

**Content Example**:

```json
{
  "success": true,
  "models": [
    {
      "name": "csm-tiny",
      "path": "/opt/csm/models/csm-tiny",
      "files": 16
    }
  ]
}
```

#### Error Response

**Code**: `500 INTERNAL SERVER ERROR`

**Content Example**:

```json
{
  "success": false,
  "error": "Failed to list voice models",
  "message": "Error details..."
}
```

#### Sample Request

```bash
curl -X GET http://localhost:9100/api/voice/models
```

### Download Voice Model

Download a voice model from Hugging Face.

**URL**: `/models/download`

**Method**: `POST`

**Auth Required**: Yes

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| modelName | string | Yes | The name of the model to download |

#### Success Response

**Code**: `200 OK`

**Content Example**:

```json
{
  "success": true,
  "modelName": "csm-tiny",
  "path": "/opt/csm/models/csm-tiny"
}
```

#### Error Response

**Code**: `400 BAD REQUEST`

**Content Example**:

```json
{
  "success": false,
  "error": "Model name is required"
}
```

**Code**: `500 INTERNAL SERVER ERROR`

**Content Example**:

```json
{
  "success": false,
  "error": "Failed to download voice model",
  "message": "Error details..."
}
```

#### Sample Request

```bash
curl -X POST http://localhost:9100/api/voice/models/download \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "csm-tiny"
  }'
```

## Integration with Workflows

The Voice Synthesis API can be integrated with n8n workflows to automate text-to-speech conversion. Here's an example workflow:

1. Trigger: Webhook or Scheduled
2. HTTP Request: POST to `/api/voice/synthesize` with text content
3. HTTP Request: Download the generated audio file
4. File: Save the audio to a specific location or Send via Email

For more information on integrating with n8n workflows, see the [Workflow Documentation](../workflows/README.md).

## Error Codes

| Error Code | Description |
|------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server-side issue |

## Limitations

- Maximum text length: 10,000 characters per request
- Supported audio formats: WAV, MP3, OGG
- Maximum simultaneous requests: 5 per minute
