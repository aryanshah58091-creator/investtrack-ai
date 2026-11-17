import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiAPI } from '../api';
import {
  Brain,
  Sparkles,
  Layers,
  HelpCircle,
  Lightbulb,
  ArrowRightLeft,
  FileText,
  Newspaper,
  TrendingUp,
  TrendingDown,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AITextStreamer from '../components/AITextStreamer';

export default function AIInsightsPage() {
  const [activeTab, setActiveTab] = useState('portfolio-analyst');

  // Comparison form state
  const [compSymbolA, setCompSymbolA] = useState('TCS.NS');
  const [compSymbolB, setCompSymbolB] = useState('INFY.NS');

  // Quarterly stock input
  const [quarterlySymbol, setQuarterlySymbol] = useState('RELIANCE.NS');

  // News intelligence symbol
  const [newsSymbol, setNewsSymbol] = useState('RELIANCE.NS');

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'ai',
      text: "Hello! I am InvestTrack AI. Ask me anything about your holdings, sector risks, or stock analysis.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // 1. Portfolio Analyst Query
  const { data: analystData, isLoading: isAnalystLoading, refetch: refetchAnalyst } = useQuery({
    queryKey: ['ai-portfolio-analyst'],
    queryFn: async () => {
      const res = await aiAPI.getPortfolioAnalyst();
      return res.data;
    },
  });

  // 2. Health Score Query
  const { data: healthData, isLoading: isHealthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['ai-health-score'],
    queryFn: async () => {
      const res = await aiAPI.getHealthScore();
      return res.data;
    },
  });

  // 3. Why Moved Query
  const { data: whyMovedData, isLoading: isWhyMovedLoading, refetch: refetchWhyMoved } = useQuery({
    queryKey: ['ai-why-moved'],
    queryFn: async () => {
      const res = await aiAPI.getWhyMoved();
      return res.data;
    },
  });

  // 4. Trade Ideas Query
  const { data: tradeIdeasData, isLoading: isTradeIdeasLoading, refetch: refetchTradeIdeas } = useQuery({
    queryKey: ['ai-trade-ideas'],
    queryFn: async () => {
      const res = await aiAPI.getTradeIdeas();
      return res.data;
    },
  });

  // 5. Stock Comparison Query
  const {
    data: comparisonData,
    isLoading: isComparisonLoading,
    refetch: triggerComparison,
  } = useQuery({
    queryKey: ['ai-compare', compSymbolA, compSymbolB],
    queryFn: async () => {
      const res = await aiAPI.compareStocks({ symbol_a: compSymbolA, symbol_b: compSymbolB });
      return res.data;
    },
    enabled: false,
  });

  // 6. Quarterly Results Query
  const {
    data: quarterlyData,
    isLoading: isQuarterlyLoading,
    refetch: triggerQuarterly,
  } = useQuery({
    queryKey: ['ai-quarterly', quarterlySymbol],
    queryFn: async () => {
      const res = await aiAPI.getQuarterlyAnalyst(quarterlySymbol);
      return res.data;
    },
    enabled: false,
  });

  // 7. News Intelligence Query
  const {
    data: newsData,
    isLoading: isNewsLoading,
    refetch: triggerNews,
  } = useQuery({
    queryKey: ['ai-news-sentiment', newsSymbol],
    queryFn: async () => {
      const res = await aiAPI.getNewsSentiment({ symbol: newsSymbol });
      return res.data;
    },
  });

  // Handle Freeform Chat Submit
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || isAsking) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsAsking(true);

    try {
      const res = await aiAPI.ask({ question: userText });
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: res.data?.answer || res.data?.analysis || 'Analysis complete.' },
      ]);
    } catch (err) {
      toast.error('Failed to get AI response');
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'I encountered an error. Please check your network or try again.' },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const tabs = [
    { id: 'portfolio-analyst', label: 'AI Portfolio Analyst', icon: Brain },
    { id: 'health-score', label: 'Health Score (0-100)', icon: Layers },
    { id: 'why-moved', label: 'Why Did It Move?', icon: HelpCircle },
    { id: 'trade-ideas', label: 'Trade Idea Generator', icon: Lightbulb },
    { id: 'stock-compare', label: 'Stock Comparison', icon: ArrowRightLeft },
    { id: 'quarterly', label: 'Quarterly Results', icon: FileText },
    { id: 'news-intel', label: 'News Intelligence', icon: Newspaper },
    { id: 'chat', label: 'Interactive AI Chat', icon: Sparkles },
  ];

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Financial Intelligence Hub</h1>
          <p className="page-subtitle">
            7 specialized analytical agents powering data-backed investment decision making
          </p>
        </div>
      </div>

      {/* Multi-Agent Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '24px',
          background: 'var(--bg-card)',
          padding: '8px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------------------
          TAB 1: AI PORTFOLIO ANALYST (Feature #6)
      ------------------------------------------------------------- */}
      {activeTab === 'portfolio-analyst' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Brain size={24} style={{ color: 'var(--accent)' }} />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>AI Portfolio Analyst</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Deep-dive audit of your overall portfolio structure, risk, and positioning
                </p>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => refetchAnalyst()}>
              <RefreshCw size={14} /> Re-evaluate
            </button>
          </div>

          {isAnalystLoading ? (
            <AITextStreamer isLoading={true} />
          ) : (
            <AITextStreamer
              text={analystData?.analysis}
              title="Portfolio Analyst Report"
              badge="Full Audit"
            />
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: PORTFOLIO HEALTH SCORE (Feature #9)
      ------------------------------------------------------------- */}
      {activeTab === 'health-score' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={24} style={{ color: 'var(--accent-2)' }} />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Portfolio Health Score (0-100)</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Algorithmic scoring across Diversification, Quality, Risk, and Return Momentum
                </p>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => refetchHealth()}>
              <RefreshCw size={14} /> Recalculate
            </button>
          </div>

          {isHealthLoading ? (
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <Loader2 className="spinner" />
            </div>
          ) : (
            <div>
              {/* Score Header Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  background: 'var(--bg-secondary)',
                  padding: '24px',
                  borderRadius: 'var(--radius)',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: 'var(--accent-glow)',
                    border: '3px solid var(--accent)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent)' }}>
                    {healthData?.health_score}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '22px', fontWeight: '800' }}>Grade: {healthData?.grade}</span>
                    <span className="badge badge-green">{healthData?.status}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
                    Your portfolio exhibits balanced risk-reward characteristics with established blue-chip anchors.
                  </p>
                </div>
              </div>

              {/* 4 Pillars Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {(healthData?.pillars || []).map((pillar, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>{pillar.name}</span>
                      <span style={{ fontWeight: '700', color: 'var(--accent)' }}>
                        {pillar.score} / {pillar.max}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-card)', borderRadius: '3px', marginBottom: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(pillar.score / pillar.max) * 100}%`,
                          height: '100%',
                          background: 'var(--accent)',
                        }}
                      />
                    </div>
                    <small style={{ color: 'var(--text-muted)' }}>{pillar.desc}</small>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Key Optimization Steps</h4>
                <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  {(healthData?.recommendations || []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 3: "WHY DID MY PORTFOLIO MOVE?" (Feature #11)
      ------------------------------------------------------------- */}
      {activeTab === 'why-moved' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HelpCircle size={24} style={{ color: 'var(--yellow)' }} />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>“Why Did My Portfolio Move?” Agent</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Attribution analysis identifying top movers, rupee impact, and news catalysts
                </p>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => refetchWhyMoved()}>
              <RefreshCw size={14} /> Refresh Movement
            </button>
          </div>

          {isWhyMovedLoading ? (
            <AITextStreamer isLoading={true} />
          ) : (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <AITextStreamer
                  text={whyMovedData?.explanation}
                  title="Attribution Engine"
                  badge="Catalyst Intelligence"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {whyMovedData?.top_gainer && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ color: 'var(--green)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Top Day Contributor
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px' }}>
                      {whyMovedData.top_gainer.symbol} ({whyMovedData.top_gainer.change_pct > 0 ? '+' : ''}{whyMovedData.top_gainer.change_pct}%)
                    </div>
                    <div style={{ color: 'var(--green)', fontSize: '14px', marginTop: '4px' }}>
                      Impact: +₹{Math.abs(whyMovedData.top_gainer.pnl_impact).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )}

                {whyMovedData?.top_loser && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Lagging Position
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px' }}>
                      {whyMovedData.top_loser.symbol} ({whyMovedData.top_loser.change_pct}%)
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                      Impact: ₹{whyMovedData.top_loser.pnl_impact.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 4: TRADE IDEA GENERATOR (Feature #10)
      ------------------------------------------------------------- */}
      {activeTab === 'trade-ideas' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lightbulb size={24} style={{ color: 'var(--yellow)' }} />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Trade Idea Generator</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  AI screened rebalancing and tactical opportunities addressing portfolio gaps
                </p>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => refetchTradeIdeas()}>
              <RefreshCw size={14} /> Screen Ideas
            </button>
          </div>

          {isTradeIdeasLoading ? (
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <Loader2 className="spinner" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(tradeIdeasData?.trade_ideas || []).map((idea, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius)',
                    padding: '18px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--accent)' }}>
                          {idea.symbol}
                        </span>
                        <span className="badge badge-blue">{idea.sector}</span>
                        <span className="badge badge-green">{idea.action}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {idea.company_name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--green)' }}>
                        Target {idea.target_upside}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Horizon: {idea.timeframe}</div>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '8px' }}>
                    {idea.rationale}
                  </p>
                </div>
              ))}
              <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>
                {tradeIdeasData?.disclaimer}
              </small>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 5: STOCK COMPARISON AGENT (Feature #12)
      ------------------------------------------------------------- */}
      {activeTab === 'stock-compare' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <ArrowRightLeft size={24} style={{ color: 'var(--accent)' }} />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Stock Comparison Agent</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Head-to-head comparison of valuations, technicals, and AI verdict
              </p>
            </div>
          </div>

          {/* Input selectors */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Stock A (e.g. TCS.NS, AAPL)</label>
              <input
                type="text"
                className="form-input"
                value={compSymbolA}
                onChange={(e) => setCompSymbolA(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Stock B (e.g. INFY.NS, MSFT)</label>
              <input
                type="text"
                className="form-input"
                value={compSymbolB}
                onChange={(e) => setCompSymbolB(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => triggerComparison()}
              disabled={isComparisonLoading}
              style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isComparisonLoading ? <Loader2 size={16} className="spinner" /> : <ArrowRightLeft size={16} />}
              Compare
            </button>
          </div>

          {comparisonData && (
            <div>
              <div className="table-container" style={{ marginBottom: '20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>{comparisonData.symbol_a}</th>
                      <th>{comparisonData.symbol_b}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: '600' }}>Company Name</td>
                      <td>{comparisonData.stock_a.name}</td>
                      <td>{comparisonData.stock_b.name}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: '600' }}>Current Price</td>
                      <td style={{ fontWeight: '700' }}>₹{comparisonData.stock_a.price?.toFixed(2) || '—'}</td>
                      <td style={{ fontWeight: '700' }}>₹{comparisonData.stock_b.price?.toFixed(2) || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: '600' }}>P/E Ratio</td>
                      <td>{comparisonData.stock_a.pe_ratio || '—'}x</td>
                      <td>{comparisonData.stock_b.pe_ratio || '—'}x</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: '600' }}>RSI (14) Momentum</td>
                      <td>{comparisonData.stock_a.rsi || '50'}</td>
                      <td>{comparisonData.stock_b.rsi || '50'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: '600' }}>Beta (Sensitivity)</td>
                      <td>{comparisonData.stock_a.beta || '1.0'}</td>
                      <td>{comparisonData.stock_b.beta || '1.0'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AI Verdict */}
              <div style={{ marginTop: '20px' }}>
                <AITextStreamer
                  text={comparisonData.verdict}
                  title="AI Comparison Verdict"
                  badge="Multi-Factor Synthesis"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 6: QUARTERLY RESULTS ANALYST (Feature #7)
      ------------------------------------------------------------- */}
      {activeTab === 'quarterly' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <FileText size={24} style={{ color: 'var(--accent)' }} />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Quarterly Results Analyst</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Earnings reviews, revenue growth trajectory, and operating margin health
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Enter ticker (e.g. RELIANCE.NS, TCS.NS)..."
              value={quarterlySymbol}
              onChange={(e) => setQuarterlySymbol(e.target.value)}
              style={{ maxWidth: '300px' }}
            />
            <button
              className="btn btn-primary"
              onClick={() => triggerQuarterly()}
              disabled={isQuarterlyLoading}
            >
              {isQuarterlyLoading ? <Loader2 size={16} className="spinner" /> : 'Analyze Results'}
            </button>
          </div>

          {isQuarterlyLoading ? (
            <AITextStreamer isLoading={true} />
          ) : quarterlyData && (
            <AITextStreamer
              text={quarterlyData.analysis}
              title={`Quarterly Synthesis • ${quarterlyData.symbol}`}
              badge="Earnings Breakdown"
            />
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 7: NEWS INTELLIGENCE (Feature #8)
      ------------------------------------------------------------- */}
      {activeTab === 'news-intel' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Newspaper size={24} style={{ color: 'var(--accent)' }} />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>News Intelligence & Sentiment Engine</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Headline sentiment classification and market catalyst tracking
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Enter ticker (e.g. RELIANCE.NS, INFY.NS)..."
              value={newsSymbol}
              onChange={(e) => setNewsSymbol(e.target.value)}
              style={{ maxWidth: '300px' }}
            />
            <button className="btn btn-primary" onClick={() => triggerNews()} disabled={isNewsLoading}>
              {isNewsLoading ? <Loader2 size={16} className="spinner" /> : 'Scan Sentiment'}
            </button>
          </div>

          {newsData && (
            <div>
              {/* Sentiment Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-secondary)',
                  padding: '18px 24px',
                  borderRadius: 'var(--radius)',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Market Sentiment: {newsData.symbol}
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: '800',
                      color: newsData.sentiment === 'BULLISH' ? 'var(--green)' : newsData.sentiment === 'BEARISH' ? 'var(--red)' : 'var(--yellow)',
                      marginTop: '4px',
                    }}
                  >
                    {newsData.sentiment} ({newsData.sentiment_score}%)
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {newsData.key_takeaway}
                  </p>
                </div>
              </div>

              {/* Articles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(newsData.articles || []).map((art, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <a
                      href={art.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none', fontSize: '14px' }}
                    >
                      {art.title}
                    </a>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {art.publisher} • {art.published_at || 'Recent'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 8: INTERACTIVE AI CHAT
      ------------------------------------------------------------- */}
      {activeTab === 'chat' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Conversational Financial Assistant</h3>
          </div>

          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: msg.role === 'user' ? '70%' : '85%',
                  width: msg.role === 'ai' ? '100%' : 'auto',
                }}
              >
                {msg.role === 'user' ? (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                      color: '#ffffff',
                      padding: '12px 18px',
                      borderRadius: '16px 16px 4px 16px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    {msg.text}
                  </div>
                ) : (
                  <AITextStreamer
                    text={msg.text}
                    title="InvestTrack Assistant"
                    badge="Conversational"
                  />
                )}
              </div>
            ))}
            {isAsking && (
              <div style={{ width: '100%' }}>
                <AITextStreamer isLoading={true} />
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ask about your holdings, risks, or stock outlook..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={isAsking} style={{ padding: '0 20px' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
