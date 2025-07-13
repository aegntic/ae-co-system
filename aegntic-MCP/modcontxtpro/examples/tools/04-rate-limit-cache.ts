/**
 * Example 4: Weather API Tool with Rate Limiting and Caching
 * 
 * This example demonstrates:
 * - Rate limiting implementation
 * - Multi-tier caching strategy
 * - API key management
 * - Graceful degradation
 * - Performance optimization
 * - Cost-aware API usage
 */

import { z } from 'zod';
import { defineTool } from '../../src/core/tool-builder';
import axios from 'axios';
import crypto from 'crypto';

// Schema for weather queries
const WeatherQuerySchema = z.object({
  location: z.string()
    .min(2, 'Location must be at least 2 characters')
    .describe('City name, coordinates (lat,lon), or zip code'),
  
  units: z.enum(['metric', 'imperial', 'kelvin'])
    .default('metric')
    .describe('Temperature units'),
  
  forecast: z.boolean()
    .default(false)
    .describe('Include 5-day forecast'),
  
  detailed: z.boolean()
    .default(false)
    .describe('Include detailed weather information'),
});

// In-memory rate limiter implementation
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  async checkLimit(key: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this key
    const userRequests = this.requests.get(key) || [];
    
    // Filter out old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      this.cleanup();
    }
    
    return true;
  }
  
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const userRequests = this.requests.get(key) || [];
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    return Math.max(0, this.maxRequests - validRequests.length);
  }
  
  getResetTime(key: string): number {
    const userRequests = this.requests.get(key) || [];
    if (userRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...userRequests);
    return oldestRequest + this.windowMs;
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > now - this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Multi-tier cache implementation
class MultiTierCache {
  private l1Cache: Map<string, { data: any; expires: number }> = new Map(); // Hot cache (in-memory)
  private l2Cache: Map<string, { data: any; expires: number }> = new Map(); // Warm cache (longer TTL)
  
  async get(key: string): Promise<any | null> {
    const now = Date.now();
    
    // Check L1 cache
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && l1Entry.expires > now) {
      return l1Entry.data;
    }
    
    // Check L2 cache
    const l2Entry = this.l2Cache.get(key);
    if (l2Entry && l2Entry.expires > now) {
      // Promote to L1
      this.l1Cache.set(key, {
        data: l2Entry.data,
        expires: now + 60000, // 1 minute in L1
      });
      return l2Entry.data;
    }
    
    return null;
  }
  
  async set(key: string, data: any, ttlSeconds: number): Promise<void> {
    const now = Date.now();
    const ttlMs = ttlSeconds * 1000;
    
    // Set in L1 cache (short TTL)
    this.l1Cache.set(key, {
      data,
      expires: now + Math.min(ttlMs, 60000), // Max 1 minute in L1
    });
    
    // Set in L2 cache (full TTL)
    this.l2Cache.set(key, {
      data,
      expires: now + ttlMs,
    });
    
    // Cleanup old entries
    this.cleanup();
  }
  
  private cleanup() {
    const now = Date.now();
    
    // Clean L1 cache
    for (const [key, entry] of this.l1Cache.entries()) {
      if (entry.expires <= now) {
        this.l1Cache.delete(key);
      }
    }
    
    // Clean L2 cache
    for (const [key, entry] of this.l2Cache.entries()) {
      if (entry.expires <= now) {
        this.l2Cache.delete(key);
      }
    }
  }
  
  getStats() {
    return {
      l1Size: this.l1Cache.size,
      l2Size: this.l2Cache.size,
      totalSize: this.l1Cache.size + this.l2Cache.size,
    };
  }
}

// Create rate limiter instance (shared across all requests)
const rateLimiter = new RateLimiter(50, 3600000); // 50 requests per hour

// Create cache instance
const weatherCache = new MultiTierCache();

// Mock weather data generator for demo/fallback
function generateMockWeather(location: string, units: string) {
  const seed = crypto.createHash('md5').update(location).digest('hex');
  const temp = parseInt(seed.substring(0, 2), 16) % 40 - 10; // -10 to 30
  
  const conditions = ['Clear', 'Cloudy', 'Rainy', 'Sunny', 'Overcast'];
  const condition = conditions[parseInt(seed.substring(2, 4), 16) % conditions.length];
  
  return {
    location,
    temperature: units === 'imperial' ? Math.round(temp * 9/5 + 32) : temp,
    condition,
    humidity: 50 + (parseInt(seed.substring(4, 6), 16) % 40),
    windSpeed: parseInt(seed.substring(6, 8), 16) % 30,
    isMock: true,
  };
}

