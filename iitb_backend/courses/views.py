from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model

from .models import Course, Registration
from .serializers import (
    UserSerializer, RegisterSerializer, AdminUserSerializer,
    CourseSerializer, CourseWriteSerializer,
    RegistrationSerializer, AdminRegistrationSerializer,
)

User = get_user_model()


# ─── CUSTOM PERMISSIONS ───────────────────────────────────────────────────────

class IsAdminUser(permissions.BasePermission):
    """Only users with role='admin' can access"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsStudentUser(permissions.BasePermission):
    """Only users with role='student' can access"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'


# ─── AUTH VIEWS ───────────────────────────────────────────────────────────────

class LoginView(APIView):
    """
    POST /api/auth/login/
    Body: { email, password }
    Returns: { access, refresh, user }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Django authenticates by username, so find user by email first
        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = authenticate(request, username=user_obj.username, password=password)
        if not user:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Body: { refresh }
    Blacklists the refresh token
    """
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Creates a new student account
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Return tokens immediately so user is logged in after signup
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """
    GET /api/auth/me/
    Returns the currently logged in user's details
    """
    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ─── COURSE VIEWS ─────────────────────────────────────────────────────────────

class CourseListView(generics.ListAPIView):
    """
    GET /api/courses/
    Returns all courses. Students and admins can view.
    Supports ?search= and ?category= query params.
    """
    serializer_class = CourseSerializer

    def get_queryset(self):
        queryset = Course.objects.all().order_by('code')
        search = self.request.query_params.get('search')
        category = self.request.query_params.get('category')

        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(code__icontains=search) |
                Q(instructor__icontains=search)
            )
        if category and category != 'All':
            queryset = queryset.filter(category=category)

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class CourseDetailView(generics.RetrieveAPIView):
    """
    GET /api/courses/<id>/
    Returns details of a single course
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminCourseCreateView(generics.CreateAPIView):
    """
    POST /api/admin/courses/
    Admin only — create a new course
    """
    permission_classes = [IsAdminUser]
    serializer_class = CourseWriteSerializer


class AdminCourseUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/admin/courses/<id>/
    Admin only — edit or delete a course
    """
    permission_classes = [IsAdminUser]
    queryset = Course.objects.all()

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CourseSerializer
        return CourseWriteSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        course_code = instance.code
        self.perform_destroy(instance)
        return Response(
            {'message': f'Course {course_code} deleted successfully.'},
            status=status.HTTP_200_OK
        )


# ─── REGISTRATION VIEWS ───────────────────────────────────────────────────────

class MyRegistrationsView(generics.ListAPIView):
    """
    GET /api/registrations/
    Returns all registrations for the currently logged in student
    """
    serializer_class = RegistrationSerializer

    def get_queryset(self):
        return Registration.objects.filter(student=self.request.user)


class ApplyForCourseView(generics.CreateAPIView):
    """
    POST /api/registrations/apply/
    Student applies for a course
    Body: { course, phone, roll_number, motivation }
    """
    permission_classes = [IsStudentUser]
    serializer_class = RegistrationSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminRegistrationListView(generics.ListAPIView):
    """
    GET /api/admin/registrations/
    Admin only — view all registrations
    Supports ?status=pending/accepted/rejected and ?course= filters
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminRegistrationSerializer

    def get_queryset(self):
        queryset = Registration.objects.select_related('student', 'course').all()
        status_filter = self.request.query_params.get('status')
        course_filter = self.request.query_params.get('course')

        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        if course_filter:
            queryset = queryset.filter(course__code=course_filter)

        return queryset


class AdminUpdateRegistrationView(APIView):
    """
    PATCH /api/admin/registrations/<id>/status/
    Admin only — accept or reject a registration
    Body: { status: 'accepted' | 'rejected' | 'pending' }
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            registration = Registration.objects.get(pk=pk)
        except Registration.DoesNotExist:
            return Response({'error': 'Registration not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ['pending', 'accepted', 'rejected']:
            return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)

        registration.status = new_status
        registration.save()

        return Response({
            'message': f'Registration {new_status} successfully.',
            'registration': AdminRegistrationSerializer(registration).data,
        })


# ─── ADMIN USER VIEWS ─────────────────────────────────────────────────────────

class AdminUserListView(generics.ListAPIView):
    """
    GET /api/admin/users/
    Admin only — view all registered students
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        return User.objects.filter(role='student').order_by('date_joined')


# ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

class AdminDashboardView(APIView):
    """
    GET /api/admin/dashboard/
    Returns summary stats for the admin dashboard
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({
            'total_courses': Course.objects.count(),
            'total_registrations': Registration.objects.count(),
            'pending_registrations': Registration.objects.filter(status='pending').count(),
            'accepted_registrations': Registration.objects.filter(status='accepted').count(),
            'rejected_registrations': Registration.objects.filter(status='rejected').count(),
            'total_students': User.objects.filter(role='student').count(),
        })