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
          message.role === 'user' ? 'rounded-3xl' : ''
        }`}
        style={
          message.role === 'user'
            ? {
                backgroundColor: 'var(--widget-bg-secondary)',
                color: 'var(--widget-text-primary)',
              }
            : { color: 'var(--widget-text-primary)' }
        }
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
                    <p className="mb-3 leading-relaxed" style={{ color: 'var(--widget-text-primary)' }}>{children}</p>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 pl-6 space-y-1" style={{ color: 'var(--widget-text-primary)', listStyleType: 'decimal', listStylePosition: 'outside' }}>{children}</ol>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-3 pl-6 space-y-1" style={{ color: 'var(--widget-text-primary)', listStyleType: 'disc', listStylePosition: 'outside' }}>{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed ml-0" style={{ color: 'var(--widget-text-primary)', display: 'list-item' }}>{children}</li>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold mb-2 mt-4" style={{ color: 'var(--widget-text-primary)' }}>{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold mb-2 mt-3" style={{ color: 'var(--widget-text-primary)' }}>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold mb-2 mt-2" style={{ color: 'var(--widget-text-primary)' }}>{children}</h3>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold" style={{ color: 'var(--widget-text-primary)' }}>{children}</strong>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="widget-link hover:underline"
                      style={{ color: 'var(--widget-accent-primary)' }}
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
                              className="widget-suggestion-link block px-3 py-2 rounded-lg text-sm transition-all"
                              style={{
                                backgroundColor: 'var(--widget-accent-subtle)',
                                color: 'var(--widget-accent-primary)',
                                border: '1px solid var(--widget-accent-border)',
                              }}
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
                        <code
                          className="px-1.5 py-0.5 rounded text-xs font-mono"
                          style={{
                            backgroundColor: 'var(--widget-bg-tertiary)',
                            border: '1px solid var(--widget-border-primary)',
                            color: 'var(--widget-accent-primary)',
                          }}
                        >
                          {children}
                        </code>
                      );
                    }

                    // Code block
                    return (
                      <pre
                        className="p-3 rounded-lg overflow-x-auto my-2"
                        style={{
                          backgroundColor: 'var(--widget-bg-tertiary)',
                          border: '1px solid var(--widget-border-primary)',
                          color: 'var(--widget-text-primary)',
                        }}
                      >
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
                <span
                  className="inline-block w-1.5 h-3 ml-1 animate-pulse align-middle"
                  style={{ backgroundColor: 'var(--widget-accent-primary)' }}
                />
              )}
            </div>
            {sources.length > 0 && (
              <div className="mt-2 text-xs pt-2" style={{ borderTop: '1px solid var(--widget-border-primary)' }}>
                <p className="font-semibold" style={{ color: 'var(--widget-text-secondary)' }}>Sources:</p>
                {sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="widget-link hover:underline block"
                    style={{ color: 'var(--widget-accent-primary)' }}
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
            className="widget-action-button transition-all p-1.5 rounded cursor-pointer"
            style={{ color: 'var(--widget-text-secondary)' }}
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            <CopyIcon className="w-4 h-4" />
          </button>
          <button
            className="widget-action-button transition-all p-1.5 rounded cursor-pointer"
            style={{ color: 'var(--widget-text-secondary)' }}
            title="Good response"
          >
            <ThumbUpIcon className="w-4 h-4" />
          </button>
          <button
            className="widget-action-button transition-all p-1.5 rounded cursor-pointer"
            style={{ color: 'var(--widget-text-secondary)' }}
            title="Bad response"
          >
            <ThumbDownIcon className="w-4 h-4" />
          </button>
          {isLastMessage && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="widget-action-button transition-all p-1.5 rounded cursor-pointer"
              style={{ color: 'var(--widget-text-secondary)' }}
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
