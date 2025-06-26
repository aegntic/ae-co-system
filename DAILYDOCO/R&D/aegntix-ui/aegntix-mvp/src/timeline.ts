import type { Database } from "bun:sqlite";

export interface TimelineEvent {
  id: string;
  scenarioId: string;
  timestamp: number;
  aegntId?: string;
  eventType: string;
  data: any;
  branchId?: string;
}

export interface Branch {
  id: string;
  scenarioId: string;
  parentBranchId?: string;
  branchPoint: number;
  name: string;
  createdAt: number;
}

export class Timeline {
  private branches = new Map<string, Branch>();
  
  constructor(private db: Database) {}
  
  async createBranch(scenarioId: string, branchPoint: number) {
    const branch: Branch = {
      id: crypto.randomUUID(),
      scenarioId,
      branchPoint,
      name: `Branch at ${new Date(branchPoint).toLocaleTimeString()}`,
      createdAt: Date.now()
    };
    
    // Copy all events up to branch point
    const events = this.db.query(`
      SELECT * FROM timeline_events 
      WHERE scenario_id = ? AND timestamp <= ?
      ORDER BY timestamp
    `).all(scenarioId, branchPoint);
    
    // Create new branch with copied events
    for (const event of events) {
      this.db.run(`
        INSERT INTO timeline_events 
        (id, scenario_id, timestamp, aegnt_id, event_type, data, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        scenarioId,
        event.timestamp,
        event.aegnt_id,
        event.event_type,
        event.data,
        branch.id
      ]);
    }
    
    this.branches.set(branch.id, branch);
    return branch;
  }
  
  async getTimeline(scenarioId: string, branchId?: string) {
    const query = branchId
      ? "SELECT * FROM timeline_events WHERE scenario_id = ? AND branch_id = ? ORDER BY timestamp"
      : "SELECT * FROM timeline_events WHERE scenario_id = ? AND branch_id IS NULL ORDER BY timestamp";
    
    const params = branchId ? [scenarioId, branchId] : [scenarioId];
    return this.db.query(query).all(...params);
  }
  
  async recordEvent(event: TimelineEvent) {
    this.db.run(`
      INSERT INTO timeline_events 
      (id, scenario_id, timestamp, aegnt_id, event_type, data, branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      event.id,
      event.scenarioId,
      event.timestamp,
      event.aegntId || null,
      event.eventType,
      JSON.stringify(event.data),
      event.branchId || null
    ]);
  }
}
