from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import StockDataService


class StockQuoteView(APIView):
    """GET /api/v1/stocks/<symbol>/quote/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, symbol):
        data = StockDataService.get_quote(symbol)
        return Response(data)


class StockHistoryView(APIView):
    """GET /api/v1/stocks/<symbol>/history/?period=1y&interval=1d"""
    permission_classes = [IsAuthenticated]

    def get(self, request, symbol):
        period = request.query_params.get('period', '1y')
        interval = request.query_params.get('interval', '1d')
        # Validate period and interval
        valid_periods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']
        valid_intervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']
        if period not in valid_periods:
            period = '1y'
        if interval not in valid_intervals:
            interval = '1d'
        data = StockDataService.get_history(symbol, period=period, interval=interval)
        return Response(data)


class StockInfoView(APIView):
    """GET /api/v1/stocks/<symbol>/info/ — Company fundamentals."""
    permission_classes = [IsAuthenticated]

    def get(self, request, symbol):
        data = StockDataService.get_info(symbol)
        return Response(data)


class StockNewsView(APIView):
    """GET /api/v1/stocks/<symbol>/news/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, symbol):
        data = StockDataService.get_news(symbol)
        return Response(data)


class StockSearchView(APIView):
    """GET /api/v1/stocks/search/?q=<query>"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 1:
            return Response({'error': 'Query parameter q is required.'}, status=400)
        data = StockDataService.search_symbols(query)
        return Response(data)


class MultipleQuotesView(APIView):
    """POST /api/v1/stocks/quotes/ — Batch fetch quotes."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        symbols = request.data.get('symbols', [])
        if not symbols or not isinstance(symbols, list):
            return Response({'error': 'symbols must be a non-empty list.'}, status=400)
        if len(symbols) > 50:
            return Response({'error': 'Maximum 50 symbols per request.'}, status=400)
        data = StockDataService.get_multiple_quotes(symbols)
        return Response(data)


class StockTechnicalsView(APIView):
    """GET /api/v1/stocks/<symbol>/technicals/ — RSI, SMA, and technical signals."""
    permission_classes = [IsAuthenticated]

    def get(self, request, symbol):
        data = StockDataService.get_technicals(symbol)
        return Response(data)


class StockQuarterlyView(APIView):
    """GET /api/v1/stocks/<symbol>/quarterly/ — Quarterly results & earnings dates."""
    permission_classes = [IsAuthenticated]

    def get(self, request, symbol):
        data = StockDataService.get_quarterly_results(symbol)
        return Response(data)