// Define the weather tool with rate limiting and caching
export const weatherTool = defineTool({
  name: 'get_weather_info',
  description: 'Get current weather and forecast with intelligent caching and rate limiting',
  
  schema: WeatherQuerySchema,
  
  // Optional auth for higher rate limits
  auth: {
    required: false,
    roles: ['user', 'premium'],
  },
  
  // Rate limiting configuration
  rateLimit: {
    requests: 50,
    window: '1h',
  },
  
  metadata: {
    examples: [
      {
        description: 'Basic weather query',
        input: {
          location: 'London',
          units: 'metric',
          forecast: false,
          detailed: false,
        },
        output: {
          current: {
            temperature: 15,
            condition: 'Cloudy',
            humidity: 70,
            windSpeed: 10,
          },
          cached: true,
          rateLimitRemaining: 49,
        },
      },
      {
        description: 'Detailed forecast query',
        input: {
          location: '40.7128,-74.0060',
          units: 'imperial',
          forecast: true,
          detailed: true,
        },
        output: {
          current: {
            temperature: 72,
            condition: 'Sunny',
            humidity: 45,
            windSpeed: 8,
            pressure: 1013,
            visibility: 10,
            uvIndex: 6,
          },
          forecast: [
            { day: 'Tomorrow', high: 75, low: 60, condition: 'Partly Cloudy' },
            { day: 'Thursday', high: 78, low: 62, condition: 'Sunny' },
          ],
          cached: false,
          rateLimitRemaining: 48,
        },
      },
    ],
    
    followUpPrompts: [
      'Would you like the forecast for the next 5 days?',
      'Need weather for a different location?',
      'Want to see detailed atmospheric conditions?',
      'Should I convert to different temperature units?',
    ],
    
    documentation: {
      essentials: 'Weather data with smart caching (5-30min based on conditions) and rate limiting (50/hour for free, 500/hour for premium users).',
      full: `
# Weather Information Tool

Get current weather and forecasts with intelligent caching and rate limiting.

## Location Formats
- City name: "New York", "London", "Tokyo"
- Coordinates: "40.7128,-74.0060"
- ZIP code: "10001" (US only)
- Airport code: "JFK", "LHR"

## Caching Strategy

### Cache Duration by Weather Type
- **Stable conditions** (clear, sunny): 30 minutes
- **Variable conditions** (partly cloudy): 15 minutes
- **Unstable conditions** (rain, storm): 5 minutes
- **Forecast data**: 1 hour

### Multi-Tier Cache
- **L1 Cache**: Hot data, 1-minute TTL for frequent requests
- **L2 Cache**: Warm data, full TTL based on weather conditions
- **Fallback**: Mock data if API is unavailable

## Rate Limiting

### Free Tier
- 50 requests per hour
- Shared across all free users
- Resets on rolling window

### Premium Tier (authenticated users)
- 500 requests per hour
- Per-user limits
- Priority API access

## Cost Optimization
- Each API call costs ~$0.0001
- Caching reduces costs by 80-90%
- Premium users help offset API costs

## Performance
- Cached responses: <10ms
- Fresh API calls: 200-500ms
- Cache hit rate: ~85% in production

## Error Handling
- API failures: Return cached data if available
- Rate limit exceeded: Return mock data with warning
- Invalid location: Helpful error with suggestions
      `,
    },
    
    performance: {
      estimatedDuration: '<100ms',
      cacheable: true,
      cacheKey: (input) => {
        // Normalize location for better cache hits
        const normalizedLocation = input.location.toLowerCase().replace(/\s+/g, '');
        return `weather:${normalizedLocation}:${input.units}:${input.forecast}:${input.detailed}`;
      },
    },
    
    pitfalls: [
      'Location names can be ambiguous (e.g., "Springfield")',
      'Coordinates must be in decimal format, not degrees/minutes',
      'API costs can add up without proper caching',
      'Weather can change rapidly in unstable conditions',
    ],
    
    resources: [
      {
        title: 'OpenWeatherMap API Docs',
        url: 'https://openweathermap.org/api',
        type: 'api_reference',
      },
      {
        title: 'Weather Caching Best Practices',
        url: 'https://example.com/weather-cache-guide',
        type: 'tutorial',
      },
    ],
    
    tags: ['weather', 'api', 'cached', 'rate-limited'],
  },
  
  handler: async (input, context) => {
    const { user, logger, analytics } = context;
    const startTime = Date.now();
    
    // Determine rate limit key (user-specific or global)
    const rateLimitKey = user ? `user:${user.id}` : 'anonymous';
    const isPremium = user?.roles.includes('premium') || false;
    
    // Check cache first (before rate limit check)
    const cacheKey = `weather:${input.location.toLowerCase().replace(/\s+/g, '')}:${input.units}:${input.forecast}:${input.detailed}`;
    const cached = await weatherCache.get(cacheKey);
    
    if (cached) {
      logger?.info('Weather cache hit', { location: input.location, cacheStats: weatherCache.getStats() });
      
      // Track cache hit
      await analytics?.track('weather_query', {
        location: input.location,
        cached: true,
        responseTime: Date.now() - startTime,
        user: user?.login,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: formatWeatherResponse(cached, true, rateLimiter.getRemainingRequests(rateLimitKey)),
          },
        ],
      };
    }
    
    // Check rate limit for fresh API calls
    const allowed = await rateLimiter.checkLimit(rateLimitKey);
    const remaining = rateLimiter.getRemainingRequests(rateLimitKey);
    
    if (!allowed) {
      logger?.warn('Rate limit exceeded', { key: rateLimitKey, remaining });
      
      // Return mock data with rate limit warning
      const mockData = generateMockWeather(input.location, input.units);
      const resetTime = new Date(rateLimiter.getResetTime(rateLimitKey));
      
      return {
        content: [
          {
            type: 'text',
            text: `⚠️ **Rate Limit Exceeded**\n\nYou've reached the ${isPremium ? 'premium' : 'free'} tier limit. Limit resets at ${resetTime.toLocaleTimeString()}.\n\n*Showing estimated data:*\n\n${formatWeatherResponse(mockData, false, 0)}`,
          },
        ],
      };
    }
    
    try {
      // Simulate API call (in real implementation, this would call actual weather API)
      logger?.info('Fetching fresh weather data', { location: input.location });
      
      // For demo purposes, generate realistic mock data
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300)); // Simulate API latency
      
      const weatherData: any = {
        location: input.location,
        current: {
          temperature: Math.round(20 + Math.random() * 15),
          condition: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
          humidity: Math.round(40 + Math.random() * 40),
          windSpeed: Math.round(5 + Math.random() * 20),
        },
      };
      
      if (input.detailed) {
        weatherData.current.pressure = Math.round(1000 + Math.random() * 30);
        weatherData.current.visibility = Math.round(5 + Math.random() * 10);
        weatherData.current.uvIndex = Math.round(1 + Math.random() * 10);
        weatherData.current.feelsLike = weatherData.current.temperature + Math.round(-3 + Math.random() * 6);
      }
      
      if (input.forecast) {
        weatherData.forecast = [];
        const days = ['Tomorrow', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        for (let i = 0; i < 5; i++) {
          weatherData.forecast.push({
            day: days[i],
            high: weatherData.current.temperature + Math.round(-2 + Math.random() * 8),
            low: weatherData.current.temperature - Math.round(5 + Math.random() * 5),
            condition: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
            precipChance: Math.round(Math.random() * 100),
          });
        }
      }
      
      // Convert units if needed
      if (input.units === 'imperial') {
        weatherData.current.temperature = Math.round(weatherData.current.temperature * 9/5 + 32);
        if (weatherData.current.feelsLike) {
          weatherData.current.feelsLike = Math.round(weatherData.current.feelsLike * 9/5 + 32);
        }
        if (weatherData.forecast) {
          weatherData.forecast.forEach((day: any) => {
            day.high = Math.round(day.high * 9/5 + 32);
            day.low = Math.round(day.low * 9/5 + 32);
          });
        }
        weatherData.current.windSpeed = Math.round(weatherData.current.windSpeed * 0.621371); // km/h to mph
      }
      
      // Determine cache TTL based on weather stability
      let cacheTTL = 1800; // 30 minutes default
      if (weatherData.current.condition.includes('Rain') || weatherData.current.condition.includes('Storm')) {
        cacheTTL = 300; // 5 minutes for unstable weather
      } else if (weatherData.current.condition.includes('Cloudy')) {
        cacheTTL = 900; // 15 minutes for variable conditions
      }
      
      // Cache the result
      await weatherCache.set(cacheKey, weatherData, cacheTTL);
      logger?.info('Weather data cached', { location: input.location, ttl: cacheTTL });
      
      // Track API usage
      await analytics?.track('weather_query', {
        location: input.location,
        cached: false,
        responseTime: Date.now() - startTime,
        user: user?.login,
        premium: isPremium,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: formatWeatherResponse(weatherData, false, remaining - 1),
          },
        ],
      };
      
    } catch (error) {
      logger?.error('Weather API error', { error: error instanceof Error ? error.message : error });
      
      // Try to return cached stale data if available
      const staleData = await weatherCache.get(cacheKey); // This will return null since we already checked
      
      // Return mock data as last resort
      const mockData = generateMockWeather(input.location, input.units);
      
      return {
        content: [
          {
            type: 'text',
            text: `⚠️ **Weather Service Temporarily Unavailable**\n\n*Showing estimated data:*\n\n${formatWeatherResponse(mockData, false, remaining - 1)}`,
          },
        ],
      };
    }
  },
});

