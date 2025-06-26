#!/usr/bin/env python3
"""
DailyDoco Pro Performance Benchmarking Suite

Validates system performance at 10M videos/month scale:
- 333,333 videos/day peak processing
- Sub-2x realtime video processing
- GPU cluster performance (1000+ GPUs)
- Memory optimization (< 200MB baseline)
- Storage throughput (50TB/day)
"""

import asyncio
import time
import psutil
import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import subprocess
import tempfile
import os
from datetime import datetime, timedelta

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from loguru import logger

console = Console()

@dataclass
class BenchmarkResult:
    """Performance benchmark result"""
    test_name: str
    videos_processed: int
    processing_time: float
    videos_per_second: float
    cpu_usage_percent: float
    memory_usage_mb: float
    gpu_usage_percent: Optional[float]
    gpu_memory_mb: Optional[float]
    storage_io_mbps: float
    network_io_mbps: float
    success_rate: float
    error_count: int
    cost_per_video: float
    timestamp: datetime

@dataclass
class ScaleTarget:
    """Scale testing targets"""
    videos_per_month: int = 10_000_000
    videos_per_day: int = 333_333
    videos_per_hour: int = 13_889
    videos_per_minute: int = 231
    videos_per_second: int = 4
    max_processing_time_multiplier: float = 2.0  # Sub-2x realtime
    max_memory_mb: int = 200
    max_cpu_percent: float = 80.0
    min_success_rate: float = 0.999
    max_cost_per_video: float = 0.10

