import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useUserJourney } from '../../hooks/useUserJourney';
import { usePersonalityDetection } from '../../hooks/usePersonalityDetection';

export interface NetworkMember {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  websiteUrl?: string;
  githubUrl?: string;
  reputation: number;
  tier: 'free' | 'pro' | 'business' | 'enterprise';
  lastActive: number;
  achievements: string[];
}

export interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  websiteUrl: string;
  githubUrl: string;
  authorId: string;
  authorName: string;
  authorCompany: string;
  likes: number;
  views: number;
  techStack: string[];
  tier: 'free' | 'pro' | 'business' | 'enterprise';
  createdAt: number;
  isLiked?: boolean;
}

export interface NetworkActivity {
  id: string;
  type: 'showcase_created' | 'member_joined' | 'achievement_unlocked' | 'tier_upgraded';
  userId: string;
  userName: string;
  userCompany: string;
  timestamp: number;
  data: Record<string, any>;
}

interface ProfessionalNetworkHubProps {
  onJoinNetwork?: () => void;
  onViewProfile?: (memberId: string) => void;
  onLikeShowcase?: (showcaseId: string) => void;
  variant?: 'compact' | 'full' | 'sidebar';
  enableRealTimeUpdates?: boolean;
}

export const ProfessionalNetworkHub: React.FC<ProfessionalNetworkHubProps> = ({
  onJoinNetwork,
  onViewProfile,
  onLikeShowcase,
  variant = 'full',
  enableRealTimeUpdates = true
}) => {
  const { user } = useAuth();
  const { trackInteraction } = useUserJourney();
  const { getPersonalizedStrategy, dominantPersonality } = usePersonalityDetection();
  
  // Core state
  const [activeTab, setActiveTab] = useState<'showcase' | 'members' | 'activity'>('showcase');
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseItem[]>([]);
  const [networkMembers, setNetworkMembers] = useState<NetworkMember[]>([]);
  const [networkActivity, setNetworkActivity] = useState<NetworkActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinPromptVisible, setJoinPromptVisible] = useState(false);
  
  // Personalized strategy based on personality detection
  const personalizedStrategy = getPersonalizedStrategy();

  // PHASE 5: Mock data generator for demonstration
  const generateMockShowcaseData = useCallback((): ShowcaseItem[] => {
    const mockShowcases: ShowcaseItem[] = [
      {
        id: 'showcase_1',
        title: 'AI-Powered Documentation Platform',
        description: 'Automated documentation generation with intelligent content creation and developer-friendly workflows.',
        imageUrl: '/api/placeholder/400/250',
        websiteUrl: 'https://showcase1.4site.pro',
        githubUrl: 'https://github.com/developer1/ai-docs',
        authorId: 'dev_1',
        authorName: 'Sarah Chen',
        authorCompany: 'Meta',
        likes: 234,
        views: 1847,
        techStack: ['React', 'TypeScript', 'OpenAI', 'Vercel'],
        tier: 'pro',
        createdAt: Date.now() - 86400000, // 1 day ago
        isLiked: false
      },
      {
        id: 'showcase_2',
        title: 'Distributed System Monitoring',
        description: 'Real-time monitoring and alerting for microservices architecture with beautiful dashboards.',
        imageUrl: '/api/placeholder/400/250',
        websiteUrl: 'https://showcase2.4site.pro',
        githubUrl: 'https://github.com/developer2/monitoring',
        authorId: 'dev_2',
        authorName: 'Marcus Rodriguez',
        authorCompany: 'Google',
        likes: 189,
        views: 923,
        techStack: ['Go', 'Kubernetes', 'Prometheus', 'Grafana'],
        tier: 'business',
        createdAt: Date.now() - 172800000, // 2 days ago
        isLiked: true
      },
      {
        id: 'showcase_3',
        title: 'Machine Learning Pipeline',
        description: 'End-to-end ML pipeline for recommendation systems with automated model deployment.',
        imageUrl: '/api/placeholder/400/250',
        websiteUrl: 'https://showcase3.4site.pro',
        githubUrl: 'https://github.com/developer3/ml-pipeline',
        authorId: 'dev_3',
        authorName: 'Dr. Emily Watson',
        authorCompany: 'Apple',
        likes: 342,
        views: 2156,
        techStack: ['Python', 'TensorFlow', 'Kubeflow', 'GCP'],
        tier: 'enterprise',
        createdAt: Date.now() - 259200000, // 3 days ago
        isLiked: false
      },
      {
        id: 'showcase_4',
        title: 'Blockchain Trading Platform',
        description: 'Decentralized trading platform with smart contracts and real-time market data.',
        imageUrl: '/api/placeholder/400/250',
        websiteUrl: 'https://showcase4.4site.pro',
        githubUrl: 'https://github.com/developer4/defi-trading',
        authorId: 'dev_4',
        authorName: 'Alex Thompson',
        authorCompany: 'Coinbase',
        likes: 156,
        views: 834,
        techStack: ['Solidity', 'React', 'Web3.js', 'Hardhat'],
        tier: 'pro',
        createdAt: Date.now() - 345600000, // 4 days ago
        isLiked: false
      }
    ];
    
    return mockShowcases;
  }, []);

  const generateMockMemberData = useCallback((): NetworkMember[] => {
    const mockMembers: NetworkMember[] = [
      {
        id: 'dev_1',
        name: 'Sarah Chen',
        role: 'Senior Software Engineer',
        company: 'Meta',
        avatar: '/api/placeholder/80/80',
        websiteUrl: 'https://sarah.4site.pro',
        githubUrl: 'https://github.com/sarahchen',
        reputation: 1250,
        tier: 'pro',
        lastActive: Date.now() - 3600000, // 1 hour ago
        achievements: ['Early Adopter', 'Community Builder', 'Top Showcase']
      },
      {
        id: 'dev_2',
        name: 'Marcus Rodriguez',
        role: 'Principal Engineer',
        company: 'Google',
        avatar: '/api/placeholder/80/80',
        websiteUrl: 'https://marcus.4site.pro',
        githubUrl: 'https://github.com/marcusr',
        reputation: 2340,
        tier: 'business',
        lastActive: Date.now() - 1800000, // 30 minutes ago
        achievements: ['Innovation Leader', 'Technical Excellence', 'Mentor']
      },
      {
        id: 'dev_3',
        name: 'Dr. Emily Watson',
        role: 'ML Research Scientist',
        company: 'Apple',
        avatar: '/api/placeholder/80/80',
        websiteUrl: 'https://emily.4site.pro',
        githubUrl: 'https://github.com/emilywatson',
        reputation: 3890,
        tier: 'enterprise',
        lastActive: Date.now() - 900000, // 15 minutes ago
        achievements: ['Research Pioneer', 'AI Innovator', 'Thought Leader']
      },
      {
        id: 'dev_4',
        name: 'Alex Thompson',
        role: 'Blockchain Developer',
        company: 'Coinbase',
        avatar: '/api/placeholder/80/80',
        websiteUrl: 'https://alex.4site.pro',
        githubUrl: 'https://github.com/alexthompson',
        reputation: 890,
        tier: 'pro',
        lastActive: Date.now() - 7200000, // 2 hours ago
        achievements: ['DeFi Builder', 'Smart Contract Expert']
      }
    ];
    
    return mockMembers;
  }, []);

  const generateMockActivity = useCallback((): NetworkActivity[] => {
    const mockActivity: NetworkActivity[] = [
      {
        id: 'activity_1',
        type: 'showcase_created',
        userId: 'dev_1',
        userName: 'Sarah Chen',
        userCompany: 'Meta',
        timestamp: Date.now() - 1800000, // 30 minutes ago
        data: { showcaseTitle: 'AI-Powered Documentation Platform' }
      },
      {
        id: 'activity_2',
        type: 'member_joined',
        userId: 'dev_5',
        userName: 'David Kim',
        userCompany: 'Netflix',
        timestamp: Date.now() - 3600000, // 1 hour ago
        data: { tier: 'pro' }
      },
      {
        id: 'activity_3',
        type: 'achievement_unlocked',
        userId: 'dev_2',
        userName: 'Marcus Rodriguez',
        userCompany: 'Google',
        timestamp: Date.now() - 5400000, // 1.5 hours ago
        data: { achievement: 'Innovation Leader' }
      },
      {
        id: 'activity_4',
        type: 'tier_upgraded',
        userId: 'dev_3',
        userName: 'Dr. Emily Watson',
        userCompany: 'Apple',
        timestamp: Date.now() - 7200000, // 2 hours ago
        data: { fromTier: 'business', toTier: 'enterprise' }
      }
    ];
    
    return mockActivity;
  }, []);

  // PHASE 5: Initialize data
  useEffect(() => {
    setLoading(true);
    
    // Simulate API loading delay
    setTimeout(() => {
      setShowcaseItems(generateMockShowcaseData());
      setNetworkMembers(generateMockMemberData());
      setNetworkActivity(generateMockActivity());
      setLoading(false);
    }, 800);
  }, [generateMockShowcaseData, generateMockMemberData, generateMockActivity]);

  // PHASE 5: Real-time updates simulation
  useEffect(() => {
    if (!enableRealTimeUpdates) return;
    
    const interval = setInterval(() => {
      // Simulate new activity
      const newActivity: NetworkActivity = {
        id: `activity_${Date.now()}`,
        type: Math.random() > 0.5 ? 'showcase_created' : 'member_joined',
        userId: `dev_${Math.floor(Math.random() * 100)}`,
        userName: ['Alex Kim', 'Jordan Smith', 'Sam Taylor', 'River Chen'][Math.floor(Math.random() * 4)],
        userCompany: ['Microsoft', 'Amazon', 'Tesla', 'Stripe'][Math.floor(Math.random() * 4)],
        timestamp: Date.now(),
        data: {
          showcaseTitle: 'New Innovation Project',
          tier: 'pro'
        }
      };
      
      setNetworkActivity(prev => [newActivity, ...prev.slice(0, 9)]); // Keep latest 10
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [enableRealTimeUpdates]);

  // PHASE 5: Handle showcase like
  const handleLikeShowcase = useCallback((showcaseId: string) => {
    trackInteraction('showcase_like', 'click', { showcaseId });
    
    setShowcaseItems(prev => prev.map(item => 
      item.id === showcaseId 
        ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
        : item
    ));
    
    if (onLikeShowcase) {
      onLikeShowcase(showcaseId);
    }
  }, [trackInteraction, onLikeShowcase]);

  // PHASE 5: Handle join network
  const handleJoinNetwork = useCallback(() => {
    trackInteraction('network_join', 'click', { 
      personality: dominantPersonality,
      strategy: personalizedStrategy.messagingStyle 
    });
    
    if (onJoinNetwork) {
      onJoinNetwork();
    } else {
      setJoinPromptVisible(true);
    }
  }, [trackInteraction, dominantPersonality, personalizedStrategy, onJoinNetwork]);

  // PHASE 5: Personality-based messaging
  const getPersonalizedMessage = useCallback(() => {
    switch (dominantPersonality) {
      case 'analytical':
        return {
          title: 'Join Elite Developer Network',
          subtitle: 'Connect with 10,000+ senior engineers at top companies',
          cta: 'Analyze Network Benefits'
        };
      case 'creative':
        return {
          title: 'Showcase Your Creative Vision',
          subtitle: 'Inspire and be inspired by innovative developers worldwide',
          cta: 'Explore Creative Network'
        };
      case 'social':
        return {
          title: 'Connect with Industry Leaders',
          subtitle: 'Build meaningful relationships with like-minded professionals',
          cta: 'Join the Community'
        };
      default: // pragmatic
        return {
          title: 'Advance Your Career',
          subtitle: 'Network with professionals who can accelerate your growth',
          cta: 'Access Professional Network'
        };
    }
  }, [dominantPersonality]);

  const personalizedMessage = getPersonalizedMessage();

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
      >
        <div className="glass-card-content p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            🌟 Professional Network
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex -space-x-2">
              {networkMembers.slice(0, 4).map((member, index) => (
                <div key={member.id} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-black flex items-center justify-center text-xs font-semibold text-white" style={{ zIndex: 4 - index }}>
                  {member.name.charAt(0)}
                </div>
              ))}
            </div>
            <span className="text-sm text-white/70">+10,000 professionals</span>
          </div>
          <button
            onClick={handleJoinNetwork}
            className="w-full glass-button glass-padding-sm glass-text-caption font-semibold"
            style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(37, 99, 235, 0.4))' }}
          >
            <div className="glass-button-content">
              {personalizedMessage.cta}
            </div>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="glass-card">
      <div className="glass-card-content">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-light text-white mb-2">
                {personalizedMessage.title}
              </h2>
              <p className="text-white/70">
                {personalizedMessage.subtitle}
              </p>
            </div>
            {!user && (
              <button
                onClick={handleJoinNetwork}
                className="glass-button glass-padding-md glass-text-body font-semibold"
                style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(37, 99, 235, 0.4))' }}
              >
                <div className="glass-button-content">
                  {personalizedMessage.cta}
                </div>
              </button>
            )}
          </div>
          
          {/* Network Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">10,000+</div>
              <div className="text-sm text-white/60">Professionals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">2,500+</div>
              <div className="text-sm text-white/60">Showcases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">500+</div>
              <div className="text-sm text-white/60">Companies</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="p-6 border-b border-white/10">
          <div className="flex space-x-1 glass-card p-1">
            {(['showcase', 'members', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  trackInteraction('network_tab', 'click', { tab });
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'showcase' && (
              <motion.div
                key="showcase"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="glass-card animate-pulse">
                        <div className="glass-card-content p-4">
                          <div className="h-4 bg-white/10 rounded mb-2" />
                          <div className="h-3 bg-white/5 rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  showcaseItems.map((showcase) => (
                    <motion.div
                      key={showcase.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card hover:glass-card-hover transition-all"
                    >
                      <div className="glass-card-content p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🚀</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-white">{showcase.title}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                showcase.tier === 'enterprise' ? 'bg-purple-500/20 text-purple-300' :
                                showcase.tier === 'business' ? 'bg-blue-500/20 text-blue-300' :
                                showcase.tier === 'pro' ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}>
                                {showcase.tier.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-white/70 mb-3">{showcase.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-xs text-white/60">
                                <span>{showcase.authorName} • {showcase.authorCompany}</span>
                                <span>{showcase.views} views</span>
                              </div>
                              <button
                                onClick={() => handleLikeShowcase(showcase.id)}
                                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-all ${
                                  showcase.isLiked 
                                    ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                }`}
                              >
                                <span>{showcase.isLiked ? '❤️' : '🤍'}</span>
                                <span>{showcase.likes}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {networkMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card hover:glass-card-hover transition-all cursor-pointer"
                    onClick={() => onViewProfile?.(member.id)}
                  >
                    <div className="glass-card-content p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center font-semibold text-white">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{member.name}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              member.tier === 'enterprise' ? 'bg-purple-500/20 text-purple-300' :
                              member.tier === 'business' ? 'bg-blue-500/20 text-blue-300' :
                              member.tier === 'pro' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {member.tier.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-white/70">{member.role} at {member.company}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-white/60">Reputation: {member.reputation}</span>
                            <span className="text-xs text-green-400">● Active {Math.floor((Date.now() - member.lastActive) / 60000)}m ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {networkActivity.map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 glass-card"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-sm">
                      {activity.type === 'showcase_created' ? '🚀' :
                       activity.type === 'member_joined' ? '👋' :
                       activity.type === 'achievement_unlocked' ? '🏆' : '⬆️'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        <span className="font-semibold">{activity.userName}</span>
                        <span className="text-white/60"> from {activity.userCompany} </span>
                        {activity.type === 'showcase_created' && 'created a new showcase'}
                        {activity.type === 'member_joined' && 'joined the network'}
                        {activity.type === 'achievement_unlocked' && `unlocked "${activity.data.achievement}"`}
                        {activity.type === 'tier_upgraded' && `upgraded to ${activity.data.toTier}`}
                      </p>
                      <p className="text-xs text-white/50">
                        {Math.floor((Date.now() - activity.timestamp) / 60000)} minutes ago
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Join Network Modal */}
      <AnimatePresence>
        {joinPromptVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-center justify-center p-4"
            onClick={() => setJoinPromptVisible(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-primary glass-padding-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="glass-text-title text-white glass-spacing-lg text-center">
                Join Professional Network
              </h3>
              <p className="glass-text-body text-white/80 text-center mb-6">
                Connect with 10,000+ professionals and showcase your work to industry leaders.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setJoinPromptVisible(false)}
                  className="flex-1 glass-button glass-padding-md glass-text-body"
                >
                  Maybe Later
                </button>
                <button
                  className="flex-1 glass-button glass-padding-md glass-text-body font-semibold"
                  style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(37, 99, 235, 0.4))' }}
                >
                  <div className="glass-button-content">
                    Join Network
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};