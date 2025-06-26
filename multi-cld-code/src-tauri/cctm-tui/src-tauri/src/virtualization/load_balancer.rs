use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use anyhow::{Result, Error};
use uuid::Uuid;

/// Load balancing strategies for terminal assignment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LoadBalancingStrategy {
    /// Assign to terminal with lowest resource usage
    ResourceBased,
    /// Round-robin assignment
    RoundRobin,
    /// Assign to least recently used terminal
    LeastRecentlyUsed,
    /// Assign based on project type affinity
    ProjectAffinity,
    /// Intelligent assignment using multiple factors
    Intelligent,
}

impl Default for LoadBalancingStrategy {
    fn default() -> Self {
        LoadBalancingStrategy::ResourceBased
    }
}

/// Terminal assignment candidate with scoring
#[derive(Debug, Clone)]
pub struct TerminalCandidate {
    pub terminal_id: String,
    pub resource_score: f64,    // 0.0 (high usage) to 1.0 (low usage)
    pub affinity_score: f64,    // 0.0 (no affinity) to 1.0 (perfect match)
    pub availability_score: f64, // 0.0 (busy) to 1.0 (idle)
    pub overall_score: f64,     // Weighted combination
}

/// Load balancer context for decision making
#[derive(Debug)]
pub struct LoadBalancingContext {
    pub working_dir: std::path::PathBuf,
    pub project_type: Option<String>,
    pub user_id: Option<String>,
    pub session_preferences: HashMap<String, String>,
    pub priority: AssignmentPriority,
}

#[derive(Debug, Clone)]
pub enum AssignmentPriority {
    Low,     // Can wait for optimal assignment
    Normal,  // Standard assignment
    High,    // Need immediate assignment
    Critical, // Must assign even if suboptimal
}

/// Load Balancer - Optimizes terminal assignment decisions
#[derive(Debug, Clone)]
pub struct LoadBalancer {
    strategy: LoadBalancingStrategy,
    assignment_history: std::sync::Arc<std::sync::RwLock<Vec<AssignmentRecord>>>,
    affinity_rules: std::sync::Arc<std::sync::RwLock<HashMap<String, AffinityRule>>>,
}

#[derive(Debug, Clone)]
struct AssignmentRecord {
    terminal_id: String,
    working_dir: std::path::PathBuf,
    project_type: Option<String>,
    assigned_at: chrono::DateTime<chrono::Utc>,
    performance_score: f64, // How well this assignment worked out
}

#[derive(Debug, Clone)]
struct AffinityRule {
    project_pattern: String,
    preferred_terminals: Vec<String>,
    weight: f64,
}

impl LoadBalancer {
    pub fn new(strategy: LoadBalancingStrategy) -> Result<Self> {
        Ok(LoadBalancer {
            strategy,
            assignment_history: std::sync::Arc::new(std::sync::RwLock::new(Vec::new())),
            affinity_rules: std::sync::Arc::new(std::sync::RwLock::new(HashMap::new())),
        })
    }

    /// Find the best terminal for assignment based on context and available candidates
    pub async fn select_terminal(
        &self,
        candidates: Vec<TerminalCandidate>,
        context: &LoadBalancingContext,
    ) -> Result<Option<String>> {
        if candidates.is_empty() {
            return Ok(None);
        }

        let best_candidate = match self.strategy {
            LoadBalancingStrategy::ResourceBased => {
                self.select_by_resources(&candidates, context).await?
            }
            LoadBalancingStrategy::RoundRobin => {
                self.select_by_round_robin(&candidates, context).await?
            }
            LoadBalancingStrategy::LeastRecentlyUsed => {
                self.select_by_lru(&candidates, context).await?
            }
            LoadBalancingStrategy::ProjectAffinity => {
                self.select_by_affinity(&candidates, context).await?
            }
            LoadBalancingStrategy::Intelligent => {
                self.select_intelligently(&candidates, context).await?
            }
        };

        if let Some(candidate) = best_candidate {
            // Record the assignment for learning
            self.record_assignment(&candidate.terminal_id, context).await;
            Ok(Some(candidate.terminal_id))
        } else {
            Ok(None)
        }
    }

    /// Update performance feedback for learning
    pub async fn record_performance_feedback(
        &self,
        terminal_id: &str,
        performance_score: f64,
    ) -> Result<()> {
        let mut history = self.assignment_history.write().unwrap();
        
        // Find the most recent assignment for this terminal and update its score
        for record in history.iter_mut().rev() {
            if record.terminal_id == terminal_id {
                record.performance_score = performance_score;
                break;
            }
        }

        // Use feedback to adjust affinity rules (simplified learning)
        if performance_score > 0.8 {
            // Good assignment - reinforce affinity
            self.reinforce_affinity(terminal_id).await;
        } else if performance_score < 0.3 {
            // Poor assignment - reduce affinity
            self.reduce_affinity(terminal_id).await;
        }

        Ok(())
    }

