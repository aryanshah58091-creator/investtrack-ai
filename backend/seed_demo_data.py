"""
Seed script to populate sample portfolio, holdings, transactions, and watchlist for immediate testing.
Run with: venv\\Scripts\\python seed_demo_data.py
"""
import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'investtrack.settings')
django.setup()

from apps.accounts.models import User
from apps.portfolio.models import Portfolio, Holding, Transaction
from apps.watchlist.models import WatchlistItem
from apps.alerts.models import Alert, Notification


def seed():
    print("Seeding demo data...")

    # 1. Create or get Demo User
    user, created = User.objects.get_or_create(
        email='demo@investtrack.ai',
        defaults={
            'username': 'demo_investor',
            'first_name': 'Alex',
            'last_name': 'Morgan',
            'currency': 'INR',
            'timezone': 'Asia/Kolkata',
        }
    )
    if created:
        user.set_password('Demo1234!')
        user.save()
        print("Created demo user: demo@investtrack.ai (Password: Demo1234!)")
    else:
        print("Demo user already exists.")

    # 2. Portfolio
    portfolio, _ = Portfolio.objects.get_or_create(
        user=user,
        defaults={'name': 'Growth & Value Portfolio', 'description': 'Core blue-chip long-term holdings'}
    )

    # 3. Sample Holdings & Transactions
    sample_stocks = [
        {
            'symbol': 'RELIANCE.NS',
            'name': 'Reliance Industries Limited',
            'qty': Decimal('25'),
            'price': Decimal('2850.00'),
            'current': Decimal('2980.50'),
        },
        {
            'symbol': 'TCS.NS',
            'name': 'Tata Consultancy Services',
            'qty': Decimal('15'),
            'price': Decimal('3750.00'),
            'current': Decimal('4120.00'),
        },
        {
            'symbol': 'INFY.NS',
            'name': 'Infosys Limited',
            'qty': Decimal('40'),
            'price': Decimal('1520.00'),
            'current': Decimal('1610.25'),
        },
        {
            'symbol': 'HDFCBANK.NS',
            'name': 'HDFC Bank Limited',
            'qty': Decimal('35'),
            'price': Decimal('1650.00'),
            'current': Decimal('1720.00'),
        },
    ]

    for item in sample_stocks:
        # Transaction
        from datetime import date
        Transaction.objects.get_or_create(
            portfolio=portfolio,
            symbol=item['symbol'],
            transaction_type=Transaction.BUY,
            quantity=item['qty'],
            price=item['price'],
            total_amount=item['qty'] * item['price'],
            company_name=item['name'],
            notes='Initial long-term allocation',
            transaction_date=date.today(),
        )

        # Holding
        holding, _ = Holding.objects.get_or_create(
            portfolio=portfolio,
            symbol=item['symbol'],
            defaults={
                'company_name': item['name'],
                'quantity': item['qty'],
                'avg_buy_price': item['price'],
                'current_price': item['current'],
            }
        )
        holding.quantity = item['qty']
        holding.avg_buy_price = item['price']
        holding.current_price = item['current']
        holding.save()

    # 4. Watchlist
    watchlist_items = [
        ('TATAMOTORS.NS', 'Tata Motors Passenger Vehicles'),
        ('ICICIBANK.NS', 'ICICI Bank Ltd'),
        ('NVDA', 'NVIDIA Corporation'),
        ('AAPL', 'Apple Inc.'),
    ]
    for sym, name in watchlist_items:
        WatchlistItem.objects.get_or_create(
            user=user,
            symbol=sym,
            defaults={'company_name': name}
        )

    # 5. Alerts
    Alert.objects.get_or_create(
        user=user,
        symbol='RELIANCE.NS',
        defaults={
            'company_name': 'Reliance Industries',
            'condition': Alert.ABOVE,
            'target_price': Decimal('3100.00'),
            'status': Alert.STATUS_ACTIVE,
        }
    )

    # 6. Notifications
    Notification.objects.get_or_create(
        user=user,
        title='Welcome to InvestTrack AI! 🚀',
        defaults={
            'message': 'Your portfolio is ready. You can track real-time valuations, get AI insights, and set price alerts.',
            'notification_type': Notification.SUCCESS,
            'related_symbol': 'PORTFOLIO',
        }
    )

    print("Seeding completed successfully!")


if __name__ == '__main__':
    seed()
