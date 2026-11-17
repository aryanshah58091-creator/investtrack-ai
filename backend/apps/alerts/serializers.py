from rest_framework import serializers
from .models import Alert, Notification
from apps.stocks.services import StockDataService


class AlertSerializer(serializers.ModelSerializer):
    current_price = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = [
            'id', 'symbol', 'company_name', 'condition', 'target_price',
            'status', 'message', 'triggered_at', 'notify_email', 'created_at',
            'current_price'
        ]
        read_only_fields = ['id', 'status', 'triggered_at', 'created_at', 'current_price']

    def get_current_price(self, obj):
        try:
            quote = StockDataService.get_quote(obj.symbol)
            return quote.get('price')
        except Exception:
            return None


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'related_symbol', 'created_at']
        read_only_fields = ['id', 'title', 'message', 'notification_type', 'related_symbol', 'created_at']