    /// Get load balancing statistics and insights
    pub async fn get_statistics(&self) -> LoadBalancingStats {
        let history = self.assignment_history.read().unwrap();
        let affinity_rules = self.affinity_rules.read().unwrap();

        let total_assignments = history.len();
        let avg_performance = if total_assignments > 0 {
            history.iter().map(|r| r.performance_score).sum::<f64>() / total_assignments as f64
        } else {
            0.0
        };

        let strategy_effectiveness = self.calculate_strategy_effectiveness(&history);

        LoadBalancingStats {
            strategy: self.strategy.clone(),
            total_assignments,
            average_performance: avg_performance,
            strategy_effectiveness,
            active_affinity_rules: affinity_rules.len(),
            last_updated: chrono::Utc::now(),
        }
    }

    // Strategy implementations

    async fn select_by_resources(
        &self,
        candidates: &[TerminalCandidate],
        _context: &LoadBalancingContext,
    ) -> Result<Option<TerminalCandidate>> {
        // Select terminal with highest resource score (lowest usage)
        let best = candidates
            .iter()
            .max_by(|a, b| a.resource_score.partial_cmp(&b.resource_score).unwrap());

        Ok(best.cloned())
    }

    async fn select_by_round_robin(
        &self,
        candidates: &[TerminalCandidate],
        _context: &LoadBalancingContext,
    ) -> Result<Option<TerminalCandidate>> {
        let history = self.assignment_history.read().unwrap();
        
        // Find the terminal that was assigned least recently
        let mut candidate_scores: Vec<(usize, &TerminalCandidate)> = candidates
            .iter()
            .enumerate()
            .collect();

        candidate_scores.sort_by_key(|(_, candidate)| {
            // Find the last assignment time for this terminal
            history
                .iter()
                .rev()
                .find(|record| record.terminal_id == candidate.terminal_id)
                .map(|record| record.assigned_at)
                .unwrap_or_else(|| chrono::DateTime::from_timestamp(0, 0).unwrap())
        });

        Ok(candidate_scores.first().map(|(_, candidate)| (*candidate).clone()))
    }

    async fn select_by_lru(
        &self,
        candidates: &[TerminalCandidate],
        _context: &LoadBalancingContext,
    ) -> Result<Option<TerminalCandidate>> {
        // Similar to round robin but considers usage patterns
        self.select_by_round_robin(candidates, _context).await
    }

    async fn select_by_affinity(
        &self,
        candidates: &[TerminalCandidate],
        context: &LoadBalancingContext,
    ) -> Result<Option<TerminalCandidate>> {
        let affinity_rules = self.affinity_rules.read().unwrap();
        
        // Find candidates with affinity for this project type
        let mut scored_candidates: Vec<TerminalCandidate> = candidates.to_vec();
        
        for candidate in &mut scored_candidates {
            candidate.affinity_score = self.calculate_affinity_score(
                &candidate.terminal_id,
                context,
                &affinity_rules,
            );
        }

        // Select candidate with highest affinity score
        let best = scored_candidates
            .iter()
            .max_by(|a, b| a.affinity_score.partial_cmp(&b.affinity_score).unwrap());

        Ok(best.cloned())
    }

    async fn select_intelligently(
        &self,
        candidates: &[TerminalCandidate],
        context: &LoadBalancingContext,
    ) -> Result<Option<TerminalCandidate>> {
        let mut scored_candidates: Vec<TerminalCandidate> = candidates.to_vec();
        
        // Calculate overall scores using weighted combination
        for candidate in &mut scored_candidates {
            let affinity_rules = self.affinity_rules.read().unwrap();
            
            candidate.affinity_score = self.calculate_affinity_score(
                &candidate.terminal_id,
                context,
                &affinity_rules,
            );

            // Weighted combination based on priority and context
            candidate.overall_score = match context.priority {
                AssignmentPriority::Critical => {
                    // Just pick the first available
                    candidate.availability_score
                }
                AssignmentPriority::High => {
                    // Prioritize availability, then resources
                    candidate.availability_score * 0.7 + candidate.resource_score * 0.3
                }
                AssignmentPriority::Normal => {
                    // Balanced approach
                    candidate.resource_score * 0.4 
                        + candidate.affinity_score * 0.4 
                        + candidate.availability_score * 0.2
                }
                AssignmentPriority::Low => {
                    // Optimize for best match, can wait
                    candidate.affinity_score * 0.6 
                        + candidate.resource_score * 0.3 
                        + candidate.availability_score * 0.1
                }
            };
        }

        // Select candidate with highest overall score
        let best = scored_candidates
            .iter()
            .max_by(|a, b| a.overall_score.partial_cmp(&b.overall_score).unwrap());

        Ok(best.cloned())
    }

