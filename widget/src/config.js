/**
 * Detects the current environment and returns the appropriate backend URL
 * @returns {string} The backend URL to use for API calls
 */
export function getBackendURL() {
  // Allow override via window configuration
  if (typeof window !== 'undefined' && window.MINTLIFY_ASSISTANT_CONFIG?.backendURL) {
    return window.MINTLIFY_ASSISTANT_CONFIG.backendURL;
  }

  // Detect environment based on current hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:9000';
    }
  }

  // Production default
  return 'https://devit-docs-api.vercel.app';
}

/**
 * Extracts the app name from the current URL path
 * Used to filter documentation searches by app context
 * @returns {string} App name: 'selecty', 'resell', 'general', 'lably', 'reactflow', 'discord-bots', or default 'selecty'
 */
export function getAppNameFromUrl() {
  if (typeof window === 'undefined') {
    return 'selecty'; // Default for SSR
  }

  const path = window.location.pathname;

  // Match all app URLs
  const match = path.match(/^\/(selecty|resell|general|lably|reactflow|discord-bots|email|telegram)/);

  if (match) {
    const appName = match[1];

    // Map email and telegram to discord-bots
    if (appName === 'email' || appName === 'telegram') {
      return 'discord-bots';
    }

    return appName; // selecty, resell, general, lably, reactflow, discord-bots
  }

  // Default to selecty if on root or unknown path
  return 'selecty';
}

/**
 * Gets app-specific configuration based on current URL
 * @returns {object} App-specific labels and metadata
 */
export function getAppConfig() {
  const appName = getAppNameFromUrl();

  const configs = {
    selecty: {
      name: 'selecty',
      displayName: 'Selecty',
      description: 'Free currency, language and country switchers',
      docsPath: '/selecty',
      suggestions: [
        "How do I get started with Selecty?",
        "How to create language switchers?",
        "How does market recommendation work?",
        "How to enable auto-redirect?"
      ]
    },
    resell: {
      name: 'resell',
      displayName: 'ReSell',
      description: 'Boost sales with post-purchase upsells',
      docsPath: '/resell',
      suggestions: [
        "How do I get started with ReSell?",
        "How to create an upsell funnel?",
        "What payment methods are supported?",
        "How does auto recommendation work?"
      ]
    },
    general: {
      name: 'general',
      displayName: 'DevIT.Software',
      description: 'Company information and custom solutions',
      docsPath: '/general',
      suggestions: [
        "What apps does DevIT.Software offer?",
        "How can I get custom development?",
        "What is DevIT.Software's expertise?",
        "How to contact support?"
      ]
    },
    lably: {
      name: 'lably',
      displayName: 'Lably',
      description: 'Product labels and badges for Shopify',
      docsPath: '/lably',
      suggestions: [
        "How do I get started with Lably?",
        "How to create custom labels?",
        "How do display conditions work?",
        "How to troubleshoot labels not showing?"
      ]
    },
    reactflow: {
      name: 'reactflow',
      displayName: 'React Flow',
      description: 'React Flow checkout and cart customization',
      docsPath: '/reactflow',
      suggestions: [
        "How do I get started with React Flow?",
        "How to customize the checkout flow?",
        "What features does React Flow offer?",
        "How to configure React Flow?"
      ]
    },
    'discord-bots': {
      name: 'discord-bots',
      displayName: 'Discord Bots',
      description: 'Email and Telegram bots for Discord',
      docsPath: '/discord-bots',
      suggestions: [
        "How do I get started with Email bot?",
        "How to connect Telegram to Discord?",
        "What commands are available?",
        "How to troubleshoot connection errors?"
      ]
    }
  };

  return configs[appName] || configs.selecty;
}

export const ASSISTANT_CONFIG = {
  domain: 'http://localhost/3000',
  docsURL: 'http://localhost/3000/docs',
};
