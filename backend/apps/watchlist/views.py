from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import WatchlistItem
from .serializers import WatchlistItemSerializer
from apps.stocks.services import StockDataService


class WatchlistListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/watchlist/"""
    serializer_class = WatchlistItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WatchlistItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        symbol = self.request.data.get('symbol', '').upper().strip()
        company_name = self.request.data.get('company_name', '').strip()

        if not company_name and symbol:
            try:
                info = StockDataService.get_info(symbol)
                company_name = info.get('name', symbol)
            except Exception:
                company_name = symbol

        serializer.save(user=self.request.user, symbol=symbol, company_name=company_name)


class WatchlistDestroyView(generics.DestroyAPIView):
    """DELETE /api/v1/watchlist/<id>/"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WatchlistItem.objects.filter(user=self.request.user)
