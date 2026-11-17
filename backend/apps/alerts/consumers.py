"""
WebSocket consumer for real-time alerts and price updates.
Users connect to: ws://localhost:8000/ws/alerts/
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class AlertConsumer(AsyncWebsocketConsumer):
    """Real-time alerts consumer — one group per user."""

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return

        self.user_id = user.id
        self.group_name = f'alerts_user_{self.user_id}'

        # Join user-specific group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send connection success message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to InvestTrack AI real-time alerts.',
            'user_id': self.user_id,
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """Handle incoming messages from client."""
        try:
            data = json.loads(text_data)
            msg_type = data.get('type')

            if msg_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            elif msg_type == 'subscribe_price':
                # Client can request to subscribe to a symbol's price
                symbol = data.get('symbol', '').upper()
                await self.send(text_data=json.dumps({
                    'type': 'subscribed',
                    'symbol': symbol,
                }))
        except json.JSONDecodeError:
            pass

    # --- Group message handlers (called by Celery tasks) ---

    async def alert_triggered(self, event):
        """Send alert notification to client."""
        await self.send(text_data=json.dumps({
            'type': 'alert_triggered',
            'symbol': event['symbol'],
            'message': event['message'],
            'price': event['price'],
            'target_price': event['target_price'],
            'condition': event['condition'],
        }))

    async def price_update(self, event):
        """Send live price update to client."""
        await self.send(text_data=json.dumps({
            'type': 'price_update',
            'symbol': event['symbol'],
            'price': event['price'],
            'change_pct': event['change_pct'],
        }))

    async def notification(self, event):
        """Send general notification to client."""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'title': event['title'],
            'message': event['message'],
            'notification_type': event.get('notification_type', 'INFO'),
        }))
