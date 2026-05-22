# IITB Course Registration Portal

A full-stack course registration system built with React (frontend) and Django REST Framework (backend).

## Features
- Student and Admin login with JWT authentication
- Browse and apply for courses
- Admin can add, edit, delete courses
- Admin can accept or reject applications
- Student can track application status

## Tech Stack
- Frontend: React.js
- Backend: Django + Django REST Framework
- Database: SQLite
- Authentication: JWT (SimpleJWT)

## Setup

### Backend
```bash
cd iitb_backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py runserver
```

### Frontend
```bash
cd regportal
npm install
npm start
```
