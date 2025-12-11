import ReactMarkdown from 'react-markdown';
import { parseSuggestionLinks, extractSources } from '../utils';
import { ThumbUpIcon, ThumbDownIcon, CopyIcon, RefreshIcon } from './Icons';
import { useState } from 'react';

export function Message({ message, docsURL, isLoading, isLastMessage, onRegenerate }) {
  const sources = message.role === 'assistant' ? extractSources(message.parts) : [];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[90%] p-3 text-sm leading-relaxed ${
          message.role === 'user'
            ? 'bg-[#1a1f1f] text-[#E2E8F0] rounded-3xl'
            : 'text-[#E2E8F0]'
        }`}
      >
        {message.role === 'user' ? (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        ) : (
          <>
            <div className="overflow-x-hidden text-left markdown-content">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-3 leading-relaxed text-[#E2E8F0]">{children}</p>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-[#E2E8F0] mb-3 pl-6 space-y-1" style={{ listStyleType: 'decimal', listStylePosition: 'outside' }}>{children}</ol>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-[#E2E8F0] mb-3 pl-6 space-y-1" style={{ listStyleType: 'disc', listStylePosition: 'outside' }}>{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-[#E2E8F0] leading-relaxed ml-0" style={{ display: 'list-item' }}>{children}</li>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold mb-2 mt-4 text-[#E2E8F0]">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold mb-2 mt-3 text-[#E2E8F0]">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold mb-2 mt-2 text-[#E2E8F0]">{children}</h3>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-[#E2E8F0]">{children}</strong>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#10b981] hover:text-emerald-300 hover:underline"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : undefined;

                    // Handle suggestions code block
                    if (language === 'suggestions' && typeof children === 'string') {
                      const links = parseSuggestionLinks(children, docsURL);
                      return (
                        <div className="space-y-2 my-2">
                          {links.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block px-3 py-2 bg-[#10b981]/10 text-[#10b981] hover:bg-[#3a3a3a] hover:text-emerald-300 border border-[#10b981]/20 rounded-lg text-sm transition-all"
                            >
                              {link.text}
                            </a>
                          ))}
                        </div>
                      );
                    }

                    // Inline code
                    if (inline) {
                      return (
                        <code className="bg-[#0a0e0e] border border-[#2A2F3A] px-1.5 py-0.5 rounded text-xs font-mono text-[#10b981]">
                          {children}
                        </code>
                      );
                    }

                    // Code block
                    return (
                      <pre className="bg-[#0a0e0e] border border-[#2A2F3A] text-[#E2E8F0] p-3 rounded-lg overflow-x-auto my-2">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isLoading && (
                <span className="inline-block w-1.5 h-3 ml-1 bg-[#10b981] animate-pulse align-middle" />
              )}
            </div>
            {sources.length > 0 && (
              <div className="mt-2 text-xs border-t border-[#2A2F3A] pt-2">
                <p className="font-semibold text-[#94A3B8]">Sources:</p>
                {sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10b981] hover:text-emerald-300 hover:underline block"
                  >
                    {s.title}
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Action buttons for assistant messages */}
      {message.role === 'assistant' && !isLoading && (
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleCopy}
            className="text-[#94A3B8] hover:text-[#10b981] hover:bg-[#3a3a3a] transition-all p-1.5 rounded cursor-pointer"
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            <CopyIcon className="w-4 h-4" />
          </button>
          <button
            className="text-[#94A3B8] hover:text-[#10b981] hover:bg-[#3a3a3a] transition-all p-1.5 rounded cursor-pointer"
            title="Good response"
          >
            <ThumbUpIcon className="w-4 h-4" />
          </button>
          <button
            className="text-[#94A3B8] hover:text-[#10b981] hover:bg-[#3a3a3a] transition-all p-1.5 rounded cursor-pointer"
            title="Bad response"
          >
            <ThumbDownIcon className="w-4 h-4" />
          </button>
          {isLastMessage && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="text-[#94A3B8] hover:text-[#10b981] hover:bg-[#3a3a3a] transition-all p-1.5 rounded cursor-pointer"
              title="Regenerate response"
            >
              <RefreshIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
