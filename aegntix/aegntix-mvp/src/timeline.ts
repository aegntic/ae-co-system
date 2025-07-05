import type { Database } from "bun:sqlite";
import { logger } from "./logger"; // Assuming logger.ts is in the same directory
import {
    type TimelineEvent,
    type Branch,
    type UUID,
    type Timestamp,
    createUUID,
    createTimestamp
} from "./types"; // Assuming types.ts is in the same directory

export class Timeline {
  private branches = new Map<UUID, Branch>();
  private readonly COMPONENT = "Timeline";

  constructor(private db: Database) {
    logger.info(this.COMPONENT, "Timeline system initialized.");
  }

  async createBranch(scenarioId: UUID, branchPoint: Timestamp, parentBranchId?: UUID): Promise<Branch | null> {
    const branchId = createUUID();
    const createdAt = createTimestamp();
    const branch: Branch = {
      id: branchId,
      scenarioId,
      parentBranchId: parentBranchId || undefined, // Ensure it's undefined if not provided
      branchPoint,
      name: `Branch @ ${new Date(branchPoint).toLocaleTimeString()}`, // More descriptive name
      description: `Branched from ${parentBranchId || 'main'} at ${branchPoint}`,
      createdAt,
      isActive: true, // New branches are active by default
      divergenceScore: 0 // Initial divergence is 0
    };

    logger.info(this.COMPONENT, "Attempting to create timeline branch", { scenarioId, branchPoint, parentBranchId });

    try {
      // Copy all events up to branch point from the parent/main timeline
      const sourceBranchCondition = parentBranchId ? "branch_id = ?" : "branch_id IS NULL";
      const sourceBranchParams = parentBranchId ? [scenarioId, branchPoint, parentBranchId] : [scenarioId, branchPoint];

      const eventsToCopyQuery = `
        SELECT * FROM timeline_events
        WHERE scenario_id = ? AND timestamp <= ? AND ${sourceBranchCondition}
        ORDER BY timestamp, sequence_number`; // Added sequence_number for ordering

      const eventsToCopy: TimelineEvent[] = this.db.query<TimelineEvent, any[]>(eventsToCopyQuery)
        .all(...sourceBranchParams) as TimelineEvent[];

      logger.debug(this.COMPONENT, `Found ${eventsToCopy.length} events to copy for new branch`, { branchId, scenarioId });

      // Use a transaction for atomicity
      const transaction = this.db.transaction(() => {
        for (const event of eventsToCopy) {
          this.db.run(`
            INSERT INTO timeline_events
            (id, scenario_id, timestamp, aegnt_id, event_type, data, branch_id, sequence_number, caused_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            createUUID(), // New ID for the copied event in the new branch
            event.scenarioId,
            event.timestamp,
            event.aegntId,
            event.eventType,
            typeof event.data === 'string' ? event.data : JSON.stringify(event.data),
            branch.id, // Assign to new branch
            event.sequenceNumber,
            event.causedBy
          ]);
        }
      });

      transaction(); // Execute transaction

      this.branches.set(branch.id, branch);
      logger.info(this.COMPONENT, "Timeline branch created successfully", { branchId, scenarioId, copiedEvents: eventsToCopy.length });
      return branch;

    } catch (error: any) {
      logger.error(this.COMPONENT, "Failed to create timeline branch", { scenarioId, error: error.message });
      return null;
    }
  }

  async getTimeline(scenarioId: UUID, branchId?: UUID): Promise<TimelineEvent[]> {
    logger.debug(this.COMPONENT, "Fetching timeline events", { scenarioId, branchId });
    try {
      const query = branchId
        ? "SELECT * FROM timeline_events WHERE scenario_id = ? AND branch_id = ? ORDER BY timestamp, sequence_number"
        : "SELECT * FROM timeline_events WHERE scenario_id = ? AND branch_id IS NULL ORDER BY timestamp, sequence_number";

      const params = branchId ? [scenarioId, branchId] : [scenarioId];
      const events = this.db.query<TimelineEvent, any[]>(query).all(...params) as TimelineEvent[];
      logger.info(this.COMPONENT, `Fetched ${events.length} events for timeline`, { scenarioId, branchId });
      return events;
    } catch (error: any) {
      logger.error(this.COMPONENT, "Failed to fetch timeline events", { scenarioId, branchId, error: error.message });
      return [];
    }
  }

  async recordEvent(event: Omit<TimelineEvent, 'id' | 'timestamp' | 'sequenceNumber'> & { timestamp?: Timestamp, sequenceNumber?: number }): Promise<TimelineEvent | null> {
    const eventId = createUUID();
    const eventTimestamp = event.timestamp || createTimestamp();
    // Sequence number might need to be managed more robustly, e.g., by querying max for current timestamp/branch
    const sequenceNumber = event.sequenceNumber || await this.getNextSequenceNumber(event.scenarioId, eventTimestamp, event.branchId);

    const fullEvent: TimelineEvent = {
        id: eventId,
        timestamp: eventTimestamp,
        sequenceNumber,
        ...event
    };

    logger.debug(this.COMPONENT, "Recording timeline event", { eventType: event.eventType, scenarioId: event.scenarioId, agentId: event.aegntId });
    try {
      this.db.run(`
        INSERT INTO timeline_events
        (id, scenario_id, timestamp, aegnt_id, event_type, data, branch_id, sequence_number, caused_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        fullEvent.id,
        fullEvent.scenarioId,
        fullEvent.timestamp,
        fullEvent.aegntId || null,
        fullEvent.eventType,
        JSON.stringify(fullEvent.data), // Ensure data is stringified
        fullEvent.branchId || null,
        fullEvent.sequenceNumber,
        fullEvent.causedBy || null
      ]);
      logger.info(this.COMPONENT, "Timeline event recorded", { eventId, eventType: fullEvent.eventType });
      return fullEvent;
    } catch (error: any) {
      logger.error(this.COMPONENT, "Failed to record timeline event", { eventType: event.eventType, error: error.message });
      return null;
    }
  }

  private async getNextSequenceNumber(scenarioId: UUID, timestamp: Timestamp, branchId?: UUID): Promise<number> {
    // This is a simplified approach. For high concurrency, this might need adjustment or a DB sequence.
    const query = branchId
      ? "SELECT MAX(sequence_number) as max_seq FROM timeline_events WHERE scenario_id = ? AND timestamp = ? AND branch_id = ?"
      : "SELECT MAX(sequence_number) as max_seq FROM timeline_events WHERE scenario_id = ? AND timestamp = ? AND branch_id IS NULL";

    const params = branchId ? [scenarioId, timestamp, branchId] : [scenarioId, timestamp];

    try {
      const result = this.db.query<{max_seq: number | null}, any[]>(query).get(...params);
      return (result?.max_seq ?? -1) + 1;
    } catch (error: any) {
      logger.warn(this.COMPONENT, "Could not get max sequence number, defaulting to 0.", { error: error.message });
      return 0;
    }
  }

  getBranch(branchId: UUID): Branch | undefined {
    return this.branches.get(branchId);
  }

  listBranches(scenarioId: UUID): Branch[] {
    return Array.from(this.branches.values()).filter(b => b.scenarioId === scenarioId);
  }
}
