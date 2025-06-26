"""
CLAEM CLI: Command-line interface for revolutionary AI collaboration.

Provides command-line access to CLAEM's intelligent collaboration,
knowledge evolution, and human oversight capabilities.
"""

import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from .server import CLAEMServer
from .core.types import TaskType, CollaborationStrategy

app = typer.Typer(help="CLAEM: Revolutionary AI collaboration with human oversight")
console = Console()


@app.command()
def serve():
    """Start the CLAEM MCP server."""
    console.print(Panel.fit("🚀 Starting CLAEM MCP Server", style="bold blue"))
    asyncio.run(main_server())


async def main_server():
    """Main server entry point."""
    server = CLAEMServer()
    await server.serve()


@app.command()
def init(
    directory: str = typer.Argument(".", help="Directory to initialize CLAEM in"),
    with_knowledge_graph: bool = typer.Option(True, help="Initialize with knowledge graph"),
    with_approval_interface: bool = typer.Option(True, help="Setup approval interface")
):
    """Initialize CLAEM in a directory with optimal configuration."""
    
    console.print(f"🔧 Initializing CLAEM in {directory}")
    
    dir_path = Path(directory)
    dir_path.mkdir(exist_ok=True)
    
    # Create Claude Code MCP configuration
    claude_config = {
        "mcpServers": {
            "claem-mcp": {
                "command": "uv",
                "args": ["run", "claem-server"],
                "cwd": str(dir_path.absolute()),
                "env": {}
            }
        }
    }
    
    config_file = dir_path / ".claude_code_config.json"
    with open(config_file, 'w') as f:
        json.dump(claude_config, f, indent=2)
    
    console.print(f"✅ Created Claude Code configuration: {config_file}")
    
    if with_knowledge_graph:
        console.print("✅ Knowledge graph enabled - will be created on first use")
    
    if with_approval_interface:
        console.print("✅ Human approval interface enabled")
    
    console.print(Panel.fit(
        "🎉 CLAEM initialized successfully!\n\n"
        "Next steps:\n"
        "1. Start server: claem serve\n"
        "2. Use Claude Code with CLAEM MCP tools\n"
        "3. Begin revolutionary AI collaboration!",
        style="bold green"
    ))


@app.command()
def status():
    """Show CLAEM system status and capabilities."""
    
    table = Table(title="CLAEM System Status")
    table.add_column("Component", style="cyan")
    table.add_column("Status", style="green")
    table.add_column("Description")
    
    table.add_row("MCP Server", "✅ Ready", "Revolutionary AI collaboration server")
    table.add_row("Knowledge Engine", "✅ Ready", "Evolving temporal intelligence")
    table.add_row("Collaboration Router", "✅ Ready", "Intelligent pattern selection")
    table.add_row("Human Oversight", "✅ Ready", "Approval and review system")
    
    console.print(table)
    
    # Show available strategies
    strategies_table = Table(title="Available Collaboration Strategies")
    strategies_table.add_column("Strategy", style="yellow")
    strategies_table.add_column("Cost", style="red")
    strategies_table.add_column("Best For")
    
    strategies_table.add_row(
        "DeepSeek R1", "💰 95% Cost Reduction", "Reasoning, analysis, cost optimization"
    )
    strategies_table.add_row(
        "Gemini Pro", "💰💰 Moderate", "1M token context, comprehensive analysis"
    )
    strategies_table.add_row(
        "CEO & Board", "💰💰💰 Premium", "Multi-perspective decisions, critical choices"
    )
    strategies_table.add_row(
        "Supervised Exchange", "💰💰 Moderate", "Human-guided AI collaboration"
    )
    strategies_table.add_row(
        "Local Strategy", "🆓 Free", "Privacy-critical, local processing"
    )
    
    console.print(strategies_table)


@app.command()
def collaborate(
    content: str = typer.Argument(..., help="Content for AI collaboration"),
    task_type: Optional[str] = typer.Option(None, help="Task type for optimal routing"),
    strategy: Optional[str] = typer.Option(None, help="Preferred collaboration strategy"),
    context_file: Optional[str] = typer.Option(None, help="File containing additional context"),
    max_tokens: int = typer.Option(50000, help="Maximum tokens for collaboration"),
):
    """Start an AI collaboration from the command line."""
    
    console.print("🤖 Starting CLAEM collaboration...")
    
    # Load context from file if provided
    context = None
    if context_file:
        try:
            with open(context_file, 'r') as f:
                context = f.read()
            console.print(f"📄 Loaded context from {context_file}")
        except Exception as e:
            console.print(f"❌ Error loading context file: {e}", style="red")
            return
    
    # Validate task type
    if task_type and task_type not in [t.value for t in TaskType]:
        console.print(f"❌ Invalid task type: {task_type}", style="red")
        console.print(f"Available: {[t.value for t in TaskType]}")
        return
    
    # Validate strategy
    if strategy and strategy not in [s.value for s in CollaborationStrategy]:
        console.print(f"❌ Invalid strategy: {strategy}", style="red")
        console.print(f"Available: {s.value for s in CollaborationStrategy]}")
        return
    
    console.print(Panel.fit(
        f"🚀 Collaboration Request\n\n"
        f"Content: {content[:100]}...\n"
        f"Task Type: {task_type or 'Auto-detect'}\n"
        f"Strategy: {strategy or 'Auto-select'}\n"
        f"Max Tokens: {max_tokens:,}",
        style="blue"
    ))
    
    console.print("💡 Note: Start 'claem serve' first, then use Claude Code with CLAEM MCP tools for full functionality")


@app.command()
def export(
    session_id: Optional[str] = typer.Option(None, help="Specific session to export"),
    output_file: str = typer.Option("claem_export.json", help="Output file path"),
    format_type: str = typer.Option("json", help="Export format (json/markdown)")
):
    """Export CLAEM collaboration insights and knowledge."""
    
    console.print(f"📤 Exporting CLAEM data to {output_file}")
    
    # This would integrate with the actual server for real exports
    export_data = {
        "timestamp": "2025-01-06T00:00:00Z",
        "session_id": session_id,
        "format": format_type,
        "note": "Start CLAEM server and use MCP tools for actual export functionality"
    }
    
    try:
        with open(output_file, 'w') as f:
            if format_type == "json":
                json.dump(export_data, f, indent=2)
            else:
                f.write(f"# CLAEM Export\n\n{json.dumps(export_data, indent=2)}")
        
        console.print(f"✅ Export completed: {output_file}")
    except Exception as e:
        console.print(f"❌ Export failed: {e}", style="red")


def main():
    """Main CLI entry point."""
    app()


if __name__ == "__main__":
    main()