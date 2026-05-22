from django.db import models
from django.contrib.auth.models import AbstractUser


# ─── CUSTOM USER MODEL ────────────────────────────────────────────────────────
class User(AbstractUser):
    """
    Extends Django's built-in user.
    role: 'student' or 'admin'
    roll_number: e.g. 25B0001 (only for students)
    phone: contact number
    """
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    roll_number = models.CharField(max_length=20, blank=True, null=True, unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    @property
    def is_admin_user(self):
        return self.role == 'admin'


# ─── COURSE MODEL ─────────────────────────────────────────────────────────────
class Course(models.Model):
    LEVEL_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
        ('All Levels', 'All Levels'),
    ]

    CATEGORY_CHOICES = [
        ('Computer Science', 'Computer Science'),
        ('Management', 'Management'),
        ('Mathematics', 'Mathematics'),
        ('Mechanical Engineering', 'Mechanical Engineering'),
        ('Physics', 'Physics'),
    ]

    code = models.CharField(max_length=20, unique=True)          # e.g. CS101
    title = models.CharField(max_length=200)
    description = models.TextField()
    instructor = models.CharField(max_length=100)
    department = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='Beginner')
    duration = models.CharField(max_length=50)                   # e.g. "16 weeks"
    schedule = models.CharField(max_length=100)                  # e.g. "Mon/Wed, 9-10 AM"
    total_seats = models.PositiveIntegerField(default=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} - {self.title}"

    @property
    def available_seats(self):
        """Seats remaining after accepted registrations"""
        accepted = self.registrations.filter(status='accepted').count()
        return self.total_seats - accepted

    @property
    def total_registrations(self):
        return self.registrations.count()


# ─── REGISTRATION MODEL ───────────────────────────────────────────────────────
class Registration(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='registrations',
        limit_choices_to={'role': 'student'}
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='registrations'
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    phone = models.CharField(max_length=15, blank=True)
    roll_number = models.CharField(max_length=20, blank=True)
    motivation = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # A student can only register for a course once
        unique_together = ('student', 'course')
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.student.get_full_name()} → {self.course.code} [{self.status}]"