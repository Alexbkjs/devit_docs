import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { AssistantWidget } from './components/AssistantWidget';
import { getBackendURL } from './config';
import cssContent from './index.css?inline';

// Self-executing widget for Mintlify docs
(function() {
  // Inject CSS into the page
  function injectCSS() {
    const styleId = 'mintlify-assistant-styles';

    // Check if styles are already injected
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = cssContent;
    document.head.appendChild(style);
  }

  // Initialize the widget
  function initWidget() {
    // Default configuration - can be overridden via window.MINTLIFY_ASSISTANT_CONFIG
    const config = window.MINTLIFY_ASSISTANT_CONFIG || {};
    const {
      domain = 'http://localhost:3000',
      docsURL = 'http://localhost:3000/docs',
      containerId = 'mintlify-assistant-widget'
    } = config;

    // Get backend URL with automatic environment detection
    const backendURL = getBackendURL();

    // Inject CSS first
    injectCSS();

    // Create container if it doesn't exist
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }

    // Render the widget
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <AssistantWidget domain={domain} docsURL={docsURL} backendURL={backendURL} />
      </StrictMode>
    );
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    // DOM is already ready
    initWidget();
  }
})();
