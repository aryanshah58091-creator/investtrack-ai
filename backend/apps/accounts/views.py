from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import (
    RegisterSerializer, UserProfileSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view allowing either email or username."""
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — Create a new user account."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': 'Account created successfully.',
            'user': UserProfileSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/auth/profile/ — View or update profile."""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/ — Change password."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password changed successfully.'})


class DeleteAccountView(APIView):
    """DELETE /api/v1/auth/delete/ — Permanently delete account."""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        request.user.delete()
        return Response({'message': 'Account deleted.'}, status=status.HTTP_204_NO_CONTENT)
