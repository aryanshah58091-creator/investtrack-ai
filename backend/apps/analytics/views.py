from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from apps.portfolio.models import Portfolio
from apps.stocks.services import StockDataService


class SectorAllocationView(APIView):
    """GET /api/v1/analytics/sector-allocation/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolio, _ = Portfolio.objects.get_or_create(user=request.user)
        holdings = portfolio.holdings.filter(quantity__gt=0)

        sector_totals = {}
        total_portfolio_val = Decimal('0')

        for holding in holdings:
            val = holding.current_value
            total_portfolio_val += val
            try:
                info = StockDataService.get_info(holding.symbol)
                sector = info.get('sector', 'Other') or 'Other'
            except Exception:
                sector = 'Other'

            sector_totals[sector] = sector_totals.get(sector, Decimal('0')) + val

        result = []
        for sector, val in sector_totals.items():
            pct = (val / total_portfolio_val * 100) if total_portfolio_val > 0 else Decimal('0')
            result.append({
                'sector': sector,
                'value': float(val),
                'percentage': round(float(pct), 2),
            })

        result.sort(key=lambda x: x['value'], reverse=True)
        return Response({
            'total_value': float(total_portfolio_val),
            'sectors': result
        })


class RiskMetricsView(APIView):
    """GET /api/v1/analytics/risk/
    Calculates Portfolio Beta, Estimated Volatility, and Sharpe Ratio in clean, explainable Python.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolio, _ = Portfolio.objects.get_or_create(user=request.user)
        holdings = portfolio.holdings.filter(quantity__gt=0)
        total_val = portfolio.total_current_value

        if total_val == 0 or not holdings.exists():
            return Response({
                'portfolio_beta': 1.0,
                'volatility_pct': 15.0,
                'sharpe_ratio': 0.0,
                'risk_level': 'Moderate',
                'description': 'Balanced market baseline risk.'
            })

        # Calculate weighted average beta
        # Portfolio Beta = sum(weight_i * beta_i)
        weighted_beta_sum = 0.0
        for h in holdings:
            weight = float(h.current_value / total_val)
            try:
                info = StockDataService.get_info(h.symbol)
                beta = float(info.get('beta') or 1.0)
            except Exception:
                beta = 1.0
            weighted_beta_sum += weight * beta

        portfolio_beta = round(weighted_beta_sum, 2)
        # Estimated annualized volatility ~ broad market standard deviation (15%) * beta
        volatility = round(abs(portfolio_beta) * 15.0, 1)

        # Sharpe Ratio = (Portfolio Return % - Risk Free Rate (7%)) / Volatility %
        pnl_pct = float(portfolio.total_pnl_pct)
        risk_free_rate = 7.0  # 7% Indian G-Sec / Bank FD baseline
        sharpe_ratio = round((pnl_pct - risk_free_rate) / volatility, 2) if volatility > 0 else 0.0

        if portfolio_beta < 0.85:
            risk_level = 'Conservative / Low'
            desc = 'Lower sensitivity to market swings. Defensive allocation.'
        elif portfolio_beta <= 1.15:
            risk_level = 'Balanced / Moderate'
            desc = 'Moves closely in tandem with broader market index.'
        else:
            risk_level = 'Aggressive / High'
            desc = 'Higher volatility and sensitivity to market fluctuations.'

        return Response({
            'portfolio_beta': portfolio_beta,
            'volatility_pct': volatility,
            'sharpe_ratio': sharpe_ratio,
            'risk_level': risk_level,
            'description': desc,
        })


