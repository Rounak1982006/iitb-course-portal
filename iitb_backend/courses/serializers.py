from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Course, Registration

User = get_user_model()


# ─── USER SERIALIZERS ─────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    """Used to return user info after login"""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name',
                  'full_name', 'role', 'roll_number', 'phone']
        read_only_fields = ['id', 'role']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class RegisterSerializer(serializers.ModelSerializer):
    """Used when a new student creates an account"""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'roll_number',
                  'phone', 'password', 'confirm_password']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        # Use email as username
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
            roll_number=validated_data.get('roll_number'),
            phone=validated_data.get('phone'),
            role='student',
        )
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    """Used by admin to view all users"""
    full_name = serializers.SerializerMethodField()
    registration_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'roll_number',
                  'phone', 'date_joined', 'registration_count']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_registration_count(self, obj):
        return obj.registrations.count()


# ─── COURSE SERIALIZERS ───────────────────────────────────────────────────────

class CourseSerializer(serializers.ModelSerializer):
    """Full course details including computed fields"""
    available_seats = serializers.ReadOnlyField()
    total_registrations = serializers.ReadOnlyField()
    is_registered = serializers.SerializerMethodField()
    my_status = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'code', 'title', 'description', 'instructor',
            'department', 'category', 'level', 'duration', 'schedule',
            'total_seats', 'available_seats', 'total_registrations',
            'is_registered', 'my_status', 'created_at',
        ]

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(student=request.user).exists()
        return False

    def get_my_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reg = obj.registrations.filter(student=request.user).first()
            return reg.status if reg else None
        return None


class CourseWriteSerializer(serializers.ModelSerializer):
    """Used when admin creates or edits a course"""
    class Meta:
        model = Course
        fields = [
            'code', 'title', 'description', 'instructor', 'department',
            'category', 'level', 'duration', 'schedule', 'total_seats',
        ]

    def validate_code(self, value):
        # On update, exclude current instance from uniqueness check
        instance = self.instance
        if Course.objects.filter(code=value).exclude(
            pk=instance.pk if instance else None
        ).exists():
            raise serializers.ValidationError("A course with this code already exists.")
        return value.upper()


# ─── REGISTRATION SERIALIZERS ─────────────────────────────────────────────────

class RegistrationSerializer(serializers.ModelSerializer):
    """Student's view of their own registration"""
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_schedule = serializers.CharField(source='course.schedule', read_only=True)
    course_duration = serializers.CharField(source='course.duration', read_only=True)

    class Meta:
        model = Registration
        fields = [
            'id', 'course', 'course_code', 'course_title',
            'course_schedule', 'course_duration',
            'status', 'phone', 'roll_number', 'motivation', 'applied_at',
        ]
        read_only_fields = ['id', 'status', 'applied_at']

    def validate_course(self, value):
        request = self.context.get('request')
        if Registration.objects.filter(student=request.user, course=value).exists():
            raise serializers.ValidationError("You have already applied for this course.")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        return Registration.objects.create(
            student=request.user,
            **validated_data
        )


class AdminRegistrationSerializer(serializers.ModelSerializer):
    """Admin's view of all registrations with full student and course info"""
    student_name = serializers.SerializerMethodField()
    student_email = serializers.EmailField(source='student.email', read_only=True)
    student_roll = serializers.CharField(source='student.roll_number', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Registration
        fields = [
            'id', 'student_name', 'student_email', 'student_roll',
            'course_code', 'course_title', 'status',
            'phone', 'roll_number', 'motivation', 'applied_at',
        ]
        read_only_fields = ['id', 'applied_at']

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.username
