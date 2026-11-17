from django.db import models
from django.conf import settings


class Alert(models.Model):
    """Price alert set by user for a stock."""
    ABOVE = 'ABOVE'
    BELOW = 'BELOW'
    CONDITION_CHOICES = [(ABOVE, 'Price Above'), (BELOW, 'Price Below')]

    STATUS_ACTIVE = 'ACTIVE'
    STATUS_TRIGGERED = 'TRIGGERED'
    STATUS_DISABLED = 'DISABLED'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_TRIGGERED, 'Triggered'),
        (STATUS_DISABLED, 'Disabled'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='alerts')
    symbol = models.CharField(max_length=20)
    company_name = models.CharField(max_length=200)
    condition = models.CharField(max_length=10, choices=CONDITION_CHOICES)
    target_price = models.DecimalField(max_digits=15, decimal_places=4)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    message = models.TextField(blank=True)
    triggered_at = models.DateTimeField(null=True, blank=True)
    notify_email = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'alerts'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.symbol} {self.condition} {self.target_price}"


class Notification(models.Model):
    """In-app notification record."""
    INFO = 'INFO'
    SUCCESS = 'SUCCESS'
    WARNING = 'WARNING'
    ERROR = 'ERROR'
    TYPES = [(INFO, 'Info'), (SUCCESS, 'Success'), (WARNING, 'Warning'), (ERROR, 'Error')]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=10, choices=TYPES, default=INFO)
    is_read = models.BooleanField(default=False)
    related_symbol = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
