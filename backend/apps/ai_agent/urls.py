from django.urls import path
from .views import (
    AIQueryView,
    AIInsightView,
    AIPortfolioAnalystView,
    AIQuarterlyView,
    AINewsSentimentView,
    AIHealthScoreView,
    AITradeIdeasView,
    AIWhyMovedView,
    AIStockComparisonView,
)

urlpatterns = [
    path('ask/', AIQueryView.as_view(), name='ai-ask'),
    path('insights/', AIInsightView.as_view(), name='ai-insights'),
    path('portfolio-analyst/', AIPortfolioAnalystView.as_view(), name='ai-portfolio-analyst'),
    path('quarterly/<str:symbol>/', AIQuarterlyView.as_view(), name='ai-quarterly'),
    path('news-sentiment/', AINewsSentimentView.as_view(), name='ai-news-sentiment'),
    path('health-score/', AIHealthScoreView.as_view(), name='ai-health-score'),
    path('trade-ideas/', AITradeIdeasView.as_view(), name='ai-trade-ideas'),
    path('why-moved/', AIWhyMovedView.as_view(), name='ai-why-moved'),
    path('compare/', AIStockComparisonView.as_view(), name='ai-compare'),
]
