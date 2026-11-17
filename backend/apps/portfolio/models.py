from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal


class Portfolio(models.Model):
    """User's investment portfolio."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='portfolio')
    name = models.CharField(max_length=100, default='My Portfolio')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'portfolios'

    def __str__(self):
        return f"{self.user.email}'s Portfolio"

    @property
    def total_invested(self):
        return sum(h.total_invested for h in self.holdings.filter(quantity__gt=0))

    @property
    def total_current_value(self):
        return sum(h.current_value for h in self.holdings.filter(quantity__gt=0))

    @property
    def total_pnl(self):
        return self.total_current_value - self.total_invested

    @property
    def total_pnl_pct(self):
        if self.total_invested == 0:
            return Decimal('0')
        return (self.total_pnl / self.total_invested) * 100


class Holding(models.Model):
    """Individual stock holding within a portfolio."""
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='holdings')
    symbol = models.CharField(max_length=20)
    company_name = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=15, decimal_places=4)
    avg_buy_price = models.DecimalField(max_digits=15, decimal_places=4)
    current_price = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0'))
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'holdings'
        unique_together = ('portfolio', 'symbol')

    @property
    def total_invested(self):
        return self.quantity * self.avg_buy_price

    @property
    def current_value(self):
        return self.quantity * self.current_price

    @property
    def pnl(self):
        return self.current_value - self.total_invested

    @property
    def pnl_pct(self):
        if self.total_invested == 0:
            return Decimal('0')
        return (self.pnl / self.total_invested) * 100

    def __str__(self):
        return f"{self.symbol} x {self.quantity}"


class Transaction(models.Model):
    """Buy/sell transaction record."""
    BUY = 'BUY'
    SELL = 'SELL'
    DIVIDEND = 'DIVIDEND'
    TRANSACTION_TYPES = [
        (BUY, 'Buy'),
        (SELL, 'Sell'),
        (DIVIDEND, 'Dividend'),
    ]

    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='transactions')
    symbol = models.CharField(max_length=20)
    company_name = models.CharField(max_length=200)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=15, decimal_places=4)
    price = models.DecimalField(max_digits=15, decimal_places=4)
    total_amount = models.DecimalField(max_digits=20, decimal_places=4)
    brokerage = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('0'))
    notes = models.TextField(blank=True)
    transaction_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-transaction_date', '-created_at']

    def __str__(self):
        return f"{self.transaction_type} {self.quantity} {self.symbol} @ {self.price}"


class BrokerAccount(models.Model):
    """User connected broker account (Angel One, Groww, Zerodha, etc.)."""
    BROKER_ANGEL = 'angel_one'
    BROKER_GROWW = 'groww'
    BROKER_ZERODHA = 'zerodha'
    BROKER_UPSTOX = 'upstox'
    BROKER_DHAN = 'dhan'
    BROKER_CAS = 'cas_import'

    BROKER_CHOICES = [
        (BROKER_ANGEL, 'Angel One (SmartAPI)'),
        (BROKER_GROWW, 'Groww'),
        (BROKER_ZERODHA, 'Zerodha (Kite Connect)'),
        (BROKER_UPSTOX, 'Upstox'),
        (BROKER_DHAN, 'Dhan'),
        (BROKER_CAS, 'CAS Statement Import'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='broker_accounts')
    broker_type = models.CharField(max_length=30, choices=BROKER_CHOICES)
    account_name = models.CharField(max_length=100, default='Primary Broker Account')
    client_id = models.CharField(max_length=100, blank=True)
    api_key = models.CharField(max_length=200, blank=True)
    api_secret = models.CharField(max_length=200, blank=True)
    totp_secret = models.CharField(max_length=100, blank=True)
    is_connected = models.BooleanField(default=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    holdings_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'broker_accounts'
        unique_together = ('user', 'broker_type')

    def __str__(self):
        return f"{self.user.email} - {self.get_broker_type_display()} ({self.client_id or 'Active'})"

