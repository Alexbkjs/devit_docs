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
 * @returns {string} App name: 'selecty', 'resell', 'general', or default 'selecty'
 */
export function getAppNameFromUrl() {
  if (typeof window === 'undefined') {
    return 'selecty'; // Default for SSR
  }

  const path = window.location.pathname;

  // Match URL pattern: /selecty/*, /resell/*, /general/*
  const match = path.match(/^\/(selecty|resell|general)/);

  if (match) {
    return match[1]; // Returns: 'selecty', 'resell', or 'general'
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
    }
  };

  return configs[appName] || configs.selecty;
}

export const ASSISTANT_CONFIG = {
  domain: 'http://localhost/3000',
  docsURL: 'http://localhost/3000/docs',
};
