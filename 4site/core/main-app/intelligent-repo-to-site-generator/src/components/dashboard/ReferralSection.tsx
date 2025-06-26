import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Users, 
  TrendingUp, 
  Share2, 
  Mail, 
  Copy, 
  Check,
  Twitter,
  Linkedin,
  Link,
  DollarSign,
  Target,
  Award
} from 'lucide-react';

interface ReferralSectionProps {
  userId: string;
  referralCode: string;
  referralStats: any;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({ 
  userId, 
  referralCode,
  referralStats 
}) => {
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  const referralUrl = `https://4site.pro/?ref=${referralCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailInvite = async () => {
    if (!emailInput) return;
    
    setSendingInvite(true);
    try {
      // In real app, this would send an API request
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Invitation sent to ${emailInput}!`);
      setEmailInput('');
    } catch (error) {
      alert('Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const shareOnTwitter = () => {
    const text = `Just discovered @4sitepro - build stunning websites in 60 seconds with AI! 🚀 Join me and get 1 month free:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`, '_blank');
  };

  // Calculate potential earnings
  const potentialEarnings = (referralStats?.total || 0) * 5; // $5 per referral
  const monthsEarned = Math.floor((referralStats?.converted || 0) / 3) * 3; // 3 months per 3 conversions

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Referral Program</h2>
        <p className="text-white/60">
          Earn rewards by inviting friends. Get 3 months free for every 3 friends who upgrade to Pro!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Referrals"
          value={referralStats?.total || 0}
          subtext="Friends invited"
        />
        <StatCard
          icon={Target}
          label="Active Users"
          value={referralStats?.activated || 0}
          subtext="Signed up"
          highlight
        />
        <StatCard
          icon={Award}
          label="Pro Conversions"
          value={referralStats?.converted || 0}
          subtext="Upgraded to Pro"
          highlight
        />
        <StatCard
          icon={Gift}
          label="Rewards Earned"
          value={`${monthsEarned} months`}
          subtext="Free Pro access"
          accent
        />
      </div>

      {/* Referral Link Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Your Referral Link</h3>
        
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-black/30 rounded-lg border border-white/20">
            <Link className="w-5 h-5 text-white/40 flex-shrink-0" />
            <code className="text-sm text-white/80 truncate">{referralUrl}</code>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="px-4 py-3 bg-primary-400 hover:bg-primary-500 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied!' : 'Copy'}
          </motion.button>
        </div>

        {/* Social Share Buttons */}
        <div className="flex gap-2">
          <button
            onClick={shareOnTwitter}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 border border-[#1DA1F2]/40 rounded-lg transition-colors"
          >
            <Twitter className="w-5 h-5 text-[#1DA1F2]" />
            <span className="text-sm text-white">Twitter</span>
          </button>
          <button
            onClick={shareOnLinkedIn}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 border border-[#0A66C2]/40 rounded-lg transition-colors"
          >
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            <span className="text-sm text-white">LinkedIn</span>
          </button>
        </div>
      </div>

      {/* Email Invite Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Invite via Email</h3>
        
        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="friend@example.com"
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-primary-400 text-white placeholder-white/40"
          />
          <button
            onClick={handleEmailInvite}
            disabled={!emailInput || sendingInvite}
            className="px-6 py-3 bg-primary-400 hover:bg-primary-500 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Mail className="w-5 h-5" />
            {sendingInvite ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
        
        <p className="text-sm text-white/40 mt-2">
          Your friend will receive an invitation with your referral link
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
        
        <div className="space-y-4">
          <Step 
            number="1" 
            title="Share Your Link"
            description="Send your unique referral link to friends via email, social media, or messaging"
          />
          <Step 
            number="2" 
            title="Friends Sign Up"
            description="When they sign up using your link, they get 1 month free Pro access"
          />
          <Step 
            number="3" 
            title="Earn Rewards"
            description="For every 3 friends who upgrade to Pro, you get 3 months free!"
          />
        </div>

        <div className="mt-6 p-4 bg-primary-400/10 rounded-lg border border-primary-400/30">
          <p className="text-sm text-primary-100">
            <strong>Pro tip:</strong> Share your success stories and showcase sites to increase conversions. 
            Users who see real examples are 3x more likely to sign up!
          </p>
        </div>
      </div>

      {/* Referral Leaderboard */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Top Referrers This Month</h3>
        
        <div className="space-y-3">
          {[
            { rank: 1, name: 'Sarah K.', referrals: 47, reward: '🏆' },
            { rank: 2, name: 'Mike T.', referrals: 32, reward: '🥈' },
            { rank: 3, name: 'Emma L.', referrals: 28, reward: '🥉' },
            { rank: 4, name: 'You', referrals: referralStats?.total || 0, reward: '', isYou: true },
          ].map((user) => (
            <div 
              key={user.rank}
              className={`flex items-center justify-between p-3 rounded-lg ${
                user.isYou ? 'bg-primary-400/10 border border-primary-400/30' : 'bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white/20">#{user.rank}</span>
                <div>
                  <p className="text-white font-medium">
                    {user.name} {user.reward}
                  </p>
                  <p className="text-sm text-white/40">
                    {user.referrals} referrals
                  </p>
                </div>
              </div>
              {user.isYou && (
                <span className="text-sm text-primary-400 font-medium">You</span>
              )}
            </div>
          ))}
        </div>

        <p className="text-sm text-white/40 text-center mt-4">
          Top 3 referrers get exclusive perks and early access to new features!
        </p>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext: string;
  highlight?: boolean;
  accent?: boolean;
}> = ({ icon: Icon, label, value, subtext, highlight, accent }) => (
  <div className={`
    p-6 rounded-xl border transition-all
    ${accent 
      ? 'bg-primary-400/10 border-primary-400/30' 
      : highlight 
        ? 'bg-green-400/10 border-green-400/30'
        : 'bg-white/5 border-white/10'
    }
  `}>
    <Icon className={`w-8 h-8 mb-3 ${
      accent ? 'text-primary-400' : highlight ? 'text-green-400' : 'text-white/40'
    }`} />
    <p className="text-sm text-white/60 mb-1">{label}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-white/40 mt-1">{subtext}</p>
  </div>
);

// Step Component
const Step: React.FC<{
  number: string;
  title: string;
  description: string;
}> = ({ number, title, description }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-10 h-10 bg-primary-400/20 rounded-full flex items-center justify-center">
      <span className="text-primary-400 font-bold">{number}</span>
    </div>
    <div>
      <h4 className="text-white font-medium mb-1">{title}</h4>
      <p className="text-sm text-white/60">{description}</p>
    </div>
  </div>
);