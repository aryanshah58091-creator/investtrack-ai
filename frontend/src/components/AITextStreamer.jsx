import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Brain, Shield, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * AITextStreamer
 * Formats AI financial text with typewriter streaming, markdown parsing,
 * metrics highlight (percentages, rupees, signals), and professional UI styling.
 */
export default function AITextStreamer({
  text = '',
  isLoading = false,
  title = 'InvestTrack AI Intelligence',
  badge = 'Live Synthesis',
  speed = 12, // ms per tick
  showCopy = true
}) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [copied, setCopied] = useState(false);

  // Reset or run streamer whenever text changes
  useEffect(() => {
    if (!text || isLoading) {
      setDisplayedLength(0);
      return;
    }

    // If text is short, display immediately
    if (text.length < 60) {
      setDisplayedLength(text.length);
      return;
    }

    // Stream text progressively
    setDisplayedLength(1);
    let current = 1;
    const step = Math.max(3, Math.floor(text.length / 80)); // scale speed smoothly

    const interval = setInterval(() => {
      current += step;
      if (current >= text.length) {
        setDisplayedLength(text.length);
        clearInterval(interval);
      } else {
        setDisplayedLength(current);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, isLoading, speed]);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('AI Analysis copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isStreaming = displayedLength < text.length && !isLoading && text.length > 0;
  const currentText = text.slice(0, displayedLength);

  // Render thinking placeholder
  if (isLoading) {
    return (
      <div className="ai-output-container is-generating" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <Brain size={24} style={{ color: '#818cf8', animation: 'pulseGlow 1.5s infinite' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#c7d2fe', letterSpacing: 0.5 }}>
            INVESTTRACK AI IS ANALYZING...
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '14px 0' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', animation: 'aiDotPulse 1.2s infinite ease-in-out' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6', animation: 'aiDotPulse 1.2s infinite ease-in-out 0.2s' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ec4899', animation: 'aiDotPulse 1.2s infinite ease-in-out 0.4s' }} />
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 440, margin: '0 auto', lineHeight: 1.5 }}>
          Synthesizing real-time market data, valuation multiples, technical indicators (RSI & SMA), and news catalysts...
        </p>
      </div>
    );
  }

  if (!text) return null;

  // Format markdown blocks (headers, bold, numbers, bullets)
  const formatText = (raw) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} style={{ height: 10 }} />;

      // Header 3 / 2
      if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
        const hText = trimmed.replace(/^###?\s+/, '');
        return (
          <h4
            key={idx}
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#93c5fd',
              margin: '14px 0 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              letterSpacing: 0.3
            }}
          >
            <Sparkles size={14} style={{ color: '#60a5fa' }} />
            {hText}
          </h4>
        );
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bText = trimmed.replace(/^[-*]\s+/, '');
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 8,
              fontSize: 13.5,
              lineHeight: 1.6,
              color: '#e2e8f0'
            }}
          >
            <span style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#818cf8',
              marginTop: 8,
              flexShrink: 0,
              boxShadow: '0 0 6px #818cf8'
            }} />
            <div>{parseInlineMarkup(bText)}</div>
          </div>
        );
      }

      // Numbered lists (e.g. 1. 2.)
      if (/^\d+\.\s+/.test(trimmed)) {
        const num = trimmed.match(/^(\d+)\.\s+/)[1];
        const nText = trimmed.replace(/^\d+\.\s+/, '');
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 8,
              fontSize: 13.5,
              lineHeight: 1.6,
              color: '#e2e8f0'
            }}
          >
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#a5b4fc',
              background: 'rgba(99, 102, 241, 0.2)',
              padding: '1px 6px',
              borderRadius: 6,
              marginTop: 2,
              flexShrink: 0
            }}>
              {num}
            </span>
            <div>{parseInlineMarkup(nText)}</div>
          </div>
        );
      }

      // Standard paragraph
      return (
        <p
          key={idx}
          style={{
            fontSize: 13.5,
            color: '#e2e8f0',
            lineHeight: 1.65,
            marginBottom: 8
          }}
        >
          {parseInlineMarkup(trimmed)}
        </p>
      );
    });
  };

  // Helper for bold **text**, percentages, and currencies
  const parseInlineMarkup = (str) => {
    // Split by ** for bold
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong
            key={pIdx}
            style={{
              color: '#ffffff',
              fontWeight: 700,
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '1px 4px',
              borderRadius: 4
            }}
          >
            {highlightFinancialTokens(inner)}
          </strong>
        );
      }
      return <span key={pIdx}>{highlightFinancialTokens(part)}</span>;
    });
  };

  // Highlights positive %, negative %, and rupee symbols
  const highlightFinancialTokens = (segment) => {
    const tokens = segment.split(/(\+?\d+\.?\d*%|₹\s?\d+[\d,]*\.?\d*)/g);
    return tokens.map((tok, tIdx) => {
      if (/^\+\d+\.?\d*%/.test(tok)) {
        return (
          <span
            key={tIdx}
            style={{
              color: '#34d399',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '1px 5px',
              borderRadius: 4
            }}
          >
            {tok}
          </span>
        );
      }
      if (/^-\d+\.?\d*%/.test(tok)) {
        return (
          <span
            key={tIdx}
            style={{
              color: '#f87171',
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.15)',
              padding: '1px 5px',
              borderRadius: 4
            }}
          >
            {tok}
          </span>
        );
      }
      if (/^₹/.test(tok)) {
        return (
          <span
            key={tIdx}
            style={{
              color: '#93c5fd',
              fontWeight: 600
            }}
          >
            {tok}
          </span>
        );
      }
      return tok;
    });
  };

  return (
    <div className={`ai-output-container ${isStreaming ? 'is-generating' : ''}`} style={{ animation: 'aiFadeUp 0.3s ease' }}>
      {/* AI Header Bar */}
      <div className="ai-output-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="ai-pulse-dot" />
          <span className="ai-tag-live">{title}</span>
          {badge && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(147, 51, 234, 0.25))',
              color: '#c7d2fe',
              border: '1px solid rgba(129, 140, 248, 0.3)'
            }}>
              {badge}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isStreaming && (
            <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 600 }}>
              Generating...
            </span>
          )}
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-ghost btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 8px',
                fontSize: 12,
                color: copied ? '#10b981' : 'var(--text-secondary)'
              }}
              title="Copy to clipboard"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div style={{ padding: '18px 20px', minHeight: 60 }}>
        {formatText(currentText)}
        {isStreaming && <span className="ai-typing-cursor" />}
      </div>
    </div>
  );
}
