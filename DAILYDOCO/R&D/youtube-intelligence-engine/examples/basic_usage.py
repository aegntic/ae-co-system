#!/usr/bin/env python3
"""Basic usage example for YouTube Intelligence Engine."""

import asyncio
import httpx
import json
from typing import Dict, Any


class YouTubeIntelligenceClient:
    """Simple client for YouTube Intelligence Engine API."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()
    
    async def analyze_video(self, youtube_url: str, priority: str = "normal") -> Dict[str, Any]:
        """Analyze a YouTube video and get intelligence report."""
        response = await self.client.post(
            f"{self.base_url}/analyze",
            json={
                "url": youtube_url,
                "priority": priority,
                "include_knowledge_graph": True
            }
        )
        response.raise_for_status()
        return response.json()
    
    async def search_concepts(self, query: str, concept_type: str = None, limit: int = 20) -> Dict[str, Any]:
        """Search concepts in the knowledge graph."""
        response = await self.client.post(
            f"{self.base_url}/knowledge/search",
            json={
                "query": query,
                "concept_type": concept_type,
                "limit": limit
            }
        )
        response.raise_for_status()
        return response.json()
    
    async def get_trending_concepts(self, days: int = 7, limit: int = 10) -> Dict[str, Any]:
        """Get trending concepts from the knowledge graph."""
        response = await self.client.get(
            f"{self.base_url}/knowledge/trending",
            params={"days": days, "limit": limit}
        )
        response.raise_for_status()
        return response.json()
    
    async def get_dailydoco_suggestions(self, limit: int = 20) -> Dict[str, Any]:
        """Get integration suggestions for DailyDoco Pro."""
        response = await self.client.get(
            f"{self.base_url}/integration/dailydoco",
            params={"limit": limit}
        )
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


async def demo_basic_analysis():
    """Demonstrate basic YouTube video analysis."""
    client = YouTubeIntelligenceClient()
    
    try:
        print("🎥 YouTube Intelligence Engine - Basic Demo")
        print("=" * 50)
        
        # Example YouTube URLs (replace with actual URLs you want to analyze)
        test_videos = [
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  # Replace with real URL
            # Add more URLs here
        ]
        
        for i, youtube_url in enumerate(test_videos, 1):
            print(f"\n📹 Analyzing Video {i}: {youtube_url}")
            print("-" * 40)
            
            try:
                # Analyze the video
                result = await client.analyze_video(youtube_url)
                
                # Display key insights
                print(f"✅ Analysis completed successfully!")
                print(f"📊 Analysis ID: {result['analysis_id']}")
                print(f"📝 Title: {result['content_analysis']['title']}")
                print(f"⏱️  Duration: {result['content_analysis']['duration']} seconds")
                print(f"🎯 Relevance Score: {result['content_analysis']['relevance_score']:.2f}")
                
                # Show top actionable insights
                insights = result['actionable_insights']
                print(f"\n💡 Top Actions ({insights['total_actions']} total):")
                
                for j, action in enumerate(insights['recommended_actions'][:3], 1):
                    action_data = action['action']
                    ratings = action['ratings']
                    print(f"  {j}. {action_data['title']}")
                    print(f"     Impact: {ratings['impact']:.2f} | Feasibility: {ratings['feasibility']:.2f}")
                    print(f"     {action_data['description'][:100]}...")
                
                # Show knowledge graph impact
                kg_impact = result['knowledge_graph_impact']
                print(f"\n🧠 Knowledge Graph Impact:")
                print(f"   New Concepts: {kg_impact['new_concepts']}")
                print(f"   New Relationships: {kg_impact['new_relationships']}")
                
                # Show integration assessment
                integration = result['integration_assessment']
                print(f"\n🔗 DailyDoco Integration:")
                print(f"   Compatibility Score: {integration['dailydoco_compatibility']['overall_compatibility_score']:.2f}")
                print(f"   High Compatibility Actions: {integration['dailydoco_compatibility']['high_compatibility']}")
                
                print(f"\n⏱️  Processing Time: {result['metadata']['processing_time']}")
                
            except Exception as e:
                print(f"❌ Error analyzing video: {e}")
        
        # Demonstrate knowledge graph queries
        print("\n" + "=" * 50)
        print("🧠 Knowledge Graph Exploration")
        print("=" * 50)
        
        # Search for AI-related concepts
        print("\n🔍 Searching for AI concepts...")
        ai_concepts = await client.search_concepts("artificial intelligence", limit=5)
        print(f"Found {ai_concepts['total_results']} AI-related concepts:")
        for concept in ai_concepts['concepts'][:3]:
            print(f"  - {concept['concept_name']} ({concept['concept_type']})")
            print(f"    Relevance: {concept['relevance_score']:.2f}")
        
        # Get trending concepts
        print("\n📈 Getting trending concepts...")
        trending = await client.get_trending_concepts(days=7, limit=5)
        print(f"Top trending concepts (last 7 days):")
        for concept in trending['trending_concepts'][:3]:
            print(f"  - {concept['concept_name']} ({concept['recent_mentions']} mentions)")
        
        # Get DailyDoco-specific suggestions
        print("\n🎯 Getting DailyDoco Pro integration suggestions...")
        suggestions = await client.get_dailydoco_suggestions(limit=5)
        print(f"Found {suggestions['total_suggestions']} integration opportunities:")
        for suggestion in suggestions['integration_suggestions'][:3]:
            print(f"  - {suggestion['title']}")
            print(f"    Context Score: {suggestion['context_score']:.2f}")
            print(f"    From: {suggestion['url']}")
        
    finally:
        await client.close()


async def demo_advanced_features():
    """Demonstrate advanced features of the intelligence engine."""
    client = YouTubeIntelligenceClient()
    
    try:
        print("\n" + "=" * 50)
        print("🚀 Advanced Features Demo")
        print("=" * 50)
        
        # Concept path finding (requires Neo4j)
        print("\n🛤️  Finding concept paths...")
        try:
            path_response = await client.client.post(
                f"{client.base_url}/knowledge/paths",
                json={
                    "from_concept": "ai",
                    "to_concept": "automation",
                    "max_depth": 3
                }
            )
            if path_response.status_code == 200:
                paths = path_response.json()
                print(f"Found {paths['paths_found']} paths from 'ai' to 'automation':")
                for i, path in enumerate(paths['paths'][:2], 1):
                    print(f"  Path {i}: {' -> '.join(path['nodes'])}")
            else:
                print("Path finding not available (requires Neo4j)")
        except Exception as e:
            print(f"Path finding unavailable: {e}")
        
        # Knowledge analytics
        print("\n📊 Knowledge Graph Analytics...")
        try:
            analytics_response = await client.client.get(f"{client.base_url}/knowledge/analytics")
            if analytics_response.status_code == 200:
                analytics = analytics_response.json()
                print(f"Total Concepts: {analytics['total_concepts']}")
                print(f"Total Relationships: {analytics['total_relationships']}")
                print("Concept Distribution:")
                for dist in analytics['concept_distribution'][:5]:
                    print(f"  - {dist['concept_type']}: {dist['concept_count']} concepts")
            else:
                print("Analytics not available")
        except Exception as e:
            print(f"Analytics unavailable: {e}")
        
    finally:
        await client.close()


async def interactive_demo():
    """Interactive demo for testing with user input."""
    client = YouTubeIntelligenceClient()
    
    try:
        print("\n" + "=" * 50)
        print("🎮 Interactive Demo")
        print("=" * 50)
        print("Enter YouTube URLs to analyze (or 'quit' to exit)")
        
        while True:
            try:
                url = input("\n📺 YouTube URL: ").strip()
                
                if url.lower() in ['quit', 'exit', 'q']:
                    break
                
                if not url:
                    continue
                
                if "youtube.com" not in url and "youtu.be" not in url:
                    print("❌ Please enter a valid YouTube URL")
                    continue
                
                print(f"🔄 Analyzing {url}...")
                
                result = await client.analyze_video(url)
                
                print(f"✅ Analysis Complete!")
                print(f"📝 Title: {result['content_analysis']['title']}")
                print(f"🎯 Relevance: {result['content_analysis']['relevance_score']:.2f}")
                print(f"💡 Actions: {result['actionable_insights']['total_actions']}")
                
                # Ask if user wants details
                show_details = input("\n🔍 Show detailed results? (y/n): ").strip().lower()
                if show_details in ['y', 'yes']:
                    print(json.dumps(result, indent=2))
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"❌ Error: {e}")
        
        print("\n👋 Thanks for using YouTube Intelligence Engine!")
        
    finally:
        await client.close()


if __name__ == "__main__":
    print("🚀 YouTube Intelligence Engine - Demo Suite")
    print("" * 60)
    
    # Check if server is running
    async def check_server():
        client = YouTubeIntelligenceClient()
        try:
            response = await client.client.get(f"{client.base_url}/health")
            if response.status_code == 200:
                print("✅ Server is running!")
                return True
            else:
                print("❌ Server returned error")
                return False
        except Exception as e:
            print(f"❌ Server not accessible: {e}")
            print("💡 Make sure to start the server with: uv run python main.py")
            return False
        finally:
            await client.close()
    
    async def main():
        server_ok = await check_server()
        if not server_ok:
            return
        
        # Run demos
        demo_choice = input("\nChoose demo: (1) Basic Analysis (2) Advanced Features (3) Interactive (q) Quit: ").strip()
        
        if demo_choice == '1':
            await demo_basic_analysis()
        elif demo_choice == '2':
            await demo_advanced_features()
        elif demo_choice == '3':
            await interactive_demo()
        else:
            print("👋 Goodbye!")
    
    asyncio.run(main())
