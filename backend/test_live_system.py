import urllib.request
import json
import sys

BASE = 'http://127.0.0.1:8000/api/v1'

def api_post(endpoint, payload=None, token=None):
    data = json.dumps(payload or {}).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(f'{BASE}{endpoint}', data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())

def api_get(endpoint, token=None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(f'{BASE}{endpoint}', headers=headers)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())

print("==================================================")
print("INVESTTRACK AI — REAL LIVE DATA SYSTEM VERIFICATION")
print("==================================================")

# 1. Auth Login
try:
    tokens = api_post('/auth/token/', {'email': 'demo@investtrack.ai', 'password': 'Demo1234!'})
    token = tokens['access']
    print("[PASS] Auth Login: Success with JWT access token.")
except Exception as e:
    print(f"[FAIL] Auth Login failed: {e}")
    sys.exit(1)

# 2. Live Market Quotes
test_tickers = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'NVDA', 'AAPL']
print("\n--- TEST 1: LIVE EXCHANGE QUOTES ---")
for sym in test_tickers:
    try:
        quote = api_get(f'/stocks/{sym}/quote/', token)
        price = quote.get('price')
        currency = quote.get('currency')
        chg = quote.get('change')
        chg_pct = quote.get('change_pct')
        vol = quote.get('volume')
        high = quote.get('day_high')
        low = quote.get('day_low')
        print(f"[PASS] {sym:<12} | Price: {price:>8.2f} {currency:<3} | Chg: {chg:>+6.2f} ({chg_pct:>+5.2f}%) | Day High/Low: {high:.2f}/{low:.2f} | Vol: {vol:,}")
    except Exception as e:
        print(f"[FAIL] {sym} quote failed: {e}")

# 3. Live Stock Search
print("\n--- TEST 2: LIVE STOCK SEARCH ---")
for query in ['Tata', 'HDFC', 'Nvidia']:
    try:
        search_res = api_get(f'/stocks/search/?q={query}', token)
        print(f"[PASS] Search '{query}': Found {len(search_res)} live listings")
        for item in search_res[:2]:
            print(f"       -> {item.get('symbol')}: {item.get('name')} [{item.get('exchange')}]")
    except Exception as e:
        print(f"[FAIL] Search '{query}' failed: {e}")

# 4. Live Stock News & Sentiment
print("\n--- TEST 3: LIVE NEWS FEED ---")
for sym in ['RELIANCE.NS', 'TCS.NS', 'AAPL']:
    try:
        news_res = api_get(f'/stocks/{sym}/news/', token)
        print(f"[PASS] News for {sym}: Retrieved {len(news_res)} recent articles")
        if news_res:
            n = news_res[0]
            print(f"       -> Title: {n.get('title')[:75]}...")
            print(f"          Publisher: {n.get('publisher')} | Date: {n.get('published_at')}")
    except Exception as e:
        print(f"[FAIL] News for {sym} failed: {e}")

# 5. Technical Indicators on Live History (RSI, SMA, Signal)
print("\n--- TEST 4: LIVE TECHNICALS (RSI, SMA, SIGNAL) ---")
for sym in ['TCS.NS', 'RELIANCE.NS', 'NVDA']:
    try:
        tech = api_get(f'/stocks/{sym}/technicals/', token)
        print(f"[PASS] Technicals for {sym}:")
        print(f"       Current: {tech.get('current_price')} | RSI(14): {tech.get('rsi_14')} | SMA20: {tech.get('sma_20')} | SMA50: {tech.get('sma_50')} | Signal: {tech.get('signal')}")
        print(f"       Interpretation: {tech.get('interpretation')}")
    except Exception as e:
        print(f"[FAIL] Technicals for {sym} failed: {e}")

# 6. Live Portfolio Price Refresh
print("\n--- TEST 5: PORTFOLIO LIVE PRICE REFRESH & VALUATION ---")
try:
    refresh_res = api_get('/portfolio/summary/', token)
    print(f"[INFO] Before Refresh: Total Value=₹{refresh_res.get('total_current_value')}, P&L=₹{refresh_res.get('total_pnl')} ({refresh_res.get('total_pnl_pct')}%)")
    
    refresh_action = api_post('/portfolio/refresh-prices/', {}, token)
    print(f"[PASS] Refresh Prices API: {refresh_action.get('message')}")
    
    updated_summary = api_get('/portfolio/summary/', token)
    print(f"[PASS] Live Portfolio Valuation: Total Value=₹{updated_summary.get('total_current_value')}, P&L=₹{updated_summary.get('total_pnl')} ({updated_summary.get('total_pnl_pct')}%)")
