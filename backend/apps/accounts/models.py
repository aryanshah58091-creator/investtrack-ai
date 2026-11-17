from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended user model with investor profile fields."""
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True)
    currency = models.CharField(max_length=3, default='INR')
    timezone = models.CharField(max_length=50, default='Asia/Kolkata')
    email_alerts = models.BooleanField(default=True)
    push_alerts = models.BooleanField(default=True)
    weekly_report = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email
