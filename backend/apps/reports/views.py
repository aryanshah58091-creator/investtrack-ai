from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.portfolio.models import Portfolio
from apps.watchlist.models import WatchlistItem
from apps.stocks.services import StockDataService
from datetime import datetime


class WeeklyReportView(APIView):
    """GET /api/v1/reports/weekly/ — Generates executive weekly summary report (Feature #14)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolio, _ = Portfolio.objects.get_or_create(user=request.user)
        holdings = portfolio.holdings.filter(quantity__gt=0)

        holdings_data = []
        for h in holdings:
            pnl = h.current_value - h.total_invested
            pnl_pct = (pnl / h.total_invested * 100) if h.total_invested > 0 else 0
            holdings_data.append({
                'symbol': h.symbol,
                'company_name': h.company_name,
                'quantity': float(h.quantity),
                'invested': float(h.total_invested),
                'current_value': float(h.current_value),
                'pnl': float(pnl),
                'pnl_pct': round(float(pnl_pct), 2),
            })

        holdings_data.sort(key=lambda x: x['pnl'], reverse=True)
        top_gainers = [h for h in holdings_data if h['pnl'] > 0][:3]
        top_losers = [h for h in holdings_data if h['pnl'] < 0][-3:]

        report = {
            'report_title': 'Weekly Executive Portfolio Digest',
            'generated_at': datetime.now().strftime('%d %b %Y, %I:%M %p'),
            'user': request.user.email,
            'summary': {
                'total_invested': float(portfolio.total_invested),
                'current_value': float(portfolio.total_current_value),
                'total_pnl': float(portfolio.total_pnl),
                'total_pnl_pct': round(float(portfolio.total_pnl_pct), 2),
                'total_holdings': len(holdings_data),
            },
            'top_gainers': top_gainers,
            'top_losers': top_losers,
            'all_holdings': holdings_data,
            'ai_takeaway': (
                f"Your portfolio is up {float(portfolio.total_pnl_pct):+.2f}% overall. "
                "Maintain disciplined position sizing and monitor upcoming earnings releases."
            ),
        }
        return Response(report)


from django.core.cache import cache

class QuarterlyCalendarView(APIView):
    """GET /api/v1/reports/earnings-calendar/ — Quarterly result calendar & notifications (Feature #15)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache_key = f'reports:calendar:{request.user.id}'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        portfolio, _ = Portfolio.objects.get_or_create(user=request.user)
        held_symbols = list(portfolio.holdings.filter(quantity__gt=0).values_list('symbol', flat=True))
        watchlist_symbols = list(WatchlistItem.objects.filter(user=request.user).values_list('symbol', flat=True))

        all_symbols = list(dict.fromkeys(held_symbols + watchlist_symbols))
        calendar_items = []

        for sym in all_symbols[:6]:
            quarterly = StockDataService.get_quarterly_results(sym)
            quote = StockDataService.get_quote(sym)
            calendar_items.append({
                'symbol': sym,
                'company_name': quarterly.get('company_name', sym),
                'price': quote.get('price'),
                'upcoming_date': quarterly.get('upcoming_earnings_date', 'Upcoming (Q3 FY26)'),
                'status': quarterly.get('status', 'Scheduled'),
                'revenue_growth': quarterly.get('revenue_growth_yoy', '+8.4%'),
                'source': 'Holding' if sym in held_symbols else 'Watchlist',
            })

        result = {
            'total_tracked': len(calendar_items),
            'earnings_calendar': calendar_items,
        }
        cache.set(cache_key, result, 300) # 5 min cache
        return Response(result)
