from django.urls import path
from .views import (
    SectorAllocationView,
    RiskMetricsView,
    DiversificationView,
    BenchmarkComparisonView,
    PerformanceView,
)

urlpatterns = [
    path('sector-allocation/', SectorAllocationView.as_view(), name='sector-allocation'),
    path('risk/', RiskMetricsView.as_view(), name='risk-metrics'),
    path('diversification/', DiversificationView.as_view(), name='diversification-score'),
    path('benchmark/', BenchmarkComparisonView.as_view(), name='benchmark-comparison'),
    path('performance/', PerformanceView.as_view(), name='portfolio-performance'),
]
