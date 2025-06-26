/**
 * COMMISSION DASHBOARD EXPERIENCE
 * Monthly engagement psychology with tier progression visualization
 * 
 * Philosophy: Make commission claiming feel like achievement celebration
 */

import React, { useState, useEffect, useRef } from 'react';

interface CommissionData {
  currentTier: 'new' | 'growing' | 'established' | 'legacy';
  currentRate: number; // 0.20 = 20%
  nextTier?: 'growing' | 'established' | 'legacy';
  nextTierRate?: number;
  monthsToNextTier?: number;
  
  thisMonth: {
    amount: number;
    referrals: number;
    claimable: number;
    lastClaimed?: Date;
  };
  
  lifetime: {
    earned: number;
    paid: number;
    referrals: number;
    conversionRate: number;
  };
  
  achievements: {
    totalReferrals: number;
    qualityScore: number; // 0-1
    longestStreak: number; // months
    topMonth: number; // highest earning month
  };
}

interface CommissionDashboardProps {
  userId: string;
  userTier: 'free' | 'pro' | 'business' | 'enterprise';
  onClaim: (amount: number) => Promise<void>;
}

export const CommissionDashboardExperience: React.FC<CommissionDashboardProps> = ({
  userId,
  userTier,
  onClaim
}) => {
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [celebrationMode, setCelebrationMode] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  
  const progressRingRef = useRef<SVGCircleElement>(null);
  const achievementRingRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    loadCommissionData();
  }, [userId]);

  const loadCommissionData = async () => {
    setIsLoading(true);
    try {
      // This would integrate with the commission dashboard view
      const response = await fetch(`/api/commissions/dashboard/${userId}`);
      const data = await response.json();
      setCommissionData(data);
    } catch (error) {
      console.error('Failed to load commission data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimCommission = async () => {
    if (!commissionData?.thisMonth.claimable || isClaiming) return;
    
    setIsClaiming(true);
    setCelebrationMode(true);
    
    try {
      await onClaim(commissionData.thisMonth.claimable);
      
      // Update data after successful claim
      await loadCommissionData();
      
      // Celebration animation
      setTimeout(() => setCelebrationMode(false), 3000);
    } catch (error) {
      console.error('Failed to claim commission:', error);
      setCelebrationMode(false);
    } finally {
      setIsClaiming(false);
    }
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'new': return '#6b7280';      // Gray
      case 'growing': return '#10b981';  // Green  
      case 'established': return '#3b82f6'; // Blue
      case 'legacy': return '#f59e0b';   // Gold
      default: return '#6b7280';
    }
  };

  const getTierIcon = (tier: string): string => {
    switch (tier) {
      case 'new': return '🌱';
      case 'growing': return '🌿'; 
      case 'established': return '🌳';
      case 'legacy': return '👑';
      default: return '⭐';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateProgressToNextTier = (): number => {
    if (!commissionData?.monthsToNextTier) return 100;
    
    const totalMonthsNeeded = {
      'new': 9,
      'growing': 24,
      'established': 48
    }[commissionData.currentTier] || 0;
    
    const monthsPassed = totalMonthsNeeded - commissionData.monthsToNextTier;
    return (monthsPassed / totalMonthsNeeded) * 100;
  };

  if (isLoading) {
    return (
      <div className="apple-glass p-8 text-center">
        <div className="apple-spinner mx-auto mb-4" />
        <div className="text-gray-400">Loading your commission insights...</div>
      </div>
    );
  }

  if (!commissionData) {
    return (
      <div className="apple-glass p-8 text-center">
        <div className="text-gray-400">No commission data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Celebration Overlay */}
      {celebrationMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="apple-glass p-8 text-center max-w-md animate-spring-in">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-2xl font-bold text-white mb-2">
              Commission Claimed!
            </div>
            <div className="text-xl" style={{ color: getTierColor(commissionData.currentTier) }}>
              {formatCurrency(commissionData.thisMonth.claimable)}
            </div>
            <div className="text-sm text-gray-400 mt-4">
              Keep building your network for even greater rewards
            </div>
          </div>
        </div>
      )}

      {/* Header with Tier Progression */}
      <div className="apple-glass p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Commission Dashboard</h2>
            <p className="text-gray-400">Track your network growth and earnings</p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-2xl">{getTierIcon(commissionData.currentTier)}</span>
              <span className="text-lg font-semibold capitalize" style={{ color: getTierColor(commissionData.currentTier) }}>
                {commissionData.currentTier}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              {(commissionData.currentRate * 100).toFixed(0)}% commission rate
            </div>
          </div>
        </div>

        {/* Tier Progression Visualization */}
        {commissionData.nextTier && (
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Progress to {commissionData.nextTier}</span>
              <span className="text-sm font-medium" style={{ color: getTierColor(commissionData.nextTier) }}>
                {commissionData.monthsToNextTier} months remaining
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
              <div 
                className="h-3 rounded-full transition-all duration-1000 relative overflow-hidden"
                style={{ 
                  width: `${calculateProgressToNextTier()}%`,
                  background: `linear-gradient(90deg, ${getTierColor(commissionData.currentTier)}, ${getTierColor(commissionData.nextTier)})`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-400">
              Next tier: <span style={{ color: getTierColor(commissionData.nextTier) }}>
                {(commissionData.nextTierRate! * 100).toFixed(0)}% commission rate
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* This Month - Claimable */}
        <div className="apple-glass p-6 text-center relative">
          <div className="relative z-10">
            <div className="text-3xl font-bold text-white mb-2">
              {formatCurrency(commissionData.thisMonth.claimable)}
            </div>
            <div className="text-sm text-gray-400 mb-4">Available to Claim</div>
            
            {commissionData.thisMonth.claimable > 0 ? (
              <button
                onClick={handleClaimCommission}
                disabled={isClaiming}
                className="btn-apple btn-primary w-full"
                style={{ background: getTierColor(commissionData.currentTier) }}
              >
                {isClaiming ? 'Claiming...' : 'Claim Commission'}
              </button>
            ) : (
              <div className="text-sm text-gray-500">
                {commissionData.thisMonth.lastClaimed 
                  ? `Last claimed ${new Date(commissionData.thisMonth.lastClaimed).toLocaleDateString()}`
                  : 'No commissions to claim yet'
                }
              </div>
            )}
          </div>
          
          {/* Subtle glow effect for claimable amount */}
          {commissionData.thisMonth.claimable > 0 && (
            <div 
              className="absolute inset-0 rounded-2xl opacity-20 animate-pulse"
              style={{ background: `radial-gradient(circle, ${getTierColor(commissionData.currentTier)}40, transparent)` }}
            />
          )}
        </div>

        {/* This Month Performance */}
        <div className="apple-glass p-6">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-white">
              {commissionData.thisMonth.referrals}
            </div>
            <div className="text-sm text-gray-400">Referrals This Month</div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Earned:</span>
              <span className="text-white font-medium">
                {formatCurrency(commissionData.thisMonth.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Commission Rate:</span>
              <span style={{ color: getTierColor(commissionData.currentTier) }}>
                {(commissionData.currentRate * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Lifetime Performance */}
        <div className="apple-glass p-6">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-white">
              {formatCurrency(commissionData.lifetime.earned)}
            </div>
            <div className="text-sm text-gray-400">Lifetime Earnings</div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Paid:</span>
              <span className="text-green-400 font-medium">
                {formatCurrency(commissionData.lifetime.paid)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Conversion Rate:</span>
              <span className="text-blue-400">
                {(commissionData.lifetime.conversionRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Showcase */}
      <div className="apple-glass p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Network Achievements</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: getTierColor(commissionData.currentTier) }}>
              {commissionData.achievements.totalReferrals}
            </div>
            <div className="text-sm text-gray-400">Total Referrals</div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-bold text-green-400">
              {(commissionData.achievements.qualityScore * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-400">Quality Score</div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-bold text-blue-400">
              {commissionData.achievements.longestStreak}
            </div>
            <div className="text-sm text-gray-400">Month Streak</div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-bold text-purple-400">
              {formatCurrency(commissionData.achievements.topMonth)}
            </div>
            <div className="text-sm text-gray-400">Best Month</div>
          </div>
        </div>
      </div>

      {/* Referral Link & Sharing */}
      <div className="apple-glass p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Your Referral Network</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Referral Link</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={`https://4site.pro?ref=${userId}`}
                readOnly
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              />
              <button 
                className="btn-apple btn-secondary"
                onClick={() => navigator.clipboard.writeText(`https://4site.pro?ref=${userId}`)}
              >
                Copy
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-400">
            Share your link to start earning commissions on every subscription.
            Your commission rate increases over time as you build long-term relationships.
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default CommissionDashboardExperience;