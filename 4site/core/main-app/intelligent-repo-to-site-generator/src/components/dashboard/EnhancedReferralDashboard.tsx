import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { showcaseHelpers } from '../../lib/supabase';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Share2, 
  Crown, 
  Target,
  Clock,
  CheckCircle,
  Gift
} from 'lucide-react';

interface CommissionTotals {
  total: number;
  new: number;
  established: number;
  legacy: number;
  pending: number;
  paid: number;
}

interface ReferralProgress {
  total: number;
  converted: number;
  remaining: number;
  percentage: number;
}

interface Commission {
  id: string;
  commission_amount: number;
  commission_rate: number;
  commission_tier: 'new' | 'established' | 'legacy';
  payment_status: 'pending' | 'paid' | 'failed';
  referral_relationship_months: number;
  created_at: string;
  paid_at?: string;
}

const EnhancedReferralDashboard: React.FC = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [totals, setTotals] = useState<CommissionTotals>({
    total: 0,
    new: 0,
    established: 0,
    legacy: 0,
    pending: 0,
    paid: 0
  });
  const [progress, setProgress] = useState<ReferralProgress>({
    total: 0,
    converted: 0,
    remaining: 10,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load commission earnings
      const { commissions: commissionData, totals: totalsData } = await showcaseHelpers.getCommissionEarnings(user.id);
      setCommissions(commissionData || []);
      setTotals(totalsData);
      
      // Load referral progress
      const progressData = await showcaseHelpers.getReferralProgress(user.id);
      setProgress(progressData);
      
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getCommissionTierInfo = (tier: string) => {
    switch (tier) {
      case 'new':
        return { rate: '20%', period: '0-12 months', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
      case 'established':
        return { rate: '25%', period: '13-48 months', color: 'text-green-400', bgColor: 'bg-green-500/20' };
      case 'legacy':
        return { rate: '40%', period: '4+ years', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
      default:
        return { rate: '20%', period: '', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'new':
        return <Users className="w-4 h-4" />;
      case 'established':
        return <TrendingUp className="w-4 h-4" />;
      case 'legacy':
        return <Crown className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-white/10 rounded w-1/3"></div>
            <div className="h-4 bg-white/5 rounded w-2/3"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lifetime Commission Overview */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Lifetime Commission Earnings</h3>
            <p className="text-gray-400">Track your growing income from quality referrals</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{formatCurrency(totals.total)}</div>
            <div className="text-sm text-gray-400">Total Earned</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(totals.paid)}</div>
            <div className="text-sm text-gray-400">Paid Out</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{formatCurrency(totals.pending)}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{commissions.length}</div>
            <div className="text-sm text-gray-400">Payments</div>
          </div>
        </div>

        {/* Commission Tier Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['new', 'established', 'legacy'] as const).map((tier) => {
            const tierInfo = getCommissionTierInfo(tier);
            const amount = totals[tier];
            
            return (
              <div key={tier} className={`${tierInfo.bgColor} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={tierInfo.color}>
                    {getTierIcon(tier)}
                  </div>
                  <span className="font-medium text-white capitalize">{tier} Tier</span>
                </div>
                <div className={`text-xl font-bold ${tierInfo.color}`}>
                  {formatCurrency(amount)}
                </div>
                <div className="text-sm text-gray-400">
                  {tierInfo.rate} • {tierInfo.period}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Free Pro Milestone Progress */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Gift className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Free Pro Tier Progress</h3>
            <p className="text-gray-400">Earn 12 months of Pro free with 10 successful referrals</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">
              {progress.converted} / 10 referrals converted
            </span>
            <span className="text-gray-400">
              {progress.remaining} remaining
            </span>
          </div>
          
          <div className="w-full bg-white/10 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>0</span>
            <span>{progress.percentage.toFixed(1)}%</span>
            <span>10</span>
          </div>
        </div>

        {progress.converted >= 10 ? (
          <div className="flex items-center gap-2 p-3 bg-green-500/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">
              Congratulations! You've earned 12 months of Pro free!
            </span>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <Target className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <p>Keep sharing! Each quality referral brings you closer to free Pro.</p>
          </div>
        )}
      </div>

      {/* Share Tracking & Viral Boost */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Share2 className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Viral Growth Mechanics</h3>
            <p className="text-gray-400">External shares increase your featuring likelihood exponentially</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Share Multipliers</h4>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-white/5 rounded">
                <span className="text-gray-400">0 shares</span>
                <span className="text-white">1.0x boost</span>
              </div>
              <div className="flex justify-between p-2 bg-blue-500/10 rounded">
                <span className="text-gray-400">1-5 shares</span>
                <span className="text-blue-400">1.2x boost</span>
              </div>
              <div className="flex justify-between p-2 bg-green-500/10 rounded">
                <span className="text-gray-400">6-15 shares</span>
                <span className="text-green-400">1.5x boost</span>
              </div>
              <div className="flex justify-between p-2 bg-yellow-500/10 rounded">
                <span className="text-gray-400">16-50 shares</span>
                <span className="text-yellow-400">2.0x boost</span>
              </div>
              <div className="flex justify-between p-2 bg-red-500/10 rounded">
                <span className="text-gray-400">50+ shares</span>
                <span className="text-red-400">3.0x boost</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white">Commission Tiers Over Time</h4>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-blue-500/10 rounded">
                <span className="text-gray-400">First 13 months</span>
                <span className="text-blue-400">20% commission</span>
              </div>
              <div className="flex justify-between p-2 bg-green-500/10 rounded">
                <span className="text-gray-400">Years 1-4</span>
                <span className="text-green-400">25% commission</span>
              </div>
              <div className="flex justify-between p-2 bg-yellow-500/10 rounded">
                <span className="text-gray-400">4+ years</span>
                <span className="text-yellow-400">40% commission</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-purple-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Long-term Quality Rewards</span>
              </div>
              <p className="text-sm text-gray-400">
                Commission rates increase over time to reward lasting relationships
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Commission History */}
      {commissions.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Commission History</h3>
          
          <div className="overflow-hidden">
            <div className="space-y-2">
              {commissions.slice(0, 10).map((commission) => {
                const tierInfo = getCommissionTierInfo(commission.commission_tier);
                
                return (
                  <div key={commission.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${tierInfo.bgColor} rounded`}>
                        {getTierIcon(commission.commission_tier)}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {formatCurrency(commission.commission_amount)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {tierInfo.rate} • {commission.referral_relationship_months} months
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        commission.payment_status === 'paid' ? 'text-green-400' :
                        commission.payment_status === 'pending' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {commission.payment_status.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedReferralDashboard;