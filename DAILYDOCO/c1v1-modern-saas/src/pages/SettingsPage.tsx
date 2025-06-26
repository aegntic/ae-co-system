import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PersonIcon,
  BellIcon,
  GlobeIcon,
  LockClosedIcon,
  DesktopIcon,
  IdCardIcon,
  QuestionMarkCircledIcon
} from '@radix-ui/react-icons';
import * as Switch from '@radix-ui/react-switch';
import { useToastContext } from '@/components/ToastProvider';
import { cn } from '@/utils/cn';

const settingsSections = [
  { id: 'profile', name: 'Profile', icon: PersonIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon },
  { id: 'integrations', name: 'Integrations', icon: GlobeIcon },
  { id: 'privacy', name: 'Privacy & Security', icon: LockClosedIcon },
  { id: 'preferences', name: 'Preferences', icon: DesktopIcon },
  { id: 'billing', name: 'Billing', icon: IdCardIcon },
  { id: 'help', name: 'Help & Support', icon: QuestionMarkCircledIcon },
];

export default function SettingsPage() {
  const toast = useToastContext();
  const [activeSection, setActiveSection] = useState('profile');
  
  // Profile settings
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  
  // Privacy settings
  const [publicProfile, setPublicProfile] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  
  const handleSaveProfile = () => {
    toast.success('Profile Updated', 'Your profile has been updated successfully');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Profile Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <PersonIcon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Change Picture
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        );
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Notification Preferences
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="email-notifications" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Email Notifications
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive updates about your videos via email
                    </p>
                  </div>
                  <Switch.Root
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    className={cn(
                      'w-11 h-6 rounded-full relative transition-colors',
                      emailNotifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
                  </Switch.Root>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="desktop-notifications" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Desktop Notifications
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show notifications on your desktop
                    </p>
                  </div>
                  <Switch.Root
                    id="desktop-notifications"
                    checked={desktopNotifications}
                    onCheckedChange={setDesktopNotifications}
                    className={cn(
                      'w-11 h-6 rounded-full relative transition-colors',
                      desktopNotifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
                  </Switch.Root>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="weekly-digest" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Weekly Digest
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get a weekly summary of your activity
                    </p>
                  </div>
                  <Switch.Root
                    id="weekly-digest"
                    checked={weeklyDigest}
                    onCheckedChange={setWeeklyDigest}
                    className={cn(
                      'w-11 h-6 rounded-full relative transition-colors',
                      weeklyDigest ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
                  </Switch.Root>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Privacy & Security
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="public-profile" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Public Profile
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow others to view your profile
                    </p>
                  </div>
                  <Switch.Root
                    id="public-profile"
                    checked={publicProfile}
                    onCheckedChange={setPublicProfile}
                    className={cn(
                      'w-11 h-6 rounded-full relative transition-colors',
                      publicProfile ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
                  </Switch.Root>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="analytics" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Usage Analytics
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Help us improve by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch.Root
                    id="analytics"
                    checked={analytics}
                    onCheckedChange={setAnalytics}
                    className={cn(
                      'w-11 h-6 rounded-full relative transition-colors',
                      analytics ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
                  </Switch.Root>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Security
                  </h3>
                  <div className="space-y-3">
                    <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                      Change Password
                    </button>
                    <button className="block text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                      Enable Two-Factor Authentication
                    </button>
                    <button className="block text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              This section is coming soon...
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeSection === section.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <section.icon className="w-5 h-5" />
                {section.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
          >
            {renderSection()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}