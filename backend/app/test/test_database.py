import pytest
import sqlite3
from app.core.database import UserRepository, ProfileRepository, ResumeRepository, init_db, get_db_connection
from unittest.mock import patch
import bcrypt

# Fixture to set up an in-memory SQLite database
@pytest.fixture
def in_memory_db():
    conn = sqlite3.connect(":memory:")
    with patch("app.core.database.get_db_path", return_value=":memory:"):
        init_db()  # Initialize schema
        yield conn
    conn.close()

# Fixture to mock get_db_connection to use in-memory database
@pytest.fixture
def mock_db_connection(in_memory_db):
    with patch("app.core.database.get_db_connection", return_value=in_memory_db):
        yield in_memory_db

# UserRepository Tests
def test_user_repository_signup_success(mock_db_connection):
    repo = UserRepository()
    result = repo.signup("John Doe", "john@example.com", "password123", "1234567890")
    assert result["status"] == "success"
    assert result["user"]["name"] == "John Doe"
    assert result["user"]["email"] == "john@example.com"

def test_user_repository_signup_duplicate_email(mock_db_connection):
    repo = UserRepository()
    repo.signup("John Doe", "john@example.com", "password123", "1234567890")
    result = repo.signup("Jane Doe", "john@example.com", "password456", "0987654321")
    assert result["status"] == "error"
    assert result["message"] == "User already exists"

def test_user_repository_check_login_success(mock_db_connection):
    repo = UserRepository()
    repo.signup("John Doe", "john@example.com", "password123", "1234567890")
    result = repo.check_login("john@example.com", "password123")
    assert result["status"] == "success"
    assert result["user"]["email"] == "john@example.com"

def test_user_repository_check_login_invalid_credentials(mock_db_connection):
    repo = UserRepository()
    repo.signup("John Doe", "john@example.com", "password123", "1234567890")
    result = repo.check_login("john@example.com", "wrongpassword")
    assert result["status"] == "error"
    assert result["message"] == "Invalid credentials"

def test_user_repository_get_by_id_success(mock_db_connection):
    repo = UserRepository()
    repo.signup("John Doe", "john@example.com", "password123", "1234567890")
    user = repo.get_by_id(1)
    assert user is not None
    assert user["email"] == "john@example.com"

def test_user_repository_get_by_id_not_found(mock_db_connection):
    repo = UserRepository()
    user = repo.get_by_id(999)
    assert user is None

# ProfileRepository Tests
def test_profile_repository_create_success(mock_db_connection):
    user_repo = UserRepository()
    user_repo.signup("John Doe", "john@example.com", "password123", "1234567890")
    
    profile_repo = ProfileRepository()
    profile_data = {
        "user_id": 1,
        "profile_name": "Professional",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "address": "123 Main St",
        "education": "BS Computer Science",
        "experience": "Software Engineer at XYZ",
        "skills": "Python, SQL",
        "certifications": "AWS Certified",
        "projects": "Resume Builder",
        "languages": "English, Spanish",
        "hobbies": "Reading, Hiking"
    }
    result = profile_repo.create(profile_data)
    assert result["status"] == "success"
    assert result["profile_id"] == 1

def test_profile_repository_get_by_user_id_success(mock_db_connection):
    user_repo = UserRepository()
    user_repo.signup("John Doe", "john@example.com", "password123", "1234567890")
    
    profile_repo = ProfileRepository()
    profile_data = {
        "user_id": 1,
        "profile_name": "Professional",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "address": "123 Main St",
        "education": "BS Computer Science",
        "experience": "Software Engineer at XYZ",
        "skills": "Python, SQL",
        "certifications": "AWS Certified",
        "projects": "Resume Builder",
        "languages": "English, Spanish",
        "hobbies": "Reading, Hiking"
    }
    profile_repo.create(profile_data)
    
    profiles = profile_repo.get_by_user_id(1)
    assert len(profiles) == 1
    assert profiles[0]["email"] == "john@example.com"

def test_profile_repository_get_by_user_id_empty(mock_db_connection):
    profile_repo = ProfileRepository()
    profiles = profile_repo.get_by_user_id(999)
    assert profiles == []

