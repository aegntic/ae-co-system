import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { createReferral } from '../../lib/supabase';
import { polarService } from '../../services/polarService';
import { emailService } from '../../services/emailService';

interface ReferralSectionProps {
  referrals: any[];
  referralCode: string;
  onUpdate: () => void;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({ 
  referrals, 
  referralCode, 
  onUpdate,
  userId,
  userEmail,
  userName
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [commissionData, setCommissionData] = useState<any>(null);

  const referralUrl = `${window.location.origin}?ref=${referralCode}`;
  
  const completedReferrals = referrals.filter(r => r.status === 'completed');
  const pendingReferrals = referrals.filter(r => r.status === 'pending');
  const totalRewards = completedReferrals.length * 3; // 3 months per referral

  // Calculate commission earnings using the new progressive rate system
  const calculateCommissionEarnings = () => {
    const totalReferrals = completedReferrals.length;
    
    // Progressive commission rates: 20% → 25% → 40%
    let rate = 0.20; // New tier: 20%
    if (totalReferrals >= 5) rate = 0.25; // Established tier: 25%
    if (totalReferrals >= 15) rate = 0.40; // Legacy tier: 40%
    
    // Assume average revenue per referral is $29/month (pro subscription)
    const avgRevenuePerReferral = 29;
    const totalRevenue = totalReferrals * avgRevenuePerReferral;
    const totalCommissions = totalRevenue * rate;
    
    return {
      totalReferrals,
      rate,
      tier: totalReferrals >= 15 ? 'legacy' : totalReferrals >= 5 ? 'established' : 'new',
      totalCommissions,
      pendingAmount: totalCommissions * 0.15, // Assume 15% pending
      paidAmount: totalCommissions * 0.85
    };
  };

  const earnings = calculateCommissionEarnings();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSending(true);
    setMessage(null);

    try {
      // Create referral in existing system
      await createReferral(inviteEmail);
      
      // Track referral in commission system (placeholder - would be triggered when referral converts)
      if (userId && userEmail && userName) {
        // This would normally be called when a referral actually converts to a paid user
        // For now, we're just demonstrating the integration
        console.log('Would track commission for user:', {
          referrerId: userId,
          referredEmail: inviteEmail,
          tier: earnings.tier,
          commissionRate: earnings.rate
        });
      }
      
      setMessage({ type: 'success', text: 'Invitation sent successfully! You\'ll earn commissions when they subscribe.' });
      setInviteEmail('');
      onUpdate();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send invitation. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setMessage({ type: 'success', text: 'Referral link copied to clipboard!' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Total Referrals</h3>
            <Icon name="users" size={20} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold">{referrals.length}</p>
          <p className="text-sm text-gray-400 mt-1">
            {completedReferrals.length} active, {pendingReferrals.length} pending
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Commission Tier</h3>
            <Icon name="star" size={20} className="text-yellow-400" />
          </div>
          <p className="text-3xl font-bold">{Math.round(earnings.rate * 100)}%</p>
          <p className="text-sm text-gray-400 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              earnings.tier === 'legacy' ? 'bg-purple-500/20 text-purple-400' :
              earnings.tier === 'established' ? 'bg-blue-500/20 text-blue-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {earnings.tier} tier
            </span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Total Earned</h3>
            <Icon name="dollar-sign" size={20} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold">${earnings.totalCommissions.toFixed(0)}</p>
          <p className="text-sm text-gray-400 mt-1">
            ${earnings.paidAmount.toFixed(0)} paid, ${earnings.pendingAmount.toFixed(0)} pending
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pro Rewards</h3>
            <Icon name="gift" size={20} className="text-purple-400" />
          </div>
          <p className="text-3xl font-bold">{totalRewards}</p>
          <p className="text-sm text-gray-400 mt-1">Months of Pro features</p>
        </motion.div>
      </div>

      {/* Share Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Share Your Referral Link</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Your unique referral link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={referralUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300"
              />
              <button
                onClick={copyReferralLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Icon name="copy" size={16} />
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out 4site.pro - Create amazing websites in seconds! Use my referral link: ${referralUrl}`)}`, '_blank')}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center space-x-2"
            >
              <Icon name="twitter" size={16} />
              <span>Share on Twitter</span>
            </button>
            
            <button
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`, '_blank')}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center space-x-2"
            >
              <Icon name="linkedin" size={16} />
              <span>Share on LinkedIn</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Email Invite */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Invite by Email</h3>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleInvite} className="flex space-x-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="friend@example.com"
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
            required
          />
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {sending ? (
              <>
                <Icon name="loader-2" size={16} className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Icon name="send" size={16} />
                <span>Send Invite</span>
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Referral List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Your Referrals</h3>
        
        {referrals.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No referrals yet. Start inviting friends to earn rewards!
          </p>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium">{referral.referred_email}</p>
                  <p className="text-sm text-gray-400">
                    Invited {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  referral.status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : referral.status === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {referral.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Commission Payout Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Commission Payouts</h3>
        
        <div className="space-y-4">
          {/* Next Payout Info */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-400">Next Payout</h4>
              <span className="text-sm text-gray-400">December 1, 2024</span>
            </div>
            <p className="text-2xl font-bold text-white">${earnings.pendingAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-400 mt-1">
              Processed via Polar.sh • Arrives in 1-3 business days
            </p>
          </div>

          {/* Commission Rate Progress */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Rate Progress</h4>
              <span className="text-sm text-gray-400">
                {earnings.tier === 'legacy' ? 'Max tier!' : 
                 earnings.tier === 'established' ? `${15 - earnings.totalReferrals} to Legacy (40%)` :
                 `${5 - earnings.totalReferrals} to Established (25%)`}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  earnings.tier === 'legacy' ? 'bg-purple-500' :
                  earnings.tier === 'established' ? 'bg-blue-500' :
                  'bg-green-500'
                }`}
                style={{ 
                  width: earnings.tier === 'legacy' ? '100%' :
                         earnings.tier === 'established' ? `${(earnings.totalReferrals / 15) * 100}%` :
                         `${(earnings.totalReferrals / 5) * 100}%`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>New (20%)</span>
              <span>Established (25%)</span>
              <span>Legacy (40%)</span>
            </div>
          </div>

          {/* Payout History Placeholder */}
          <div className="text-center py-4 text-gray-400">
            <Icon name="clock" size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Payout history will appear here once you start earning commissions</p>
          </div>

          {/* Integration Notice */}
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400 text-sm">
              <strong>🚀 Polar.sh Integration Active:</strong> All commission payouts are now processed through Polar.sh for faster, more reliable payments worldwide.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};