"""Celery application for distributed processing infrastructure."""

import os
from celery import Celery
from celery.signals import worker_ready, worker_shutdown
from kombu import Queue
import structlog

from ..config.settings import get_settings, get_celery_config

logger = structlog.get_logger()
settings = get_settings()

# Create Celery application
celery_app = Celery('youtube_automation_pipeline')

# Load configuration
celery_config = get_celery_config()
celery_app.conf.update(celery_config)

# Define queues with priorities
celery_app.conf.task_routes = {
    # High priority tasks - critical uploads and processing
    'youtube_automation_pipeline.workers.youtube_upload.upload_video': {
        'queue': 'high_priority',
        'priority': 9
    },
    'youtube_automation_pipeline.workers.video_processing.process_urgent_video': {
        'queue': 'high_priority', 
        'priority': 9
    },
    
    # Normal priority tasks - regular processing
    'youtube_automation_pipeline.workers.video_processing.process_video': {
        'queue': 'normal_priority',
        'priority': 5
    },
    'youtube_automation_pipeline.workers.content_generation.generate_content': {
        'queue': 'normal_priority',
        'priority': 5
    },
    
    # Low priority tasks - analytics and optimization
    'youtube_automation_pipeline.workers.analytics.collect_analytics': {
        'queue': 'low_priority',
        'priority': 1
    },
    'youtube_automation_pipeline.workers.optimization.optimize_thumbnails': {
        'queue': 'low_priority',
        'priority': 1
    }
}

# Configure queues
celery_app.conf.task_queues = (
    Queue('high_priority', routing_key='high_priority', queue_arguments={'x-max-priority': 10}),
    Queue('normal_priority', routing_key='normal_priority', queue_arguments={'x-max-priority': 5}),
    Queue('low_priority', routing_key='low_priority', queue_arguments={'x-max-priority': 1}),
    Queue('video_processing', routing_key='video_processing'),
    Queue('youtube_upload', routing_key='youtube_upload'),
    Queue('content_generation', routing_key='content_generation'),
)

# Task settings
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Worker settings
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    
    # Result backend settings
    result_expires=3600,  # 1 hour
    result_backend_transport_options={
        'priority_steps': list(range(10)),
        'sep': ':',
        'queue_order_strategy': 'priority',
    },
    
    # Task execution settings
    task_soft_time_limit=3600,  # 1 hour soft limit
    task_time_limit=7200,       # 2 hour hard limit
    task_reject_on_worker_lost=True,
    
    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        'collect-analytics-hourly': {
            'task': 'youtube_automation_pipeline.workers.analytics.collect_all_analytics',
            'schedule': 3600.0,  # Every hour
        },
        'optimize-upload-schedule': {
            'task': 'youtube_automation_pipeline.workers.scheduler.optimize_upload_schedule',
            'schedule': 1800.0,  # Every 30 minutes
        },
        'health-check': {
            'task': 'youtube_automation_pipeline.workers.monitoring.health_check',
            'schedule': 300.0,   # Every 5 minutes
        },
        'quota-management': {
            'task': 'youtube_automation_pipeline.workers.youtube_upload.manage_quotas',
            'schedule': 900.0,   # Every 15 minutes
        },
        'performance-optimization': {
            'task': 'youtube_automation_pipeline.workers.optimization.optimize_performance',
            'schedule': 3600.0,  # Every hour
        }
    }
)


@worker_ready.connect
def worker_ready_handler(sender=None, **kwargs):
    """Handle worker ready signal."""
    logger.info(
        "Celery worker ready",
        worker_name=sender.hostname,
        queues=[queue.name for queue in sender.app.conf.task_queues]
    )


@worker_shutdown.connect  
def worker_shutdown_handler(sender=None, **kwargs):
    """Handle worker shutdown signal."""
    logger.info(
        "Celery worker shutting down",
        worker_name=sender.hostname
    )


# Auto-discover tasks
celery_app.autodiscover_tasks([
    'youtube_automation_pipeline.workers.video_processing',
    'youtube_automation_pipeline.workers.youtube_upload', 
    'youtube_automation_pipeline.workers.content_generation',
    'youtube_automation_pipeline.workers.analytics',
    'youtube_automation_pipeline.workers.optimization',
    'youtube_automation_pipeline.workers.monitoring',
    'youtube_automation_pipeline.workers.scheduler'
])


# Error handling
@celery_app.task(bind=True)
def debug_task(self):
    """Debug task for testing."""
    print(f'Request: {self.request!r}')
    return 'Debug task completed'


def get_celery_app():
    """Get the Celery application instance."""
    return celery_app
