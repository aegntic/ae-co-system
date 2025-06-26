"""Graphitti Scheduler - Automated snapshot, backup, and maintenance system."""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, time
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
import structlog

from graph.graphitti import Graphitti, SnapshotType

logger = structlog.get_logger()


class GraphittiScheduler:
    """Automated scheduler for Graphitti maintenance tasks."""
    
    def __init__(self, graphitti: Graphitti, config: Optional[Dict[str, Any]] = None):
        self.graphitti = graphitti
        self.config = config or self._get_default_config()
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
        
        logger.info("Graphitti scheduler initialized", config=self.config)
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration for automated tasks."""
        return {
            # Snapshot schedules
            "daily_snapshot": {
                "enabled": True,
                "time": "02:00",  # 2 AM daily
                "retention_days": 30
            },
            "weekly_snapshot": {
                "enabled": True,
                "day_of_week": "sunday",
                "time": "01:00",  # 1 AM on Sundays
                "retention_weeks": 12
            },
            "incremental_snapshot": {
                "enabled": True,
                "interval_hours": 6,  # Every 6 hours
                "retention_days": 7
            },
            
            # Health monitoring
            "health_check": {
                "enabled": True,
                "interval_minutes": 30,
                "alert_threshold": 0.5  # Alert if health score below 50%
            },
            
            # Maintenance tasks
            "maintenance": {
                "enabled": True,
                "vacuum_schedule": "03:00",  # 3 AM daily
                "cleanup_old_changes": {
                    "enabled": True,
                    "retention_days": 90
                },
                "refresh_materialized_views": {
                    "enabled": True,
                    "interval_hours": 1
                }
            },
            
            # Performance optimization
            "optimization": {
                "enabled": True,
                "reindex_schedule": "04:00",  # 4 AM daily
                "analyze_schedule": "05:00"   # 5 AM daily
            },
            
            # Automated iteration creation
            "auto_iteration": {
                "enabled": False,  # Disabled by default
                "change_threshold": 1000,  # Create iteration after 1000 changes
                "time_threshold_days": 7,  # Or after 7 days
                "stability_threshold": 0.8  # Only if stability is good
            }
        }
    
    async def start(self):
        """Start the automated scheduler."""
        if self.is_running:
            logger.warning("Graphitti scheduler already running")
            return
        
        logger.info("Starting Graphitti scheduler")
        
        # Schedule snapshot tasks
        await self._schedule_snapshot_tasks()
        
        # Schedule maintenance tasks
        await self._schedule_maintenance_tasks()
        
        # Schedule health monitoring
        await self._schedule_health_monitoring()
        
        # Schedule optimization tasks
        await self._schedule_optimization_tasks()
        
        # Schedule automated iteration creation
        await self._schedule_auto_iteration()
        
        # Start the scheduler
        self.scheduler.start()
        self.is_running = True
        
        logger.info("Graphitti scheduler started successfully")
    
    async def stop(self):
        """Stop the automated scheduler."""
        if not self.is_running:
            return
        
        logger.info("Stopping Graphitti scheduler")
        
        self.scheduler.shutdown(wait=True)
        self.is_running = False
        
        logger.info("Graphitti scheduler stopped")
    
    async def _schedule_snapshot_tasks(self):
        """Schedule automated snapshot creation."""
        
        # Daily snapshots
        if self.config["daily_snapshot"]["enabled"]:
            time_str = self.config["daily_snapshot"]["time"]
            hour, minute = map(int, time_str.split(":"))
            
            self.scheduler.add_job(
                self._create_daily_snapshot,
                CronTrigger(hour=hour, minute=minute),
                id="daily_snapshot",
                name="Daily Knowledge Graph Snapshot",
                max_instances=1,
                coalesce=True
            )
            logger.info(f"Scheduled daily snapshots at {time_str}")
        
        # Weekly snapshots
        if self.config["weekly_snapshot"]["enabled"]:
            day_map = {
                "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
                "friday": 4, "saturday": 5, "sunday": 6
            }
            day_of_week = day_map[self.config["weekly_snapshot"]["day_of_week"].lower()]
            time_str = self.config["weekly_snapshot"]["time"]
            hour, minute = map(int, time_str.split(":"))
            
            self.scheduler.add_job(
                self._create_weekly_snapshot,
                CronTrigger(day_of_week=day_of_week, hour=hour, minute=minute),
                id="weekly_snapshot",
                name="Weekly Knowledge Graph Snapshot",
                max_instances=1,
                coalesce=True
            )
            logger.info(f"Scheduled weekly snapshots on {self.config['weekly_snapshot']['day_of_week']} at {time_str}")
        
        # Incremental snapshots
        if self.config["incremental_snapshot"]["enabled"]:
            interval_hours = self.config["incremental_snapshot"]["interval_hours"]
            
            self.scheduler.add_job(
                self._create_incremental_snapshot,
                IntervalTrigger(hours=interval_hours),
                id="incremental_snapshot",
                name="Incremental Knowledge Graph Snapshot",
                max_instances=1,
                coalesce=True
            )
            logger.info(f"Scheduled incremental snapshots every {interval_hours} hours")
    
    async def _schedule_maintenance_tasks(self):
        """Schedule maintenance tasks."""
        
        if not self.config["maintenance"]["enabled"]:
            return
        
        # Database vacuum
        vacuum_time = self.config["maintenance"]["vacuum_schedule"]
        hour, minute = map(int, vacuum_time.split(":"))
        
        self.scheduler.add_job(
            self._vacuum_database,
            CronTrigger(hour=hour, minute=minute),
            id="vacuum_database",
            name="Database Vacuum and Maintenance",
            max_instances=1,
            coalesce=True
        )
        logger.info(f"Scheduled database vacuum at {vacuum_time}")
        
        # Cleanup old changes
        if self.config["maintenance"]["cleanup_old_changes"]["enabled"]:
            self.scheduler.add_job(
                self._cleanup_old_changes,
                CronTrigger(hour=hour + 1, minute=minute),  # 1 hour after vacuum
                id="cleanup_old_changes",
                name="Cleanup Old Changes",
                max_instances=1,
                coalesce=True
            )
            logger.info("Scheduled cleanup of old changes")
        
        # Refresh materialized views
        if self.config["maintenance"]["refresh_materialized_views"]["enabled"]:
            interval_hours = self.config["maintenance"]["refresh_materialized_views"]["interval_hours"]
            
            self.scheduler.add_job(
                self._refresh_materialized_views,
                IntervalTrigger(hours=interval_hours),
                id="refresh_views",
                name="Refresh Materialized Views",
                max_instances=1,
                coalesce=True
            )
            logger.info(f"Scheduled materialized view refresh every {interval_hours} hours")
    
    async def _schedule_health_monitoring(self):
        """Schedule health monitoring tasks."""
        
        if not self.config["health_check"]["enabled"]:
            return
        
        interval_minutes = self.config["health_check"]["interval_minutes"]
        
        self.scheduler.add_job(
            self._health_check,
            IntervalTrigger(minutes=interval_minutes),
            id="health_check",
            name="Graph Health Monitoring",
            max_instances=1,
            coalesce=True
        )
        logger.info(f"Scheduled health checks every {interval_minutes} minutes")
    
    async def _schedule_optimization_tasks(self):
        """Schedule performance optimization tasks."""
        
        if not self.config["optimization"]["enabled"]:
            return
        
        # Reindex schedule
        reindex_time = self.config["optimization"]["reindex_schedule"]
        hour, minute = map(int, reindex_time.split(":"))
        
        self.scheduler.add_job(
            self._reindex_database,
            CronTrigger(hour=hour, minute=minute),
            id="reindex_database",
            name="Database Reindexing",
            max_instances=1,
            coalesce=True
        )
        logger.info(f"Scheduled database reindexing at {reindex_time}")
        
        # Analyze schedule
        analyze_time = self.config["optimization"]["analyze_schedule"]
        hour, minute = map(int, analyze_time.split(":"))
        
        self.scheduler.add_job(
            self._analyze_database,
            CronTrigger(hour=hour, minute=minute),
            id="analyze_database",
            name="Database Statistics Analysis",
            max_instances=1,
            coalesce=True
        )
        logger.info(f"Scheduled database analysis at {analyze_time}")
    
    async def _schedule_auto_iteration(self):
        """Schedule automated iteration creation."""
        
        if not self.config["auto_iteration"]["enabled"]:
            return
        
        # Check for auto-iteration criteria every hour
        self.scheduler.add_job(
            self._check_auto_iteration,
            IntervalTrigger(hours=1),
            id="auto_iteration_check",
            name="Auto-Iteration Check",
            max_instances=1,
            coalesce=True
        )
        logger.info("Scheduled auto-iteration checks")
    
    # Snapshot creation methods
    async def _create_daily_snapshot(self):
        """Create daily snapshot and cleanup old ones."""
        logger.info("Creating daily snapshot")
        
        try:
            snapshot_id = await self.graphitti.create_snapshot(
                snapshot_type=SnapshotType.DAILY_BACKUP,
                name=f"Daily Backup - {datetime.utcnow().strftime('%Y-%m-%d')}",
                description="Automated daily backup snapshot",
                tags=["daily", "automated", "backup"]
            )
            
            # Cleanup old daily snapshots
            retention_days = self.config["daily_snapshot"]["retention_days"]
            await self._cleanup_old_snapshots(SnapshotType.DAILY_BACKUP, retention_days)
            
            logger.info("Daily snapshot created successfully", snapshot_id=snapshot_id)
            
        except Exception as e:
            logger.error("Failed to create daily snapshot", error=str(e))
    
    async def _create_weekly_snapshot(self):
        """Create weekly snapshot and cleanup old ones."""
        logger.info("Creating weekly snapshot")
        
        try:
            snapshot_id = await self.graphitti.create_snapshot(
                snapshot_type=SnapshotType.WEEKLY_BACKUP,
                name=f"Weekly Backup - Week {datetime.utcnow().strftime('%Y-W%U')}",
                description="Automated weekly backup snapshot",
                tags=["weekly", "automated", "backup"]
            )
            
            # Cleanup old weekly snapshots
            retention_weeks = self.config["weekly_snapshot"]["retention_weeks"]
            await self._cleanup_old_snapshots(SnapshotType.WEEKLY_BACKUP, retention_weeks * 7)
            
            logger.info("Weekly snapshot created successfully", snapshot_id=snapshot_id)
            
        except Exception as e:
            logger.error("Failed to create weekly snapshot", error=str(e))
    
    async def _create_incremental_snapshot(self):
        """Create incremental snapshot and cleanup old ones."""
        logger.info("Creating incremental snapshot")
        
        try:
            # Check if there have been significant changes since last snapshot
            changes_since_last = await self._count_changes_since_last_snapshot()
            
            if changes_since_last < 10:  # Skip if fewer than 10 changes
                logger.info("Skipping incremental snapshot - insufficient changes", changes=changes_since_last)
                return
            
            snapshot_id = await self.graphitti.create_snapshot(
                snapshot_type=SnapshotType.INCREMENTAL,
                name=f"Incremental - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
                description=f"Automated incremental snapshot ({changes_since_last} changes)",
                tags=["incremental", "automated"]
            )
            
            # Cleanup old incremental snapshots
            retention_days = self.config["incremental_snapshot"]["retention_days"]
            await self._cleanup_old_snapshots(SnapshotType.INCREMENTAL, retention_days)
            
            logger.info("Incremental snapshot created successfully", 
                       snapshot_id=snapshot_id, changes_since_last=changes_since_last)
            
        except Exception as e:
            logger.error("Failed to create incremental snapshot", error=str(e))
    
    # Maintenance methods
    async def _vacuum_database(self):
        """Perform database vacuum and maintenance."""
        logger.info("Starting database vacuum and maintenance")
        
        try:
            async with self.graphitti.knowledge_db.pg_pool.acquire() as conn:
                # Vacuum analyze all Graphitti tables
                tables = [
                    "graph_changes",
                    "graph_snapshots", 
                    "graph_iterations",
                    "evolution_metrics",
                    "change_batches"
                ]
                
                for table in tables:
                    await conn.execute(f"VACUUM ANALYZE {table}")
                    logger.debug(f"Vacuumed table {table}")
                
                # Update table statistics
                await conn.execute("ANALYZE")
            
            logger.info("Database vacuum completed successfully")
            
        except Exception as e:
            logger.error("Database vacuum failed", error=str(e))
    
    async def _cleanup_old_changes(self):
        """Cleanup old change records based on retention policy."""
        logger.info("Cleaning up old change records")
        
        try:
            retention_days = self.config["maintenance"]["cleanup_old_changes"]["retention_days"]
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
            
            async with self.graphitti.knowledge_db.pg_pool.acquire() as conn:
                # Delete old changes
                deleted_count = await conn.fetchval(
                    "DELETE FROM graph_changes WHERE timestamp < $1 RETURNING COUNT(*)",
                    cutoff_date
                )
                
                # Delete empty batches
                deleted_batches = await conn.fetchval(
                    "DELETE FROM change_batches WHERE changes_count = 0 AND started_at < $1 RETURNING COUNT(*)",
                    cutoff_date
                )
            
            logger.info("Cleanup completed", 
                       deleted_changes=deleted_count or 0, 
                       deleted_batches=deleted_batches or 0,
                       retention_days=retention_days)
            
        except Exception as e:
            logger.error("Cleanup failed", error=str(e))
    
    async def _refresh_materialized_views(self):
        """Refresh materialized views for better query performance."""
        logger.info("Refreshing materialized views")
        
        try:
            async with self.graphitti.knowledge_db.pg_pool.acquire() as conn:
                await conn.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY evolution_summary")
            
            logger.info("Materialized views refreshed successfully")
            
        except Exception as e:
            logger.error("Failed to refresh materialized views", error=str(e))
    
    # Health monitoring
    async def _health_check(self):
        """Perform health check and alert if necessary."""
        try:
            health_metrics = await self.graphitti.get_graph_health_metrics()
            health_score = health_metrics["overall_health_score"]
            
            alert_threshold = self.config["health_check"]["alert_threshold"]
            
            if health_score < alert_threshold:
                logger.warning(
                    "Graph health below threshold",
                    health_score=health_score,
                    threshold=alert_threshold,
                    grade=health_metrics["health_grade"],
                    recommendations=health_metrics["recommendations"]
                )
                
                # In a production system, this would send alerts via email, Slack, etc.
                await self._send_health_alert(health_metrics)
            else:
                logger.debug("Graph health check passed", health_score=health_score)
            
        except Exception as e:
            logger.error("Health check failed", error=str(e))
    
    # Optimization methods
    async def _reindex_database(self):
        """Reindex database for optimal performance."""
        logger.info("Starting database reindexing")
        
        try:
            async with self.graphitti.knowledge_db.pg_pool.acquire() as conn:
                # Reindex Graphitti tables
                await conn.execute("REINDEX TABLE graph_changes")
                await conn.execute("REINDEX TABLE graph_snapshots")
                await conn.execute("REINDEX TABLE graph_iterations")
                await conn.execute("REINDEX TABLE evolution_metrics")
                await conn.execute("REINDEX TABLE change_batches")
            
            logger.info("Database reindexing completed")
            
        except Exception as e:
            logger.error("Database reindexing failed", error=str(e))
    
    async def _analyze_database(self):
        """Update database statistics for query optimization."""
        logger.info("Updating database statistics")
        
        try:
            async with self.graphitti.knowledge_db.pg_pool.acquire() as conn:
                await conn.execute("ANALYZE")
            
            logger.info("Database statistics updated")
            
        except Exception as e:
            logger.error("Database analysis failed", error=str(e))
    
    # Auto-iteration methods
    async def _check_auto_iteration(self):
        """Check if criteria are met for automatic iteration creation."""
        try:
            config = self.config["auto_iteration"]
            
            # Get latest iteration
            async with self.graphitti.knowledge_db.pg_pool.acquire() as conn:
                latest_iteration = await conn.fetchrow(
                    "SELECT * FROM graph_iterations ORDER BY created_at DESC LIMIT 1"
                )
                
                if not latest_iteration:
                    return  # No iterations yet
                
                # Check change threshold
                changes_since = await conn.fetchval(
                    "SELECT COUNT(*) FROM graph_changes WHERE timestamp > $1",
                    latest_iteration["created_at"]
                )
                
                # Check time threshold
                time_since = datetime.utcnow() - latest_iteration["created_at"]
                
                # Check if criteria are met
                should_create = (
                    changes_since >= config["change_threshold"] or
                    time_since.days >= config["time_threshold_days"]
                )
                
                if should_create and latest_iteration["stability_rating"] >= config["stability_threshold"]:
                    # Create auto iteration
                    version = f"auto-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
                    
                    await self.graphitti.create_iteration(
                        version=version,
                        name=f"Auto-generated iteration ({changes_since} changes)",
                        description=f"Automatically created after {changes_since} changes over {time_since.days} days",
                        major_features=["automated_milestone"],
                        tags=["automated", "milestone"]
                    )
                    
                    logger.info(
                        "Auto-iteration created",
                        version=version,
                        changes_since=changes_since,
                        days_since=time_since.days
                    )
            
        except Exception as e:
            logger.error("Auto-iteration check failed", error=str(e))
    
    # Helper methods
    async def _cleanup_old_snapshots(self, snapshot_type: SnapshotType, retention_days: int):
        """Cleanup old snapshots based on retention policy."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
            
            async with self.graphitti.knowledge_db.pg_pool.acquire() as conn:
                # Get old snapshots to delete
                old_snapshots = await conn.fetch(
                    "SELECT id, storage_path FROM graph_snapshots WHERE snapshot_type = $1 AND timestamp < $2",
                    snapshot_type.value, cutoff_date
                )
                
                for snapshot in old_snapshots:
                    # Delete storage file
                    try:
                        await self.graphitti.storage_backend.delete_snapshot(snapshot["storage_path"])
                    except Exception as e:
                        logger.warning("Failed to delete snapshot file", path=snapshot["storage_path"], error=str(e))
                    
                    # Delete database record
                    await conn.execute(
                        "DELETE FROM graph_snapshots WHERE id = $1",
                        snapshot["id"]
                    )
                
                if old_snapshots:
                    logger.info(f"Cleaned up {len(old_snapshots)} old {snapshot_type.value} snapshots")
            
        except Exception as e:
            logger.error("Snapshot cleanup failed", snapshot_type=snapshot_type.value, error=str(e))
    
    async def _count_changes_since_last_snapshot(self) -> int:
        """Count changes since the last snapshot."""
        try:
            async with self.graphitti.knowledge_db.pg_pool.acquire() as conn:
                last_snapshot = await conn.fetchrow(
                    "SELECT timestamp FROM graph_snapshots ORDER BY timestamp DESC LIMIT 1"
                )
                
                if not last_snapshot:
                    # No snapshots yet, count all changes
                    return await conn.fetchval("SELECT COUNT(*) FROM graph_changes")
                
                return await conn.fetchval(
                    "SELECT COUNT(*) FROM graph_changes WHERE timestamp > $1",
                    last_snapshot["timestamp"]
                )
        except Exception:
            return 0
    
    async def _send_health_alert(self, health_metrics: Dict[str, Any]):
        """Send health alert (placeholder for notification system)."""
        # In a production system, this would integrate with:
        # - Email notifications
        # - Slack/Discord webhooks
        # - PagerDuty/OpsGenie
        # - Custom monitoring systems
        
        logger.critical(
            "GRAPH HEALTH ALERT",
            health_score=health_metrics["overall_health_score"],
            health_grade=health_metrics["health_grade"],
            recommendations=health_metrics["recommendations"],
            statistics=health_metrics["statistics"]
        )
    
    # Status and control methods
    def get_status(self) -> Dict[str, Any]:
        """Get current scheduler status."""
        if not self.is_running:
            return {"status": "stopped", "jobs": []}
        
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        
        return {
            "status": "running",
            "jobs": jobs,
            "config": self.config
        }
    
    async def force_snapshot(self, snapshot_type: str = "incremental") -> str:
        """Force creation of a snapshot outside of schedule."""
        logger.info("Forcing snapshot creation", snapshot_type=snapshot_type)
        
        try:
            snapshot_type_enum = SnapshotType(snapshot_type)
        except ValueError:
            raise ValueError(f"Invalid snapshot type: {snapshot_type}")
        
        snapshot_id = await self.graphitti.create_snapshot(
            snapshot_type=snapshot_type_enum,
            name=f"Manual {snapshot_type} - {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
            description="Manually triggered snapshot",
            tags=[snapshot_type, "manual"]
        )
        
        logger.info("Manual snapshot created", snapshot_id=snapshot_id, snapshot_type=snapshot_type)
        return snapshot_id
    
    async def force_maintenance(self):
        """Force maintenance tasks to run immediately."""
        logger.info("Forcing maintenance tasks")
        
        await self._vacuum_database()
        await self._cleanup_old_changes()
        await self._refresh_materialized_views()
        
        logger.info("Manual maintenance completed")
