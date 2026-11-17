FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System dependencies for mysqlclient & building packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

# Collect static files
RUN python manage.py collectstatic --no-input || true

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && python seed_demo_data.py && gunicorn investtrack.wsgi:application --bind 0.0.0.0:$PORT"]
