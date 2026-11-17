from rest_framework import serializers
from .models import WatchlistItem
from apps.stocks.services import StockDataService


class WatchlistItemSerializer(serializers.ModelSerializer):
    quote = serializers.SerializerMethodField()

    class Meta:
        model = WatchlistItem
        fields = ['id', 'symbol', 'company_name', 'added_at', 'quote']
        read_only_fields = ['id', 'added_at', 'quote']

    def get_quote(self, obj):
        try:
            return StockDataService.get_quote(obj.symbol)
        except Exception:
            return None