    // Helper methods

    async fn record_assignment(&self, terminal_id: &str, context: &LoadBalancingContext) {
        let record = AssignmentRecord {
            terminal_id: terminal_id.to_string(),
            working_dir: context.working_dir.clone(),
            project_type: context.project_type.clone(),
            assigned_at: chrono::Utc::now(),
            performance_score: 0.5, // Default score, will be updated with feedback
        };

        let mut history = self.assignment_history.write().unwrap();
        history.push(record);

        // Keep history manageable
        if history.len() > 1000 {
            history.drain(0..500);
        }
    }

    async fn reinforce_affinity(&self, terminal_id: &str) {
        // Simplified affinity learning - in real implementation would be more sophisticated
        log::info!("Reinforcing positive affinity for terminal {}", terminal_id);
    }

    async fn reduce_affinity(&self, terminal_id: &str) {
        // Simplified affinity learning
        log::info!("Reducing affinity for terminal {}", terminal_id);
    }

    fn calculate_affinity_score(
        &self,
        terminal_id: &str,
        context: &LoadBalancingContext,
        affinity_rules: &HashMap<String, AffinityRule>,
    ) -> f64 {
        // Check if any affinity rules match this context
        for rule in affinity_rules.values() {
            if let Some(project_type) = &context.project_type {
                if rule.project_pattern == *project_type {
                    if rule.preferred_terminals.contains(&terminal_id.to_string()) {
                        return rule.weight;
                    }
                }
            }
        }

        // Default affinity score
        0.5
    }

    fn calculate_strategy_effectiveness(&self, history: &[AssignmentRecord]) -> f64 {
        if history.is_empty() {
            return 0.5;
        }

        // Calculate how well the current strategy is performing
        let recent_assignments = history.iter().rev().take(50);
        let avg_performance: f64 = recent_assignments
            .map(|r| r.performance_score)
            .sum::<f64>() / (50.0_f64).min(history.len() as f64);

        avg_performance
    }
}

#[derive(Debug, Serialize)]
pub struct LoadBalancingStats {
    pub strategy: LoadBalancingStrategy,
    pub total_assignments: usize,
    pub average_performance: f64,
    pub strategy_effectiveness: f64,
    pub active_affinity_rules: usize,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[tokio::test]
    async fn test_load_balancer_creation() {
        let balancer = LoadBalancer::new(LoadBalancingStrategy::ResourceBased).unwrap();
        let stats = balancer.get_statistics().await;
        assert_eq!(stats.total_assignments, 0);
    }

    #[tokio::test]
    async fn test_resource_based_selection() {
        let balancer = LoadBalancer::new(LoadBalancingStrategy::ResourceBased).unwrap();
        
        let candidates = vec![
            TerminalCandidate {
                terminal_id: "terminal-1".to_string(),
                resource_score: 0.3,
                affinity_score: 0.5,
                availability_score: 0.8,
                overall_score: 0.0,
            },
            TerminalCandidate {
                terminal_id: "terminal-2".to_string(),
                resource_score: 0.9, // Highest resource score
                affinity_score: 0.2,
                availability_score: 0.6,
                overall_score: 0.0,
            },
        ];

        let context = LoadBalancingContext {
            working_dir: PathBuf::from("/test"),
            project_type: Some("rust".to_string()),
            user_id: None,
            session_preferences: HashMap::new(),
            priority: AssignmentPriority::Normal,
        };

        let selected = balancer.select_terminal(candidates, &context).await.unwrap();
        assert_eq!(selected, Some("terminal-2".to_string()));
    }

    #[tokio::test]
    async fn test_intelligent_selection() {
        let balancer = LoadBalancer::new(LoadBalancingStrategy::Intelligent).unwrap();
        
        let candidates = vec![
            TerminalCandidate {
                terminal_id: "terminal-1".to_string(),
                resource_score: 0.5,
                affinity_score: 0.9, // High affinity
                availability_score: 0.7,
                overall_score: 0.0,
            },
            TerminalCandidate {
                terminal_id: "terminal-2".to_string(),
                resource_score: 0.9,
                affinity_score: 0.1, // Low affinity
                availability_score: 0.8,
                overall_score: 0.0,
            },
        ];

        let context = LoadBalancingContext {
            working_dir: PathBuf::from("/test"),
            project_type: Some("rust".to_string()),
            user_id: None,
            session_preferences: HashMap::new(),
            priority: AssignmentPriority::Normal,
        };

        let selected = balancer.select_terminal(candidates, &context).await.unwrap();
        // Should select terminal-1 due to higher affinity in balanced scoring
        assert_eq!(selected, Some("terminal-1".to_string()));
    }
}