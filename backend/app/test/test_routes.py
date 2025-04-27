import pytest
import httpx
from fastapi.testclient import TestClient
from app.api.routes import api_routes
from app.core.database import UserRepository, ProfileRepository, ResumeRepository
from app.api.models import LoginModel, SignUpModel, profileModel, NewResume
from unittest.mock import AsyncMock, patch

# Create a TestClient for the FastAPI app
client = TestClient(api_routes)

# Mock dependencies
@pytest.fixture
def mock_user_repo():
    return AsyncMock(spec=UserRepository)

@pytest.fixture
def mock_profile_repo():
    return AsyncMock(spec=ProfileRepository)

@pytest.fixture
def mock_resume_repo():
    return AsyncMock(spec=ResumeRepository)

@pytest.fixture
def mock_resume_service():
    return AsyncMock()

# Override dependencies in the app
def override_dependencies(mock_user_repo, mock_profile_repo, mock_resume_repo, mock_resume_service):
    api_routes.dependency_overrides[api_routes.get_user_repo] = lambda: mock_user_repo
    api_routes.dependency_overrides[api_routes.get_profile_repo] = lambda: mock_profile_repo
    api_routes.dependency_overrides[api_routes.get_resume_repo] = lambda: mock_resume_repo
    api_routes.dependency_overrides[api_routes.get_resume_service] = lambda: mock_resume_service

# Test /login endpoint
@pytest.mark.asyncio
async def test_login_success(mock_user_repo):
    override_dependencies(mock_user_repo, None, None, None)
    mock_user_repo.check_login.return_value = {
        "status": "success",
        "user": {"id": 1, "name": "John Doe", "email": "john@example.com", "phone": "1234567890", "created_at": "2023-10-01"}
    }
    response = client.post("/login", json={"email": "john@example.com", "password": "password123"})
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["data"]["user"]["email"] == "john@example.com"

@pytest.mark.asyncio
async def test_login_invalid_credentials(mock_user_repo):
    override_dependencies(mock_user_repo, None, None, None)
    mock_user_repo.check_login.return_value = {"status": "error", "message": "Invalid credentials"}
    response = client.post("/login", json={"email": "john@example.com", "password": "wrongpassword"})
    assert response.status_code == 401
    assert response.json()["status"] == "error"
    assert response.json()["message"] == "Invalid credentials"

# Test /signup endpoint
@pytest.mark.asyncio
async def test_signup_success(mock_user_repo):
    override_dependencies(mock_user_repo, None, None, None)
    mock_user_repo.signup.return_value = {
        "status": "success",
        "user": {"name": "John Doe", "email": "john@example.com"}
    }
    response = client.post("/signup", json={
        "name": "John Doe",
        "email": "john@example.com",
        "password": "password123",
        "phone": "1234567890"
    })
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["data"]["user"]["email"] == "john@example.com"

@pytest.mark.asyncio
async def test_signup_duplicate_email(mock_user_repo):
    override_dependencies(mock_user_repo, None, None, None)
    mock_user_repo.signup.return_value = {"status": "error", "message": "User already exists"}
    response = client.post("/signup", json={
        "name": "John Doe",
        "email": "john@example.com",
        "password": "password123",
        "phone": "1234567890"
    })
    assert response.status_code == 400
    assert response.json()["status"] == "error"
    assert response.json()["message"] == "User already exists"

# Test /user/{user_id} endpoint
@pytest.mark.asyncio
async def test_get_user_success(mock_user_repo):
    override_dependencies(mock_user_repo, None, None, None)
    mock_user_repo.get_by_id.return_value = {
        "id": 1, "name": "John Doe", "email":ovelope:
        "john@example.com", "phone": "1234567890", "created_at": "2023-10-01"
    }
    response = client.get("/user/1")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["data"]["user"]["email"] == "john@example.com"

@pytest.mark.asyncio
async def test_get_user_not_found(mock_user_repo):
    override_dependencies(mock_user_repo, None, None, None)
    mock_user_repo.get_by_id.return_value = None
    response = client.get("/user/999")
    assert response.status_code == 404
    assert response.json()["status"] == "error"
    assert response.json()["message"] == "User not found"

# Test /profile endpoint
@pytest.mark.asyncio
async def test_create_profile_success(mock_user_repo, mock_profile_repo):
    override_dependencies(mock_user_repo, mock_profile_repo, None, None)
    mock_user_repo.get_by_id.return_value = {"id": 1, "name": "John Doe", "email": "john@example.com"}
    mock_profile_repo.create.return_value = {"status": "success", "message": "Profile created successfully", "profile_id": 1}
    response = client.post("/profile", json={
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
    })
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["data"]["new_profile_id"] == 1

@pytest.mark.asyncio
async def test_create_profile_user_not_found(mock_user_repo, mock_profile_repo):
    override_dependencies(mock_user_repo, mock_profile_repo, None, None)
    mock_user_repo.get_by_id.return_value = None
    response = client.post("/profile", json={
        "user_id": 999,
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
    })
    assert response.status_code == 404
    assert response.json()["status"] == "error"
    assert response.json()["message"] == "User not found"