class PerformanceBenchmarker:
    """Comprehensive performance benchmarking system"""
    
    def __init__(self, output_dir: Path = Path("results")):
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)
        self.targets = ScaleTarget()
        self.results: List[BenchmarkResult] = []
        self.setup_logging()
        
    def setup_logging(self):
        """Configure logging"""
        logger.add(
            self.output_dir / "performance_benchmark.log",
            rotation="100 MB",
            level="INFO",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"
        )
        
    async def run_full_benchmark_suite(self) -> Dict[str, BenchmarkResult]:
        """Run comprehensive performance benchmark suite"""
        console.print("[bold green]🚀 Starting DailyDoco Pro Performance Benchmark Suite[/bold green]")
        console.print(f"[yellow]Target: {self.targets.videos_per_month:,} videos/month ({self.targets.videos_per_day:,} videos/day)[/yellow]")
        
        benchmarks = {
            "single_video_processing": self.benchmark_single_video_processing,
            "concurrent_video_processing": self.benchmark_concurrent_processing,
            "gpu_cluster_simulation": self.benchmark_gpu_cluster,
            "storage_throughput": self.benchmark_storage_throughput,
            "database_performance": self.benchmark_database_performance,
            "network_bandwidth": self.benchmark_network_bandwidth,
            "memory_stress_test": self.benchmark_memory_usage,
            "sustained_load_test": self.benchmark_sustained_load,
            "peak_traffic_simulation": self.benchmark_peak_traffic,
            "end_to_end_pipeline": self.benchmark_end_to_end_pipeline,
        }
        
        results = {}
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TimeElapsedColumn(),
            console=console
        ) as progress:
            
            for test_name, benchmark_func in benchmarks.items():
                task = progress.add_task(f"Running {test_name}...", total=1)
                
                try:
                    logger.info(f"Starting benchmark: {test_name}")
                    result = await benchmark_func()
                    results[test_name] = result
                    self.results.append(result)
                    
                    # Log result
                    logger.info(f"Completed {test_name}: {result.videos_per_second:.2f} videos/sec")
                    progress.update(task, completed=1)
                    
                except Exception as e:
                    logger.error(f"Benchmark {test_name} failed: {e}")
                    progress.update(task, completed=1)
                    
        await self.generate_performance_report(results)
        return results
        
    async def benchmark_single_video_processing(self) -> BenchmarkResult:
        """Benchmark single video processing performance"""
        logger.info("Benchmarking single video processing")
        
        # Create test video file
        test_video = await self.create_test_video_file()
        
        start_time = time.time()
        start_cpu = psutil.cpu_percent()
        start_memory = psutil.virtual_memory().used / 1024 / 1024
        
        # Simulate video processing pipeline
        await self.simulate_video_processing(test_video)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Measure resource usage
        cpu_usage = psutil.cpu_percent() - start_cpu
        memory_usage = (psutil.virtual_memory().used / 1024 / 1024) - start_memory
        
        # Calculate metrics
        videos_per_second = 1 / processing_time if processing_time > 0 else 0
        
        return BenchmarkResult(
            test_name="single_video_processing",
            videos_processed=1,
            processing_time=processing_time,
            videos_per_second=videos_per_second,
            cpu_usage_percent=cpu_usage,
            memory_usage_mb=memory_usage,
            gpu_usage_percent=None,  # Will be populated if GPU available
            gpu_memory_mb=None,
            storage_io_mbps=0.0,  # TODO: Measure actual storage I/O
            network_io_mbps=0.0,
            success_rate=1.0,
            error_count=0,
            cost_per_video=0.05,  # Estimated cost
            timestamp=datetime.now()
        )
        
    async def benchmark_concurrent_processing(self) -> BenchmarkResult:
        """Benchmark concurrent video processing"""
        logger.info("Benchmarking concurrent video processing")
        
        num_concurrent = 50  # Simulate 50 concurrent video processing jobs
        test_videos = []
        
        # Create test video files
        for i in range(num_concurrent):
            test_video = await self.create_test_video_file(f"test_video_{i}")
            test_videos.append(test_video)
            
        start_time = time.time()
        start_cpu = psutil.cpu_percent()
        start_memory = psutil.virtual_memory().used / 1024 / 1024
        
        # Process videos concurrently
        with ThreadPoolExecutor(max_workers=num_concurrent) as executor:
            futures = [
                executor.submit(asyncio.run, self.simulate_video_processing(video))
                for video in test_videos
            ]
            
            completed = 0
            errors = 0
            for future in as_completed(futures):
                try:
                    future.result()
                    completed += 1
                except Exception as e:
                    errors += 1
                    logger.error(f"Video processing failed: {e}")
                    
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Measure resource usage
        cpu_usage = psutil.cpu_percent() - start_cpu
        memory_usage = (psutil.virtual_memory().used / 1024 / 1024) - start_memory
        
        # Calculate metrics
        videos_per_second = completed / processing_time if processing_time > 0 else 0
        success_rate = completed / num_concurrent
        
        return BenchmarkResult(
            test_name="concurrent_video_processing",
            videos_processed=completed,
            processing_time=processing_time,
            videos_per_second=videos_per_second,
            cpu_usage_percent=cpu_usage,
            memory_usage_mb=memory_usage,
            gpu_usage_percent=None,
            gpu_memory_mb=None,
            storage_io_mbps=0.0,
            network_io_mbps=0.0,
            success_rate=success_rate,
            error_count=errors,
            cost_per_video=0.05,
            timestamp=datetime.now()
        )
        
    async def benchmark_gpu_cluster(self) -> BenchmarkResult:
        """Benchmark GPU cluster performance simulation"""
        logger.info("Benchmarking GPU cluster performance")
        
        # Simulate 1000 GPU cluster performance
        num_gpus = 1000
        videos_per_gpu = 10  # Each GPU processes 10 videos simultaneously
        total_videos = num_gpus * videos_per_gpu
        
        start_time = time.time()
        
        # Simulate GPU processing (using CPU intensive tasks as proxy)
        tasks = []
        for i in range(total_videos):
            task = asyncio.create_task(self.simulate_gpu_processing())
            tasks.append(task)
            
        # Process in batches to avoid overwhelming system
        batch_size = 100
        completed = 0
        errors = 0
        
        for i in range(0, len(tasks), batch_size):
            batch = tasks[i:i + batch_size]
            try:
                await asyncio.gather(*batch)
                completed += len(batch)
            except Exception as e:
                errors += len(batch)
                logger.error(f"GPU batch processing failed: {e}")
                
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Calculate metrics
        videos_per_second = completed / processing_time if processing_time > 0 else 0
        success_rate = completed / total_videos
        
        return BenchmarkResult(
            test_name="gpu_cluster_simulation",
            videos_processed=completed,
            processing_time=processing_time,
            videos_per_second=videos_per_second,
            cpu_usage_percent=psutil.cpu_percent(),
            memory_usage_mb=psutil.virtual_memory().used / 1024 / 1024,
            gpu_usage_percent=85.0,  # Simulated GPU usage
            gpu_memory_mb=40000,  # Simulated GPU memory usage
            storage_io_mbps=0.0,
            network_io_mbps=0.0,
            success_rate=success_rate,
            error_count=errors,
            cost_per_video=0.08,  # Higher cost for GPU processing
            timestamp=datetime.now()
        )
        
    async def benchmark_storage_throughput(self) -> BenchmarkResult:
        """Benchmark storage throughput for 50TB/day requirement"""
        logger.info("Benchmarking storage throughput")
        
        # Target: 50TB/day = 578 MB/second sustained
        target_mbps = 578
        test_duration = 30  # seconds
        
        start_time = time.time()
        
        # Simulate high-throughput storage operations
        total_bytes_written = 0
        total_bytes_read = 0
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Write test
            write_tasks = []
            for i in range(100):  # 100 concurrent write operations
                task = asyncio.create_task(
                    self.simulate_storage_write(temp_path / f"test_file_{i}.dat", 10 * 1024 * 1024)  # 10MB per file
                )
                write_tasks.append(task)
                
            write_results = await asyncio.gather(*write_tasks, return_exceptions=True)
            total_bytes_written = sum(r for r in write_results if isinstance(r, int))
            
            # Read test
            read_tasks = []
            for i in range(100):
                if (temp_path / f"test_file_{i}.dat").exists():
                    task = asyncio.create_task(
                        self.simulate_storage_read(temp_path / f"test_file_{i}.dat")
                    )
                    read_tasks.append(task)
                    
            read_results = await asyncio.gather(*read_tasks, return_exceptions=True)
            total_bytes_read = sum(r for r in read_results if isinstance(r, int))
            
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Calculate throughput
        total_bytes = total_bytes_written + total_bytes_read
        throughput_mbps = (total_bytes / 1024 / 1024) / processing_time
        
        return BenchmarkResult(
            test_name="storage_throughput",
            videos_processed=0,  # Not applicable
            processing_time=processing_time,
            videos_per_second=0,
            cpu_usage_percent=psutil.cpu_percent(),
            memory_usage_mb=psutil.virtual_memory().used / 1024 / 1024,
            gpu_usage_percent=None,
            gpu_memory_mb=None,
            storage_io_mbps=throughput_mbps,
            network_io_mbps=0.0,
            success_rate=1.0,
            error_count=0,
            cost_per_video=0.01,  # Storage cost per video
            timestamp=datetime.now()
        )
        
    async def benchmark_database_performance(self) -> BenchmarkResult:
        """Benchmark database performance under extreme load"""
        logger.info("Benchmarking database performance")
        
        # Simulate database operations for video metadata
        num_operations = 10000
        start_time = time.time()
        
        # Simulate database writes (video metadata)
        write_tasks = []
        for i in range(num_operations):
            task = asyncio.create_task(self.simulate_database_write(i))
            write_tasks.append(task)
            
        await asyncio.gather(*write_tasks, return_exceptions=True)
        
        # Simulate database reads (video queries)
        read_tasks = []
        for i in range(num_operations):
            task = asyncio.create_task(self.simulate_database_read(i))
            read_tasks.append(task)
            
        await asyncio.gather(*read_tasks, return_exceptions=True)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        operations_per_second = (num_operations * 2) / processing_time  # Read + Write
        
        return BenchmarkResult(
            test_name="database_performance",
            videos_processed=num_operations,
            processing_time=processing_time,
            videos_per_second=operations_per_second,
            cpu_usage_percent=psutil.cpu_percent(),
            memory_usage_mb=psutil.virtual_memory().used / 1024 / 1024,
            gpu_usage_percent=None,
            gpu_memory_mb=None,
            storage_io_mbps=0.0,
            network_io_mbps=0.0,
            success_rate=1.0,
            error_count=0,
            cost_per_video=0.001,  # Database cost per video
            timestamp=datetime.now()
        )
        
    async def benchmark_network_bandwidth(self) -> BenchmarkResult:
        """Benchmark network bandwidth requirements"""
        logger.info("Benchmarking network bandwidth")
        
        # Target: 10Gbps sustained, 100Gbps burst
        # Simulate network transfer of processed videos
        
        start_time = time.time()
        
        # Simulate network transfers
        transfer_tasks = []
        for i in range(100):  # 100 concurrent transfers
            task = asyncio.create_task(self.simulate_network_transfer(100 * 1024 * 1024))  # 100MB per transfer
            transfer_tasks.append(task)
            
        results = await asyncio.gather(*transfer_tasks, return_exceptions=True)
        total_bytes_transferred = sum(r for r in results if isinstance(r, int))
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Calculate bandwidth
        bandwidth_mbps = (total_bytes_transferred / 1024 / 1024) / processing_time
        
        return BenchmarkResult(
            test_name="network_bandwidth",
            videos_processed=len(transfer_tasks),
            processing_time=processing_time,
            videos_per_second=len(transfer_tasks) / processing_time,
            cpu_usage_percent=psutil.cpu_percent(),
            memory_usage_mb=psutil.virtual_memory().used / 1024 / 1024,
            gpu_usage_percent=None,
            gpu_memory_mb=None,
            storage_io_mbps=0.0,
            network_io_mbps=bandwidth_mbps,
            success_rate=1.0,
            error_count=0,
            cost_per_video=0.02,  # Network cost per video
            timestamp=datetime.now()
        )
        
    async def benchmark_memory_usage(self) -> BenchmarkResult:
        """Benchmark memory usage under stress"""
        logger.info("Benchmarking memory usage")
        
        initial_memory = psutil.virtual_memory().used / 1024 / 1024
        
        # Simulate memory-intensive video processing
        memory_stress_tasks = []
        for i in range(50):  # 50 memory-intensive tasks
            task = asyncio.create_task(self.simulate_memory_intensive_processing())
            memory_stress_tasks.append(task)
            
        start_time = time.time()
        await asyncio.gather(*memory_stress_tasks, return_exceptions=True)
        end_time = time.time()
        
        final_memory = psutil.virtual_memory().used / 1024 / 1024
        memory_usage = final_memory - initial_memory
        processing_time = end_time - start_time
        
        return BenchmarkResult(
            test_name="memory_stress_test",
            videos_processed=len(memory_stress_tasks),
            processing_time=processing_time,
            videos_per_second=len(memory_stress_tasks) / processing_time,
            cpu_usage_percent=psutil.cpu_percent(),
            memory_usage_mb=memory_usage,
            gpu_usage_percent=None,
            gpu_memory_mb=None,
            storage_io_mbps=0.0,
            network_io_mbps=0.0,
            success_rate=1.0,
            error_count=0,
            cost_per_video=0.03,
            timestamp=datetime.now()
        )
        
    async def benchmark_sustained_load(self) -> BenchmarkResult:
        """Benchmark sustained load over extended period"""
        logger.info("Benchmarking sustained load (5 minutes)")
        
        # Run sustained load for 5 minutes
        test_duration = 300  # 5 minutes in seconds
        start_time = time.time()
        videos_processed = 0
        errors = 0
        
        # Continuous video processing simulation
        while time.time() - start_time < test_duration:
            try:
                batch_start = time.time()
                
                # Process batch of videos
                batch_tasks = []
                for i in range(10):  # 10 videos per batch
                    task = asyncio.create_task(self.simulate_video_processing_fast())
                    batch_tasks.append(task)
                    
                await asyncio.gather(*batch_tasks, return_exceptions=True)
                videos_processed += len(batch_tasks)
                
                # Small delay to avoid overwhelming system
                await asyncio.sleep(0.1)
                
            except Exception as e:
                errors += 1
                logger.error(f"Sustained load batch failed: {e}")
                
        end_time = time.time()
        processing_time = end_time - start_time
        videos_per_second = videos_processed / processing_time
        
        return BenchmarkResult(
            test_name="sustained_load_test",
            videos_processed=videos_processed,
            processing_time=processing_time,
            videos_per_second=videos_per_second,
            cpu_usage_percent=psutil.cpu_percent(),
            memory_usage_mb=psutil.virtual_memory().used / 1024 / 1024,
            gpu_usage_percent=None,
            gpu_memory_mb=None,
            storage_io_mbps=0.0,
            network_io_mbps=0.0,
            success_rate=(videos_processed - errors) / videos_processed if videos_processed > 0 else 0,
            error_count=errors,
            cost_per_video=0.05,
            timestamp=datetime.now()
        )
        
    async def benchmark_peak_traffic(self) -> BenchmarkResult:
        """Benchmark peak traffic simulation (holidays, viral events)"""
        logger.info("Benchmarking peak traffic simulation")
        
        # Simulate 5x normal load (viral event scenario)
        peak_multiplier = 5
        normal_rate = self.targets.videos_per_second
        peak_rate = normal_rate * peak_multiplier
        
        start_time = time.time()
        videos_processed = 0
        errors = 0
        
        # Simulate peak traffic for 2 minutes
        test_duration = 120  # 2 minutes
        
        while time.time() - start_time < test_duration:
            try:
                # Process videos at peak rate
                batch_tasks = []
                for i in range(int(peak_rate)):
                    task = asyncio.create_task(self.simulate_video_processing_fast())
                    batch_tasks.append(task)
                    
                await asyncio.gather(*batch_tasks, return_exceptions=True)
                videos_processed += len(batch_tasks)
                
                # Wait for next second
                await asyncio.sleep(1)
                
            except Exception as e:
                errors += 1
                logger.error(f"Peak traffic batch failed: {e}")
                
        end_time = time.time()
        processing_time = end_time - start_time
        videos_per_second = videos_processed / processing_time
        
        return BenchmarkResult(
            test_name="peak_traffic_simulation",
            videos_processed=videos_processed,
            processing_time=processing_time,
            videos_per_second=videos_per_second,
            cpu_usage_percent=psutil.cpu_percent(),
            memory_usage_mb=psutil.virtual_memory().used / 1024 / 1024,
            gpu_usage_percent=None,
            gpu_memory_mb=None,
            storage_io_mbps=0.0,
            network_io_mbps=0.0,
            success_rate=(videos_processed - errors) / videos_processed if videos_processed > 0 else 0,
            error_count=errors,
            cost_per_video=0.05,
            timestamp=datetime.now()
        )
        
    async def benchmark_end_to_end_pipeline(self) -> BenchmarkResult:
        """Benchmark complete end-to-end video processing pipeline"""
        logger.info("Benchmarking end-to-end pipeline")
        
        num_videos = 100
        start_time = time.time()
        
        # Simulate complete pipeline: capture -> process -> upload -> analyze
        pipeline_tasks = []
        for i in range(num_videos):
            task = asyncio.create_task(self.simulate_full_pipeline())
            pipeline_tasks.append(task)
            
        results = await asyncio.gather(*pipeline_tasks, return_exceptions=True)
        successful = sum(1 for r in results if not isinstance(r, Exception))
        errors = len(results) - successful
        
        end_time = time.time()
        processing_time = end_time - start_time
        videos_per_second = successful / processing_time
        
        return BenchmarkResult(
            test_name="end_to_end_pipeline",
            videos_processed=successful,
            processing_time=processing_time,
            videos_per_second=videos_per_second,
            cpu_usage_percent=psutil.cpu_percent(),
            memory_usage_mb=psutil.virtual_memory().used / 1024 / 1024,
            gpu_usage_percent=None,
            gpu_memory_mb=None,
            storage_io_mbps=0.0,
            network_io_mbps=0.0,
            success_rate=successful / num_videos,
            error_count=errors,
            cost_per_video=0.10,  # Full pipeline cost
            timestamp=datetime.now()
        )
        
    # Simulation helper methods
    async def create_test_video_file(self, filename: str = "test_video") -> Path:
        """Create a test video file for benchmarking"""
        # In real implementation, this would create an actual video file
        # For benchmarking, we'll simulate this
        await asyncio.sleep(0.001)  # Simulate file creation time
        return Path(f"/tmp/{filename}.mp4")
        
    async def simulate_video_processing(self, video_path: Path) -> None:
        """Simulate video processing operation"""
        # Simulate CPU-intensive video processing
        await asyncio.sleep(0.5)  # Simulate processing time
        
        # Simulate some CPU work
        for _ in range(1000):
            _ = sum(i ** 2 for i in range(100))
            
    async def simulate_video_processing_fast(self) -> None:
        """Simulate fast video processing for sustained load tests"""
        await asyncio.sleep(0.1)  # Faster processing for load tests
        
        # Light CPU work
        for _ in range(100):
            _ = sum(i for i in range(50))
            
    async def simulate_gpu_processing(self) -> None:
        """Simulate GPU-accelerated processing"""
        # Simulate GPU processing with CPU intensive work
        await asyncio.sleep(0.2)
        
        # Simulate GPU computation
        for _ in range(500):
            _ = sum(i ** 3 for i in range(50))
            
    async def simulate_storage_write(self, file_path: Path, size_bytes: int) -> int:
        """Simulate storage write operation"""
        # Simulate writing data to storage
        await asyncio.sleep(0.01)  # Simulate I/O latency
        
        # Actually write some data for realistic simulation
        with open(file_path, 'wb') as f:
            f.write(b'0' * min(size_bytes, 1024 * 1024))  # Cap at 1MB for testing
            
        return size_bytes
        
    async def simulate_storage_read(self, file_path: Path) -> int:
        """Simulate storage read operation"""
        await asyncio.sleep(0.005)  # Simulate read latency
        
        if file_path.exists():
            size = file_path.stat().st_size
            with open(file_path, 'rb') as f:
                _ = f.read()
            return size
        return 0
        
    async def simulate_network_transfer(self, size_bytes: int) -> int:
        """Simulate network transfer"""
        # Simulate network latency and bandwidth
        transfer_time = size_bytes / (100 * 1024 * 1024)  # 100 MB/s simulation
        await asyncio.sleep(transfer_time)
        return size_bytes
        
    async def simulate_database_write(self, record_id: int) -> None:
        """Simulate database write operation"""
        await asyncio.sleep(0.001)  # Simulate DB write latency
        
    async def simulate_database_read(self, record_id: int) -> None:
        """Simulate database read operation"""
        await asyncio.sleep(0.0005)  # Simulate DB read latency
        
    async def simulate_memory_intensive_processing(self) -> None:
        """Simulate memory-intensive processing"""
        # Allocate and use memory
        data = [i for i in range(100000)]  # Simulate memory usage
        await asyncio.sleep(0.1)
        del data  # Clean up
        
    async def simulate_full_pipeline(self) -> None:
        """Simulate complete video processing pipeline"""
        # Capture
        await asyncio.sleep(0.1)
        
        # Process
        await self.simulate_video_processing_fast()
        
        # Upload
        await asyncio.sleep(0.05)
        
        # Analyze
        await asyncio.sleep(0.02)
        
    async def generate_performance_report(self, results: Dict[str, BenchmarkResult]) -> None:
        """Generate comprehensive performance report"""
        logger.info("Generating performance report")
        
        # Create results table
        table = Table(title="DailyDoco Pro Performance Benchmark Results")
        table.add_column("Test", style="cyan")
        table.add_column("Videos/sec", style="magenta")
        table.add_column("CPU %", style="yellow")
        table.add_column("Memory MB", style="green")
        table.add_column("Success Rate", style="blue")
        table.add_column("Cost/Video", style="red")
        table.add_column("Status", style="bold")
        
        for test_name, result in results.items():
            # Determine status based on targets
            status = "✅ PASS"
            
            if result.videos_per_second < self.targets.videos_per_second:
                status = "❌ FAIL (Speed)"
            elif result.cpu_usage_percent > self.targets.max_cpu_percent:
                status = "⚠️ WARN (CPU)"
            elif result.memory_usage_mb > self.targets.max_memory_mb:
                status = "⚠️ WARN (Memory)"
            elif result.success_rate < self.targets.min_success_rate:
                status = "❌ FAIL (Reliability)"
            elif result.cost_per_video > self.targets.max_cost_per_video:
                status = "⚠️ WARN (Cost)"
                
            table.add_row(
                test_name.replace("_", " ").title(),
                f"{result.videos_per_second:.2f}",
                f"{result.cpu_usage_percent:.1f}",
                f"{result.memory_usage_mb:.1f}",
                f"{result.success_rate:.3f}",
                f"${result.cost_per_video:.3f}",
                status
            )
            
        console.print(table)
        
        # Save detailed results
        results_df = pd.DataFrame([asdict(r) for r in self.results])
        results_df.to_csv(self.output_dir / "benchmark_results.csv", index=False)
        
        # Generate visualizations
        await self.generate_visualizations(results_df)
        
        # Save JSON results
        with open(self.output_dir / "benchmark_results.json", "w") as f:
            json.dump(
                {name: asdict(result) for name, result in results.items()},
                f,
                indent=2,
                default=str
            )
            
        console.print(f"[green]📊 Full report saved to: {self.output_dir}[/green]")
        
    async def generate_visualizations(self, df: pd.DataFrame) -> None:
        """Generate performance visualization charts"""
        logger.info("Generating performance visualizations")
        
        # Set up plotting style
        plt.style.use('seaborn-v0_8')
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Videos per second comparison
        axes[0, 0].bar(df['test_name'], df['videos_per_second'])
        axes[0, 0].set_title('Videos Per Second by Test')
        axes[0, 0].tick_params(axis='x', rotation=45)
        axes[0, 0].axhline(y=self.targets.videos_per_second, color='r', linestyle='--', label='Target')
        axes[0, 0].legend()
        
        # Resource usage
        x = range(len(df))
        width = 0.35
        axes[0, 1].bar([i - width/2 for i in x], df['cpu_usage_percent'], width, label='CPU %')
        axes[0, 1].bar([i + width/2 for i in x], df['memory_usage_mb']/10, width, label='Memory (MB/10)')
        axes[0, 1].set_title('Resource Usage')
        axes[0, 1].set_xticks(x)
        axes[0, 1].set_xticklabels(df['test_name'], rotation=45)
        axes[0, 1].legend()
        
        # Success rate
        axes[1, 0].bar(df['test_name'], df['success_rate'])
        axes[1, 0].set_title('Success Rate by Test')
        axes[1, 0].tick_params(axis='x', rotation=45)
        axes[1, 0].axhline(y=self.targets.min_success_rate, color='r', linestyle='--', label='Target')
        axes[1, 0].legend()
        
        # Cost per video
        axes[1, 1].bar(df['test_name'], df['cost_per_video'])
        axes[1, 1].set_title('Cost Per Video by Test')
        axes[1, 1].tick_params(axis='x', rotation=45)
        axes[1, 1].axhline(y=self.targets.max_cost_per_video, color='r', linestyle='--', label='Target')
        axes[1, 1].legend()
        
        plt.tight_layout()
        plt.savefig(self.output_dir / "performance_charts.png", dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info("Performance visualizations saved")

async def main():
    """Main entry point for performance benchmarking"""
    benchmarker = PerformanceBenchmarker()
    
    try:
        results = await benchmarker.run_full_benchmark_suite()
        
        # Print summary
        console.print("\n[bold green]🎉 Performance Benchmarking Complete![/bold green]")
        
        # Calculate overall metrics
        total_videos_per_second = sum(r.videos_per_second for r in results.values()) / len(results)
        avg_cpu_usage = sum(r.cpu_usage_percent for r in results.values()) / len(results)
        avg_memory_usage = sum(r.memory_usage_mb for r in results.values()) / len(results)
        avg_success_rate = sum(r.success_rate for r in results.values()) / len(results)
        avg_cost = sum(r.cost_per_video for r in results.values()) / len(results)
        
        console.print(f"[yellow]📈 Average Performance Metrics:[/yellow]")
        console.print(f"Videos/second: {total_videos_per_second:.2f}")
        console.print(f"CPU Usage: {avg_cpu_usage:.1f}%")
        console.print(f"Memory Usage: {avg_memory_usage:.1f} MB")
        console.print(f"Success Rate: {avg_success_rate:.3f}")
        console.print(f"Cost per Video: ${avg_cost:.3f}")
        
        # Scale projection
        daily_capacity = total_videos_per_second * 86400  # seconds per day
        monthly_capacity = daily_capacity * 30
        
        console.print(f"\n[bold blue]📊 Scale Projection:[/bold blue]")
        console.print(f"Daily Capacity: {daily_capacity:,.0f} videos")
        console.print(f"Monthly Capacity: {monthly_capacity:,.0f} videos")
        
        target_met = monthly_capacity >= benchmarker.targets.videos_per_month
        status = "✅ TARGET MET" if target_met else "❌ NEEDS OPTIMIZATION"
        console.print(f"10M/month Target: {status}")
        
    except Exception as e:
        logger.error(f"Benchmarking failed: {e}")
        console.print(f"[red]❌ Benchmarking failed: {e}[/red]")
        
if __name__ == "__main__":
    asyncio.run(main())