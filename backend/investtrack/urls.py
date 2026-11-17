"""
InvestTrack AI - URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from apps.accounts.views import CustomTokenObtainPairView

api_v1 = [
    # Auth
    path('auth/', include('apps.accounts.urls')),
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Portfolio
    path('portfolio/', include('apps.portfolio.urls')),

    # Stocks & Market Data
    path('stocks/', include('apps.stocks.urls')),

    # Watchlist
    path('watchlist/', include('apps.watchlist.urls')),

    # Alerts
    path('alerts/', include('apps.alerts.urls')),

    # AI Agent
    path('ai/', include('apps.ai_agent.urls')),

    # Analytics
    path('analytics/', include('apps.analytics.urls')),

    # Reports
    path('reports/', include('apps.reports.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
