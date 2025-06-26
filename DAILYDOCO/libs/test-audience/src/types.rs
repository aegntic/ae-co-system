/*!
 * DailyDoco Pro - Elite Persona Generation Type System
 * 
 * Comprehensive type definitions for ultra-realistic synthetic viewer generation
 */

use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

// Core behavioral types

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TechSpecialization {
    Frontend,
    Backend,
    FullStack,
    Mobile,
    DevOps,
    DataScience,
    MachineLearning,
    Security,
    Architecture,
    QualityAssurance,
    ProductManagement,
    Design,
    Research,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MentoringStyle {
    Collaborative,
    DirectiveGuidance,
    SocraticQuestioning,
    HandsOff,
    PairProgramming,
    CodeReviews,
    ArchitecturalGuidance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProductArea {
    ConsumerApps,
    EnterpriseTools,
    DeveloperTools,
    Infrastructure,
    DataPlatforms,
    SecurityProducts,
    FinTech,
    HealthTech,
    EdTech,
    Gaming,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DesignType {
    UXResearch,
    UIDesign,
    ProductDesign,
    SystemDesign,
    ServiceDesign,
    DesignSystems,
    VisualDesign,
    InteractionDesign,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InfrastructureFocus {
    CloudNative,
    OnPremise,
    HybridCloud,
    Containerization,
    Orchestration,
    Monitoring,
    Security,
    Compliance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AutomationPhilosophy {
    FullAutomation,
    SelectiveAutomation,
    HumanInTheLoop,
    IncrementalAutomation,
    RiskAverse,
    InnovationDriven,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReliabilityFocus {
    HighAvailability,
    DisasterRecovery,
    PerformanceOptimization,
    CapacityPlanning,
    IncidentResponse,
    MonitoringAlerting,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MLExpertise {
    DeepLearning,
    TraditionalML,
    NLP,
    ComputerVision,
    RecommendationSystems,
    TimeSeriesAnalysis,
    ReinforcementLearning,
    MLOps,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecurityFocus {
    ApplicationSecurity,
    NetworkSecurity,
    CloudSecurity,
    IdentityAccess,
    ComplianceGovernance,
    ThreatIntelligence,
    IncidentResponse,
    SecurityArchitecture,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OrganizationSize {
    Startup(u32),        // Employee count
    SmallCompany(u32),   // 50-200
    MidSizeCompany(u32), // 200-1000
    LargeEnterprise(u32), // 1000+
    BigTech(u32),        // 10000+
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ArchitectureType {
    SoftwareArchitecture,
    SystemArchitecture,
    CloudArchitecture,
    DataArchitecture,
    SecurityArchitecture,
    EnterpriseArchitecture,
    SolutionArchitecture,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EducationLevel {
    HighSchool,
    Associates,
    Bachelors,
    Masters,
    PhD,
    Bootcamp,
    SelfTaught,
    OnlineCourses,
}

// Demographic and social types

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgeRange {
    Gen_Z_Early(u8),      // 16-20
    Gen_Z_Late(u8),       // 21-25
    Millennial_Early(u8), // 26-30
    Millennial_Mid(u8),   // 31-35
    Millennial_Late(u8),  // 36-40
    Gen_X_Early(u8),      // 41-45
    Gen_X_Late(u8),       // 46-55
    Boomer_Early(u8),     // 56-65
    Boomer_Late(u8),      // 65+
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeographicLocation {
    pub continent: String,
    pub country: String,
    pub region: Option<String>,
    pub city_size: CitySize,
    pub tech_hub_proximity: f32, // 0.0-1.0, distance to major tech centers
    pub timezone_offset: i8,
    pub internet_quality: InternetQuality,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CitySize {
    Rural,
    SmallTown,
    Suburb,
    MediumCity,
    LargeCity,
    Metropolis,
    Megacity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InternetQuality {
    Excellent,  // Fiber, low latency
    Good,       // High-speed broadband
    Average,    // Standard broadband
    Limited,    // Slower connections
    Unreliable, // Intermittent connectivity
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CulturalBackground {
    pub primary_culture: String,
    pub multicultural_influences: Vec<String>,
    pub communication_style: CommunicationStyle,
    pub work_life_balance_expectation: f32,
    pub hierarchical_preference: f32,
    pub individualism_vs_collectivism: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommunicationStyle {
    Direct,
    Indirect,
    HighContext,
    LowContext,
    Formal,
    Informal,
    Diplomatic,
    Assertive,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AccessibilityNeed {
    VisualImpairment(VisualImpairmentType),
    HearingImpairment(HearingImpairmentType),
    MotorImpairment(MotorImpairmentType),
    CognitiveConsiderations(CognitiveConsiderationType),
    LanguageLearner(LanguageLearnerType),
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VisualImpairmentType {
    Blindness,
    LowVision,
    ColorBlindness,
    PhotoSensitivity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HearingImpairmentType {
    Deafness,
    HardOfHearing,
    AuditoryProcessingDisorder,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MotorImpairmentType {
    LimitedMobility,
    FingerDexterity,
    TremorConditions,
    AmputeeAdaptations,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CognitiveConsiderationType {
    ADHD,
    Dyslexia,
    AutismSpectrum,
    MemoryImpairment,
    ProcessingSpeed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LanguageLearnerType {
    ESL,
    SecondLanguage,
    RegionalDialect,
    TechnicalEnglish,
}

// Professional and career types

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CompanySize {
    Startup,        // < 50 employees
    SmallBusiness,  // 50-200
    MidMarket,      // 200-1000
    Enterprise,     // 1000-10000
    LargeEnterprise, // 10000+
    Freelance,
    Consulting,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Industry {
    Technology,
    Finance,
    Healthcare,
    Education,
    Retail,
    Manufacturing,
    Media,
    Gaming,
    Automotive,
    Aerospace,
    Government,
    NonProfit,
    Consulting,
    Startups,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExperienceLevel {
    Intern,
    EntryLevel,      // 0-2 years
    Junior,          // 2-4 years
    Mid,             // 4-7 years
    Senior,          // 7-12 years
    Staff,           // 12-18 years
    Principal,       // 18+ years
    Distinguished,   // 20+ years, exceptional
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TechStack {
    pub primary_languages: Vec<String>,
    pub frameworks: Vec<String>,
    pub databases: Vec<String>,
    pub cloud_platforms: Vec<String>,
    pub tools: Vec<String>,
    pub specializations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CareerGoal {
    TechnicalLeadership,
    PeopleManagement,
    IndividualContributor,
    Entrepreneurship,
    Consulting,
    Teaching,
    Research,
    ProductManagement,
    CareerChange,
    WorkLifeBalance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SalaryRange {
    EntryLevel,      // < $70k
    Junior,          // $70k-$90k
    Mid,             // $90k-$130k
    Senior,          // $130k-$180k
    Staff,           // $180k-$250k
    Principal,       // $250k-$350k
    Executive,       // $350k+
    Consulting,      // Variable/hourly
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RemoteWorkStatus {
    FullyRemote,
    Hybrid(u8),      // Days per week in office
    FullyOnsite,
    Flexible,
    DigitalNomad,
    Relocating,
}

// Behavioral and psychological types

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LearningStyle {
    Visual,
    Auditory,
    Kinesthetic,
    ReadWrite,
    Multimodal,
    Sequential,
    Random,
    Concrete,
    Abstract,
    Active,
    Reflective,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AttentionSpan {
    VeryShort,       // < 2 minutes
    Short,           // 2-5 minutes
    Moderate,        // 5-15 minutes
    Long,            // 15-30 minutes
    VeryLong,        // 30+ minutes
    Variable,        // Depends on interest/energy
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EngagementTrigger {
    CodeExamples,
    RealWorldProblems,
    VisualDiagrams,
    InteractiveDemos,
    PersonalStories,
    IndustryTrends,
    PerformanceMetrics,
    BestPractices,
    CommonPitfalls,
    CommunityDiscussion,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DropOffFactor {
    TechnicalComplexity,
    SlowPacing,
    FastPacing,
    LackOfRelevance,
    PoorAudioVideo,
    Distractions,
    LengthConcerns,
    PrerequisiteGaps,
    BoringPresentation,
    CognitiveFatigue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InteractionFrequency {
    Passive,         // Rarely interacts
    Occasional,      // Some likes/comments
    Regular,         // Frequent interactions
    Active,          // High engagement
    CommunityLeader, // Drives discussions
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommentPropensity {
    Never,
    RarelyPositive,
    QuestionAsker,
    RegularContributor,
    DiscussionStarter,
    CommunityHelper,
    CriticalFeedback,
    DetailOriented,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LikeSubscribeBehavior {
    pub like_threshold: f32,        // Engagement level needed to like
    pub subscribe_threshold: f32,   // Content quality needed to subscribe
    pub share_threshold: f32,       // Excitement level needed to share
    pub notification_preference: NotificationPreference,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationPreference {
    All,
    Highlights,
    None,
    Personalized,
}

// Content and platform types

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContentType {
    Tutorial,
    Walkthrough,
    CodeReview,
    Architecture,
    Debugging,
    LiveCoding,
    Interview,
    Conference,
    Documentary,
    News,
    Opinion,
    QA,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PresentationStyle {
    ScreenRecording,
    LiveCoding,
    SlidePresentation,
    Whiteboarding,
    Interview,
    Panel,
    Demonstration,
    StoryTelling,
    CaseStudy,
    Interactive,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoDurationPreference {
    Micro,           // < 2 minutes
    Short,           // 2-10 minutes
    Medium,          // 10-30 minutes
    Long,            // 30-60 minutes
    Extended,        // 60+ minutes
    SeriesBased,     // Multiple parts
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PlaybackSpeedPreference {
    Slow(f32),       // 0.5x-0.75x
    Normal,          // 1.0x
    Fast(f32),       // 1.25x-2.0x
    Variable,        // Adjusts based on content
    Adaptive,        // AI-optimized speed
}

// Advanced modeling types

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalityTraits {
    pub openness: f32,              // 0.0-1.0
    pub conscientiousness: f32,
    pub extraversion: f32,
    pub agreeableness: f32,
    pub neuroticism: f32,
    pub curiosity: f32,
    pub risk_tolerance: f32,
    pub achievement_orientation: f32,
    pub social_orientation: f32,
    pub detail_orientation: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningMotivation {
    pub intrinsic_motivation: f32,
    pub extrinsic_motivation: f32,
    pub career_advancement: f32,
    pub personal_interest: f32,
    pub peer_influence: f32,
    pub problem_solving: f32,
    pub mastery_orientation: f32,
    pub performance_orientation: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FeedbackReceptivity {
    HighlyReceptive,
    Receptive,
    Selective,
    Defensive,
    Resistant,
    ContextDependent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CollaborationPreference {
    HighlyCollaborative,
    TeamOriented,
    SmallGroups,
    PairWork,
    Independent,
    Leadership,
    Mentoring,
    Learning,
}

// Platform-specific types

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SubscriberTier {
    Unsubscribed,
    NewSubscriber,
    RegularViewer,
    LoyalFan,
    SuperFan,
    ChannelMember,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchTimePatterns {
    pub average_session_length: f32,
    pub binge_watching_tendency: f32,
    pub return_viewer_rate: f32,
    pub completion_rate: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionStyles {
    pub comment_frequency: f32,
    pub like_ratio: f32,
    pub share_propensity: f32,
    pub community_participation: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProfessionalLevel {
    Student,
    EntryLevel,
    Professional,
    Senior,
    Executive,
    Thought_Leader,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkingBehaviors {
    pub connection_selectivity: f32,
    pub content_sharing_frequency: f32,
    pub professional_engagement: f32,
    pub thought_leadership_activities: f32,
}

// Configuration and session types

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemporalBehavior {
    pub timezone_distribution: HashMap<String, f32>,
    pub peak_activity_hours: Vec<u8>,
    pub seasonal_variations: SeasonalVariations,
    pub work_schedule_adherence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeasonalVariations {
    pub spring_engagement_modifier: f32,
    pub summer_engagement_modifier: f32,
    pub fall_engagement_modifier: f32,
    pub winter_engagement_modifier: f32,
    pub holiday_impact: f32,
    pub conference_season_boost: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CulturalDiversity {
    pub geographic_distribution: HashMap<String, f32>,
    pub language_distribution: HashMap<String, f32>,
    pub cultural_communication_styles: HashMap<String, f32>,
    pub work_culture_variations: HashMap<String, f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessibilityOptions {
    pub visual_impairment_percentage: f32,
    pub hearing_impairment_percentage: f32,
    pub motor_impairment_percentage: f32,
    pub cognitive_considerations_percentage: f32,
    pub language_learner_percentage: f32,
    pub accommodation_requirements: HashMap<String, f32>,
}

// Generation and modeling support types

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationSession {
    pub session_id: Uuid,
    pub start_time: DateTime<Utc>,
    pub completion_time: DateTime<Utc>,
    pub config: GenerationSessionConfig,
    pub personas_generated: usize,
    pub quality_metrics: QualityMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationSessionConfig {
    pub realism_level: f32,
    pub diversity_requirements: DiversityRequirements,
    pub behavioral_complexity: BehavioralComplexity,
    pub temporal_modeling: bool,
    pub cultural_sensitivity: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiversityRequirements {
    pub minimum_demographic_diversity: f32,
    pub minimum_professional_diversity: f32,
    pub minimum_behavioral_diversity: f32,
    pub inclusion_targets: InclusionTargets,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BehavioralComplexity {
    Basic,      // Simple behavior patterns
    Standard,   // Realistic complexity
    High,       // Very sophisticated
    Elite,      // Maximum realism
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InclusionTargets {
    pub gender_balance: HashMap<String, f32>,
    pub age_distribution: HashMap<AgeRange, f32>,
    pub geographic_representation: HashMap<String, f32>,
    pub accessibility_representation: f32,
    pub experience_level_distribution: HashMap<ExperienceLevel, f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityMetrics {
    pub average_authenticity_score: f32,
    pub diversity_index: f32,
    pub behavioral_complexity_score: f32,
    pub predictive_accuracy_estimate: f32,
    pub generation_time_seconds: f32,
}

// Default implementations

impl Default for TechStack {
    fn default() -> Self {
        Self {
            primary_languages: vec!["JavaScript".to_string(), "Python".to_string()],
            frameworks: vec!["React".to_string(), "Node.js".to_string()],
            databases: vec!["PostgreSQL".to_string(), "MongoDB".to_string()],
            cloud_platforms: vec!["AWS".to_string()],
            tools: vec!["Git".to_string(), "Docker".to_string()],
            specializations: vec!["Web Development".to_string()],
        }
    }
}

impl Default for PersonalityTraits {
    fn default() -> Self {
        Self {
            openness: 0.7,
            conscientiousness: 0.6,
            extraversion: 0.5,
            agreeableness: 0.6,
            neuroticism: 0.4,
            curiosity: 0.8,
            risk_tolerance: 0.5,
            achievement_orientation: 0.7,
            social_orientation: 0.5,
            detail_orientation: 0.6,
        }
    }
}

impl Default for LikeSubscribeBehavior {
    fn default() -> Self {
        Self {
            like_threshold: 0.6,
            subscribe_threshold: 0.8,
            share_threshold: 0.85,
            notification_preference: NotificationPreference::Highlights,
        }
    }
}

impl Default for TemporalBehavior {
    fn default() -> Self {
        Self {
            timezone_distribution: [
                ("UTC-8".to_string(), 0.25), // US West Coast
                ("UTC-5".to_string(), 0.35), // US East Coast
                ("UTC+0".to_string(), 0.20), // Europe
                ("UTC+5:30".to_string(), 0.15), // India
                ("UTC+9".to_string(), 0.05), // Asia Pacific
            ].into(),
            peak_activity_hours: vec![9, 10, 11, 14, 15, 16, 19, 20, 21],
            seasonal_variations: SeasonalVariations {
                spring_engagement_modifier: 1.1,
                summer_engagement_modifier: 0.9,
                fall_engagement_modifier: 1.2,
                winter_engagement_modifier: 1.0,
                holiday_impact: 0.7,
                conference_season_boost: 1.3,
            },
            work_schedule_adherence: 0.7,
        }
    }
}

impl Default for CulturalDiversity {
    fn default() -> Self {
        Self {
            geographic_distribution: [
                ("North America".to_string(), 0.45),
                ("Europe".to_string(), 0.25),
                ("Asia".to_string(), 0.20),
                ("Other".to_string(), 0.10),
            ].into(),
            language_distribution: [
                ("English".to_string(), 0.70),
                ("Spanish".to_string(), 0.10),
                ("Hindi".to_string(), 0.05),
                ("Chinese".to_string(), 0.05),
                ("Other".to_string(), 0.10),
            ].into(),
            cultural_communication_styles: [
                ("Direct".to_string(), 0.60),
                ("Indirect".to_string(), 0.40),
            ].into(),
            work_culture_variations: [
                ("Individual_Achievement".to_string(), 0.55),
                ("Team_Collaboration".to_string(), 0.45),
            ].into(),
        }
    }
}

impl Default for AccessibilityOptions {
    fn default() -> Self {
        Self {
            visual_impairment_percentage: 0.08,
            hearing_impairment_percentage: 0.05,
            motor_impairment_percentage: 0.03,
            cognitive_considerations_percentage: 0.10,
            language_learner_percentage: 0.25,
            accommodation_requirements: [
                ("captions".to_string(), 0.30),
                ("high_contrast".to_string(), 0.15),
                ("slower_pace".to_string(), 0.20),
                ("clear_audio".to_string(), 0.25),
            ].into(),
        }
    }
}

impl Default for GenerationSessionConfig {
    fn default() -> Self {
        Self {
            realism_level: 0.9,
            diversity_requirements: DiversityRequirements::default(),
            behavioral_complexity: BehavioralComplexity::High,
            temporal_modeling: true,
            cultural_sensitivity: true,
        }
    }
}

impl Default for DiversityRequirements {
    fn default() -> Self {
        Self {
            minimum_demographic_diversity: 0.8,
            minimum_professional_diversity: 0.85,
            minimum_behavioral_diversity: 0.75,
            inclusion_targets: InclusionTargets::default(),
        }
    }
}

impl Default for InclusionTargets {
    fn default() -> Self {
        Self {
            gender_balance: [
                ("male".to_string(), 0.60),
                ("female".to_string(), 0.35),
                ("non_binary".to_string(), 0.05),
            ].into(),
            age_distribution: [
                (AgeRange::Gen_Z_Late(23), 0.15),
                (AgeRange::Millennial_Early(28), 0.25),
                (AgeRange::Millennial_Mid(33), 0.25),
                (AgeRange::Millennial_Late(38), 0.20),
                (AgeRange::Gen_X_Early(43), 0.15),
            ].into(),
            geographic_representation: [
                ("north_america".to_string(), 0.45),
                ("europe".to_string(), 0.25),
                ("asia".to_string(), 0.20),
                ("other".to_string(), 0.10),
            ].into(),
            accessibility_representation: 0.15,
            experience_level_distribution: [
                (ExperienceLevel::Junior, 0.25),
                (ExperienceLevel::Mid, 0.30),
                (ExperienceLevel::Senior, 0.25),
                (ExperienceLevel::Staff, 0.15),
                (ExperienceLevel::Principal, 0.05),
            ].into(),
        }
    }
}