"""Semantic Tagger - Extracts and categorizes concepts from content analysis."""

import asyncio
import re
from typing import Dict, Any, List, Set, Tuple
import structlog

logger = structlog.get_logger()


class SemanticTagger:
    """Advanced semantic concept extraction and tagging system."""
    
    def __init__(self):
        self.concept_categories = self._load_concept_categories()
        self.technical_keywords = self._load_technical_keywords()
        self.domain_patterns = self._load_domain_patterns()
        
        logger.info("Semantic tagger initialized", 
                   categories=len(self.concept_categories),
                   keywords=len(self.technical_keywords))
    
    async def extract_concepts(self, ai_insights: Dict[str, Any], actions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract semantic concepts from AI insights and actions."""
        logger.info("Extracting semantic concepts")
        
        concepts = []
        
        # Extract concepts from AI insights
        insight_concepts = await self._extract_from_insights(ai_insights)
        concepts.extend(insight_concepts)
        
        # Extract concepts from actions
        action_concepts = await self._extract_from_actions(actions)
        concepts.extend(action_concepts)
        
        # Extract relationships between concepts
        enriched_concepts = await self._enrich_concepts(concepts)
        
        # Remove duplicates and rank by relevance
        unique_concepts = self._deduplicate_concepts(enriched_concepts)
        ranked_concepts = self._rank_concepts(unique_concepts)
        
        logger.info("Concept extraction completed", total_concepts=len(ranked_concepts))
        return ranked_concepts
    
    async def extract_tags(self, title: str, description: str, main_topics: List[str]) -> List[str]:
        """Extract semantic tags from content for simplified tagging."""
        logger.info("Extracting semantic tags", title=bool(title), description=bool(description), topics=len(main_topics))
        
        tags = []
        
        # Extract from title
        if title:
            title_concepts = await self._extract_from_text(title, "title")
            tags.extend([concept["name"] for concept in title_concepts])
        
        # Extract from description
        if description:
            desc_concepts = await self._extract_from_text(description, "description")
            tags.extend([concept["name"] for concept in desc_concepts])
        
        # Add main topics directly
        tags.extend([topic.lower().strip() for topic in main_topics if topic])
        
        # Clean and deduplicate tags
        clean_tags = []
        seen = set()
        for tag in tags:
            clean_tag = tag.lower().strip()
            if clean_tag and len(clean_tag) > 2 and clean_tag not in seen:
                clean_tags.append(clean_tag)
                seen.add(clean_tag)
        
        logger.info("Tag extraction completed", total_tags=len(clean_tags))
        return clean_tags[:20]  # Limit to top 20 tags
    
    def _load_concept_categories(self) -> Dict[str, Dict[str, Any]]:
        """Load predefined concept categories for classification."""
        return {
            "technology": {
                "description": "Technical concepts, tools, and frameworks",
                "weight": 0.9,
                "patterns": ["api", "framework", "library", "tool", "platform", "service"]
            },
            "methodology": {
                "description": "Development methodologies and practices",
                "weight": 0.8,
                "patterns": ["agile", "devops", "testing", "deployment", "methodology", "practice"]
            },
            "user_experience": {
                "description": "User interface and experience concepts",
                "weight": 0.8,
                "patterns": ["ui", "ux", "interface", "experience", "usability", "design"]
            },
            "performance": {
                "description": "Performance and optimization concepts",
                "weight": 0.7,
                "patterns": ["performance", "optimization", "speed", "efficiency", "scalability"]
            },
            "security": {
                "description": "Security and privacy concepts",
                "weight": 0.9,
                "patterns": ["security", "privacy", "authentication", "authorization", "encryption"]
            },
            "integration": {
                "description": "Integration and interoperability concepts",
                "weight": 0.7,
                "patterns": ["integration", "api", "webhook", "connector", "plugin", "extension"]
            },
            "automation": {
                "description": "Automation and workflow concepts",
                "weight": 0.8,
                "patterns": ["automation", "workflow", "pipeline", "process", "orchestration"]
            },
            "ai_ml": {
                "description": "Artificial intelligence and machine learning",
                "weight": 0.9,
                "patterns": ["ai", "ml", "machine learning", "neural network", "model", "prediction"]
            },
            "data": {
                "description": "Data management and processing concepts",
                "weight": 0.7,
                "patterns": ["data", "database", "storage", "processing", "analytics", "pipeline"]
            },
            "development": {
                "description": "Software development concepts",
                "weight": 0.8,
                "patterns": ["development", "coding", "programming", "debugging", "refactoring"]
            }
        }
    
    def _load_technical_keywords(self) -> Set[str]:
        """Load technical keywords for concept identification."""
        return {
            # Programming languages
            "python", "javascript", "typescript", "rust", "go", "java", "c++", "c#",
            
            # Frameworks and libraries
            "react", "vue", "angular", "express", "fastapi", "django", "flask", "spring",
            "tensorflow", "pytorch", "opencv", "pandas", "numpy",
            
            # Development tools
            "git", "docker", "kubernetes", "jenkins", "github", "gitlab", "vscode",
            "webpack", "babel", "eslint", "prettier", "jest", "cypress",
            
            # Methodologies
            "agile", "scrum", "kanban", "devops", "ci/cd", "tdd", "bdd",
            
            # Architecture patterns
            "microservices", "monolith", "serverless", "event-driven", "mvc", "mvvm",
            
            # Data technologies
            "sql", "nosql", "postgresql", "mongodb", "redis", "elasticsearch",
            
            # Cloud platforms
            "aws", "azure", "gcp", "heroku", "vercel", "netlify",
            
            # AI/ML concepts
            "neural network", "deep learning", "nlp", "computer vision", "reinforcement learning",
            
            # DailyDoco specific
            "screen recording", "documentation", "video processing", "automation",
            "developer productivity", "workflow capture"
        }
    
    def _load_domain_patterns(self) -> Dict[str, List[str]]:
        """Load domain-specific patterns for concept extraction."""
        return {
            "dailydoco_features": [
                "screen capture", "video recording", "documentation automation",
                "developer workflow", "code documentation", "tutorial creation",
                "privacy filtering", "intelligent capture", "ai narration"
            ],
            "video_processing": [
                "video compression", "frame analysis", "audio processing",
                "subtitle generation", "video editing", "format conversion"
            ],
            "user_interface": [
                "user experience", "interface design", "usability", "accessibility",
                "responsive design", "user interaction", "visual design"
            ],
            "developer_tools": [
                "ide integration", "plugin development", "extension", "api integration",
                "developer experience", "toolchain", "build process"
            ]
        }
    
    async def _extract_from_insights(self, ai_insights: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract concepts from AI insights."""
        concepts = []
        
        # Extract from key topics
        key_topics = ai_insights.get("key_topics", [])
        for topic in key_topics:
            concept = await self._create_concept(topic, "topic", ai_insights)
            if concept:
                concepts.append(concept)
        
        # Extract from actionable concepts
        actionable_concepts = ai_insights.get("actionable_concepts", [])
        for concept_data in actionable_concepts:
            concept_name = concept_data.get("concept", "")
            concept = await self._create_concept(concept_name, "actionable", ai_insights, concept_data)
            if concept:
                concepts.append(concept)
        
        # Extract from innovation opportunities
        opportunities = ai_insights.get("innovation_opportunities", [])
        for opportunity in opportunities:
            opportunity_name = opportunity.get("opportunity", "")
            concept = await self._create_concept(opportunity_name, "innovation", ai_insights, opportunity)
            if concept:
                concepts.append(concept)
        
        # Extract from integration points
        integration_points = ai_insights.get("integration_points", [])
        for integration in integration_points:
            feature_area = integration.get("feature_area", "")
            concept = await self._create_concept(feature_area, "integration", ai_insights, integration)
            if concept:
                concepts.append(concept)
        
        return concepts
    
    async def _extract_from_actions(self, actions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract concepts from generated actions."""
        concepts = []
        
        for action in actions:
            # Extract from action title
            title = action.get("title", "")
            title_concepts = await self._extract_from_text(title, "action_title")
            concepts.extend(title_concepts)
            
            # Extract from action description
            description = action.get("description", "")
            desc_concepts = await self._extract_from_text(description, "action_description")
            concepts.extend(desc_concepts)
            
            # Extract from technical requirements
            tech_requirements = action.get("technical_requirements", [])
            for requirement in tech_requirements:
                concept = await self._create_concept(requirement, "technical_requirement")
                if concept:
                    concepts.append(concept)
            
            # Extract from tags
            tags = action.get("tags", [])
            for tag in tags:
                concept = await self._create_concept(tag, "tag")
                if concept:
                    concepts.append(concept)
        
        return concepts
    
    async def _extract_from_text(self, text: str, source_type: str) -> List[Dict[str, Any]]:
        """Extract concepts from free text using NLP techniques."""
        concepts = []
        
        if not text:
            return concepts
        
        # Clean and normalize text
        cleaned_text = self._clean_text(text)
        
        # Extract technical keywords
        tech_concepts = self._extract_technical_concepts(cleaned_text, source_type)
        concepts.extend(tech_concepts)
        
        # Extract domain-specific patterns
        domain_concepts = self._extract_domain_concepts(cleaned_text, source_type)
        concepts.extend(domain_concepts)
        
        # Extract noun phrases (simplified approach)
        noun_phrases = self._extract_noun_phrases(cleaned_text, source_type)
        concepts.extend(noun_phrases)
        
        return concepts
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text for concept extraction."""
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep alphanumeric and spaces
        text = re.sub(r'[^a-zA-Z0-9\s-]', ' ', text)
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _extract_technical_concepts(self, text: str, source_type: str) -> List[Dict[str, Any]]:
        """Extract technical concepts from text."""
        concepts = []
        
        for keyword in self.technical_keywords:
            if keyword in text:
                concept = {
                    "name": keyword,
                    "type": "technical",
                    "source_type": source_type,
                    "category": self._categorize_concept(keyword),
                    "properties": {
                        "is_technical": True,
                        "relevance_score": 0.8,
                        "confidence": 0.9
                    }
                }
                concepts.append(concept)
        
        return concepts
    
    def _extract_domain_concepts(self, text: str, source_type: str) -> List[Dict[str, Any]]:
        """Extract domain-specific concepts."""
        concepts = []
        
        for domain, patterns in self.domain_patterns.items():
            for pattern in patterns:
                if pattern in text:
                    concept = {
                        "name": pattern,
                        "type": "domain",
                        "source_type": source_type,
                        "category": domain,
                        "properties": {
                            "is_domain_specific": True,
                            "domain": domain,
                            "relevance_score": 0.7,
                            "confidence": 0.8
                        }
                    }
                    concepts.append(concept)
        
        return concepts
    
    def _extract_noun_phrases(self, text: str, source_type: str) -> List[Dict[str, Any]]:
        """Extract potential concepts from noun phrases (simplified)."""
        concepts = []
        
        # Simple noun phrase extraction using patterns
        # This is a simplified approach - in production, use spaCy or NLTK
        
        # Pattern: adjective + noun
        adjective_noun_pattern = r'\b(?:intelligent|smart|automated|advanced|enhanced|improved)\s+(?:system|process|feature|tool|method)\b'
        matches = re.findall(adjective_noun_pattern, text)
        
        for match in matches:
            concept = {
                "name": match,
                "type": "compound",
                "source_type": source_type,
                "category": "methodology",
                "properties": {
                    "is_compound": True,
                    "relevance_score": 0.6,
                    "confidence": 0.7
                }
            }
            concepts.append(concept)
        
        return concepts
    
    async def _create_concept(self, name: str, concept_type: str, context: Dict[str, Any] = None, extra_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a standardized concept object."""
        if not name or len(name.strip()) < 2:
            return None
        
        name = name.strip().lower()
        
        # Skip common words
        if name in {"a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}:
            return None
        
        category = self._categorize_concept(name)
        relevance_score = self._calculate_relevance(name, category, context, extra_data)
        
        concept = {
            "name": name,
            "type": concept_type,
            "category": category,
            "properties": {
                "relevance_score": relevance_score,
                "confidence": self._calculate_confidence(name, concept_type),
                "dailydoco_specific": self._is_dailydoco_specific(name),
                "technical_complexity": self._assess_technical_complexity(name),
                "implementation_priority": self._assess_implementation_priority(name, relevance_score)
            }
        }
        
        # Add extra properties from context
        if extra_data:
            concept["properties"].update({
                "source_data": extra_data,
                "has_detailed_context": True
            })
        
        return concept
    
    def _categorize_concept(self, name: str) -> str:
        """Categorize a concept based on its name and patterns."""
        name_lower = name.lower()
        
        for category, category_data in self.concept_categories.items():
            patterns = category_data["patterns"]
            if any(pattern in name_lower for pattern in patterns):
                return category
        
        # Default categorization based on technical keywords
        if name_lower in self.technical_keywords:
            return "technology"
        
        return "general"
    
    def _calculate_relevance(self, name: str, category: str, context: Dict[str, Any] = None, extra_data: Dict[str, Any] = None) -> float:
        """Calculate relevance score for a concept."""
        base_score = 0.5
        
        # Category-based scoring
        category_data = self.concept_categories.get(category, {})
        category_weight = category_data.get("weight", 0.5)
        base_score *= category_weight
        
        # Technical keyword bonus
        if name.lower() in self.technical_keywords:
            base_score += 0.2
        
        # DailyDoco specific bonus
        if self._is_dailydoco_specific(name):
            base_score += 0.3
        
        # Context-based adjustments
        if context:
            relevance_from_context = context.get("relevance_score", 0.5)
            base_score = (base_score + relevance_from_context) / 2
        
        # Extra data adjustments
        if extra_data:
            if "dailydoco_relevance" in extra_data:
                dailydoco_relevance = extra_data["dailydoco_relevance"]
                base_score = (base_score + dailydoco_relevance) / 2
        
        return min(1.0, max(0.0, base_score))
    
    def _calculate_confidence(self, name: str, concept_type: str) -> float:
        """Calculate confidence score for concept extraction."""
        base_confidence = 0.7
        
        # Higher confidence for technical keywords
        if name.lower() in self.technical_keywords:
            base_confidence = 0.9
        
        # Adjust based on concept type
        type_confidence = {
            "technical": 0.9,
            "actionable": 0.8,
            "innovation": 0.7,
            "domain": 0.8,
            "topic": 0.6,
            "compound": 0.6,
            "tag": 0.5
        }
        
        type_conf = type_confidence.get(concept_type, 0.5)
        return (base_confidence + type_conf) / 2
    
    def _is_dailydoco_specific(self, name: str) -> bool:
        """Check if a concept is specific to DailyDoco Pro."""
        dailydoco_terms = {
            "screen recording", "documentation automation", "developer workflow",
            "code documentation", "video recording", "tutorial creation",
            "privacy filtering", "intelligent capture", "ai narration",
            "workflow capture", "developer productivity"
        }
        
        return any(term in name.lower() for term in dailydoco_terms)
    
    def _assess_technical_complexity(self, name: str) -> float:
        """Assess the technical complexity of implementing a concept."""
        high_complexity_terms = {
            "ai", "machine learning", "neural network", "deep learning",
            "computer vision", "natural language processing", "blockchain"
        }
        
        medium_complexity_terms = {
            "api integration", "real-time processing", "video processing",
            "performance optimization", "scalability", "microservices"
        }
        
        name_lower = name.lower()
        
        if any(term in name_lower for term in high_complexity_terms):
            return 0.8
        elif any(term in name_lower for term in medium_complexity_terms):
            return 0.6
        else:
            return 0.4
    
    def _assess_implementation_priority(self, name: str, relevance_score: float) -> float:
        """Assess implementation priority based on various factors."""
        # Base priority from relevance
        priority = relevance_score
        
        # High priority terms
        high_priority_terms = {
            "user experience", "performance", "automation", "productivity",
            "developer experience", "integration"
        }
        
        # Low priority terms
        low_priority_terms = {
            "experimental", "research", "prototype", "investigation"
        }
        
        name_lower = name.lower()
        
        if any(term in name_lower for term in high_priority_terms):
            priority += 0.2
        elif any(term in name_lower for term in low_priority_terms):
            priority -= 0.2
        
        return min(1.0, max(0.0, priority))
    
    async def _enrich_concepts(self, concepts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enrich concepts with additional metadata and relationships."""
        enriched = []
        
        for concept in concepts:
            # Add semantic relationships
            concept["relationships"] = self._find_semantic_relationships(concept, concepts)
            
            # Add implementation suggestions
            concept["implementation_suggestions"] = self._generate_implementation_suggestions(concept)
            
            # Add tags
            concept["tags"] = self._generate_concept_tags(concept)
            
            enriched.append(concept)
        
        return enriched
    
    def _find_semantic_relationships(self, concept: Dict[str, Any], all_concepts: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Find semantic relationships between concepts."""
        relationships = []
        concept_name = concept["name"]
        
        for other_concept in all_concepts:
            if other_concept["name"] == concept_name:
                continue
            
            relationship = self._determine_relationship(concept, other_concept)
            if relationship:
                relationships.append({
                    "target_concept": other_concept["name"],
                    "relationship_type": relationship,
                    "strength": self._calculate_relationship_strength(concept, other_concept)
                })
        
        return relationships[:5]  # Limit to top 5 relationships
    
    def _determine_relationship(self, concept1: Dict[str, Any], concept2: Dict[str, Any]) -> str:
        """Determine the type of relationship between two concepts."""
        cat1 = concept1["category"]
        cat2 = concept2["category"]
        name1 = concept1["name"].lower()
        name2 = concept2["name"].lower()
        
        # Same category = related
        if cat1 == cat2:
            return "related_to"
        
        # Technology enables methodology
        if cat1 == "technology" and cat2 == "methodology":
            return "enables"
        elif cat1 == "methodology" and cat2 == "technology":
            return "requires"
        
        # AI/ML enhances other categories
        if cat1 == "ai_ml":
            return "enhances"
        elif cat2 == "ai_ml":
            return "enhanced_by"
        
        # Integration connects different concepts
        if cat1 == "integration" or cat2 == "integration":
            return "connects_to"
        
        # Performance optimizes other concepts
        if "performance" in name1 and "optimization" not in name2:
            return "optimizes"
        elif "performance" in name2 and "optimization" not in name1:
            return "optimized_by"
        
        return None
    
    def _calculate_relationship_strength(self, concept1: Dict[str, Any], concept2: Dict[str, Any]) -> float:
        """Calculate the strength of relationship between concepts."""
        # Base strength
        strength = 0.5
        
        # Same category increases strength
        if concept1["category"] == concept2["category"]:
            strength += 0.3
        
        # Both high relevance increases strength
        rel1 = concept1["properties"]["relevance_score"]
        rel2 = concept2["properties"]["relevance_score"]
        if rel1 > 0.7 and rel2 > 0.7:
            strength += 0.2
        
        # Technical concepts have stronger relationships
        if concept1["type"] == "technical" and concept2["type"] == "technical":
            strength += 0.2
        
        return min(1.0, strength)
    
    def _generate_implementation_suggestions(self, concept: Dict[str, Any]) -> List[str]:
        """Generate implementation suggestions for a concept."""
        suggestions = []
        category = concept["category"]
        name = concept["name"].lower()
        
        category_suggestions = {
            "ai_ml": [
                "Consider using pre-trained models for faster implementation",
                "Implement fallback mechanisms for AI failures",
                "Plan for model updates and retraining"
            ],
            "user_experience": [
                "Conduct user research before implementation",
                "Create prototypes for user testing",
                "Ensure accessibility compliance"
            ],
            "performance": [
                "Establish baseline performance metrics",
                "Implement monitoring and alerting",
                "Consider caching strategies"
            ],
            "security": [
                "Conduct security review before deployment",
                "Implement proper authentication and authorization",
                "Plan for security updates and patches"
            ]
        }
        
        suggestions.extend(category_suggestions.get(category, [
            "Break down into smaller, manageable tasks",
            "Create proof-of-concept implementation first",
            "Plan for testing and validation"
        ]))
        
        return suggestions[:3]  # Limit to top 3 suggestions
    
    def _generate_concept_tags(self, concept: Dict[str, Any]) -> List[str]:
        """Generate tags for a concept."""
        tags = [concept["category"], concept["type"]]
        
        # Add technical tags
        name = concept["name"].lower()
        if "ai" in name or "ml" in name:
            tags.append("artificial_intelligence")
        if "performance" in name:
            tags.append("optimization")
        if "user" in name:
            tags.append("user_focused")
        if "integration" in name:
            tags.append("interoperability")
        
        # Add priority tags
        relevance = concept["properties"]["relevance_score"]
        if relevance > 0.8:
            tags.append("high_relevance")
        elif relevance > 0.6:
            tags.append("medium_relevance")
        
        # Add complexity tags
        complexity = concept["properties"]["technical_complexity"]
        if complexity > 0.7:
            tags.append("high_complexity")
        elif complexity < 0.4:
            tags.append("low_complexity")
        
        return list(set(tags))  # Remove duplicates
    
    def _deduplicate_concepts(self, concepts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate concepts based on name similarity."""
        unique_concepts = []
        seen_names = set()
        
        for concept in concepts:
            name = concept["name"].lower().strip()
            if name not in seen_names:
                unique_concepts.append(concept)
                seen_names.add(name)
        
        return unique_concepts
    
    def _rank_concepts(self, concepts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Rank concepts by relevance and importance."""
        def concept_score(concept):
            relevance = concept["properties"]["relevance_score"]
            confidence = concept["properties"]["confidence"]
            priority = concept["properties"]["implementation_priority"]
            
            # Composite score with weights
            return (relevance * 0.4 + confidence * 0.3 + priority * 0.3)
        
        return sorted(concepts, key=concept_score, reverse=True)