class DiversificationView(APIView):
    """GET /api/v1/analytics/diversification/
    Calculates 0-100 Diversification Score based on:
    - Sector spread (up to 40 pts)
    - Single asset concentration limit (up to 40 pts)
    - Asset count (up to 20 pts)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolio, _ = Portfolio.objects.get_or_create(user=request.user)
        holdings = list(portfolio.holdings.filter(quantity__gt=0))
        total_val = portfolio.total_current_value

        if total_val == 0 or not holdings:
            return Response({
                'score': 50,
                'rating': 'Neutral',
                'sector_count': 0,
                'holding_count': 0,
                'max_concentration_pct': 0.0,
                'top_holding': 'None',
                'feedback': 'Add stock positions across multiple sectors to build diversification.'
            })

        # 1. Sector Spread (up to 40 pts)
        sectors = set()
        for h in holdings:
            try:
                info = StockDataService.get_info(h.symbol)
                sectors.add(info.get('sector', 'Other') or 'Other')
            except Exception:
                sectors.add('Other')

        sector_count = len(sectors)
        sector_score = min(40, sector_count * 10)  # 4+ sectors = 40 pts

        # 2. Asset Concentration (up to 40 pts)
        # Ideal: No single holding exceeds 25% of total portfolio
        max_pct = 0.0
        top_holding_name = holdings[0].symbol
        for h in holdings:
            pct = float((h.current_value / total_val) * 100)
            if pct > max_pct:
                max_pct = pct
                top_holding_name = h.symbol

        if max_pct <= 25.0:
            concentration_score = 40
        elif max_pct <= 35.0:
            concentration_score = 30
        elif max_pct <= 50.0:
            concentration_score = 20
        else:
            concentration_score = 10

        # 3. Asset Count (up to 20 pts)
        h_count = len(holdings)
        if h_count >= 8:
            count_score = 20
        elif h_count >= 5:
            count_score = 15
        elif h_count >= 3:
            count_score = 10
        else:
            count_score = 5

        total_score = sector_score + concentration_score + count_score

        if total_score >= 85:
            rating = 'Excellent'
            feedback = 'Well-balanced across sectors with healthy position sizing.'
        elif total_score >= 70:
            rating = 'Good'
            feedback = f'Good diversification. Top position is {top_holding_name} at {max_pct:.1f}%.'
        elif total_score >= 50:
            rating = 'Moderate'
            feedback = f'Consider spreading capital to reduce dependency on {top_holding_name} ({max_pct:.1f}%).'
        else:
            rating = 'High Concentration Risk'
            feedback = f'High risk: {top_holding_name} accounts for {max_pct:.1f}% of your portfolio.'

        return Response({
            'score': total_score,
            'rating': rating,
            'sector_count': sector_count,
            'holding_count': h_count,
            'max_concentration_pct': round(max_pct, 1),
            'top_holding': top_holding_name,
            'feedback': feedback,
            'breakdown': {
                'sector_score': sector_score,
                'concentration_score': concentration_score,
                'count_score': count_score,
            }
        })


class BenchmarkComparisonView(APIView):
    """GET /api/v1/analytics/benchmark/
    Compares portfolio return vs NIFTY 50 and S&P 500 benchmarks.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolio, _ = Portfolio.objects.get_or_create(user=request.user)
        portfolio_return = round(float(portfolio.total_pnl_pct), 2)

        # Broad market baseline annual returns
        nifty_return = 12.4
        sp500_return = 14.2

        alpha_nifty = round(portfolio_return - nifty_return, 2)
        alpha_sp500 = round(portfolio_return - sp500_return, 2)

        return Response({
            'portfolio_return': portfolio_return,
            'benchmarks': [
                {
                    'name': 'NIFTY 50 (India)',
                    'benchmark_return': nifty_return,
                    'alpha': alpha_nifty,
                    'outperforming': alpha_nifty >= 0,
                },
                {
                    'name': 'S&P 500 (US)',
                    'benchmark_return': sp500_return,
                    'alpha': alpha_sp500,
                    'outperforming': alpha_sp500 >= 0,
                }
            ],
            'summary': f'Portfolio return of {portfolio_return:+.2f}% vs NIFTY 50 baseline of {nifty_return:.2f}%.'
        })


class PerformanceView(APIView):
    """GET /api/v1/analytics/performance/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolio, _ = Portfolio.objects.get_or_create(user=request.user)
        total_invested = portfolio.total_invested
        total_current = portfolio.total_current_value
        pnl = portfolio.total_pnl
        pnl_pct = portfolio.total_pnl_pct

        return Response({
            'total_invested': float(total_invested),
            'current_value': float(total_current),
            'total_pnl': float(pnl),
            'pnl_percentage': round(float(pnl_pct), 2),
            'holdings_count': portfolio.holdings.filter(quantity__gt=0).count(),
            'transactions_count': portfolio.transactions.count(),
        })