except Exception as e:
    print(f"[FAIL] Portfolio refresh failed: {e}")

# 7. Broker Account Integration
print("\n--- TEST 6: BROKER INTEGRATION (Angel One, Groww, Zerodha) ---")
try:
    # Check broker list
    brokers_data = api_get('/portfolio/brokers/', token)
    brokers = brokers_data.get('results', brokers_data) if isinstance(brokers_data, dict) else brokers_data
    print(f"[PASS] Connected Brokers Count: {len(brokers)}")
    for b in brokers:
        print(f"       -> Broker: {b.get('broker_type_display')} | Client: {b.get('client_id')} | Status: {'CONNECTED' if b.get('is_connected') else 'DISCONNECTED'}")
    
    # Test broker sync
    if brokers:
        target_b = next((b for b in brokers if b.get('broker_type') != 'cas_import'), brokers[0])
        b_id = target_b['id']
        sync_res = api_post(f'/portfolio/brokers/{b_id}/sync/', {}, token)
        print(f"[PASS] Broker Sync Response ({target_b.get('broker_type_display')}): {sync_res.get('message')}")
except Exception as e:
    print(f"[FAIL] Broker test failed: {e}")

# 8. CAS / Universal Statement Import
print("\n--- TEST 7: STATEMENT / CSV PORTFOLIO IMPORT ---")
try:
    sample_csv = """Symbol,Quantity,Average Price,Company Name
INFY.NS,15,1125.00,Infosys Limited
SBIN.NS,40,820.00,State Bank of India
AAPL,5,225.00,Apple Inc.
"""
    import_res = api_post('/portfolio/import-statement/', {'content': sample_csv}, token)
    print(f"[PASS] Statement Import: {import_res.get('message')}")
    print(f"       Holdings Updated: {import_res.get('holdings_updated')} | Skipped: {import_res.get('skipped')}")
except Exception as e:
    print(f"[FAIL] Statement import failed: {e}")

# 9. AI Insights on Live Data
print("\n--- TEST 8: AI ENGINES RUNNING ON ACTUAL DATA ---")
try:
    # Health Score
    health = api_get('/ai/health-score/', token)
    print(f"[PASS] AI Health Score: {health.get('health_score')}/100 (Grade {health.get('grade')} - {health.get('status')})")
    for p in health.get('pillars', []):
        print(f"       - {p['name']}: {p['score']}/{p['max']} ({p['desc']})")

    # Why Moved
    why_moved = api_get('/ai/why-moved/', token)
    print(f"[PASS] AI 'Why Moved' Attribution: {why_moved.get('explanation')}")

    # News Sentiment
    sentiment = api_get('/ai/news-sentiment/?symbol=RELIANCE.NS', token)
    print(f"[PASS] AI News Sentiment (RELIANCE.NS): {sentiment.get('sentiment')} ({sentiment.get('sentiment_score')}/100) | {sentiment.get('key_takeaway')}")

    # Stock Comparison
    compare = api_get('/ai/compare/?symbol_a=TCS.NS&symbol_b=INFY.NS', token)
    print(f"[PASS] AI Stock Comparison (TCS vs INFY):")
    print(f"       TCS Price: ₹{compare.get('stock_a', {}).get('price')} (RSI: {compare.get('stock_a', {}).get('rsi')})")
    print(f"       INFY Price: ₹{compare.get('stock_b', {}).get('price')} (RSI: {compare.get('stock_b', {}).get('rsi')})")
    print(f"       Verdict: {compare.get('verdict')}")
except Exception as e:
    print(f"[FAIL] AI engine tests failed: {e}")

print("\n==================================================")
print("ALL LIVE DATA & INTEGRATION TESTS COMPLETED!")
print("==================================================")
