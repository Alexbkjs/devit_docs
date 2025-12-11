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
            className="bg-[#090d0d]/95 backdrop-blur-md border border-[#2A2F3A] hover:border-[#10b981]/50 text-[#94A3B8] group flex items-center gap-3 px-4 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]"
          >
            <span className="text-[#10b981]/80">
              <SparklesIcon className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium text-[#E2E8F0]/80 group-hover:text-[#E2E8F0]">
              Ask a question...
            </span>
            <div className="bg-slate-800/90 p-1.5 rounded-full group-hover:bg-[#10b981] transition-colors">
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
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={() => setIsOpen(false)}
            style={{ animation: 'fadeIn 0.2s ease-in-out' }}
          />

          {/* Sidebar */}
          <div
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#090d0d] border-l border-[#2f4f4f] shadow-2xl flex flex-col z-[9999]"
            style={{ animation: 'slideIn 0.3s ease-out' }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#2A2F3A]/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-[#10b981]" />
                  <h3 className="font-semibold text-[#E2E8F0]">Assistant</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearChat}
                    className="text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#3a3a3a] transition-all p-1.5 rounded cursor-pointer"
                    title="Clear chat"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#3a3a3a] transition-all p-1.5 rounded cursor-pointer"
                    title="Close"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* Context Indicator */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                  {appConfig.displayName}
                </span>
                <span className="text-xs text-[#94A3B8]">{appConfig.description}</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-6 py-3 text-center border-b border-[#2A2F3A]/50 bg-[#090d0d]/50">
              <p className="text-xs text-[#94A3B8]">
                Responses are generated using AI and may contain mistakes.
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                  <SparklesIcon className="w-12 h-12 text-[#10b981]/50" />
                  <p className="text-sm text-[#94A3B8]">Ask anything about the documentation</p>
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
                <p className="text-xs font-semibold text-[#94A3B8] mb-3">Suggestions</p>
                <div className="flex flex-col gap-2">
                  {appConfig.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestionClick(s)}
                      disabled={isLoading}
                      className="text-left text-sm text-[#10b981] hover:text-emerald-300 hover:bg-[#3a3a3a] transition-all py-1.5 px-2 rounded truncate disabled:opacity-50 cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-6 border-t border-[#2A2F3A] bg-[#090d0d]">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="w-full bg-[#090d0d] border border-[#2A2F3A]/30 text-[#E2E8F0] rounded-full pl-4 pr-12 py-3 text-sm focus:border-[#10b981] transition-all placeholder-[#94A3B8]/50 outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 inset-y-0 my-auto bg-[#10b981] hover:bg-emerald-600 text-white w-8 h-8 rounded-full disabled:opacity-50 disabled:hover:bg-[#10b981] transition-colors flex items-center justify-center cursor-pointer"
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