def test_profile_repository_get_by_id_success(mock_db_connection):
    user_repo = UserRepository()
    user_repo.signup("John Doe", "john@example.com", "password123", "1234567890")
    
    profile_repo = ProfileRepository()
    profile_data = {
        "user_id": 1,
        "profile_name": "Professional",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "address": "123 Main St",
        "education": "BS Computer Science",
        "experience": "Software Engineer at XYZ",
        "skills": "Python, SQL",
        "certifications": "AWS Certified",
        "projects": "Resume Builder",
        "languages": "English, Spanish",
        "hobbies": "Reading, Hiking"
    }
    profile_repo.create(profile_data)
    
    profiles = profile_repo.get_by_id(1)
    assert len(profiles) == 1
    assert profiles[0]["email"] == "john@example.com"

def test_profile_repository_get_by_id_not_found(mock_db_connection):
    profile_repo = ProfileRepository()
    profiles = profile_repo.get_by_id(999)
    assert profiles == []

# ResumeRepository Tests
def test_resume_repository_create_success(mock_db_connection):
    user_repo = UserRepository()
    user_repo.signup("John Doe", "john@example.com", "password123", "1234567890")
    
    profile_repo = ProfileRepository()
    profile_data = {
        "user_id": 1,
        "profile_name": "Professional",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "address": "123 Main St",
        "education": "BS Computer Science",
        "experience": "Software Engineer at XYZ",
        "skills": "Python, SQL",
        "certifications": "AWS Certified",
        "projects": "Resume Builder",
        "languages": "English, Spanish",
        "hobbies": "Reading, Hiking"
    }
    profile_repo.create(profile_data)
    
    resume_repo = ResumeRepository()
    resume_data = {
        "user_id": 1,
        "user_resume_id": 1,
        "name": "John Doe Resume",
        "job_title": "Software Engineer",
        "job_description": "Develop software solutions",
        "new_resume": "LaTeX resume content"
    }
    result = resume_repo.create(resume_data)
    assert result["status"] == "success"
    assert result["resume_id"] == 1

def test_resume_repository_get_by_user_id_success(mock_db_connection):
    user_repo = UserRepository()
    user_repo.signup("John Doe", "john@example.com", "password123", "1234567890")
    
    profile_repo = ProfileRepository()
    profile_data = {
        "user_id": 1,
        "profile_name": "Professional",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "address": "123 Main St",
        "education": "BS Computer Science",
        "experience": "Software Engineer at XYZ",
        "skills": "Python, SQL",
        "certifications": "AWS Certified",
        "projects": "Resume Builder",
        "languages": "English, Spanish",
        "hobbies": "Reading, Hiking"
    }
    profile_repo.create(profile_data)
    
    resume_repo = ResumeRepository()
    resume_data = {
        "user_id": 1,
        "user_resume_id": 1,
        "name": "John Doe Resume",
        "job_title": "Software Engineer",
        "job_description": "Develop software solutions",
        "new_resume": "LaTeX resume content"
    }
    resume_repo.create(resume_data)
    
    resumes = resume_repo.get_by_user_id(1)
    assert len(resumes) == 1
    assert resumes[0]["job_title"] == "Software Engineer"

def test_resume_repository_get_by_user_id_empty(mock_db_connection):
    resume_repo = ResumeRepository()
    resumes = resume_repo.get_by_user_id(999)
    assert resumes == []

def test_resume_repository_get_by_id_success(mock_db_connection):
    user_repo = UserRepository()
    user_repo.signup("John Doe", "john@example.com", "password123", "1234567890")
    
    profile_repo = ProfileRepository()
    profile_data = {
        "user_id": 1,
        "profile_name": "Professional",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "address": "123 Main St",
        "education": "BS Computer Science",
        "experience": "Software Engineer at XYZ",
        "skills": "Python, SQL",
        "certifications": "AWS Certified",
        "projects": "Resume Builder",
        "languages": "English, Spanish",
        "hobbies": "Reading, Hiking"
    }
    profile_repo.create(profile_data)
    
    resume_repo = ResumeRepository()
    resume_data = {
        "user_id": 1,
        "user_resume_id": 1,
        "name": "John Doe Resume",
        "job_title": "Software Engineer",
        "job_description": "Develop software solutions",
        "new_resume": "LaTeX resume content"
    }
    resume_repo.create(resume_data)
    
    resume = resume_repo.get_by_id(1)
    assert resume is not None
    assert resume["job_title"] == "Software Engineer"

def test_resume_repository_get_by_id_not_found(mock_db_connection):
    resume_repo = ResumeRepository()
    resume = resume_repo.get_by_id(999)
    assert resume is None