# Test /profile/{user_id} endpoint
@pytest.mark.asyncio
async def test_get_profile_by_user_id_success(mock_profile).json()["status"] == "success"
    assert response.json()["data"]["profiles"][0]["email"] == "john@example.com"

@pytest.mark.asyncio
async def test_get_profile_by_user_id_not_found(mock_profile_repo):
    override_dependencies(None, mock_profile_repo, None, None)
    mock_profile_repo.get_by_user_id.return_value = []
    response = client.get("/profile/999")
    assert response.status_code == 404
    assert response.json()["status"] == "error"
    assert response.json()["message"] == "User profiles not found"

# Test /profile/{user_id}/new_resume endpoint
@pytest.mark.asyncio
async def test_create_resume_success(mock_user_repo, mock_resume_service):
    override_dependencies(mock_user_repo, None, None, mock_resume_service)
    mock_user_repo.get_by_id.return_value = {"id": 1, "name": "John Doe", "email": "john@example.com"}
    mock_resume_service.create_resume.return_value = {"status": "success", "message": "Resume created successfully", "resume_id": 1}
    response = client.post("/profile/1/new_resume", json={
        "user_id": 1,
        "user_resume_id": 1,
        "name": "John Doe Resume",
        "job_title": "Software Engineer",
        "job_description": "Develop software solutions"
    })
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["data"]["resume_id"] == 1

@pytest.mark.asyncio
async def test_create_resume_user_not_found(mock_user_repo):
    override_dependencies(mock_user_repo, None, None, None)
    mock_user_repo.get_by_id.return_value = None
    response = client.post("/profile/999/new_resume", json={
        "user_id": 999,
        "user_resume_id": 1,
        "name": "John Doe Resume",
        "job_title": "Software Engineer",
        "job_description": "Develop software solutions"
    })
    assert response.status_code == 404
    assert response.json()["status"] == "error"
    assert response.json()["message"] == "User not found"

# Test /profile/{user_id}/new_resume/{resume_id}/pdf endpoint
@pytest.mark.asyncio
async def test_get_resume_pdf_success(mock_resume_repo):
    override_dependencies(None, None, mock_resume_repo, None)
    mock_resume_repo.get_by_id.return_value = {
        "id": 1, "user_id": 1, "user_resume_id": 1, "name": "John Doe Resume",
        "job_title": "Software Engineer", "job_description": "Develop software solutions",
        "new_resume": "LaTeX resume content", "created_at": "2023-10-01"
    }
    with patch("app.core.service.convert_latex_to_pdf", new=AsyncMock(return_value=b"PDF content")):
        response = client.get("/profile/1/new_resume/1/pdf")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"

@pytest.mark.asyncio
async def test_get_resume_pdf_not_found(mock_resume_repo):
    override_dependencies(None, None, mock_resume_repo, None)
    mock_resume_repo.get_by_id.return_value = None
    response = client.get("/profile/1/new_resume/999/pdf")
    assert response.status_code == 404
    assert response.json()["status"] == "error"
    assert response.json()["message"] == "User resume not found"

# Test /profile/{user_id}/new_resume/{resume_id} endpoint
@pytest.mark.asyncio
async def test_get_resume_by_id_success(mock_resume_repo):
    override_dependencies(None, None, mock_resume_repo, None)
    mock_resume_repo.get_by_id.return_value = {
        "id": 1, "user_id": 1, "user_resume_id": 1, "name": "John Doe Resume",
        "job_title": "Software Engineer", "job_description": "Develop software solutions",
        "new_resume": "LaTeX resume content", "created_at": "2023-10-01"
    }
    response = client.get("/profile/1/new_resume/1")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["data"]["resume"]["job_title"] == "Software Engineer"

@pytest.mark.asyncio
async def test_get_resume_by_id_not_found(mock_resume_repo):
    override_dependencies(None, None, mock_resume_repo, None)
    mock_resume_repo.get_by_id.return_value = None
    response = client.get("/profile/1/new_resume/999")
    assert response.status_code == 404
    assert response.json()["status"] == "error"
    assert response.json()["message"] == "User resume not found"

# Test /profile/{user_id}/new_resume endpoint
@pytest.mark.asyncio
async def test_get_all_resumes_by_user_id_success(mock_resume_repo):
    override_dependencies(None, None, mock_resume_repo, None)
    mock_resume_repo.get_by_user_id.return_value = [{
        "id": 1, "user_id": 1, "user_resume_id": 1, "name": "John Doe Resume",
        "job_title": "Software Engineer", "job_description": "Develop software solutions",
        "new_resume": "LaTeX resume content", "created_at": "2023-10-01"
    }]
    response = client.get("/profile/1/new_resume")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert len(response.json()["data"]["resumes"]) == 1
    assert response.json()["data"]["resumes"][0]["job_title"] == "Software Engineer"

@pytest.mark.asyncio
async def test_get_all_resumes_by_user_id_not_found(mock_resume_repo):
    override_dependencies(None, None, mock_resume_repo, None)
    mock_resume_repo.get_by_user_id.return_value = []
    response = client.get("/profile/999/new_resume")
    assert response.status_code == 404
    assert response.json()["status"] == "error"
    assert response.json()["message"] == "User resumes not found"