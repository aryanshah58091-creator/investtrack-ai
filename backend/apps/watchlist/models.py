from django.db import models
from django.conf import settings


class WatchlistItem(models.Model):
    """Stock saved to user's watchlist."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='watchlist')
    symbol = models.CharField(max_length=20)
    company_name = models.CharField(max_length=200, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'watchlist'
        unique_together = ('user', 'symbol')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.email} - {self.symbol}"
