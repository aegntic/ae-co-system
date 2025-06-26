import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Polar.sh Integration POC for 4site.pro v2
 * One-click commerce for any generated site
 */

interface PolarConfig {
  organizationId: string;
  organizationName: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    recurring: boolean;
  }>;
  theme: 'light' | 'dark' | 'auto';
}

export const PolarIntegrationWizard: React.FC<{
  siteId: string;
  onComplete: (config: PolarConfig) => void;
}> = ({ siteId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<Partial<PolarConfig>>({
    theme: 'auto'
  });

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          Add Polar.sh Commerce to Your Site
        </h2>
        <p className="text-gray-600">
          Accept payments, subscriptions, and donations in minutes
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-20 h-1 ${
                  step > s ? 'bg-yellow-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        {step === 1 && <ConnectPolarStep config={config} setConfig={setConfig} />}
        {step === 2 && <ConfigureProductsStep config={config} setConfig={setConfig} />}
        {step === 3 && <CustomizeThemeStep config={config} setConfig={setConfig} />}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-6 py-3 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-lg"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => onComplete(config as PolarConfig)}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-lg"
          >
            Complete Setup
          </button>
        )}
      </div>
    </div>
  );
};

// Step 1: Connect Polar Account
const ConnectPolarStep: React.FC<{
  config: Partial<PolarConfig>;
  setConfig: (config: Partial<PolarConfig>) => void;
}> = ({ config, setConfig }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold">Connect Your Polar Account</h3>
    
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Organization ID
        </label>
        <input
          type="text"
          placeholder="your-org-id"
          value={config.organizationId || ''}
          onChange={(e) => setConfig({ ...config, organizationId: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
        />
        <p className="text-sm text-gray-500 mt-1">
          Find this in your Polar dashboard → Settings
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Organization Name
        </label>
        <input
          type="text"
          placeholder="Your Organization"
          value={config.organizationName || ''}
          onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>
    </div>

    <div className="bg-blue-50 p-4 rounded-lg">
      <p className="text-sm">
        <strong>Don't have a Polar account?</strong>{' '}
        <a href="https://polar.sh" target="_blank" className="text-blue-600 underline">
          Sign up for free
        </a>{' '}
        and get your API credentials.
      </p>
    </div>
  </div>
);

// Step 2: Configure Products
const ConfigureProductsStep: React.FC<{
  config: Partial<PolarConfig>;
  setConfig: (config: Partial<PolarConfig>) => void;
}> = ({ config, setConfig }) => {
  const suggestedProducts = [
    { name: 'Pro Access', price: 29, recurring: true },
    { name: 'Lifetime License', price: 299, recurring: false },
    { name: 'Support the Project', price: 5, recurring: true }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">What Would You Like to Sell?</h3>
      
      <div className="space-y-4">
        {suggestedProducts.map((product, idx) => (
          <label key={idx} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              onChange={(e) => {
                const products = config.products || [];
                if (e.target.checked) {
                  products.push({ ...product, id: `prod_${idx}` });
                } else {
                  products.splice(products.findIndex(p => p.id === `prod_${idx}`), 1);
                }
                setConfig({ ...config, products });
              }}
            />
            <div className="flex-1">
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-gray-600">
                ${product.price}{product.recurring ? '/month' : ' one-time'}
              </div>
            </div>
          </label>
        ))}
      </div>

      <button className="text-sm text-blue-600 underline">
        + Add custom product
      </button>
    </div>
  );
};

// Step 3: Customize Theme
const CustomizeThemeStep: React.FC<{
  config: Partial<PolarConfig>;
  setConfig: (config: Partial<PolarConfig>) => void;
}> = ({ config, setConfig }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold">Customize Appearance</h3>
    
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Theme Mode
        </label>
        <select
          value={config.theme}
          onChange={(e) => setConfig({ ...config, theme: e.target.value as any })}
          className="w-full px-4 py-2 border rounded-lg"
        >
          <option value="auto">Auto (match site)</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Widget Placement
        </label>
        <div className="grid grid-cols-2 gap-4">
          {['Header', 'Footer', 'Sidebar', 'Custom'].map((placement) => (
            <button
              key={placement}
              className="p-4 border rounded-lg hover:border-yellow-500 transition-colors"
            >
              {placement}
            </button>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
      <p className="text-sm">
        <strong>✨ Pro Tip:</strong> The Polar widget automatically adapts to your site's design.
        You can further customize it with CSS after setup.
      </p>
    </div>
  </div>
);

/**
 * Example of generated Polar integration code
 */
export const generatePolarIntegration = (config: PolarConfig): string => {
  return `
<!-- Polar.sh Integration - Powered by 4site.pro × aeLTD -->
<script async src="https://unpkg.com/@polar-sh/checkout@latest/dist/embed.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@polar-sh/checkout@latest/dist/embed.css">

<div class="polar-checkout-embed" 
  data-organization="${config.organizationId}"
  data-theme="${config.theme}"
  data-products='${JSON.stringify(config.products)}'>
</div>

<!-- Revenue sharing: 80% creator, 15% template, 5% 4site.pro -->
<script>
  window.polarConfig = {
    organization: "${config.organizationName}",
    theme: "${config.theme}",
    callbacks: {
      onSuccess: (order) => {
        // Track conversion
        window.analytics?.track('Purchase', {
          product: order.product.name,
          amount: order.amount,
          platform: '4site.pro'
        });
      }
    }
  };
</script>

<!-- #####ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ -->
`;
};