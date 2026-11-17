from django.urls import path
from .views import (
    PortfolioView, PortfolioSummaryView, HoldingListView,
    TransactionListCreateView, TransactionDetailView,
    BrokerAccountListView, BrokerConnectView, BrokerSyncView,
    BrokerDisconnectView, StatementImportView, RefreshPricesView
)

urlpatterns = [
    path('', PortfolioView.as_view(), name='portfolio'),
    path('summary/', PortfolioSummaryView.as_view(), name='portfolio-summary'),
    path('holdings/', HoldingListView.as_view(), name='holdings-list'),
    path('transactions/', TransactionListCreateView.as_view(), name='transactions-list'),
    path('transactions/<int:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),

    # Broker Integration & Live Market Sync
    path('brokers/', BrokerAccountListView.as_view(), name='broker-list'),
    path('brokers/connect/', BrokerConnectView.as_view(), name='broker-connect'),
    path('brokers/<int:pk>/sync/', BrokerSyncView.as_view(), name='broker-sync'),
    path('brokers/<int:pk>/disconnect/', BrokerDisconnectView.as_view(), name='broker-disconnect'),
    path('import-statement/', StatementImportView.as_view(), name='import-statement'),
    path('refresh-prices/', RefreshPricesView.as_view(), name='refresh-prices'),
]