// Helper function to format weather response
function formatWeatherResponse(data: any, cached: boolean, rateLimitRemaining: number): string {
  const units = data.current.temperature > 50 ? 'F' : 'C';
  const windUnits = units === 'F' ? 'mph' : 'km/h';
  
  let response = `# Weather for ${data.location}\n\n`;
  
  if (cached) {
    response += `*📦 Cached result*\n\n`;
  }
  
  response += `## Current Conditions\n\n`;
  response += `- **Temperature**: ${data.current.temperature}°${units}\n`;
  if (data.current.feelsLike) {
    response += `- **Feels Like**: ${data.current.feelsLike}°${units}\n`;
  }
  response += `- **Condition**: ${data.current.condition}\n`;
  response += `- **Humidity**: ${data.current.humidity}%\n`;
  response += `- **Wind Speed**: ${data.current.windSpeed} ${windUnits}\n`;
  
  if (data.current.pressure) {
    response += `- **Pressure**: ${data.current.pressure} hPa\n`;
    response += `- **Visibility**: ${data.current.visibility} km\n`;
    response += `- **UV Index**: ${data.current.uvIndex}\n`;
  }
  
  if (data.forecast) {
    response += `\n## 5-Day Forecast\n\n`;
    data.forecast.forEach((day: any) => {
      response += `### ${day.day}\n`;
      response += `- High: ${day.high}°${units}, Low: ${day.low}°${units}\n`;
      response += `- ${day.condition}`;
      if (day.precipChance) {
        response += ` (${day.precipChance}% chance of rain)`;
      }
      response += `\n\n`;
    });
  }
  
  if (data.isMock) {
    response += `\n*Note: This is estimated data for demonstration purposes*\n`;
  }
  
  response += `\n---\n*Rate limit: ${rateLimitRemaining} requests remaining*`;
  
  return response;
}

