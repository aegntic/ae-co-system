#!/usr/bin/env python3
"""
DailyDoco Pro Cost Optimization Analysis

Analyzes and optimizes infrastructure costs at 10M videos/month scale:
- Infrastructure cost modeling ($0.10 target per video)
- GPU utilization optimization (80%+ efficiency target)
- Storage cost optimization with intelligent compression
- Bandwidth cost management with CDN strategies
- Real-time cost monitoring and alerting
- Multi-cloud cost comparison and optimization
"""

import asyncio
import json
import math
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from decimal import Decimal, ROUND_HALF_UP
import csv

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from loguru import logger
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn

console = Console()

@dataclass
class CostModel:
    """Infrastructure cost model"""
    component: str
    unit_cost: float  # Cost per unit
    unit_type: str   # "hour", "gb", "request", etc.
    fixed_cost: float = 0.0  # Fixed monthly cost
    scaling_factor: float = 1.0  # Cost scaling with volume
    min_commitment: float = 0.0  # Minimum commitment discount
    volume_discounts: Dict[int, float] = None  # Volume discount tiers

@dataclass
class CostOptimization:
    """Cost optimization recommendation"""
    component: str
    current_cost: float
    optimized_cost: float
    savings: float
    savings_percent: float
    optimization_strategy: str
    implementation_effort: str  # "low", "medium", "high"
    risk_level: str  # "low", "medium", "high"
    timeline: str  # "immediate", "weeks", "months"

@dataclass
class CostAnalysisResult:
    """Cost analysis result"""
    scenario_name: str
    monthly_volume: int
    total_monthly_cost: float
    cost_per_video: float
    cost_breakdown: Dict[str, float]
    optimizations: List[CostOptimization]
    projected_savings: float
    optimized_cost_per_video: float
    meets_target: bool
    timestamp: datetime

