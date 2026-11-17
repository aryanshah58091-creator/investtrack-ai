from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db.models import Q

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allows login with either email or username, case-insensitive, with whitespace trimmed."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.username_field in self.fields:
            self.fields[self.username_field].required = False
        self.fields['username'] = serializers.CharField(required=False)
        self.fields['email'] = serializers.CharField(required=False)

    def validate(self, attrs):
        identifier = attrs.get('email') or attrs.get('username') or ''
        identifier = str(identifier).strip()
        password = attrs.get('password')

        if not identifier:
            raise serializers.ValidationError({'detail': 'Email or username is required.'})

        user = User.objects.filter(
            Q(email__iexact=identifier) | Q(username__iexact=identifier)
        ).first()

        if user is None:
            raise serializers.ValidationError({'detail': 'No active account found with the given credentials.'})

        if not user.check_password(password):
            raise serializers.ValidationError({'detail': 'Incorrect password. Please verify and try again.'})

        if not user.is_active:
            raise serializers.ValidationError({'detail': 'This user account is inactive.'})

        attrs[self.username_field] = user.email
        data = super().validate(attrs)

        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'avatar', 'bio', 'currency', 'timezone',
            'email_alerts', 'push_alerts', 'weekly_report',
            'date_joined', 'created_at',
        )
        read_only_fields = ('id', 'email', 'date_joined', 'created_at')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
