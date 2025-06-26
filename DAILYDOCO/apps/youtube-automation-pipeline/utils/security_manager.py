"""Security manager for authentication, authorization, and content compliance."""

import asyncio
import hashlib
import secrets
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from enum import Enum
import jwt
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import re
import structlog
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from ..config.settings import get_settings
from ..models.security_models import (
    User, Channel, AccessToken, Permission, 
    SecurityEvent, ContentScanResult
)

logger = structlog.get_logger()
settings = get_settings()


class SecurityLevel(Enum):
    """Security access levels."""
    PUBLIC = "public"
    AUTHENTICATED = "authenticated"
    CHANNEL_OWNER = "channel_owner"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class PermissionType(Enum):
    """Permission types."""
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    UPLOAD = "upload"
    MANAGE_CHANNELS = "manage_channels"
    VIEW_ANALYTICS = "view_analytics"
    ADMIN_ACCESS = "admin_access"


class ThreatLevel(Enum):
    """Threat levels for security events."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SecurityContext:
    """Security context for requests."""
    user_id: Optional[str]
    channel_ids: List[str]
    permissions: List[str]
    security_level: SecurityLevel
    session_id: str
    ip_address: str
    user_agent: str
    authenticated_at: datetime
    expires_at: datetime


@dataclass
class ContentScanConfig:
    """Configuration for content scanning."""
    scan_text: bool = True
    scan_audio: bool = True
    scan_video: bool = False  # Expensive, enable for high-risk content
    banned_keywords: List[str] = None
    allowed_languages: List[str] = None
    max_profanity_score: float = 0.1
    enable_copyright_detection: bool = True
    enable_adult_content_detection: bool = True


class SecurityManager:
    """Comprehensive security manager for authentication and authorization."""
    
    def __init__(self):
        self.settings = get_settings()
        self.password_context = CryptContext(
            schemes=["bcrypt"], 
            deprecated="auto"
        )
        
        # Initialize encryption
        self._init_encryption()
        
        # Rate limiting
        self.rate_limits: Dict[str, List[float]] = {}
        
        # Active sessions
        self.active_sessions: Dict[str, SecurityContext] = {}
        
        # Security event buffer
        self.security_events: List[SecurityEvent] = []
        
        logger.info("Security manager initialized")
    
    def _init_encryption(self) -> None:
        """Initialize encryption components."""
        
        # Generate or load encryption key
        key_material = self.settings.security.jwt_secret_key.encode()
        
        # Derive key for Fernet encryption
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'dailydoco_salt',  # In production, use random salt
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(key_material))
        self.fernet = Fernet(key)
        
        logger.info("Encryption initialized")
    
    # Authentication Methods
    
    async def authenticate_user(
        self,
        username: str,
        password: str,
        ip_address: str,
        user_agent: str
    ) -> Optional[SecurityContext]:
        """Authenticate user credentials."""
        
        try:
            # Rate limiting check
            if not await self._check_rate_limit(f"auth_{ip_address}", 5, 300):  # 5 attempts per 5 minutes
                await self._log_security_event(
                    "authentication_rate_limit",
                    ThreatLevel.MEDIUM,
                    {"ip_address": ip_address, "username": username}
                )
                return None
            
            # Find user (this would query your database)
            user = await self._get_user_by_username(username)
            
            if not user or not self.password_context.verify(password, user.password_hash):
                await self._log_security_event(
                    "authentication_failure",
                    ThreatLevel.LOW,
                    {"ip_address": ip_address, "username": username}
                )
                return None
            
            # Check if user is active
            if not user.is_active:
                await self._log_security_event(
                    "inactive_user_login_attempt",
                    ThreatLevel.MEDIUM,
                    {"user_id": user.id, "ip_address": ip_address}
                )
                return None
            
            # Get user permissions and channels
            permissions = await self._get_user_permissions(user.id)
            channels = await self._get_user_channels(user.id)
            
            # Create security context
            session_id = secrets.token_urlsafe(32)
            now = datetime.now(timezone.utc)
            
            security_context = SecurityContext(
                user_id=user.id,
                channel_ids=[ch.id for ch in channels],
                permissions=[p.name for p in permissions],
                security_level=self._determine_security_level(permissions),
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent,
                authenticated_at=now,
                expires_at=now + timedelta(hours=24)
            )
            
            # Store active session
            self.active_sessions[session_id] = security_context
            
            await self._log_security_event(
                "authentication_success",
                ThreatLevel.LOW,
                {"user_id": user.id, "ip_address": ip_address}
            )
            
            logger.info(
                "User authenticated successfully",
                user_id=user.id,
                session_id=session_id
            )
            
            return security_context
            
        except Exception as e:
            logger.error("Authentication error", error=str(e))
            return None
    
    async def generate_access_token(
        self,
        security_context: SecurityContext
    ) -> str:
        """Generate JWT access token."""
        
        try:
            payload = {
                'user_id': security_context.user_id,
                'session_id': security_context.session_id,
                'permissions': security_context.permissions,
                'channel_ids': security_context.channel_ids,
                'iat': int(time.time()),
                'exp': int(security_context.expires_at.timestamp()),
                'iss': 'dailydoco-youtube-pipeline'
            }
            
            token = jwt.encode(
                payload,
                self.settings.security.jwt_secret_key,
                algorithm=self.settings.security.jwt_algorithm
            )
            
            return token
            
        except Exception as e:
            logger.error("Token generation failed", error=str(e))
            raise
    
    async def validate_access_token(
        self,
        token: str,
        ip_address: str
    ) -> Optional[SecurityContext]:
        """Validate JWT access token."""
        
        try:
            # Decode token
            payload = jwt.decode(
                token,
                self.settings.security.jwt_secret_key,
                algorithms=[self.settings.security.jwt_algorithm]
            )
            
            session_id = payload.get('session_id')
            user_id = payload.get('user_id')
            
            # Check if session is still active
            if session_id not in self.active_sessions:
                await self._log_security_event(
                    "invalid_session_token",
                    ThreatLevel.MEDIUM,
                    {"user_id": user_id, "session_id": session_id, "ip_address": ip_address}
                )
                return None
            
            security_context = self.active_sessions[session_id]
            
            # Verify IP address consistency (optional security measure)
            if self.settings.security.enable_ip_validation and security_context.ip_address != ip_address:
                await self._log_security_event(
                    "ip_address_mismatch",
                    ThreatLevel.HIGH,
                    {
                        "user_id": user_id,
                        "original_ip": security_context.ip_address,
                        "current_ip": ip_address
                    }
                )
                return None
            
            # Check expiration
            if security_context.expires_at <= datetime.now(timezone.utc):
                await self._invalidate_session(session_id)
                return None
            
            return security_context
            
        except jwt.ExpiredSignatureError:
            await self._log_security_event(
                "expired_token_usage",
                ThreatLevel.LOW,
                {"ip_address": ip_address}
            )
            return None
        except jwt.InvalidTokenError:
            await self._log_security_event(
                "invalid_token_usage",
                ThreatLevel.MEDIUM,
                {"ip_address": ip_address}
            )
            return None
        except Exception as e:
            logger.error("Token validation error", error=str(e))
            return None
    
    # Authorization Methods
    
    async def check_permission(
        self,
        security_context: SecurityContext,
        permission: PermissionType,
        resource_id: Optional[str] = None
    ) -> bool:
        """Check if user has specific permission."""
        
        try:
            # Super admins have all permissions
            if security_context.security_level == SecurityLevel.SUPER_ADMIN:
                return True
            
            # Check direct permission
            if permission.value in security_context.permissions:
                return True
            
            # Check resource-specific permissions
            if resource_id and permission in [PermissionType.READ, PermissionType.WRITE, PermissionType.DELETE]:
                # Check if user owns the channel/resource
                if resource_id in security_context.channel_ids:
                    return True
            
            return False
            
        except Exception as e:
            logger.error("Permission check error", error=str(e))
            return False
    
    async def check_channel_access(
        self,
        security_context: SecurityContext,
        channel_id: str,
        action: PermissionType
    ) -> bool:
        """Check if user can perform action on specific channel."""
        
        try:
            # Super admins have access to all channels
            if security_context.security_level == SecurityLevel.SUPER_ADMIN:
                return True
            
            # Check if user owns the channel
            if channel_id in security_context.channel_ids:
                return True
            
            # Check if user has global permission for this action
            if action.value in security_context.permissions:
                return True
            
            return False
            
        except Exception as e:
            logger.error("Channel access check error", error=str(e))
            return False
    
    # Content Compliance Methods
    
    async def scan_content(
        self,
        content: Dict[str, Any],
        config: ContentScanConfig
    ) -> ContentScanResult:
        """Scan content for compliance violations."""
        
        try:
            scan_result = ContentScanResult(
                content_id=content.get('id', 'unknown'),
                scan_timestamp=datetime.now(timezone.utc),
                violations=[],
                risk_score=0.0,
                approved=True
            )
            
            # Text content scanning
            if config.scan_text and 'text' in content:
                text_violations = await self._scan_text_content(
                    content['text'], config
                )
                scan_result.violations.extend(text_violations)
            
            # Audio content scanning
            if config.scan_audio and 'audio_path' in content:
                audio_violations = await self._scan_audio_content(
                    content['audio_path'], config
                )
                scan_result.violations.extend(audio_violations)
            
            # Video content scanning
            if config.scan_video and 'video_path' in content:
                video_violations = await self._scan_video_content(
                    content['video_path'], config
                )
                scan_result.violations.extend(video_violations)
            
            # Calculate overall risk score
            if scan_result.violations:
                scan_result.risk_score = sum(
                    v.severity_score for v in scan_result.violations
                ) / len(scan_result.violations)
                
                # Determine if content is approved
                scan_result.approved = scan_result.risk_score < 0.7
            
            logger.info(
                "Content scan completed",
                content_id=scan_result.content_id,
                violations=len(scan_result.violations),
                risk_score=scan_result.risk_score,
                approved=scan_result.approved
            )
            
            return scan_result
            
        except Exception as e:
            logger.error("Content scanning failed", error=str(e))
            # Return failed scan result
            return ContentScanResult(
                content_id=content.get('id', 'unknown'),
                scan_timestamp=datetime.now(timezone.utc),
                violations=[],
                risk_score=1.0,
                approved=False,
                error_message=str(e)
            )
    
    async def _scan_text_content(
        self,
        text: str,
        config: ContentScanConfig
    ) -> List[Dict[str, Any]]:
        """Scan text content for violations."""
        
        violations = []
        
        try:
            # Check banned keywords
            if config.banned_keywords:
                text_lower = text.lower()
                for keyword in config.banned_keywords:
                    if keyword.lower() in text_lower:
                        violations.append({
                            'type': 'banned_keyword',
                            'severity_score': 0.8,
                            'description': f"Banned keyword detected: {keyword}",
                            'location': text_lower.find(keyword.lower())
                        })
            
            # Check for profanity (simplified)
            profanity_patterns = [
                r'\b(fuck|shit|damn|bitch)\b',
                r'\b(asshole|bastard)\b'
            ]
            
            for pattern in profanity_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    violations.append({
                        'type': 'profanity',
                        'severity_score': 0.6,
                        'description': f"Profanity detected: {', '.join(matches)}",
                        'count': len(matches)
                    })
            
            # Check for spam patterns
            spam_indicators = [
                r'(click here|buy now|limited time)',
                r'(\$\d+|free money|get rich)',
                r'(subscribe|like and subscribe){3,}'
            ]
            
            for pattern in spam_indicators:
                if re.search(pattern, text, re.IGNORECASE):
                    violations.append({
                        'type': 'spam_indicator',
                        'severity_score': 0.4,
                        'description': 'Potential spam content detected'
                    })
            
            # Check for copyright mentions
            copyright_patterns = [
                r'(?i)(copyright|©|trademark|®)',
                r'(?i)(all rights reserved|proprietary)'
            ]
            
            for pattern in copyright_patterns:
                if re.search(pattern, text):
                    violations.append({
                        'type': 'copyright_mention',
                        'severity_score': 0.3,
                        'description': 'Copyright-related content detected'
                    })
            
        except Exception as e:
            logger.error("Text content scanning failed", error=str(e))
        
        return violations
    
    async def _scan_audio_content(
        self,
        audio_path: str,
        config: ContentScanConfig
    ) -> List[Dict[str, Any]]:
        """Scan audio content for violations."""
        
        violations = []
        
        try:
            # This would integrate with audio analysis services
            # For now, return placeholder
            
            # Check audio duration
            # Check for copyrighted music
            # Check for inappropriate audio content
            
            logger.info("Audio content scan completed", audio_path=audio_path)
            
        except Exception as e:
            logger.error("Audio content scanning failed", error=str(e))
        
        return violations
    
    async def _scan_video_content(
        self,
        video_path: str,
        config: ContentScanConfig
    ) -> List[Dict[str, Any]]:
        """Scan video content for violations."""
        
        violations = []
        
        try:
            # This would integrate with video analysis services
            # For now, return placeholder
            
            # Check for inappropriate visual content
            # Check for copyrighted video content
            # Check for violence or adult content
            
            logger.info("Video content scan completed", video_path=video_path)
            
        except Exception as e:
            logger.error("Video content scanning failed", error=str(e))
        
        return violations
    
    # Rate Limiting
    
    async def _check_rate_limit(
        self,
        identifier: str,
        limit: int,
        window_seconds: int
    ) -> bool:
        """Check if request is within rate limits."""
        
        try:
            now = time.time()
            window_start = now - window_seconds
            
            # Clean old entries
            if identifier in self.rate_limits:
                self.rate_limits[identifier] = [
                    timestamp for timestamp in self.rate_limits[identifier]
                    if timestamp > window_start
                ]
            else:
                self.rate_limits[identifier] = []
            
            # Check if within limit
            if len(self.rate_limits[identifier]) >= limit:
                return False
            
            # Add current request
            self.rate_limits[identifier].append(now)
            return True
            
        except Exception as e:
            logger.error("Rate limit check failed", error=str(e))
            return True  # Allow on error
    
    # Encryption/Decryption
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data."""
        try:
            return self.fernet.encrypt(data.encode()).decode()
        except Exception as e:
            logger.error("Encryption failed", error=str(e))
            raise
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data."""
        try:
            return self.fernet.decrypt(encrypted_data.encode()).decode()
        except Exception as e:
            logger.error("Decryption failed", error=str(e))
            raise
    
    # Security Event Logging
    
    async def _log_security_event(
        self,
        event_type: str,
        threat_level: ThreatLevel,
        details: Dict[str, Any]
    ) -> None:
        """Log security event."""
        
        try:
            event = SecurityEvent(
                timestamp=datetime.now(timezone.utc),
                event_type=event_type,
                threat_level=threat_level,
                details=details,
                ip_address=details.get('ip_address'),
                user_id=details.get('user_id')
            )
            
            self.security_events.append(event)
            
            # Alert on high/critical threats
            if threat_level in [ThreatLevel.HIGH, ThreatLevel.CRITICAL]:
                await self._send_security_alert(event)
            
            logger.warning(
                "Security event logged",
                event_type=event_type,
                threat_level=threat_level.value,
                details=details
            )
            
        except Exception as e:
            logger.error("Security event logging failed", error=str(e))
    
    async def _send_security_alert(self, event: SecurityEvent) -> None:
        """Send security alert for high-priority events."""
        
        try:
            # This would integrate with alerting systems
            # (email, Slack, webhook, etc.)
            
            logger.critical(
                "SECURITY ALERT",
                event_type=event.event_type,
                threat_level=event.threat_level.value,
                details=event.details
            )
            
        except Exception as e:
            logger.error("Security alert failed", error=str(e))
    
    # Session Management
    
    async def _invalidate_session(self, session_id: str) -> None:
        """Invalidate user session."""
        
        try:
            if session_id in self.active_sessions:
                security_context = self.active_sessions[session_id]
                del self.active_sessions[session_id]
                
                await self._log_security_event(
                    "session_invalidated",
                    ThreatLevel.LOW,
                    {
                        "session_id": session_id,
                        "user_id": security_context.user_id
                    }
                )
                
                logger.info("Session invalidated", session_id=session_id)
            
        except Exception as e:
            logger.error("Session invalidation failed", error=str(e))
    
    async def cleanup_expired_sessions(self) -> None:
        """Clean up expired sessions."""
        
        try:
            now = datetime.now(timezone.utc)
            expired_sessions = [
                session_id for session_id, context in self.active_sessions.items()
                if context.expires_at <= now
            ]
            
            for session_id in expired_sessions:
                await self._invalidate_session(session_id)
            
            if expired_sessions:
                logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")
            
        except Exception as e:
            logger.error("Session cleanup failed", error=str(e))
    
    # Helper methods (would integrate with actual database)
    
    async def _get_user_by_username(self, username: str) -> Optional[Any]:
        """Get user by username - placeholder for database integration."""
        # This would query your user database
        return None
    
    async def _get_user_permissions(self, user_id: str) -> List[Any]:
        """Get user permissions - placeholder for database integration."""
        # This would query your permissions database
        return []
    
    async def _get_user_channels(self, user_id: str) -> List[Any]:
        """Get user channels - placeholder for database integration."""
        # This would query your channels database
        return []
    
    def _determine_security_level(self, permissions: List[Any]) -> SecurityLevel:
        """Determine security level based on permissions."""
        # This would analyze permissions to determine security level
        return SecurityLevel.AUTHENTICATED
    
    async def get_security_metrics(self) -> Dict[str, Any]:
        """Get security metrics and statistics."""
        
        try:
            now = datetime.now(timezone.utc)
            last_hour = now - timedelta(hours=1)
            
            recent_events = [
                event for event in self.security_events
                if event.timestamp >= last_hour
            ]
            
            return {
                'active_sessions': len(self.active_sessions),
                'recent_security_events': len(recent_events),
                'threat_levels': {
                    level.value: len([
                        event for event in recent_events
                        if event.threat_level == level
                    ])
                    for level in ThreatLevel
                },
                'rate_limit_keys': len(self.rate_limits),
                'timestamp': now.isoformat()
            }
            
        except Exception as e:
            logger.error("Security metrics failed", error=str(e))
            return {}
    
    async def shutdown(self) -> None:
        """Shutdown security manager."""
        logger.info("Shutting down security manager")
        
        # Clear sensitive data
        self.active_sessions.clear()
        self.rate_limits.clear()
        
        logger.info("Security manager shutdown complete")
