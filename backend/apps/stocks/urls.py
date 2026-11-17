from django.urls import path
from .views import (
    StockQuoteView, StockHistoryView, StockInfoView,
    StockNewsView, StockSearchView, MultipleQuotesView,
    StockTechnicalsView, StockQuarterlyView
)

urlpatterns = [
    path('search/', StockSearchView.as_view(), name='stock-search'),
    path('quotes/', MultipleQuotesView.as_view(), name='stock-multiple-quotes'),
    path('<str:symbol>/quote/', StockQuoteView.as_view(), name='stock-quote'),
    path('<str:symbol>/history/', StockHistoryView.as_view(), name='stock-history'),
    path('<str:symbol>/info/', StockInfoView.as_view(), name='stock-info'),
    path('<str:symbol>/news/', StockNewsView.as_view(), name='stock-news'),
    path('<str:symbol>/technicals/', StockTechnicalsView.as_view(), name='stock-technicals'),
    path('<str:symbol>/quarterly/', StockQuarterlyView.as_view(), name='stock-quarterly'),
]
