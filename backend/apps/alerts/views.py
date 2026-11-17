from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Alert, Notification
from .serializers import AlertSerializer, NotificationSerializer
from apps.stocks.services import StockDataService


class AlertListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/alerts/"""
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Alert.objects.filter(user=self.request.user)

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


class AlertDestroyView(generics.DestroyAPIView):
    """DELETE /api/v1/alerts/<id>/"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Alert.objects.filter(user=self.request.user)


class NotificationListView(generics.ListAPIView):
    """GET /api/v1/alerts/notifications/"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationUpdateView(generics.UpdateAPIView):
    """PATCH /api/v1/alerts/notifications/<id>/"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['patch']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
