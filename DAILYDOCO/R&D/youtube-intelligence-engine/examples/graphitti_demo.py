#!/usr/bin/env python3
"""Graphitti Demonstration - Knowledge Graph Versioning and Evolution Tracking."""

import asyncio
import httpx
import json
from typing import Dict, Any
from datetime import datetime, timedelta


class GraphittiClient:
    """Client for demonstrating Graphitti features."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()
    
    # Snapshot Management
    async def create_snapshot(self, snapshot_type: str = "incremental", name: str = None) -> Dict[str, Any]:
        """Create a knowledge graph snapshot."""
        response = await self.client.post(
            f"{self.base_url}/graphitti/snapshots",
            json={
                "snapshot_type": snapshot_type,
                "name": name,
                "description": f"Demo {snapshot_type} snapshot",
                "tags": ["demo", snapshot_type]
            }
        )
        response.raise_for_status()
        return response.json()
    
    async def list_snapshots(self, limit: int = 10) -> Dict[str, Any]:
        """List knowledge graph snapshots."""
        response = await self.client.get(
            f"{self.base_url}/graphitti/snapshots",
            params={"limit": limit}
        )
        response.raise_for_status()
        return response.json()
    
    async def restore_snapshot(self, snapshot_id: str, dry_run: bool = True) -> Dict[str, Any]:
        """Restore from a snapshot."""
        response = await self.client.post(
            f"{self.base_url}/graphitti/snapshots/restore",
            json={
                "snapshot_id": snapshot_id,
                "dry_run": dry_run
            }
        )
        response.raise_for_status()
        return response.json()
    
    # Iteration Management
    async def create_iteration(self, version: str, name: str) -> Dict[str, Any]:
        """Create a new graph iteration."""
        response = await self.client.post(
            f"{self.base_url}/graphitti/iterations",
            json={
                "version": version,
                "name": name,
                "description": f"Demo iteration {version}",
                "major_features": ["demo_feature", "graphitti_showcase"],
                "tags": ["demo", "showcase"]
            }
        )
        response.raise_for_status()
        return response.json()
    
    async def list_iterations(self, limit: int = 10) -> Dict[str, Any]:
        """List graph iterations."""
        response = await self.client.get(
            f"{self.base_url}/graphitti/iterations",
            params={"limit": limit}
        )
        response.raise_for_status()
        return response.json()
    
    async def compare_iterations(self, from_version: str, to_version: str) -> Dict[str, Any]:
        """Compare two iterations."""
        response = await self.client.post(
            f"{self.base_url}/graphitti/iterations/compare",
            json={
                "from_version": from_version,
                "to_version": to_version,
                "detailed": True
            }
        )
        response.raise_for_status()
        return response.json()
    
    # Change Tracking
    async def start_batch(self, name: str) -> Dict[str, Any]:
        """Start a change batch."""
        response = await self.client.post(
            f"{self.base_url}/graphitti/batches",
            json={
                "name": name,
                "description": f"Demo batch: {name}",
                "source": "demo"
            }
        )
        response.raise_for_status()
        return response.json()
    
    async def complete_batch(self, batch_id: str) -> Dict[str, Any]:
        """Complete a change batch."""
        response = await self.client.post(
            f"{self.base_url}/graphitti/batches/{batch_id}/complete"
        )
        response.raise_for_status()
        return response.json()
    
    async def list_batches(self, limit: int = 10) -> Dict[str, Any]:
        """List change batches."""
        response = await self.client.get(
            f"{self.base_url}/graphitti/batches",
            params={"limit": limit}
        )
        response.raise_for_status()
        return response.json()
    
    # Analytics
    async def get_evolution_timeline(self, days: int = 7) -> Dict[str, Any]:
        """Get evolution timeline."""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        response = await self.client.post(
            f"{self.base_url}/graphitti/evolution/timeline",
            json={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "granularity": "day",
                "include_details": True
            }
        )
        response.raise_for_status()
        return response.json()
    
    async def get_graph_health(self) -> Dict[str, Any]:
        """Get graph health metrics."""
        response = await self.client.get(f"{self.base_url}/graphitti/health")
        response.raise_for_status()
        return response.json()
    
    async def get_recent_changes(self, limit: int = 20) -> Dict[str, Any]:
        """Get recent changes."""
        response = await self.client.get(
            f"{self.base_url}/graphitti/changes",
            params={"limit": limit}
        )
        response.raise_for_status()
        return response.json()
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get Graphitti statistics."""
        response = await self.client.get(f"{self.base_url}/graphitti/stats")
        response.raise_for_status()
        return response.json()
    
    # YouTube Analysis (to generate changes)
    async def analyze_youtube_video(self, url: str) -> Dict[str, Any]:
        """Analyze a YouTube video to generate graph changes."""
        response = await self.client.post(
            f"{self.base_url}/analyze",
            json={"url": url}
        )
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


