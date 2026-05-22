from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/login/',     views.LoginView.as_view()),
    path('auth/logout/',    views.LogoutView.as_view()),
    path('auth/register/',  views.RegisterView.as_view()),
    path('auth/me/',        views.MeView.as_view()),

    # Courses (student)
    path('courses/',        views.CourseListView.as_view()),
    path('courses/<int:pk>/', views.CourseDetailView.as_view()),

    # Courses (admin)
    path('admin/courses/',          views.AdminCourseCreateView.as_view()),
    path('admin/courses/<int:pk>/', views.AdminCourseUpdateDeleteView.as_view()),

    # Registrations (student)
    path('registrations/',        views.MyRegistrationsView.as_view()),
    path('registrations/apply/',  views.ApplyForCourseView.as_view()),

    # Registrations (admin)
    path('admin/registrations/',                    views.AdminRegistrationListView.as_view()),
    path('admin/registrations/<int:pk>/status/',    views.AdminUpdateRegistrationView.as_view()),

    # Users & dashboard (admin)
    path('admin/users/',      views.AdminUserListView.as_view()),
    path('admin/dashboard/',  views.AdminDashboardView.as_view()),
]