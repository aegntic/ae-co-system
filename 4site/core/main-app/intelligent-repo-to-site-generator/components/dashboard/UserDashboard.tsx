import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth, usePermissions } from '../../contexts/AuthContext';
import { getUserWebsites, getUserUsage, getUserReferrals } from '../../lib/supabase';
import { Icon } from '../ui/Icon';
import { WebsiteCard } from './WebsiteCard';
import { UsageMetrics } from './UsageMetrics';
import { ReferralSection } from './ReferralSection';
import { UpgradePrompt } from './UpgradePrompt';

interface Website {
  id: string;
  title: string;
  description?: string;
  repo_url: string;
  subdomain?: string;
  custom_domain?: string;
  status: 'active' | 'building' | 'error' | 'suspended';
  pageviews: number;
  unique_visitors: number;
  created_at: string;
  updated_at: string;
}

export const UserDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const permissions = usePermissions();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sites' | 'analytics' | 'referrals' | 'settings'>('sites');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [websitesData, usageData, referralsData] = await Promise.all([
        getUserWebsites(user.id),
        getUserUsage(user.id),
        getUserReferrals(user.id)
      ]);

      setWebsites(websitesData as Website[]);
      setUsage(usageData);
      setReferrals(referralsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return null;
  }

  const tabs = [
    { id: 'sites', label: 'My Sites', icon: 'layout-grid' },
    { id: 'analytics', label: 'Analytics', icon: 'bar-chart-3' },
    { id: 'referrals', label: 'Referrals', icon: 'users' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="glass-header sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {profile.email}
              </span>
              <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-xs font-semibold uppercase">
                {profile.tier}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Sites</p>
                <p className="text-3xl font-bold">{websites.length}</p>
                {profile.websites_limit > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    of {profile.websites_limit} allowed
                  </p>
                )}
              </div>
              <Icon name="layout-grid" size={32} className="text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Views</p>
                <p className="text-3xl font-bold">
                  {websites.reduce((sum, site) => sum + site.pageviews, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <Icon name="eye" size={32} className="text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Referrals</p>
                <p className="text-3xl font-bold">{referrals.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {referrals.filter(r => r.status === 'completed').length} active
                </p>
              </div>
              <Icon name="users" size={32} className="text-purple-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Storage Used</p>
                <p className="text-3xl font-bold">
                  {Math.round(profile.total_pageviews / 1024)}MB
                </p>
                {profile.storage_limit_mb > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    of {profile.storage_limit_mb}MB
                  </p>
                )}
              </div>
              <Icon name="hard-drive" size={32} className="text-orange-400" />
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 glass-card p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon name={tab.icon} size={20} />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Icon name="loader-2" className="animate-spin" size={48} />
            </div>
          ) : (
            <>
              {activeTab === 'sites' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {!permissions.canCreateWebsite() && websites.length >= profile.websites_limit && (
                    <UpgradePrompt 
                      message="You've reached your website limit. Upgrade to create more sites!"
                      currentTier={profile.tier}
                    />
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {websites.map((website) => (
                      <WebsiteCard key={website.id} website={website} onUpdate={loadDashboardData} />
                    ))}
                    
                    {permissions.canCreateWebsite() && (
                      <motion.a
                        href="/"
                        className="glass-card p-6 flex flex-col items-center justify-center space-y-4 hover:bg-white/10 transition-colors group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon 
                          name="plus-circle" 
                          size={48} 
                          className="text-gray-500 group-hover:text-blue-400 transition-colors" 
                        />
                        <span className="text-gray-400 group-hover:text-white transition-colors">
                          Create New Site
                        </span>
                      </motion.a>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <UsageMetrics usage={usage} websites={websites} />
                </motion.div>
              )}

              {activeTab === 'referrals' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ReferralSection 
                    referrals={referrals} 
                    referralCode={profile.referral_code}
                    onUpdate={loadDashboardData}
                  />
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="glass-card p-8 space-y-6">
                    <h2 className="text-2xl font-bold">Account Settings</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Email
                        </label>
                        <p className="text-lg">{profile.email}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Current Plan
                        </label>
                        <div className="flex items-center space-x-3">
                          <span className="text-lg capitalize">{profile.tier}</span>
                          {profile.tier !== 'enterprise' && (
                            <a 
                              href="/pricing" 
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              Upgrade Plan
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Referral Code
                        </label>
                        <div className="flex items-center space-x-3">
                          <code className="bg-gray-800 px-3 py-1 rounded text-sm">
                            {profile.referral_code}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(profile.referral_code)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Icon name="copy" size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};