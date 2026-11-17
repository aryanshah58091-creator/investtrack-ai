from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from decimal import Decimal
from .models import Portfolio, Holding, Transaction, BrokerAccount
from .serializers import (
    PortfolioSerializer, PortfolioSummarySerializer,
    HoldingSerializer, TransactionSerializer, BrokerAccountSerializer
)
from apps.stocks.services import StockDataService
from .broker_service import BrokerService


class PortfolioView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/portfolio/ — Get or update user's portfolio."""
    serializer_class = PortfolioSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        portfolio, _ = Portfolio.objects.get_or_create(user=self.request.user)
        return portfolio


class PortfolioSummaryView(APIView):
    """GET /api/v1/portfolio/summary/ — Lightweight dashboard summary."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolio, _ = Portfolio.objects.get_or_create(user=request.user)
        serializer = PortfolioSummarySerializer(portfolio)
        return Response(serializer.data)


class HoldingListView(generics.ListAPIView):
    """GET /api/v1/portfolio/holdings/ — List all holdings."""
    serializer_class = HoldingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        portfolio, _ = Portfolio.objects.get_or_create(user=self.request.user)
        return portfolio.holdings.filter(quantity__gt=0).order_by('-last_updated')


class TransactionListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/portfolio/transactions/"""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        portfolio, _ = Portfolio.objects.get_or_create(user=self.request.user)
        qs = portfolio.transactions.all()
        symbol = self.request.query_params.get('symbol')
        tx_type = self.request.query_params.get('type')
        if symbol:
            qs = qs.filter(symbol__iexact=symbol)
        if tx_type:
            qs = qs.filter(transaction_type=tx_type.upper())
        return qs

    def perform_create(self, serializer):
        portfolio, _ = Portfolio.objects.get_or_create(user=self.request.user)
        transaction = serializer.save(portfolio=portfolio)
        self._update_holding(portfolio, transaction)

    def _update_holding(self, portfolio, transaction):
        """Update or create holding based on transaction."""
        holding, created = Holding.objects.get_or_create(
            portfolio=portfolio,
            symbol=transaction.symbol,
            defaults={
                'company_name': transaction.company_name,
                'quantity': Decimal('0'),
                'avg_buy_price': Decimal('0'),
                'current_price': transaction.price,
            }
        )

        if transaction.transaction_type == Transaction.BUY:
            total_cost = (holding.quantity * holding.avg_buy_price) + transaction.total_amount
            holding.quantity += transaction.quantity
            holding.avg_buy_price = total_cost / holding.quantity if holding.quantity > 0 else Decimal('0')

        elif transaction.transaction_type == Transaction.SELL:
            holding.quantity -= transaction.quantity
            if holding.quantity < 0:
                holding.quantity = Decimal('0')

        holding.company_name = transaction.company_name
        holding.save()


class TransactionDetailView(generics.RetrieveDestroyAPIView):
    """GET/DELETE /api/v1/portfolio/transactions/<id>/"""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        portfolio, _ = Portfolio.objects.get_or_create(user=self.request.user)
        return portfolio.transactions.all()


# -------------------------------------------------------------
# Broker Integration & Live Market Sync Views
# -------------------------------------------------------------

class BrokerAccountListView(generics.ListAPIView):
    """GET /api/v1/portfolio/brokers/ — List connected brokers."""
    serializer_class = BrokerAccountSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return BrokerAccount.objects.filter(user=self.request.user).order_by('-last_sync_at')


class BrokerConnectView(APIView):
    """POST /api/v1/portfolio/brokers/connect/ — Connect broker and auto-sync holdings."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        broker_type = request.data.get('broker_type', 'angel_one')
        client_id = request.data.get('client_id', '')
        api_key = request.data.get('api_key', '')
        api_secret = request.data.get('api_secret', '')
        totp_secret = request.data.get('totp_secret', '')

        valid_brokers = [b[0] for b in BrokerAccount.BROKER_CHOICES]
        if broker_type not in valid_brokers:
            return Response(
                {'error': f"Invalid broker type. Must be one of: {', '.join(valid_brokers)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = BrokerService.connect_or_sync_broker(
            user=request.user,
            broker_type=broker_type,
            client_id=client_id,
            api_key=api_key,
            api_secret=api_secret,
            totp_secret=totp_secret,
        )
        return Response(result, status=status.HTTP_200_OK)


class BrokerSyncView(APIView):
    """POST /api/v1/portfolio/brokers/<id>/sync/ — 1-Click live sync of existing broker."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        broker_acc = get_object_or_404(BrokerAccount, pk=pk, user=request.user)
        result = BrokerService.connect_or_sync_broker(
            user=request.user,
            broker_type=broker_acc.broker_type,
            client_id=broker_acc.client_id,
            api_key=broker_acc.api_key,
            api_secret=broker_acc.api_secret,
            totp_secret=broker_acc.totp_secret,
        )
        return Response(result, status=status.HTTP_200_OK)


class BrokerDisconnectView(APIView):
    """POST /api/v1/portfolio/brokers/<id>/disconnect/ — Disconnect a broker account."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        broker_acc = get_object_or_404(BrokerAccount, pk=pk, user=request.user)
        broker_acc.is_connected = False
        broker_acc.save()
        return Response({'status': 'success', 'message': f"Disconnected {broker_acc.get_broker_type_display()}."})


class StatementImportView(APIView):
    """POST /api/v1/portfolio/import-statement/ — Upload and parse CAS/CSV/JSON statement."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        raw_text = request.data.get('content')

        if uploaded_file:
            try:
                content = uploaded_file.read().decode('utf-8', errors='ignore')
                filename = uploaded_file.name
            except Exception as e:
                return Response({'error': f"Failed to read file: {e}"}, status=status.HTTP_400_BAD_REQUEST)
        elif raw_text:
            content = raw_text
            filename = 'pasted_statement.csv'
        else:
            return Response({'error': 'No file or statement content provided.'}, status=status.HTTP_400_BAD_REQUEST)

        result = BrokerService.import_statement(
            user=request.user,
            file_content=content,
            filename=filename
        )
        if result.get('status') == 'error':
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)


class RefreshPricesView(APIView):
    """POST /api/v1/portfolio/refresh-prices/ — Live update market prices for all holdings."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        result = BrokerService.refresh_portfolio_prices(request.user)
        return Response(result, status=status.HTTP_200_OK)

