from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.database import UserRepository, ProfileRepository, ResumeRepository
from app.core.service import create_resume, convert_latex_to_pdf
from app.api.models import LoginModel, NewResume, SignUpModel, profileModel
from app.core.logs import logger

api_routes = FastAPI()

api_routes.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ApiResponse(BaseModel):
    status: str
    message: str | None = None
    data: dict | list | None = None

def get_user_repo():
    return UserRepository()

def get_profile_repo():
    return ProfileRepository()

def get_resume_repo():
    return ResumeRepository()

class ResumeService:
    def __init__(self, profile_repo: ProfileRepository, resume_repo: ResumeRepository):
        self.profile_repo = profile_repo
        self.resume_repo = resume_repo

    async def create_resume(self, new_resume: NewResume):
        profile_details = self.profile_repo.get_by_id(new_resume.user_resume_id)
        if not profile_details:
            raise HTTPException(status_code=404, detail="Profile not found")

        gen_resume = await create_resume(profile_details[0], new_resume.job_title, new_resume.job_description)
        if not gen_resume:
            raise HTTPException(status_code=500, detail="Resume generation failed")

        new_resume.new_resume = str(gen_resume)
        result = self.resume_repo.create(new_resume.dict())
        if result["status"] != "success":
            raise HTTPException(status_code=400, detail="Resume creation failed")

        return result

def get_resume_service(profile_repo: ProfileRepository = Depends(get_profile_repo), resume_repo: ResumeRepository = Depends(get_resume_repo)):
    return ResumeService(profile_repo, resume_repo)

@api_routes.post("/login", response_model=ApiResponse)
async def login(login_modal: LoginModel, user_repo: UserRepository = Depends(get_user_repo)):
    logger.info(f"Login attempt for email: {login_modal.email}")
    result = user_repo.check_login(login_modal.email, login_modal.password)
    if result["status"] == "success":
        logger.info(f"User {login_modal.email} logged in successfully")
        return ApiResponse(status="success", data={"user": result["user"]})
    logger.warning(f"Failed login for email: {login_modal.email}")
    raise HTTPException(status_code=401, detail="Invalid credentials")

@api_routes.post("/signup", response_model=ApiResponse)
async def signup(signup_modal: SignUpModel, user_repo: UserRepository = Depends(get_user_repo)):
    logger.info(f"Signup attempt for email: {signup_modal.email}")
    result = user_repo.signup(signup_modal.name, signup_modal.email, signup_modal.password, signup_modal.phone)
    if result["status"] == "success":
        logger.info(f"User {signup_modal.email} signed up successfully")
        return ApiResponse(status="success", data={"user": result["user"]})
    logger.error(f"Signup failed for email: {signup_modal.email}: {result['message']}")
    raise HTTPException(status_code=400, detail="User already exists")

@api_routes.get("/user/{user_id}", response_model=ApiResponse)
async def get_user(user_id: int, user_repo: UserRepository = Depends(get_user_repo)):
    user = user_repo.get_by_id(user_id)
    if user:
        logger.info(f"User {user_id} information retrieved successfully")
        return ApiResponse(status="success", data={"user": user})
    logger.error(f"User {user_id} not found")
    raise HTTPException(status_code=404, detail="User not found")

@api_routes.post("/profile", response_model=ApiResponse)
async def new_profile(profile: profileModel, user_repo: UserRepository = Depends(get_user_repo), profile_repo: ProfileRepository = Depends(get_profile_repo)):
    if not user_repo.get_by_id(profile.user_id):
        logger.error(f"User {profile.user_id} not found")
        raise HTTPException(status_code=404, detail="User not found")
    
    result = profile_repo.create(profile.dict())
    if result["status"] == "success":
        logger.info(f"Profile created for user {profile.user_id}")
        return ApiResponse(status="success", data={"new_profile_id": result["profile_id"], "user": profile.dict()})
    logger.error(f"Failed to create profile for user {profile.user_id}: {result['message']}")
    raise HTTPException(status_code=400, detail="Profile creation failed")

@api_routes.get("/profile/{user_id}", response_model=ApiResponse)
async def get_profile_by_userid(user_id: int, profile_repo: ProfileRepository = Depends(get_profile_repo)):
    profiles = profile_repo.get_by_user_id(user_id)
    if profiles:
        logger.info(f"Profiles retrieved for user {user_id}")
        return ApiResponse(status="success", data={"profiles": profiles})
    logger.error(f"No profiles found for user {user_id}")
    raise HTTPException(status_code=404, detail="User profiles not found")

@api_routes.post("/profile/{user_id}/new_resume", response_model=ApiResponse)
async def new_resumes(new_resume: NewResume, user_repo: UserRepository = Depends(get_user_repo), resume_service: ResumeService = Depends(get_resume_service)):
    if not user_repo.get_by_id(new_resume.user_id):
        logger.error(f"User {new_resume.user_id} not found")
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await resume_service.create_resume(new_resume)
    logger.info(f"Resume created for user {new_resume.user_id}")
    return ApiResponse(status="success", data={"resume_id": result["resume_id"], "message": result["message"]})

@api_routes.get("/profile/{user_id}/new_resume/{resume_id}/pdf")
async def get_resume_pdf(user_id: int, resume_id: int, resume_repo: ResumeRepository = Depends(get_resume_repo)):
    user_resume = resume_repo.get_by_id(resume_id)
    if not user_resume:
        logger.error(f"Resume {resume_id} not found for user {user_id}")
        raise HTTPException(status_code=404, detail="User resume not found")

    try:
        pdf_response = await convert_latex_to_pdf(user_resume['new_resume'], output_filename=f"resume_{user_id}_{resume_id}")
        logger.info(f"PDF generated for resume {resume_id} of user {user_id}")
        return pdf_response
    except RuntimeError as e:
        logger.error(f"PDF generation failed for resume {resume_id} of user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="PDF generation failed")

@api_routes.get("/profile/{user_id}/new_resume/{resume_id}", response_model=ApiResponse)
async def get_resume_by_resumeid(user_id: int, resume_id: int, resume_repo: ResumeRepository = Depends(get_resume_repo)):
    user_resume = resume_repo.get_by_id(resume_id)
    if user_resume:
        logger.info(f"Resume {resume_id} retrieved for user {user_id}")
        return ApiResponse(status="success", data={"resume": user_resume})
    logger.error(f"Resume {resume_id} not found for user {user_id}")
    raise HTTPException(status_code=404, detail="User resume not found")

@api_routes.get("/profile/{user_id}/new_resume", response_model=ApiResponse)
async def get_all_resume_by_userid(user_id: int, resume_repo: ResumeRepository = Depends(get_resume_repo)):
    resumes = resume_repo.get_by_user_id(user_id)
    if resumes:
        logger.info(f"All resumes retrieved for user {user_id}")
        return ApiResponse(status="success", data={"resumes": resumes})
    logger.error(f"No resumes found for user {user_id}")
    raise HTTPException(status_code=404, detail="User resumes not found")