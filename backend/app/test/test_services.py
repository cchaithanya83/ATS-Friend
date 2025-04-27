import pytest
from unittest.mock import AsyncMock, patch
from app.core.service.resume import ResumeService
from app.core.database import ProfileRepository, ResumeRepository
from app.api.models import NewResume
from fastapi import HTTPException

@pytest.fixture
def profile_repo():
    return ProfileRepository()

@pytest.fixture
def resume_repo():
    return ResumeRepository()

@pytest.fixture
def resume_service(profile_repo, resume_repo):
    return ResumeService(profile_repo, resume_repo)

@pytest.mark.asyncio
async def test_resume_service_create_success(resume_service, profile_repo, resume_repo):
    # Mock profile_repo.get_by_id
    profile_repo.get_by_id = AsyncMock(return_value=[{
        "id": 1, "user_id": 1, "profile_name": "Professional", "name": "John Doe",
        "email": "john@example.com", "phone": "1234567890", "address": "123 Main St",
        "education": "BS Computer Science", "experience": "Software Engineer at XYZ",
        "skills": "Python, SQL", "certifications": "AWS Certified", "projects": "Resume Builder",
        "languages": "English, Spanish", "hobbies": "Reading, Hiking", "created_at": "2023-10-01"
    }])

    # Mock create_resume
    with patch("app.core.service.resume.create_resume", new=AsyncMock(return_value="LaTeX resume content")):
        # Mock resume_repo.create
        resume_repo.create = AsyncMock(return_value={"status": "success", "message": "Resume created successfully", "resume_id": 1})

        new_resume = NewResume(
            user_id=1,
            user_resume_id=1,
            name="John Doe Resume",
            job_title="Software Engineer",
            job_description="Develop software solutions"
        )
        result = await resume_service.create_resume(new_resume)
        assert result["status"] == "success"
        assert result["resume_id"] == 1

@pytest.mark.asyncio
async def test_resume_service_create_profile_not_found(resume_service, profile_repo):
    profile_repo.get_by_id = AsyncMock(return_value=[])
    new_resume = NewResume(
        user_id=1,
        user_resume_id=1,
        name="John Doe Resume",
        job_title="Software Engineer",
        job_description="Develop software solutions"
    )
    with pytest.raises(HTTPException) as exc:
        await resume_service.create_resume(new_resume)
    assert exc.value.status_code == 404
    assert exc.value.detail == "Profile not found"

@pytest.mark.asyncio
async def test_resume_service_create_resume_generation_failed(resume_service, profile_repo):
    profile_repo.get_by_id = AsyncMock(return_value=[{
        "id": 1, "user_id": 1, "profile_name": "Professional", "name": "John Doe",
        "email": "john@example.com", "phone": "1234567890", "address": "123 Main St",
        "education": "BS Computer Science", "experience": "Software Engineer at XYZ",
        "skills": "Python, SQL", "certifications": "AWS Certified", "projects": "Resume Builder",
        "languages": "English, Spanish", "hobbies": "Reading, Hiking", "created_at": "2023-10-01"
    }])
    with patch("app.core.service.resume.create_resume", new=AsyncMock(return_value=None)):
        new_resume = NewResume(
            user_id=1,
            user_resume_id=1,
            name="John Doe Resume",
            job_title="Software Engineer",
            job_description="Develop software solutions"
        )
        with pytest.raises(HTTPException) as exc:
            await resume_service.create_resume(new_resume)
        assert exc.value.status_code == 500
        assert exc.value.detail == "Resume generation failed"