class CostOptimizer:
    """Comprehensive cost optimization analysis system"""
    
    def __init__(self, output_dir: Path = Path("results")):
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)
        self.target_cost_per_video = 0.10
        self.monthly_volume_target = 10_000_000
        self.setup_logging()
        self.initialize_cost_models()
        
    def setup_logging(self):
        """Configure logging"""
        logger.add(
            self.output_dir / "cost_optimization.log",
            rotation="100 MB",
            level="INFO",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"
        )
        
    def initialize_cost_models(self):
        """Initialize infrastructure cost models"""
        
        # AWS pricing (example - would be updated with current pricing)
        self.aws_cost_models = {
            "compute_gpu": CostModel(
                component="GPU Compute (A100)",
                unit_cost=3.20,  # Per hour
                unit_type="hour",
                scaling_factor=0.95,  # Volume discount
                volume_discounts={1000: 0.85, 5000: 0.80, 10000: 0.75}
            ),
            "compute_cpu": CostModel(
                component="CPU Compute (c5.4xlarge)",
                unit_cost=0.68,  # Per hour
                unit_type="hour",
                scaling_factor=0.90,
                volume_discounts={1000: 0.85, 5000: 0.80}
            ),
            "storage_s3": CostModel(
                component="S3 Storage",
                unit_cost=0.023,  # Per GB per month
                unit_type="gb_month",
                scaling_factor=0.98
            ),
            "storage_ebs": CostModel(
                component="EBS SSD Storage",
                unit_cost=0.10,  # Per GB per month
                unit_type="gb_month"
            ),
            "bandwidth_cloudfront": CostModel(
                component="CloudFront CDN",
                unit_cost=0.085,  # Per GB
                unit_type="gb",
                volume_discounts={100000: 0.80, 1000000: 0.70}
            ),
            "database_rds": CostModel(
                component="RDS PostgreSQL",
                unit_cost=0.40,  # Per hour
                unit_type="hour",
                fixed_cost=200  # Base cost
            ),
            "queue_sqs": CostModel(
                component="SQS Queue",
                unit_cost=0.0000004,  # Per request
                unit_type="request"
            ),
        }
        
        # GCP pricing
        self.gcp_cost_models = {
            "compute_gpu": CostModel(
                component="GPU Compute (A100)",
                unit_cost=2.93,  # Per hour - GCP often cheaper
                unit_type="hour",
                scaling_factor=0.90,
                volume_discounts={1000: 0.80, 5000: 0.75}
            ),
            "compute_cpu": CostModel(
                component="CPU Compute (n2-standard-16)",
                unit_cost=0.58,  # Per hour
                unit_type="hour",
                scaling_factor=0.85
            ),
            "storage_gcs": CostModel(
                component="Cloud Storage",
                unit_cost=0.020,  # Per GB per month
                unit_type="gb_month"
            ),
            "bandwidth_cdn": CostModel(
                component="Cloud CDN",
                unit_cost=0.080,  # Per GB
                unit_type="gb",
                volume_discounts={100000: 0.75, 1000000: 0.65}
            ),
            "database_cloudsql": CostModel(
                component="Cloud SQL PostgreSQL",
                unit_cost=0.35,  # Per hour
                unit_type="hour"
            ),
        }
        
        # Azure pricing
        self.azure_cost_models = {
            "compute_gpu": CostModel(
                component="GPU Compute (NC24ads A100 v4)",
                unit_cost=3.40,  # Per hour
                unit_type="hour",
                scaling_factor=0.92
            ),
            "compute_cpu": CostModel(
                component="CPU Compute (Standard_D16s_v3)",
                unit_cost=0.64,  # Per hour
                unit_type="hour"
            ),
            "storage_blob": CostModel(
                component="Blob Storage",
                unit_cost=0.021,  # Per GB per month
                unit_type="gb_month"
            ),
            "bandwidth_cdn": CostModel(
                component="Azure CDN",
                unit_cost=0.087,  # Per GB
                unit_type="gb"
            ),
        }
        
    async def run_comprehensive_cost_analysis(self) -> Dict[str, CostAnalysisResult]:
        """Run comprehensive cost analysis across multiple scenarios"""
        console.print("[bold green]💰 Starting DailyDoco Pro Cost Optimization Analysis[/bold green]")
        console.print(f"[yellow]Target: ${self.target_cost_per_video:.3f} per video at {self.monthly_volume_target:,} videos/month[/yellow]")
        
        # Define analysis scenarios
        scenarios = [
            {"name": "current_architecture", "volume": self.monthly_volume_target, "provider": "aws"},
            {"name": "optimized_aws", "volume": self.monthly_volume_target, "provider": "aws", "optimized": True},
            {"name": "multi_cloud_optimized", "volume": self.monthly_volume_target, "provider": "multi", "optimized": True},
            {"name": "scale_test_1m", "volume": 1_000_000, "provider": "aws"},
            {"name": "scale_test_5m", "volume": 5_000_000, "provider": "aws"},
            {"name": "scale_test_20m", "volume": 20_000_000, "provider": "aws"},
        ]
        
        results = {}
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            console=console
        ) as progress:
            
            for scenario in scenarios:
                task = progress.add_task(f"Analyzing {scenario['name']}...", total=1)
                
                try:
                    logger.info(f"Starting cost analysis: {scenario['name']}")
                    result = await self.analyze_scenario_cost(scenario)
                    results[scenario['name']] = result
                    
                    status = "✅ MEETS TARGET" if result.meets_target else "❌ OVER TARGET"
                    logger.info(f"Completed {scenario['name']}: ${result.cost_per_video:.3f}/video - {status}")
                    progress.update(task, completed=1)
                    
                except Exception as e:
                    logger.error(f"Cost analysis {scenario['name']} failed: {e}")
                    progress.update(task, completed=1)
                    
        await self.generate_cost_report(results)
        return results
        
    async def analyze_scenario_cost(self, scenario: Dict[str, Any]) -> CostAnalysisResult:
        """Analyze cost for a specific scenario"""
        scenario_name = scenario["name"]
        monthly_volume = scenario["volume"]
        provider = scenario["provider"]
        optimized = scenario.get("optimized", False)
        
        logger.info(f"Analyzing cost scenario: {scenario_name}")
        
        # Calculate resource requirements
        resource_requirements = await self.calculate_resource_requirements(monthly_volume)
        
        # Calculate costs based on provider
        if provider == "aws":
            cost_breakdown = await self.calculate_aws_costs(resource_requirements, optimized)
        elif provider == "gcp":
            cost_breakdown = await self.calculate_gcp_costs(resource_requirements, optimized)
        elif provider == "azure":
            cost_breakdown = await self.calculate_azure_costs(resource_requirements, optimized)
        elif provider == "multi":
            cost_breakdown = await self.calculate_multi_cloud_costs(resource_requirements, optimized)
        else:
            raise ValueError(f"Unknown provider: {provider}")
            
        # Calculate total costs
        total_monthly_cost = sum(cost_breakdown.values())
        cost_per_video = total_monthly_cost / monthly_volume if monthly_volume > 0 else 0
        
        # Generate optimization recommendations
        optimizations = await self.generate_optimizations(cost_breakdown, resource_requirements, provider)
        
        # Calculate projected savings
        projected_savings = sum(opt.savings for opt in optimizations)
        optimized_cost_per_video = (total_monthly_cost - projected_savings) / monthly_volume if monthly_volume > 0 else 0
        
        # Check if meets target
        meets_target = optimized_cost_per_video <= self.target_cost_per_video
        
        return CostAnalysisResult(
            scenario_name=scenario_name,
            monthly_volume=monthly_volume,
            total_monthly_cost=total_monthly_cost,
            cost_per_video=cost_per_video,
            cost_breakdown=cost_breakdown,
            optimizations=optimizations,
            projected_savings=projected_savings,
            optimized_cost_per_video=optimized_cost_per_video,
            meets_target=meets_target,
            timestamp=datetime.now()
        )
        
    async def calculate_resource_requirements(self, monthly_volume: int) -> Dict[str, float]:
        """Calculate infrastructure resource requirements"""
        
        # Video processing assumptions
        avg_video_length_minutes = 15
        processing_time_multiplier = 1.5  # Sub-2x realtime target
        
        # GPU requirements for video processing
        gpu_hours_per_video = (avg_video_length_minutes / 60) * processing_time_multiplier
        total_gpu_hours = monthly_volume * gpu_hours_per_video
        
        # CPU requirements for general processing
        cpu_hours_per_video = 0.1  # For metadata, API calls, etc.
        total_cpu_hours = monthly_volume * cpu_hours_per_video
        
        # Storage requirements
        avg_raw_video_size_gb = 2.0  # 15 min at 1080p
        avg_processed_video_size_gb = 0.5  # Compressed
        temp_storage_gb = monthly_volume * avg_raw_video_size_gb * 1.5  # Temp space
        permanent_storage_gb = monthly_volume * avg_processed_video_size_gb
        
        # Bandwidth requirements
        upload_bandwidth_gb = monthly_volume * avg_processed_video_size_gb
        cdn_bandwidth_gb = upload_bandwidth_gb * 3  # 3x for global distribution
        
        # Database requirements
        database_hours = 24 * 30  # Always on
        
        # Queue operations
        queue_operations = monthly_volume * 10  # 10 operations per video
        
        return {
            "gpu_hours": total_gpu_hours,
            "cpu_hours": total_cpu_hours,
            "temp_storage_gb": temp_storage_gb,
            "permanent_storage_gb": permanent_storage_gb,
            "upload_bandwidth_gb": upload_bandwidth_gb,
            "cdn_bandwidth_gb": cdn_bandwidth_gb,
            "database_hours": database_hours,
            "queue_operations": queue_operations,
        }
        
    async def calculate_aws_costs(self, requirements: Dict[str, float], optimized: bool = False) -> Dict[str, float]:
        """Calculate AWS infrastructure costs"""
        costs = {}
        
        # GPU compute costs
        gpu_model = self.aws_cost_models["compute_gpu"]
        gpu_cost = requirements["gpu_hours"] * gpu_model.unit_cost
        if optimized and requirements["gpu_hours"] > 10000:
            gpu_cost *= gpu_model.volume_discounts.get(10000, 0.9)
        costs["gpu_compute"] = gpu_cost
        
        # CPU compute costs
        cpu_model = self.aws_cost_models["compute_cpu"]
        cpu_cost = requirements["cpu_hours"] * cpu_model.unit_cost
        if optimized:
            cpu_cost *= 0.8  # Spot instances
        costs["cpu_compute"] = cpu_cost
        
        # Storage costs
        s3_model = self.aws_cost_models["storage_s3"]
        ebs_model = self.aws_cost_models["storage_ebs"]
        
        costs["permanent_storage"] = requirements["permanent_storage_gb"] * s3_model.unit_cost
        costs["temp_storage"] = requirements["temp_storage_gb"] * ebs_model.unit_cost
        
        if optimized:
            # Intelligent tiering and compression
            costs["permanent_storage"] *= 0.7  # Better compression
            costs["temp_storage"] *= 0.6  # Better temp management
            
        # Bandwidth costs
        cdn_model = self.aws_cost_models["bandwidth_cloudfront"]
        cdn_cost = requirements["cdn_bandwidth_gb"] * cdn_model.unit_cost
        if optimized and requirements["cdn_bandwidth_gb"] > 1000000:
            cdn_cost *= cdn_model.volume_discounts.get(1000000, 0.8)
        costs["bandwidth"] = cdn_cost
        
        # Database costs
        db_model = self.aws_cost_models["database_rds"]
        costs["database"] = requirements["database_hours"] * db_model.unit_cost + db_model.fixed_cost
        
        # Queue costs
        queue_model = self.aws_cost_models["queue_sqs"]
        costs["queue"] = requirements["queue_operations"] * queue_model.unit_cost
        
        return costs
        
    async def calculate_gcp_costs(self, requirements: Dict[str, float], optimized: bool = False) -> Dict[str, float]:
        """Calculate GCP infrastructure costs"""
        costs = {}
        
        # GPU compute costs (typically lower than AWS)
        gpu_model = self.gcp_cost_models["compute_gpu"]
        gpu_cost = requirements["gpu_hours"] * gpu_model.unit_cost
        if optimized:
            gpu_cost *= 0.75  # Preemptible instances
        costs["gpu_compute"] = gpu_cost
        
        # CPU compute costs
        cpu_model = self.gcp_cost_models["compute_cpu"]
        cpu_cost = requirements["cpu_hours"] * cpu_model.unit_cost
        if optimized:
            cpu_cost *= 0.7  # Preemptible instances
        costs["cpu_compute"] = cpu_cost
        
        # Storage costs
        storage_model = self.gcp_cost_models["storage_gcs"]
        costs["permanent_storage"] = requirements["permanent_storage_gb"] * storage_model.unit_cost
        costs["temp_storage"] = requirements["temp_storage_gb"] * storage_model.unit_cost * 2  # Higher tier for temp
        
        # Bandwidth costs
        cdn_model = self.gcp_cost_models["bandwidth_cdn"]
        cdn_cost = requirements["cdn_bandwidth_gb"] * cdn_model.unit_cost
        if optimized and requirements["cdn_bandwidth_gb"] > 1000000:
            cdn_cost *= cdn_model.volume_discounts.get(1000000, 0.75)
        costs["bandwidth"] = cdn_cost
        
        # Database costs
        db_model = self.gcp_cost_models["database_cloudsql"]
        costs["database"] = requirements["database_hours"] * db_model.unit_cost
        
        # Queue costs (using Pub/Sub)
        costs["queue"] = requirements["queue_operations"] * 0.0000004  # Similar to SQS
        
        return costs
        
    async def calculate_azure_costs(self, requirements: Dict[str, float], optimized: bool = False) -> Dict[str, float]:
        """Calculate Azure infrastructure costs"""
        costs = {}
        
        # GPU compute costs
        gpu_model = self.azure_cost_models["compute_gpu"]
        gpu_cost = requirements["gpu_hours"] * gpu_model.unit_cost
        if optimized:
            gpu_cost *= 0.8  # Spot instances
        costs["gpu_compute"] = gpu_cost
        
        # CPU compute costs
        cpu_model = self.azure_cost_models["compute_cpu"]
        cpu_cost = requirements["cpu_hours"] * cpu_model.unit_cost
        if optimized:
            cpu_cost *= 0.75  # Spot instances
        costs["cpu_compute"] = cpu_cost
        
        # Storage costs
        storage_model = self.azure_cost_models["storage_blob"]
        costs["permanent_storage"] = requirements["permanent_storage_gb"] * storage_model.unit_cost
        costs["temp_storage"] = requirements["temp_storage_gb"] * storage_model.unit_cost * 1.5
        
        # Bandwidth costs
        cdn_model = self.azure_cost_models["bandwidth_cdn"]
        costs["bandwidth"] = requirements["cdn_bandwidth_gb"] * cdn_model.unit_cost
        
        # Database costs
        costs["database"] = requirements["database_hours"] * 0.38  # Azure Database for PostgreSQL
        
        # Queue costs
        costs["queue"] = requirements["queue_operations"] * 0.0000005  # Service Bus
        
        return costs
        
    async def calculate_multi_cloud_costs(self, requirements: Dict[str, float], optimized: bool = False) -> Dict[str, float]:
        """Calculate multi-cloud optimized costs"""
        
        # Optimize by using best provider for each service
        costs = {}
        
        # Use GCP for GPU compute (typically cheapest)
        gcp_gpu_model = self.gcp_cost_models["compute_gpu"]
        gpu_cost = requirements["gpu_hours"] * gcp_gpu_model.unit_cost
        if optimized:
            gpu_cost *= 0.7  # Preemptible + volume discounts
        costs["gpu_compute"] = gpu_cost
        
        # Use GCP for CPU compute
        gcp_cpu_model = self.gcp_cost_models["compute_cpu"]
        cpu_cost = requirements["cpu_hours"] * gcp_cpu_model.unit_cost
        if optimized:
            cpu_cost *= 0.65  # Best preemptible pricing
        costs["cpu_compute"] = cpu_cost
        
        # Use AWS S3 for storage (best ecosystem)
        aws_storage_model = self.aws_cost_models["storage_s3"]
        costs["permanent_storage"] = requirements["permanent_storage_gb"] * aws_storage_model.unit_cost
        costs["temp_storage"] = requirements["temp_storage_gb"] * aws_storage_model.unit_cost * 1.2
        
        if optimized:
            costs["permanent_storage"] *= 0.6  # Intelligent tiering + compression
            costs["temp_storage"] *= 0.5  # Optimized temp storage
            
        # Use best CDN pricing (GCP at volume)
        gcp_cdn_model = self.gcp_cost_models["bandwidth_cdn"]
        cdn_cost = requirements["cdn_bandwidth_gb"] * gcp_cdn_model.unit_cost
        if optimized and requirements["cdn_bandwidth_gb"] > 1000000:
            cdn_cost *= 0.6  # Best volume pricing
        costs["bandwidth"] = cdn_cost
        
        # Use GCP for database
        gcp_db_model = self.gcp_cost_models["database_cloudsql"]
        costs["database"] = requirements["database_hours"] * gcp_db_model.unit_cost
        
        # Use cheapest queue option
        costs["queue"] = requirements["queue_operations"] * 0.0000003  # Optimized pricing
        
        return costs
        
    async def generate_optimizations(self, cost_breakdown: Dict[str, float], requirements: Dict[str, float], provider: str) -> List[CostOptimization]:
        """Generate cost optimization recommendations"""
        optimizations = []
        
        # GPU optimization
        if cost_breakdown.get("gpu_compute", 0) > 100000:  # If GPU costs are high
            gpu_savings = cost_breakdown["gpu_compute"] * 0.25  # 25% savings possible
            optimizations.append(CostOptimization(
                component="GPU Compute",
                current_cost=cost_breakdown["gpu_compute"],
                optimized_cost=cost_breakdown["gpu_compute"] - gpu_savings,
                savings=gpu_savings,
                savings_percent=25.0,
                optimization_strategy="Use preemptible/spot instances, optimize GPU utilization to 80%+, implement intelligent batching",
                implementation_effort="medium",
                risk_level="low",
                timeline="weeks"
            ))
            
        # Storage optimization
        storage_cost = cost_breakdown.get("permanent_storage", 0) + cost_breakdown.get("temp_storage", 0)
        if storage_cost > 50000:
            storage_savings = storage_cost * 0.35  # 35% savings possible
            optimizations.append(CostOptimization(
                component="Storage",
                current_cost=storage_cost,
                optimized_cost=storage_cost - storage_savings,
                savings=storage_savings,
                savings_percent=35.0,
                optimization_strategy="Implement intelligent compression, lifecycle policies, deduplication, and cold storage tiers",
                implementation_effort="medium",
                risk_level="low",
                timeline="weeks"
            ))
            
        # Bandwidth optimization
        if cost_breakdown.get("bandwidth", 0) > 30000:
            bandwidth_savings = cost_breakdown["bandwidth"] * 0.30  # 30% savings possible
            optimizations.append(CostOptimization(
                component="Bandwidth",
                current_cost=cost_breakdown["bandwidth"],
                optimized_cost=cost_breakdown["bandwidth"] - bandwidth_savings,
                savings=bandwidth_savings,
                savings_percent=30.0,
                optimization_strategy="Optimize CDN caching, implement video compression, use regional CDN optimization",
                implementation_effort="medium",
                risk_level="low",
                timeline="weeks"
            ))
            
        # Multi-cloud optimization
        if provider != "multi":
            total_current = sum(cost_breakdown.values())
            multi_cloud_savings = total_current * 0.20  # 20% savings from multi-cloud
            optimizations.append(CostOptimization(
                component="Multi-Cloud Strategy",
                current_cost=total_current,
                optimized_cost=total_current - multi_cloud_savings,
                savings=multi_cloud_savings,
                savings_percent=20.0,
                optimization_strategy="Implement multi-cloud architecture using best provider for each service",
                implementation_effort="high",
                risk_level="medium",
                timeline="months"
            ))
            
        # Reserved instances optimization
        compute_cost = cost_breakdown.get("gpu_compute", 0) + cost_breakdown.get("cpu_compute", 0)
        if compute_cost > 75000:
            reserved_savings = compute_cost * 0.40  # 40% savings with reserved instances
            optimizations.append(CostOptimization(
                component="Reserved Instances",
                current_cost=compute_cost,
                optimized_cost=compute_cost - reserved_savings,
                savings=reserved_savings,
                savings_percent=40.0,
                optimization_strategy="Purchase 1-3 year reserved instances for baseline compute capacity",
                implementation_effort="low",
                risk_level="low",
                timeline="immediate"
            ))
            
        return optimizations
        
    async def generate_cost_report(self, results: Dict[str, CostAnalysisResult]) -> None:
        """Generate comprehensive cost analysis report"""
        logger.info("Generating cost analysis report")
        
        # Create results table
        table = Table(title="DailyDoco Pro Cost Analysis Results")
        table.add_column("Scenario", style="cyan")
        table.add_column("Volume", style="magenta")
        table.add_column("Total Cost", style="yellow")
        table.add_column("Cost/Video", style="green")
        table.add_column("Savings", style="blue")
        table.add_column("Target", style="bold")
        
        for scenario_name, result in results.items():
            volume = f"{result.monthly_volume:,}"
            total_cost = f"${result.total_monthly_cost:,.0f}"
            cost_per_video = f"${result.cost_per_video:.3f}"
            savings = f"${result.projected_savings:,.0f}" if result.projected_savings > 0 else "N/A"
            target_status = "✅ MEETS" if result.meets_target else "❌ OVER"
            
            table.add_row(
                scenario_name.replace("_", " ").title(),
                volume,
                total_cost,
                cost_per_video,
                savings,
                target_status
            )
            
        console.print(table)
        
        # Generate cost breakdown charts
        await self.generate_cost_visualizations(results)
        
        # Generate optimization summary
        console.print("\n[bold blue]💡 Top Optimization Opportunities:[/bold blue]")
        
        all_optimizations = []
        for result in results.values():
            all_optimizations.extend(result.optimizations)
            
        # Sort by savings amount
        top_optimizations = sorted(all_optimizations, key=lambda x: x.savings, reverse=True)[:5]
        
        for i, opt in enumerate(top_optimizations, 1):
            console.print(f"{i}. [yellow]{opt.component}[/yellow]: ${opt.savings:,.0f} savings ({opt.savings_percent:.1f}%)")
            console.print(f"   Strategy: {opt.optimization_strategy}")
            console.print(f"   Effort: {opt.implementation_effort}, Risk: {opt.risk_level}, Timeline: {opt.timeline}\n")
            
        # Save detailed results
        await self.save_detailed_results(results)
        
        # Generate cost projections
        await self.generate_cost_projections(results)
        
        console.print(f"[green]📊 Full cost analysis saved to: {self.output_dir}[/green]")
        
    async def generate_cost_visualizations(self, results: Dict[str, CostAnalysisResult]) -> None:
        """Generate cost visualization charts"""
        logger.info("Generating cost visualizations")
        
        # Set up plotting
        plt.style.use('seaborn-v0_8')
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        
        # Cost per video comparison
        scenarios = list(results.keys())
        costs_per_video = [results[s].cost_per_video for s in scenarios]
        
        axes[0, 0].bar(scenarios, costs_per_video)
        axes[0, 0].axhline(y=self.target_cost_per_video, color='r', linestyle='--', label=f'Target (${self.target_cost_per_video:.3f})')
        axes[0, 0].set_title('Cost Per Video by Scenario')
        axes[0, 0].set_ylabel('Cost ($)')
        axes[0, 0].tick_params(axis='x', rotation=45)
        axes[0, 0].legend()
        
        # Cost breakdown for main scenario
        main_scenario = "current_architecture"
        if main_scenario in results:
            breakdown = results[main_scenario].cost_breakdown
            axes[0, 1].pie(breakdown.values(), labels=breakdown.keys(), autopct='%1.1f%%')
            axes[0, 1].set_title('Cost Breakdown - Current Architecture')
            
        # Savings potential
        scenario_names = []
        savings_amounts = []
        for name, result in results.items():
            if result.projected_savings > 0:
                scenario_names.append(name)
                savings_amounts.append(result.projected_savings)
                
        if savings_amounts:
            axes[1, 0].bar(scenario_names, savings_amounts)
            axes[1, 0].set_title('Projected Monthly Savings')
            axes[1, 0].set_ylabel('Savings ($)')
            axes[1, 0].tick_params(axis='x', rotation=45)
            
        # Volume vs cost scaling
        scale_scenarios = [s for s in scenarios if "scale_test" in s]
        if scale_scenarios:
            volumes = [results[s].monthly_volume for s in scale_scenarios]
            costs = [results[s].cost_per_video for s in scale_scenarios]
            
            axes[1, 1].plot(volumes, costs, 'bo-')
            axes[1, 1].axhline(y=self.target_cost_per_video, color='r', linestyle='--', label='Target')
            axes[1, 1].set_title('Cost Scaling with Volume')
            axes[1, 1].set_xlabel('Monthly Volume')
            axes[1, 1].set_ylabel('Cost Per Video ($)')
            axes[1, 1].legend()
            
        plt.tight_layout()
        plt.savefig(self.output_dir / "cost_analysis_charts.png", dpi=300, bbox_inches='tight')
        plt.close()
        
    async def save_detailed_results(self, results: Dict[str, CostAnalysisResult]) -> None:
        """Save detailed cost analysis results"""
        
        # Save JSON results
        with open(self.output_dir / "cost_analysis_results.json", "w") as f:
            json.dump(
                {name: asdict(result) for name, result in results.items()},
                f,
                indent=2,
                default=str
            )
            
        # Save CSV summary
        summary_data = []
        for name, result in results.items():
            summary_data.append({
                "scenario": name,
                "monthly_volume": result.monthly_volume,
                "total_monthly_cost": result.total_monthly_cost,
                "cost_per_video": result.cost_per_video,
                "projected_savings": result.projected_savings,
                "optimized_cost_per_video": result.optimized_cost_per_video,
                "meets_target": result.meets_target
            })
            
        df_summary = pd.DataFrame(summary_data)
        df_summary.to_csv(self.output_dir / "cost_analysis_summary.csv", index=False)
        
        # Save optimization recommendations
        opt_data = []
        for name, result in results.items():
            for opt in result.optimizations:
                opt_data.append({
                    "scenario": name,
                    "component": opt.component,
                    "current_cost": opt.current_cost,
                    "savings": opt.savings,
                    "savings_percent": opt.savings_percent,
                    "strategy": opt.optimization_strategy,
                    "effort": opt.implementation_effort,
                    "risk": opt.risk_level,
                    "timeline": opt.timeline
                })
                
        if opt_data:
            df_opt = pd.DataFrame(opt_data)
            df_opt.to_csv(self.output_dir / "optimization_recommendations.csv", index=False)
            
    async def generate_cost_projections(self, results: Dict[str, CostAnalysisResult]) -> None:
        """Generate future cost projections"""
        logger.info("Generating cost projections")
        
        # Project costs for next 24 months
        months = range(1, 25)
        volume_growth_rate = 0.15  # 15% monthly growth
        
        projections = {}
        
        for scenario_name, result in results.items():
            if "scale_test" not in scenario_name:  # Only project main scenarios
                monthly_costs = []
                monthly_volumes = []
                
                for month in months:
                    # Calculate volume growth
                    projected_volume = result.monthly_volume * (1 + volume_growth_rate) ** (month - 1)
                    monthly_volumes.append(projected_volume)
                    
                    # Calculate cost with volume discounts
                    cost_per_video = result.optimized_cost_per_video if result.optimizations else result.cost_per_video
                    
                    # Apply volume discounts
                    if projected_volume > 50_000_000:
                        cost_per_video *= 0.8  # 20% discount at 50M+ videos
                    elif projected_volume > 20_000_000:
                        cost_per_video *= 0.9  # 10% discount at 20M+ videos
                        
                    monthly_cost = projected_volume * cost_per_video
                    monthly_costs.append(monthly_cost)
                    
                projections[scenario_name] = {
                    "months": list(months),
                    "volumes": monthly_volumes,
                    "costs": monthly_costs
                }
                
        # Save projections
        with open(self.output_dir / "cost_projections.json", "w") as f:
            json.dump(projections, f, indent=2)
            
        # Create projection visualization
        plt.figure(figsize=(12, 8))
        
        for scenario_name, projection in projections.items():
            plt.plot(projection["months"], projection["costs"], label=scenario_name, linewidth=2)
            
        plt.title("24-Month Cost Projections")
        plt.xlabel("Month")
        plt.ylabel("Monthly Cost ($)")
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.ticklabel_format(style='plain', axis='y')
        
        plt.tight_layout()
        plt.savefig(self.output_dir / "cost_projections.png", dpi=300, bbox_inches='tight')
        plt.close()

