import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { polarService } from '../../services/polarService';

interface CommissionStats {
  totalPaid: number;
  totalPending: number;
  totalUsers: number;
  avgCommissionRate: number;
  monthlyGrowth: number;
}

interface CommissionUser {
  id: string;
  email: string;
  fullName: string;
  tier: string;
  totalEarned: number;
  pendingAmount: number;
  referralsCount: number;
  lastPayoutDate: string;
  status: 'active' | 'suspended' | 'pending_verification';
}

const CommissionDashboard: React.FC = () => {
  const [stats, setStats] = useState<CommissionStats>({
    totalPaid: 45750.50,
    totalPending: 12340.25,
    totalUsers: 127,
    avgCommissionRate: 0.235,
    monthlyGrowth: 0.18
  });

  const [users, setUsers] = useState<CommissionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    loadCommissionData();
  }, []);

  const loadCommissionData = async () => {
    setLoading(true);
    try {
      // Placeholder data - replace with actual API calls
      const mockUsers: CommissionUser[] = [
        {
          id: '1',
          email: 'john.doe@example.com',
          fullName: 'John Doe',
          tier: 'established',
          totalEarned: 2450.75,
          pendingAmount: 187.50,
          referralsCount: 12,
          lastPayoutDate: '2024-11-01',
          status: 'active'
        },
        {
          id: '2',
          email: 'sarah.wilson@example.com',
          fullName: 'Sarah Wilson',
          tier: 'legacy',
          totalEarned: 5890.25,
          pendingAmount: 456.80,
          referralsCount: 28,
          lastPayoutDate: '2024-11-01',
          status: 'active'
        },
        {
          id: '3',
          email: 'mike.chen@example.com',
          fullName: 'Mike Chen',
          tier: 'new',
          totalEarned: 890.40,
          pendingAmount: 125.60,
          referralsCount: 5,
          lastPayoutDate: '2024-10-15',
          status: 'active'
        }
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPayout = async () => {
    console.log('Processing bulk payout for users:', selectedUsers);
    // Implement bulk payout logic
  };

  const handleExportData = () => {
    console.log('Exporting commission data...');
    // Implement CSV/PDF export
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterTier === 'all' || user.tier === filterTier;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Commission Dashboard</h1>
            <p className="text-gray-400 mt-2">Manage referral commissions and payouts</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
            <button
              onClick={loadCommissionData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Total Paid</h3>
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">${stats.totalPaid.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-1">Lifetime commissions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pending Payouts</h3>
              <Calendar className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-yellow-400">${stats.totalPending.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-1">Next payout date: Dec 1</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Active Partners</h3>
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400">{stats.totalUsers}</p>
            <p className="text-sm text-gray-400 mt-1">Commission-eligible users</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Monthly Growth</h3>
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-purple-400">
              +{(stats.monthlyGrowth * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-400 mt-1">Commission growth</p>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value="new">New (20%)</option>
                <option value="established">Established (25%)</option>
                <option value="legacy">Legacy (40%)</option>
              </select>
            </div>

            {selectedUsers.length > 0 && (
              <button
                onClick={handleBulkPayout}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Process Payout ({selectedUsers.length} users)
              </button>
            )}
          </div>
        </div>

        {/* Commission Users Table */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left">User</th>
                  <th className="px-6 py-4 text-left">Tier</th>
                  <th className="px-6 py-4 text-left">Total Earned</th>
                  <th className="px-6 py-4 text-left">Pending</th>
                  <th className="px-6 py-4 text-left">Referrals</th>
                  <th className="px-6 py-4 text-left">Last Payout</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.tier === 'legacy' ? 'bg-purple-500/20 text-purple-400' :
                        user.tier === 'established' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {user.tier} ({user.tier === 'legacy' ? '40%' : user.tier === 'established' ? '25%' : '20%'})
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">${user.totalEarned.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-yellow-400">${user.pendingAmount.toFixed(2)}</td>
                    <td className="px-6 py-4">{user.referralsCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{user.lastPayoutDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        user.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-400 hover:text-blue-300 text-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Placeholder Notice */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-sm">
            <strong>Placeholder Component:</strong> This is a mock admin dashboard. 
            In production, this would connect to the Polar.sh API for real commission data and payout processing.
          </p>
        </div>

      </div>
    </div>
  );
};

export default CommissionDashboard;