from django.urls import path
from .views import WatchlistListCreateView, WatchlistDestroyView

urlpatterns = [
    path('', WatchlistListCreateView.as_view(), name='watchlist-list-create'),
    path('<int:pk>/', WatchlistDestroyView.as_view(), name='watchlist-destroy'),
]
