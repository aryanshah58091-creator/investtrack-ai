from django.urls import path
from .views import WeeklyReportView, QuarterlyCalendarView

urlpatterns = [
    path('weekly/', WeeklyReportView.as_view(), name='weekly-report'),
    path('earnings-calendar/', QuarterlyCalendarView.as_view(), name='earnings-calendar'),
]
