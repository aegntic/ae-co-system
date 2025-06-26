import { OpenAI } from "openai";

// Use OpenRouter for free models
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "dummy-key-for-mvp",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "AegntiX MVP"
  }
});

export interface Aegnt {
  id: string;
  scenarioId: string;
  role: string;
  personality: string;
  goals: string[];
  memory: any[];
  currentState: Record<string, any>;
}

export class AegntManager {
  private aegnts = new Map<string, Aegnt>();
  private contextInjections = new Map<string, any[]>();
  
  async createAegnt(config: any) {
    const aegnt: Aegnt = {
      id: config.id,
      scenarioId: config.scenarioId,
      role: config.role,
      personality: config.personality,
      goals: config.goals,
      memory: [],
      currentState: {}
    };
    
    this.aegnts.set(aegnt.id, aegnt);
    return aegnt;
  }
  
  async getAegntAction(aegntId: string, scenario: any) {
    const aegnt = this.aegnts.get(aegntId);
    if (!aegnt) return null;
    
    // Check for context injections
    const injections = this.contextInjections.get(aegntId) || [];
    
    // Build prompt with personality and current state
    const prompt = this.buildAegntPrompt(aegnt, scenario, injections);
    
    try {
      // Use a free model from OpenRouter
      const completion = await openai.chat.completions.create({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          { role: "system", content: aegnt.personality },
          { role: "user", content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      });
      
      const action = completion.choices[0]?.message?.content || "thinks quietly";
      
      // Update aegnt memory
      aegnt.memory.push({
        timestamp: Date.now(),
        action,
        context: scenario.currentTime
      });
      
      // Clear used injections
      this.contextInjections.delete(aegntId);
      
      return {
        aegntId,
        action,
        timestamp: Date.now()
      };
    } catch (error) {
      // Fallback for demo purposes
      return {
        aegntId,
        action: `${aegnt.role} considers the situation`,
        timestamp: Date.now()
      };
    }
  }
  
  private buildAegntPrompt(aegnt: Aegnt, scenario: any, injections: any[]) {
    let prompt = `You are ${aegnt.role} in a scenario: ${scenario.name}\\n`;
    prompt += `Your goals: ${aegnt.goals.join(", ")}\\n`;
    prompt += `Current situation: ${JSON.stringify(scenario.worldState)}\\n`;
    
    if (aegnt.memory.length > 0) {
      prompt += `Your recent actions: ${aegnt.memory.slice(-3).map(m => m.action).join("; ")}\\n`;
    }
    
    if (injections.length > 0) {
      prompt += `New information: ${injections.map(i => i.context).join("; ")}\\n`;
    }
    
    prompt += "What do you do next? (Respond in 1-2 sentences as your character)";
    
    return prompt;
  }
  
  async injectContext(aegntId: string, context: string) {
    const injections = this.contextInjections.get(aegntId) || [];
    injections.push({
      timestamp: Date.now(),
      context
    });
    this.contextInjections.set(aegntId, injections);
  }
  
  async getScenarioAegnts(scenarioId: string) {
    return Array.from(this.aegnts.values()).filter(a => a.scenarioId === scenarioId);
  }
}
