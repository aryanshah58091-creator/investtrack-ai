from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .agent import InvestTrackAIAgent


class AIQueryView(APIView):
    """POST /api/v1/ai/ask/ — Ask a question to the AI assistant."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question = request.data.get('question', '').strip()
        chat_history = request.data.get('chat_history', [])

        if not question:
            return Response({'error': 'Question is required.'}, status=status.HTTP_400_BAD_REQUEST)

        agent = InvestTrackAIAgent(user=request.user)
        result = agent.ask(question=question, chat_history=chat_history)
        return Response(result)


class AIInsightView(APIView):
    """GET /api/v1/ai/insights/ — Quick health check summary."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        agent = InvestTrackAIAgent(user=request.user)
        result = agent.analyze_portfolio()
        return Response(result)


# --- 7 Specialized Interview Engines ---

class AIPortfolioAnalystView(APIView):
    """GET /api/v1/ai/portfolio-analyst/ (Feature #6)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        agent = InvestTrackAIAgent(user=request.user)
        return Response(agent.analyze_portfolio())


class AIQuarterlyView(APIView):
    """GET /api/v1/ai/quarterly/<symbol>/ (Feature #7)"""
    permission_classes = [IsAuthenticated]

    def get(self, request, symbol):
        agent = InvestTrackAIAgent(user=request.user)
        return Response(agent.analyze_quarterly(symbol))


class AINewsSentimentView(APIView):
    """GET /api/v1/ai/news-sentiment/?symbol=<symbol> (Feature #8)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        symbol = request.query_params.get('symbol')
        agent = InvestTrackAIAgent(user=request.user)
        return Response(agent.analyze_news_sentiment(symbol=symbol))


class AIHealthScoreView(APIView):
    """GET /api/v1/ai/health-score/ (Feature #9)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        agent = InvestTrackAIAgent(user=request.user)
        return Response(agent.calculate_health_score())


class AITradeIdeasView(APIView):
    """GET /api/v1/ai/trade-ideas/ (Feature #10)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        agent = InvestTrackAIAgent(user=request.user)
        return Response(agent.generate_trade_ideas())


class AIWhyMovedView(APIView):
    """GET /api/v1/ai/why-moved/ (Feature #11)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        agent = InvestTrackAIAgent(user=request.user)
        return Response(agent.explain_portfolio_move())


class AIStockComparisonView(APIView):
    """GET /api/v1/ai/compare/?symbol_a=...&symbol_b=... (Feature #12)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sym_a = request.query_params.get('symbol_a', 'TCS.NS')
        sym_b = request.query_params.get('symbol_b', 'INFY.NS')
        agent = InvestTrackAIAgent(user=request.user)
        return Response(agent.compare_stocks(sym_a, sym_b))