async def demo_snapshot_workflow():
    """Demonstrate snapshot creation and restoration workflow."""
    client = GraphittiClient()
    
    try:
        print("\n🔄 Graphitti Snapshot Workflow Demo")
        print("=" * 50)
        
        # Create initial snapshot
        print("\n📸 Creating initial snapshot...")
        snapshot1 = await client.create_snapshot("milestone", "Demo Initial State")
        print(f"✅ Created snapshot: {snapshot1['snapshot_id']}")
        
        # Simulate some changes by analyzing a video (if URL provided)
        print("\n🎬 Analyzing YouTube content to generate changes...")
        try:
            # Use a sample URL - replace with actual URL
            analysis = await client.analyze_youtube_video("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
            print(f"✅ Analysis completed: {analysis['analysis_id']}")
            print(f"   Actions generated: {analysis['actionable_insights']['total_actions']}")
        except Exception as e:
            print(f"⚠️  Analysis skipped (server may not be fully configured): {e}")
        
        # Create another snapshot after changes
        print("\n📸 Creating snapshot after changes...")
        snapshot2 = await client.create_snapshot("incremental", "Demo After Changes")
        print(f"✅ Created snapshot: {snapshot2['snapshot_id']}")
        
        # List all snapshots
        print("\n📋 Listing all snapshots...")
        snapshots = await client.list_snapshots()
        print(f"📊 Total snapshots: {snapshots['pagination']['total_count']}")
        for snapshot in snapshots['snapshots'][:3]:
            print(f"   - {snapshot['version']} ({snapshot['snapshot_type']}) - {snapshot['size_mb']:.2f} MB")
        
        # Demonstrate dry-run restoration
        if snapshots['snapshots']:
            snapshot_to_restore = snapshots['snapshots'][0]['id']
            print(f"\n🔄 Testing restoration (dry run) of {snapshot_to_restore[:8]}...")
            
            restore_result = await client.restore_snapshot(snapshot_to_restore, dry_run=True)
            if restore_result['dry_run']:
                print(f"✅ Dry run completed:")
                print(f"   - Concepts to add: {restore_result.get('concepts_to_add', 0)}")
                print(f"   - Concepts to update: {restore_result.get('concepts_to_update', 0)}")
                print(f"   - Concepts to remove: {restore_result.get('concepts_to_remove', 0)}")
        
    finally:
        await client.close()


async def demo_iteration_management():
    """Demonstrate iteration creation and comparison."""
    client = GraphittiClient()
    
    try:
        print("\n🔄 Graphitti Iteration Management Demo")
        print("=" * 50)
        
        # Create iterations
        print("\n🏗️  Creating iterations...")
        
        iteration1 = await client.create_iteration("v1.0.0-demo", "Initial Demo Release")
        print(f"✅ Created iteration: {iteration1['version']}")
        
        # Wait a moment and create another iteration
        await asyncio.sleep(1)
        
        iteration2 = await client.create_iteration("v1.1.0-demo", "Enhanced Demo Release")
        print(f"✅ Created iteration: {iteration2['version']}")
        
        # List iterations
        print("\n📋 Listing iterations...")
        iterations = await client.list_iterations()
        print(f"📊 Total iterations: {iterations['pagination']['total_count']}")
        
        for iteration in iterations['iterations'][:3]:
            print(f"   - {iteration['version']}: {iteration['name']}")
            print(f"     Changes since parent: {iteration['changes_since_parent']}")
            print(f"     Stability: {iteration['stability_rating']:.2f}")
        
        # Compare iterations if we have at least 2
        if len(iterations['iterations']) >= 2:
            iter1 = iterations['iterations'][1]  # Older
            iter2 = iterations['iterations'][0]  # Newer
            
            print(f"\n🔍 Comparing {iter1['version']} → {iter2['version']}...")
            
            comparison = await client.compare_iterations(iter1['version'], iter2['version'])
            
            print(f"📊 Comparison results:")
            summary = comparison['summary']
            print(f"   - Total changes: {summary['total_changes']}")
            print(f"   - Concepts created: {summary['concepts_created']}")
            print(f"   - Concepts updated: {summary['concepts_updated']}")
            print(f"   - Relationships created: {summary['relationships_created']}")
            print(f"   - Stability improvement: {summary['stability_improvement']:.3f}")
        
    finally:
        await client.close()


async def demo_change_tracking():
    """Demonstrate change tracking with batches."""
    client = GraphittiClient()
    
    try:
        print("\n🔄 Graphitti Change Tracking Demo")
        print("=" * 50)
        
        # Start a batch
        print("\n📦 Starting change batch...")
        batch = await client.start_batch("Demo Batch - Knowledge Updates")
        batch_id = batch['batch_id']
        print(f"✅ Started batch: {batch_id[:8]}...")
        
        # Simulate some changes (in a real scenario, these would happen automatically)
        print("\n🔄 Simulating changes (analyze YouTube content)...")
        try:
            # This would create tracked changes
            analysis = await client.analyze_youtube_video("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
            print(f"✅ Generated changes through analysis: {analysis['analysis_id']}")
        except Exception as e:
            print(f"⚠️  Change simulation skipped: {e}")
        
        # Complete the batch
        print(f"\n✅ Completing batch {batch_id[:8]}...")
        batch_summary = await client.complete_batch(batch_id)
        print(f"📊 Batch completed:")
        print(f"   - Name: {batch_summary['name']}")
        print(f"   - Total changes: {batch_summary['total_changes']}")
        print(f"   - Duration: {batch_summary['duration_seconds']:.2f} seconds")
        
        # List recent batches
        print("\n📋 Recent change batches:")
        batches = await client.list_batches(5)
        for batch in batches['batches'][:3]:
            status_emoji = "✅" if batch['status'] == 'completed' else "🔄"
            print(f"   {status_emoji} {batch['name']} - {batch['changes_count']} changes")
        
        # Show recent changes
        print("\n📋 Recent changes:")
        changes = await client.get_recent_changes(10)
        for change in changes['changes'][:5]:
            print(f"   - {change['change_type']} on {change['entity_type']} ({change['timestamp']})")
        
    finally:
        await client.close()


async def demo_analytics_and_health():
    """Demonstrate analytics and health monitoring."""
    client = GraphittiClient()
    
    try:
        print("\n🔄 Graphitti Analytics & Health Demo")
        print("=" * 50)
        
        # Get graph health
        print("\n🏥 Checking graph health...")
        health = await client.get_graph_health()
        
        print(f"📊 Graph Health Report:")
        print(f"   - Overall Health Score: {health['overall_health_score']:.3f}")
        print(f"   - Health Grade: {health['health_grade']}")
        print(f"   - Total Concepts: {health['statistics']['total_concepts']}")
        print(f"   - Total Relationships: {health['statistics']['total_relationships']}")
        print(f"   - Graph Density: {health['statistics']['graph_density']:.3f}")
        print(f"   - Changes (24h): {health['statistics']['changes_24h']}")
        
        if health['recommendations']:
            print(f"\n💡 Health Recommendations:")
            for rec in health['recommendations'][:3]:
                print(f"   - {rec}")
        
        # Get evolution timeline
        print("\n📈 Evolution timeline (last 7 days)...")
        timeline = await client.get_evolution_timeline(7)
        
        print(f"📊 Evolution Summary:")
        stats = timeline['summary_statistics']
        print(f"   - Total days tracked: {stats['total_days']}")
        print(f"   - Total changes: {stats['total_changes']}")
        print(f"   - Average daily changes: {stats['average_daily_changes']:.1f}")
        print(f"   - Iterations created: {stats['iterations_created']}")
        
        if timeline['daily_evolution']:
            print(f"\n📅 Recent daily activity:")
            for day in timeline['daily_evolution'][-3:]:  # Last 3 days
                print(f"   - {day['date']}: {day['total_changes']} changes ({day['creations']} created, {day['updates']} updated)")
        
        # Get comprehensive stats
        print("\n📊 Comprehensive Graphitti statistics...")
        stats = await client.get_stats()
        
        print(f"📈 System Overview:")
        overview = stats['overview']
        print(f"   - Total Changes: {overview['total_changes']}")
        print(f"   - Total Snapshots: {overview['total_snapshots']}")
        print(f"   - Total Iterations: {overview['total_iterations']}")
        print(f"   - Unique Sessions: {overview['unique_sessions']}")
        
        storage = stats['storage']
        print(f"\n💾 Storage Usage:")
        print(f"   - Average Snapshot Size: {storage['average_snapshot_size_mb']:.2f} MB")
        print(f"   - Total Storage Used: {storage['total_storage_used_mb']:.2f} MB")
        
        print(f"\n🔄 Change Type Distribution:")
        for change_type in stats['change_type_distribution'][:5]:
            print(f"   - {change_type['change_type']}: {change_type['count']}")
        
    finally:
        await client.close()


async def comprehensive_demo():
    """Run a comprehensive demonstration of all Graphitti features."""
    print("🚀 Graphitti - Advanced Knowledge Graph Versioning Demo")
    print("=" * 60)
    print("This demo showcases the complete Graphitti feature set:")
    print("• Snapshot creation and restoration")
    print("• Iteration management and comparison")
    print("• Change tracking with batches")
    print("• Analytics and health monitoring")
    print("• Evolution timeline analysis")
    
    # Check if server is running
    client = GraphittiClient()
    try:
        response = await client.client.get(f"{client.base_url}/health")
        if response.status_code != 200:
            print("\n❌ Server not accessible. Make sure to start with: uv run python main.py")
            return
    except Exception as e:
        print(f"\n❌ Server not accessible: {e}")
        print("💡 Make sure to start with: uv run python main.py")
        return
    finally:
        await client.close()
    
    print("\n✅ Server is running! Starting demos...")
    
    # Run all demonstrations
    await demo_snapshot_workflow()
    await demo_iteration_management()
    await demo_change_tracking()
    await demo_analytics_and_health()
    
    print("\n" + "=" * 60)
    print("🎉 Graphitti demonstration completed!")
    print("\n🔧 Advanced Features Available:")
    print("• Automated scheduled snapshots (daily, weekly, incremental)")
    print("• Health monitoring with alerts")
    print("• Database maintenance and optimization")
    print("• Graph restoration and rollback capabilities")
    print("• Comprehensive change tracking and auditing")
    print("• Evolution analytics and trend analysis")
    print("\n📚 Access the full API documentation at: http://localhost:8000/docs")


if __name__ == "__main__":
    print("🔧 Graphitti Demo Suite")
    print("Choose demo: (1) Snapshots (2) Iterations (3) Change Tracking (4) Analytics (5) Full Demo (q) Quit")
    
    async def main():
        choice = input("Your choice: ").strip()
        
        if choice == '1':
            await demo_snapshot_workflow()
        elif choice == '2':
            await demo_iteration_management()
        elif choice == '3':
            await demo_change_tracking()
        elif choice == '4':
            await demo_analytics_and_health()
        elif choice == '5':
            await comprehensive_demo()
        else:
            print("👋 Goodbye!")
    
    asyncio.run(main())
