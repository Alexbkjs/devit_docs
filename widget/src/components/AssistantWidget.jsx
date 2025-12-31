import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import { Message } from './Message';
import { SparklesIcon, ArrowUpIcon, XMarkIcon, TrashIcon } from './Icons';
import { getAppConfig, getAppNameFromUrl } from '../config';

export function AssistantWidget({ domain, docsURL, backendURL }) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Get app-specific configuration
  const appConfig = getAppConfig();
  const appName = getAppNameFromUrl();

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages, reload, append } = useChat({
    api: `${backendURL}/api/chat`,
    streamProtocol: 'data',
    sendExtraMessageFields: true,
    body: {
      app_name: appName, // Send app context to backend
    },
  });

  // Keyboard shortcut: Ctrl+I to toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestionClick = (suggestion) => {
    append({
      role: 'user',
      content: suggestion,
    });
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Bottom-right button */}
      {!isOpen && (
        <div
          className="fixed bottom-6 right-6 z-[9999]"
          style={{ animation: 'fadeIn 0.2s ease-in-out' }}
        >
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300"
            style={{
              backgroundColor: 'var(--widget-bg-fab)',
              border: '1px solid var(--widget-border-primary)',
              color: 'var(--widget-text-secondary)',
              boxShadow: 'var(--widget-shadow-fab)',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--widget-accent-primary)';
              e.currentTarget.style.boxShadow = 'var(--widget-shadow-fab-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--widget-border-primary)';
              e.currentTarget.style.boxShadow = 'var(--widget-shadow-fab)';
            }}
          >
            <span style={{ color: 'var(--widget-accent-primary)', opacity: 0.8 }}>
              <SparklesIcon className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--widget-text-primary)', opacity: 0.8 }}>
              Ask a question...
            </span>
            <div className="fab-arrow-container p-1.5 rounded-full transition-colors" style={{ backgroundColor: 'var(--widget-bg-hover)', opacity: 0.9 }}>
              <ArrowUpIcon className="w-3 h-3 text-slate-400 group-hover:text-white" />
            </div>
          </button>
        </div>
      )}

      {/* Right sidebar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
            style={{
              animation: 'fadeIn 0.2s ease-in-out',
              backgroundColor: 'var(--widget-backdrop)',
            }}
          />

          {/* Sidebar */}
          <div
            className="fixed top-0 right-0 h-full w-full max-w-md flex flex-col z-[9999]"
            style={{
              animation: 'slideIn 0.3s ease-out',
              backgroundColor: 'var(--widget-bg-primary)',
              borderLeft: '1px solid var(--widget-border-secondary)',
              boxShadow: 'var(--widget-shadow-sidebar)',
            }}
          >
            {/* Header */}
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--widget-border-subtle)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5" style={{ color: 'var(--widget-accent-primary)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--widget-text-primary)' }}>Assistant</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearChat}
                    className="widget-icon-button transition-all p-1.5 rounded cursor-pointer"
                    style={{ color: 'var(--widget-text-secondary)' }}
                    title="Clear chat"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="widget-icon-button transition-all p-1.5 rounded cursor-pointer"
                    style={{ color: 'var(--widget-text-secondary)' }}
                    title="Close"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* Context Indicator */}
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--widget-accent-subtle)',
                    color: 'var(--widget-accent-primary)',
                    border: '1px solid var(--widget-accent-border)',
                  }}
                >
                  {appConfig.displayName}
                </span>
                <span className="text-xs" style={{ color: 'var(--widget-text-secondary)' }}>{appConfig.description}</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div
              className="px-6 py-3 text-center"
              style={{
                borderBottom: '1px solid var(--widget-border-subtle)',
                backgroundColor: 'var(--widget-bg-primary)',
                opacity: 0.95,
              }}
            >
              <p className="text-xs" style={{ color: 'var(--widget-text-secondary)' }}>
                Responses are generated using AI and may contain mistakes.
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                  <SparklesIcon className="w-12 h-12" style={{ color: 'var(--widget-accent-primary)', opacity: 0.5 }} />
                  <p className="text-sm" style={{ color: 'var(--widget-text-secondary)' }}>Ask anything about the documentation</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <Message
                    key={message.id}
                    message={message}
                    docsURL={docsURL}
                    isLoading={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                    isLastMessage={index === messages.length - 1}
                    onRegenerate={() => reload()}
                  />
                ))
              )}
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error.message}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions (only show if few messages) - App-specific */}
            {messages.length < 2 && (
              <div className="px-6 pb-2">
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--widget-text-secondary)' }}>Suggestions</p>
                <div className="flex flex-col gap-2">
                  {appConfig.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestionClick(s)}
                      disabled={isLoading}
                      className="widget-suggestion-button text-left text-sm transition-all py-1.5 px-2 rounded truncate disabled:opacity-50 cursor-pointer"
                      style={{ color: 'var(--widget-accent-primary)' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div
              className="p-6"
              style={{
                borderTop: '1px solid var(--widget-border-primary)',
                backgroundColor: 'var(--widget-bg-primary)',
              }}
            >
              <form onSubmit={handleSubmit} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="widget-input w-full rounded-full pl-4 pr-12 py-3 text-sm transition-all outline-none"
                  style={{
                    backgroundColor: 'var(--widget-bg-primary)',
                    border: '1px solid var(--widget-border-primary)',
                    color: 'var(--widget-text-primary)',
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="widget-submit-button absolute right-2 inset-y-0 my-auto w-8 h-8 rounded-full disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer"
                  style={{
                    backgroundColor: 'var(--widget-accent-primary)',
                    color: 'var(--widget-text-inverse)',
                  }}
                >
                  <ArrowUpIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
