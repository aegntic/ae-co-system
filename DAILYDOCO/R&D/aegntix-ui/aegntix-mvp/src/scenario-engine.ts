import type { Database } from "bun:sqlite";
import { AegntManager } from "./aegnt-manager";
import { logger, monitored, withErrorHandling } from "./logger";
import { 
  type Scenario, 
  type ScenarioConfig, 
  type UUID, 
  type Timestamp,
  type ScenarioState,
  type Result,
  createUUID,
  createTimestamp,
  isUUID
} from "./types";

// Legacy interface for backward compatibility
export interface LegacyScenarioConfig {
  name: string;
  description: string;
  aegnts: Array<{
    id: string;
    role: string;
    personality: string;
    goals: string[];
  }>;
  worldState: Record<string, any>;
}

export class ScenarioEngine {
  private scenarios = new Map<UUID, any>();
  private aegntManager = new AegntManager();
  private readonly COMPONENT = 'ScenarioEngine';
  
  constructor(private db: Database) {
    logger.info(this.COMPONENT, 'ScenarioEngine initialized');
  }
  
  @monitored('ScenarioEngine', 'createScenario')
  async createScenario(config: LegacyScenarioConfig): Promise<Result<any>> {
    return withErrorHandling(this.COMPONENT, 'createScenario', async () => {
      // Validate input
      if (!config.name || !config.aegnts || config.aegnts.length === 0) {
        throw new Error('Invalid scenario configuration: name and agents required');
      }

      const scenarioId = createUUID();
      const timestamp = createTimestamp();
      
      const scenario = {
        id: scenarioId,
        ...config,
        state: "created" as ScenarioState,
        currentTime: timestamp,
        events: [],
        branches: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      logger.info(this.COMPONENT, `Creating scenario: ${config.name}`, {
        scenarioId,
        agentCount: config.aegnts.length
      });
      
      // Save to database with transaction
      try {
        this.db.run(`
          INSERT INTO scenarios (id, name, config, state, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          scenario.id,
          config.name,
          JSON.stringify(config),
          scenario.state,
          timestamp,
          timestamp
        ]);
        
        // Initialize agents
        for (const aegntConfig of config.aegnts) {
          const agentResult = await this.aegntManager.createAegnt({
            ...aegntConfig,
            scenarioId: scenario.id
          });
          
          if (!agentResult) {
            logger.warn(this.COMPONENT, `Failed to create agent: ${aegntConfig.id}`, {
              scenarioId,
              agentId: aegntConfig.id
            });
          }
        }
        
        this.scenarios.set(scenarioId, scenario);
        
        logger.info(this.COMPONENT, `Scenario created successfully`, {
          scenarioId,
          name: config.name,
          agentCount: config.aegnts.length
        });
        
        return scenario;
      } catch (dbError) {
        logger.error(this.COMPONENT, 'Database error during scenario creation', dbError, {
          scenarioId,
          name: config.name
        });
        throw new Error(`Failed to save scenario to database: ${dbError}`);
      }
    });
  }
  
  async startScenario(scenarioId: string) {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) throw new Error("Scenario not found");
    
    scenario.state = "running";
    scenario.startTime = Date.now();
    
    // Start aegnt loops
    this.runScenarioLoop(scenarioId);
    
    return scenario;
  }
  
  async pauseScenario(scenarioId: string) {
    const scenario = this.scenarios.get(scenarioId);
    if (scenario) {
      scenario.state = "paused";
      scenario.pausedAt = Date.now();
    }
  }
  
  async resumeScenario(scenarioId: string) {
    const scenario = this.scenarios.get(scenarioId);
    if (scenario && scenario.state === "paused") {
      scenario.state = "running";
      delete scenario.pausedAt;
      this.runScenarioLoop(scenarioId);
    }
  }
  
  private async runScenarioLoop(scenarioId: string) {
    const scenario = this.scenarios.get(scenarioId);
    
    while (scenario && scenario.state === "running") {
      // Get all aegnts in scenario
      const aegnts = await this.aegntManager.getScenarioAegnts(scenarioId);
      
      // Each aegnt takes a turn
      for (const aegnt of aegnts) {
        if (scenario.state !== "running") break;
        
        const action = await this.aegntManager.getAegntAction(aegnt.id, scenario);
        
        // Record the action in timeline
        const event = {
          id: crypto.randomUUID(),
          scenarioId,
          timestamp: Date.now(),
          aegntId: aegnt.id,
          eventType: "aegnt_action",
          data: action
        };
        
        scenario.events.push(event);
        
        // Broadcast to clients
        this.broadcastEvent(event);
      }
      
      // Small delay between rounds
      await Bun.sleep(100);
    }
  }
  
  private broadcastEvent(event: any) {
    // This would connect to the WebSocket broadcast system
    console.log("📡 Event:", event);
  }
  
  async listScenarios() {
    const query = this.db.query("SELECT * FROM scenarios ORDER BY created_at DESC");
    return query.all();
  }
}
