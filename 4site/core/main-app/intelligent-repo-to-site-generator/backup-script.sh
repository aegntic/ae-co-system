#!/bin/bash

# Production Database Backup Script for 4site.pro
# Run via cron: 0 2 * * * /path/to/backup-script.sh

set -e  # Exit on any error

# Configuration
SUPABASE_PROJECT_ID="YOUR-PROJECT-ID-HERE"
BACKUP_DIR="/backups/4site-pro"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SLACK_WEBHOOK_URL="YOUR-SLACK-WEBHOOK-URL-HERE"

# AWS S3 Configuration
S3_BUCKET="4sitepro-backups"
S3_PREFIX="db"

# Logging
LOG_FILE="$BACKUP_DIR/backup_$TIMESTAMP.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "Starting database backup for 4site.pro..."

# Check if required environment variables are set
if [[ -z "$DATABASE_URL" ]]; then
    log "ERROR: DATABASE_URL environment variable not set"
    exit 1
fi

# Backup database
log "Creating database dump..."
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

if pg_dump "$DATABASE_URL" > "$BACKUP_FILE"; then
    log "Database dump completed successfully"
else
    log "ERROR: Database dump failed"
    exit 1
fi

# Get backup file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup file size: $BACKUP_SIZE"

# Compress backup
log "Compressing backup..."
if gzip "$BACKUP_FILE"; then
    log "Backup compressed successfully"
    COMPRESSED_FILE="$BACKUP_FILE.gz"
else
    log "ERROR: Backup compression failed"
    exit 1
fi

# Upload to S3 if AWS CLI is available
if command -v aws &> /dev/null; then
    log "Uploading backup to S3..."
    
    S3_KEY="$S3_PREFIX/backup_$TIMESTAMP.sql.gz"
    
    if aws s3 cp "$COMPRESSED_FILE" "s3://$S3_BUCKET/$S3_KEY" --storage-class GLACIER; then
        log "Backup uploaded to S3 successfully: s3://$S3_BUCKET/$S3_KEY"
    else
        log "WARNING: S3 upload failed, backup saved locally only"
    fi
else
    log "WARNING: AWS CLI not found, skipping S3 upload"
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gzip -t "$COMPRESSED_FILE"; then
    log "Backup integrity check passed"
else
    log "ERROR: Backup integrity check failed"
    exit 1
fi

# Clean up old local backups
log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
log "Deleted $DELETED_COUNT old backup files"

# Calculate final backup info
COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
COMPRESSION_RATIO=$(echo "scale=1; $(stat -c%s "$COMPRESSED_FILE") * 100 / $(stat -c%s "${BACKUP_FILE%.*}")" | bc)

# Send notification to Slack
send_slack_notification() {
    local status="$1"
    local message="$2"
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]] && [[ "$SLACK_WEBHOOK_URL" != "YOUR-SLACK-WEBHOOK-URL-HERE" ]]; then
        local color
        case "$status" in
            "success") color="good" ;;
            "warning") color="warning" ;;
            "error") color="danger" ;;
        esac
        
        local payload=$(cat <<EOF
{
  "attachments": [
    {
      "color": "$color",
      "title": "4site.pro Database Backup",
      "fields": [
        {
          "title": "Status",
          "value": "$status",
          "short": true
        },
        {
          "title": "Timestamp",
          "value": "$TIMESTAMP",
          "short": true
        },
        {
          "title": "File Size",
          "value": "$COMPRESSED_SIZE",
          "short": true
        },
        {
          "title": "Compression",
          "value": "$COMPRESSION_RATIO%",
          "short": true
        },
        {
          "title": "Message",
          "value": "$message",
          "short": false
        }
      ]
    }
  ]
}
EOF
        )
        
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "$payload" \
            --silent
    fi
}

# Generate backup report
generate_report() {
    cat <<EOF > "$BACKUP_DIR/backup_report_$TIMESTAMP.json"
{
  "timestamp": "$TIMESTAMP",
  "status": "success",
  "backup_file": "backup_$TIMESTAMP.sql.gz",
  "original_size": "$(stat -c%s "${BACKUP_FILE%.*}" 2>/dev/null || echo 0)",
  "compressed_size": "$(stat -c%s "$COMPRESSED_FILE")",
  "compression_ratio": "$COMPRESSION_RATIO%",
  "s3_uploaded": $(command -v aws &> /dev/null && echo "true" || echo "false"),
  "duration_seconds": $SECONDS,
  "database_url": "$(echo "$DATABASE_URL" | sed 's/:[^@]*@/:***@/')"
}
EOF
}

# Success notification
log "Backup completed successfully!"
log "File: backup_$TIMESTAMP.sql.gz"
log "Size: $COMPRESSED_SIZE (${COMPRESSION_RATIO}% of original)"
log "Duration: ${SECONDS} seconds"

generate_report
send_slack_notification "success" "Database backup completed successfully. File: backup_$TIMESTAMP.sql.gz ($COMPRESSED_SIZE)"

# Optional: Run database health check after backup
if command -v psql &> /dev/null; then
    log "Running post-backup health check..."
    
    HEALTH_CHECK=$(psql "$DATABASE_URL" -t -c "
        SELECT json_build_object(
            'total_tables', COUNT(*),
            'total_size', pg_size_pretty(pg_database_size(current_database())),
            'active_connections', (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')
        )
        FROM information_schema.tables 
        WHERE table_schema = 'public';
    ")
    
    log "Database health: $HEALTH_CHECK"
fi

log "Backup script completed successfully"
exit 0