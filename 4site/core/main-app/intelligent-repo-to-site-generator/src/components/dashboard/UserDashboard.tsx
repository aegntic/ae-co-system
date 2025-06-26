import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, 
  BarChart3, 
  Users, 
  Settings, 
  Plus, 
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Globe,
  Clock,
  TrendingUp,
  Gift,
  Share2,
  Mail,
  Copy,
  Check,
  Crown
} from 'lucide-react';
import { useAuth, usePermissions } from '../../contexts/AuthContext';
import { websiteHelpers, referralHelpers, analyticsHelpers } from '../../lib/supabase';
import type { Website, UserProfile } from '../../types/database';
import { WebsiteCard } from './WebsiteCard';
import { UsageMetrics } from './UsageMetrics';
import { ReferralSection } from './ReferralSection';
import { UpgradePrompt } from './UpgradePrompt';
import EnhancedReferralDashboard from './EnhancedReferralDashboard';

type TabType = 'sites' | 'analytics' | 'referrals' | 'commissions' | 'settings';

export const UserDashboard: React.FC = () => {
  const { user, userProfile, updateProfile } = useAuth();
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState<TabType>('sites');
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [referralStats, setReferralStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load websites
      const userWebsites = await websiteHelpers.getUserWebsites(user!.id);
      setWebsites(userWebsites || []);

      // Load analytics
      if (user) {
        const analytics = await analyticsHelpers.getUserAnalyticsSummary(user.id);
        setAnalyticsData(analytics);

        // Load referral stats
        const refStats = await referralHelpers.getReferralStats(user.id);
        setReferralStats(refStats);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebsite = async (websiteId: string) => {
    if (!confirm('Are you sure you want to delete this website?')) return;

    try {
      await websiteHelpers.deleteWebsite(websiteId);
      setWebsites(websites.filter(w => w.id !== websiteId));
    } catch (error) {
      console.error('Error deleting website:', error);
      alert('Failed to delete website');
    }
  };

  const tabs = [
    { id: 'sites' as TabType, label: 'My Sites', icon: LayoutGrid },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'referrals' as TabType, label: 'Referrals', icon: Users },
    { id: 'commissions' as TabType, label: 'Commissions', icon: TrendingUp },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  const websiteLimit = permissions.getWebsiteLimit();
  const canCreateMore = websiteLimit === -1 || websites.length < websiteLimit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary-400/20 rounded-full">
                <Crown className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-medium text-primary-100">
                  {userProfile?.subscription_tier?.toUpperCase() || 'FREE'}
                </span>
              </div>
            </div>
            
            {!canCreateMore && (
              <UpgradePrompt 
                message="Upgrade to create unlimited websites"
                currentTier={permissions.tier}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 font-medium transition-all relative
                    ${activeTab === tab.id 
                      ? 'text-primary-400' 
                      : 'text-white/60 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'sites' && (
            <motion.div
              key="sites"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Site Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon={Globe}
                  label="Total Sites"
                  value={websites.length}
                  limit={websiteLimit !== -1 ? `/ ${websiteLimit}` : ''}
                />
                <StatCard
                  icon={Eye}
                  label="Total Views"
                  value={analyticsData?.total_views || 0}
                  trend="+12%"
                />
                <StatCard
                  icon={Clock}
                  label="Avg. Build Time"
                  value="47s"
                  trend="-5s"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Conversion Rate"
                  value={`${(analyticsData?.conversion_rate || 0).toFixed(1)}%`}
                  trend="+2.3%"
                />
              </div>

              {/* Create New Button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">My Websites</h2>
                {canCreateMore ? (
                  <motion.a
                    href="/"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-400 text-black font-semibold rounded-lg hover:bg-primary-500 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Site
                  </motion.a>
                ) : (
                  <UpgradePrompt 
                    message="Upgrade to create more sites"
                    currentTier={permissions.tier}
                    compact
                  />
                )}
              </div>

              {/* Websites Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : websites.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white/60 mb-2">No websites yet</h3>
                  <p className="text-white/40 mb-6">Create your first website in 60 seconds</p>
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-400 text-black font-semibold rounded-lg hover:bg-primary-500 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Site
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {websites.map((website) => (
                    <WebsiteCard
                      key={website.id}
                      website={website}
                      onDelete={() => handleDeleteWebsite(website.id)}
                      showPoweredBy={!permissions.canRemoveBranding()}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UsageMetrics 
                websites={websites}
                analyticsData={analyticsData}
                tier={permissions.tier}
              />
            </motion.div>
          )}

          {activeTab === 'referrals' && (
            <motion.div
              key="referrals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ReferralSection 
                userId={user?.id || ''}
                referralCode={userProfile?.referral_code || ''}
                referralStats={referralStats}
              />
            </motion.div>
          )}

          {activeTab === 'commissions' && (
            <motion.div
              key="commissions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <EnhancedReferralDashboard />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SettingsSection 
                userProfile={userProfile}
                onUpdateProfile={updateProfile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  limit?: string;
  trend?: string;
}> = ({ icon: Icon, label, value, limit, trend }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-white/60 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">
          {value}
          {limit && <span className="text-white/40 text-lg">{limit}</span>}
        </p>
        {trend && (
          <p className={`text-sm mt-1 ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
            {trend}
          </p>
        )}
      </div>
      <Icon className="w-8 h-8 text-white/20" />
    </div>
  </div>
);

// Settings Section Component
const SettingsSection: React.FC<{
  userProfile: UserProfile | null;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}> = ({ userProfile, onUpdateProfile }) => {
  const [username, setUsername] = useState(userProfile?.username || '');
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateProfile({
        username,
        full_name: fullName,
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-white mb-6">Account Settings</h2>
      
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={userProfile?.email || ''}
            disabled
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-primary-400 text-white placeholder-white/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-primary-400 text-white placeholder-white/40"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary-400 hover:bg-primary-500 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Subscription</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60">Current Plan</p>
            <p className="text-xl font-bold text-white capitalize">
              {userProfile?.subscription_tier || 'Free'}
            </p>
          </div>
          {userProfile?.subscription_tier === 'free' && (
            <a
              href="/pricing"
              className="px-4 py-2 bg-primary-400 hover:bg-primary-500 text-black font-semibold rounded-lg transition-colors"
            >
              Upgrade
            </a>
          )}
        </div>
      </div>
    </div>
  );
};