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
  createTimestamp
  // Removed isUUID as it's not used here directly
} from "./types";

// Legacy interface for backward compatibility, will be ScenarioConfig from types.ts
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
  private scenarios = new Map<UUID, any>(); // Consider using Scenario type from types.ts
  private aegntManager = new AegntManager();
  private readonly COMPONENT = 'ScenarioEngine';

  constructor(private db: Database) {
    logger.info(this.COMPONENT, 'ScenarioEngine initialized');
  }

  @monitored('ScenarioEngine', 'createScenario')
  async createScenario(config: LegacyScenarioConfig): Promise<Result<any>> { // Consider returning Result<Scenario>
    return withErrorHandling(this.COMPONENT, 'createScenario', async () => {
      // Validate input
      if (!config.name || !config.aegnts || config.aegnts.length === 0) {
        logger.warn(this.COMPONENT, 'Invalid scenario configuration attempt', config);
        throw new Error('Invalid scenario configuration: name and agents required');
      }

      const scenarioId = createUUID();
      const timestamp = createTimestamp();

      // Adapt LegacyScenarioConfig to Scenario (from types.ts) if possible, or use as is for MVP
      const scenario: any = { // Should ideally be of type Scenario
        id: scenarioId,
        // Assuming LegacyScenarioConfig maps to ScenarioConfig part of Scenario
        config: { // This structure might need to align with ScenarioConfig from types.ts
            name: config.name,
            description: config.description,
            // map other fields if ScenarioConfig has them e.g. category, difficulty
            aegnts: config.aegnts, // This part of config might need transformation if Agent type is different
            worldState: config.worldState,
            // Add other ScenarioConfig fields if necessary
        },
        state: "created" as ScenarioState,
        agents: config.aegnts.map(a => a.id as UUID), // Extracting agent IDs
        timeline: { // Initial timeline state
            currentTime: timestamp,
            activeBranch: createUUID(), // Needs a root branch ID
            availableBranches: [],
            eventCount: 0,
            lastEventId: '' as UUID, // or null
            branchingEnabled: true,
            maxBranches: 10 // Example value
        },
        metrics: { // Initial metrics
            engagement: 0, coherence: 0, conflictLevel: 0,
            emergentBehaviors: 0, userInterventions: 0,
            averageResponseTime: 0, totalInteractions: 0
        },
        createdAt: timestamp,
        updatedAt: timestamp // Initially same as createdAt
      };

      logger.info(this.COMPONENT, `Creating scenario: ${config.name}`, {
        scenarioId,
        agentCount: config.aegnts.length
      });

      // Save to database with transaction
      try {
        // Storing the full config as JSON, and other key fields separately
        this.db.run(`
          INSERT INTO scenarios (id, name, config, state, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          scenario.id,
          scenario.config.name, // Use name from the structured config
          JSON.stringify(scenario.config), // Store the new structured config
          scenario.state,
          scenario.createdAt,
          scenario.updatedAt
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

        return scenario; // Return the full scenario object
      } catch (dbError: any) {
        logger.error(this.COMPONENT, 'Database error during scenario creation', dbError, {
          scenarioId,
          name: config.name
        });
        throw new Error(`Failed to save scenario to database: ${dbError.message}`);
      }
    });
  }

  async startScenario(scenarioId: string) { // Should be UUID
    const scenario = this.scenarios.get(scenarioId as UUID);
    if (!scenario) {
        logger.warn(this.COMPONENT, 'Attempted to start non-existent scenario', { scenarioId });
        throw new Error("Scenario not found");
    }

    scenario.state = "running" as ScenarioState;
    scenario.startedAt = createTimestamp(); // Use typed timestamp
    scenario.updatedAt = scenario.startedAt;

    logger.info(this.COMPONENT, 'Scenario started', { scenarioId });

    this.runScenarioLoop(scenarioId as UUID);

    return scenario;
  }

  async pauseScenario(scenarioId: string) { // Should be UUID
    const scenario = this.scenarios.get(scenarioId as UUID);
    if (scenario) {
      scenario.state = "paused" as ScenarioState;
      scenario.pausedAt = createTimestamp(); // Use typed timestamp
      scenario.updatedAt = scenario.pausedAt;
      logger.info(this.COMPONENT, 'Scenario paused', { scenarioId });
    } else {
      logger.warn(this.COMPONENT, 'Attempted to pause non-existent scenario', { scenarioId });
    }
  }

  async resumeScenario(scenarioId: string) { // Should be UUID
    const scenario = this.scenarios.get(scenarioId as UUID);
    if (scenario && scenario.state === "paused") {
      scenario.state = "running" as ScenarioState;
      delete scenario.pausedAt;
      scenario.updatedAt = createTimestamp();
      logger.info(this.COMPONENT, 'Scenario resumed', { scenarioId });
      this.runScenarioLoop(scenarioId as UUID);
    } else {
      logger.warn(this.COMPONENT, 'Attempted to resume scenario not in paused state', { scenarioId, currentState: scenario?.state });
    }
  }

  private async runScenarioLoop(scenarioId: UUID) {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
        logger.error(this.COMPONENT, 'Scenario loop started for non-existent scenario', {scenarioId});
        return;
    }

    while (scenario && scenario.state === "running") {
      const aegnts = await this.aegntManager.getScenarioAegnts(scenarioId);

      if (aegnts.length === 0) {
          logger.warn(this.COMPONENT, 'No agents in scenario loop', {scenarioId});
          scenario.state = "paused"; // Pause if no agents
          break;
      }

      for (const aegnt of aegnts) {
        if (scenario.state !== "running") break;

        const action = await this.aegntManager.getAegntAction(aegnt.id, scenario);

        const eventId = createUUID();
        const eventTimestamp = createTimestamp();
        const event = {
          id: eventId,
          scenarioId,
          timestamp: eventTimestamp,
          aegntId: aegnt.id,
          eventType: "aegnt_action", // Should be EventType from types.ts
          data: action
        };

        scenario.events.push(event);
        scenario.timeline.lastEventId = eventId;
        scenario.timeline.eventCount = (scenario.timeline.eventCount || 0) + 1;
        scenario.updatedAt = eventTimestamp;

        // TODO: Persist event to DB

        this.broadcastEvent(event); // This should use a proper WebSocket manager
      }

      await Bun.sleep(100); // Consider making this configurable
    }
  }

  private broadcastEvent(event: any) { // Should be TimelineEvent
    // Placeholder for WebSocket broadcast logic
    logger.debug(this.COMPONENT, "Broadcasting event", event);
  }

  async listScenarios(): Promise<any[]> { // Should return Promise<Scenario[]>
    return withErrorHandling(this.COMPONENT, 'listScenarios', async () => {
        const query = this.db.query("SELECT id, name, state, created_at, updated_at FROM scenarios ORDER BY created_at DESC");
        const scenariosData = query.all() as any[]; // Cast for now
        logger.info(this.COMPONENT, `Listed ${scenariosData.length} scenarios`);
        return scenariosData;
    });
  }
}