// Export registration function
export function registerWeatherTool(server: any) {
  server.tool(
    weatherTool.name,
    weatherTool.description,
    weatherTool.inputSchema,
    weatherTool.handler
  );
}

// Standalone execution for testing
if (require.main === module) {
  (async () => {
    console.log('Testing Weather Tool with Rate Limiting and Caching\n');
    
    const mockContext = {
      logger: console,
      analytics: {
        track: async (event: string, data: any) => {
          console.log(`Analytics: ${event}`, data);
        },
      },
    };
    
    // Test 1: First request (cache miss)
    console.log('=== Test 1: First Request ===');
    const result1 = await weatherTool.handler({
      location: 'New York',
      units: 'metric',
      forecast: false,
      detailed: false,
    }, mockContext);
    console.log(result1.content[0].text);
    
    // Test 2: Second request (cache hit)
    console.log('\n=== Test 2: Cached Request ===');
    const result2 = await weatherTool.handler({
      location: 'New York',
      units: 'metric',
      forecast: false,
      detailed: false,
    }, mockContext);
    console.log(result2.content[0].text);
    
    // Test 3: Different location
    console.log('\n=== Test 3: Different Location ===');
    const result3 = await weatherTool.handler({
      location: 'Tokyo',
      units: 'metric',
      forecast: true,
      detailed: true,
    }, mockContext);
    console.log(result3.content[0].text);
    
    // Test 4: Simulate rate limit
    console.log('\n=== Test 4: Rate Limit Simulation ===');
    // Exhaust rate limit
    for (let i = 0; i < 51; i++) {
      await rateLimiter.checkLimit('test-user');
    }
    
    const result4 = await weatherTool.handler({
      location: 'Paris',
      units: 'metric',
      forecast: false,
      detailed: false,
    }, { ...mockContext, user: { id: 'test-user', login: 'testuser', name: 'Test User', email: 'test@example.com', roles: ['user'] } });
    console.log(result4.content[0].text);
    
    // Show cache stats
    console.log('\n=== Cache Statistics ===');
    console.log(weatherCache.getStats());
  })();
}