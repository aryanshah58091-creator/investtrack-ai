"""
Celery background tasks for InvestTrack AI.
- Refresh portfolio prices every minute
- Check price alerts every minute
- Generate weekly reports (Sunday 8 AM)
"""
from celery import shared_task
from django.utils import timezone
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


@shared_task(name='tasks.refresh_portfolio_prices')
def refresh_portfolio_prices():
    """
    Refresh current prices for all held stocks.
    Runs every 1 minute via Celery Beat.
    """
    from apps.portfolio.models import Holding
    from apps.stocks.services import StockDataService

    symbols = list(
        Holding.objects.filter(quantity__gt=0)
        .values_list('symbol', flat=True)
        .distinct()
    )

    if not symbols:
        return f"No holdings to refresh."

    quotes = StockDataService.get_multiple_quotes(symbols)
    updated = 0

    for symbol, quote in quotes.items():
        if 'error' not in quote and quote.get('price'):
            count = Holding.objects.filter(symbol=symbol, quantity__gt=0).update(
                current_price=quote['price']
            )
            updated += count

    logger.info(f"Refreshed prices for {updated} holdings.")
    return f"Updated {updated} holdings."


@shared_task(name='tasks.check_price_alerts')
def check_price_alerts():
    """
    Check all active price alerts against current market prices.
    Triggers WebSocket notifications for matched alerts.
    """
    from apps.alerts.models import Alert, Notification
    from apps.stocks.services import StockDataService
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    active_alerts = Alert.objects.filter(status=Alert.STATUS_ACTIVE).select_related('user')
    if not active_alerts.exists():
        return "No active alerts."

    # Group by symbol to minimize API calls
    symbol_alerts = {}
    for alert in active_alerts:
        symbol_alerts.setdefault(alert.symbol.upper(), []).append(alert)

    channel_layer = get_channel_layer()
    triggered_count = 0

    for symbol, alerts in symbol_alerts.items():
        quote = StockDataService.get_quote(symbol)
        current_price = quote.get('price', 0)
        if not current_price:
            continue

        for alert in alerts:
            triggered = False
            if alert.condition == Alert.ABOVE and current_price >= float(alert.target_price):
                triggered = True
                msg = f"{symbol} hit ₹{current_price:.2f} (above your target ₹{alert.target_price})"
            elif alert.condition == Alert.BELOW and current_price <= float(alert.target_price):
                triggered = True
                msg = f"{symbol} dropped to ₹{current_price:.2f} (below your target ₹{alert.target_price})"

            if triggered:
                # Update alert status
                alert.status = Alert.STATUS_TRIGGERED
                alert.triggered_at = timezone.now()
                alert.message = msg
                alert.save()

                # Create in-app notification
                Notification.objects.create(
                    user=alert.user,
                    title=f'Price Alert: {symbol}',
                    message=msg,
                    notification_type=Notification.WARNING,
                    related_symbol=symbol,
                )

                # Push WebSocket notification
                try:
                    async_to_sync(channel_layer.group_send)(
                        f'alerts_user_{alert.user.id}',
                        {
                            'type': 'alert_triggered',
                            'symbol': symbol,
                            'message': msg,
                            'price': current_price,
                            'target_price': str(alert.target_price),
                            'condition': alert.condition,
                        }
                    )
                except Exception as e:
                    logger.error(f"WebSocket push failed: {e}")

                triggered_count += 1

    return f"Triggered {triggered_count} alerts."


@shared_task(name='tasks.generate_weekly_summary')
def generate_weekly_summary():
    """
    Generate weekly portfolio performance summary for all users.
    Runs every Sunday at 8 AM.
    """
    from django.contrib.auth import get_user_model
    from apps.portfolio.models import Portfolio

    User = get_user_model()
    users_with_portfolio = User.objects.filter(portfolio__isnull=False, weekly_report=True)

    sent = 0
    for user in users_with_portfolio:
        try:
            portfolio = user.portfolio
            holdings_count = portfolio.holdings.filter(quantity__gt=0).count()
            if holdings_count == 0:
                continue

            # Create weekly summary notification
            from apps.alerts.models import Notification
            Notification.objects.create(
                user=user,
                title='Weekly Portfolio Summary',
                message=(
                    f"Your portfolio this week: "
                    f"Value ₹{portfolio.total_current_value:,.2f}, "
                    f"P&L ₹{portfolio.total_pnl:,.2f} ({portfolio.total_pnl_pct:.2f}%)"
                ),
                notification_type=Notification.INFO,
            )
            sent += 1
        except Exception as e:
            logger.error(f"Error generating summary for {user.email}: {e}")

    return f"Generated {sent} weekly summaries."