async def main():
    """Main entry point for cost optimization analysis"""
    optimizer = CostOptimizer()
    
    try:
        results = await optimizer.run_comprehensive_cost_analysis()
        
        # Print summary
        console.print("\n[bold green]💰 Cost Optimization Analysis Complete![/bold green]")
        
        # Find best scenario
        best_scenario = min(results.items(), key=lambda x: x[1].optimized_cost_per_video)
        best_name, best_result = best_scenario
        
        console.print(f"\n[bold blue]🏆 Best Cost Scenario: {best_name.replace('_', ' ').title()}[/bold blue]")
        console.print(f"Cost per video: ${best_result.optimized_cost_per_video:.3f}")
        console.print(f"Monthly cost at 10M videos: ${best_result.optimized_cost_per_video * 10_000_000:,.0f}")
        console.print(f"Target met: {'✅ YES' if best_result.meets_target else '❌ NO'}")
        
        # Calculate total potential savings
        total_savings = sum(result.projected_savings for result in results.values())
        console.print(f"\n[yellow]💡 Total Optimization Potential: ${total_savings:,.0f}/month[/yellow]")
        
        # ROI analysis
        implementation_cost = 500000  # Estimated implementation cost
        monthly_savings = total_savings / len(results)  # Average monthly savings
        roi_months = implementation_cost / monthly_savings if monthly_savings > 0 else float('inf')
        
        console.print(f"ROI Timeline: {roi_months:.1f} months")
        
    except Exception as e:
        logger.error(f"Cost optimization analysis failed: {e}")
        console.print(f"[red]❌ Analysis failed: {e}[/red]")

if __name__ == "__main__":
    asyncio.run(main())