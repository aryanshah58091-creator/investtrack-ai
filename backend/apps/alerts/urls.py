from django.urls import path
from .views import (
    AlertListCreateView,
    AlertDestroyView,
    NotificationListView,
    NotificationUpdateView,
)

urlpatterns = [
    path('', AlertListCreateView.as_view(), name='alert-list-create'),
    path('<int:pk>/', AlertDestroyView.as_view(), name='alert-destroy'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/', NotificationUpdateView.as_view(), name='notification-update'),
]
