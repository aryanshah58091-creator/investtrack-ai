from rest_framework import serializers
from .models import Portfolio, Holding, Transaction, BrokerAccount


class BrokerAccountSerializer(serializers.ModelSerializer):
    broker_display = serializers.CharField(source='get_broker_type_display', read_only=True)
    broker_type_display = serializers.CharField(source='get_broker_type_display', read_only=True)

    class Meta:
        model = BrokerAccount
        fields = (
            'id', 'broker_type', 'broker_display', 'broker_type_display', 'account_name',
            'client_id', 'is_connected', 'last_sync_at', 'holdings_count',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'is_connected', 'last_sync_at', 'holdings_count', 'created_at', 'updated_at')


class HoldingSerializer(serializers.ModelSerializer):
    pnl = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)
    pnl_pct = serializers.DecimalField(max_digits=10, decimal_places=4, read_only=True)
    total_invested = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)
    current_value = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)

    class Meta:
        model = Holding
        fields = (
            'id', 'symbol', 'company_name', 'quantity', 'avg_buy_price',
            'current_price', 'total_invested', 'current_value',
            'pnl', 'pnl_pct', 'last_updated',
        )
        read_only_fields = ('id', 'current_price', 'last_updated')


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = (
            'id', 'symbol', 'company_name', 'transaction_type',
            'quantity', 'price', 'total_amount', 'brokerage',
            'notes', 'transaction_date', 'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def validate(self, attrs):
        attrs['total_amount'] = attrs['quantity'] * attrs['price']
        return attrs


class PortfolioSerializer(serializers.ModelSerializer):
    holdings = HoldingSerializer(many=True, read_only=True)
    total_invested = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)
    total_current_value = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)
    total_pnl = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)
    total_pnl_pct = serializers.DecimalField(max_digits=10, decimal_places=4, read_only=True)

    class Meta:
        model = Portfolio
        fields = (
            'id', 'name', 'description',
            'total_invested', 'total_current_value',
            'total_pnl', 'total_pnl_pct',
            'holdings', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class PortfolioSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer without holdings for dashboard."""
    total_invested = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)
    total_current_value = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)
    total_pnl = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)
    total_pnl_pct = serializers.DecimalField(max_digits=10, decimal_places=4, read_only=True)
    holdings_count = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = (
            'id', 'name', 'total_invested', 'total_current_value',
            'total_pnl', 'total_pnl_pct', 'holdings_count',
        )

    def get_holdings_count(self, obj):
        return obj.holdings.filter(quantity__gt=0).count()
