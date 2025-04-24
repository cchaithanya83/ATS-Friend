
from app.core.llm import text_gen
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.database.config import check_login, new_signup , create_profile , get_profile_by_id ,get_profile_by_user_id , get_resume_by_id, get_resume_by_user_id,new_resume,get_user_by_id
from app.core.logs import logger
from app.core.service import create_resume, convert_latex_to_pdf
from app.api.models import LoginModel, NewResume, SignUpModel, User, profileModel
api_routes= FastAPI()

api_routes.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@api_routes.post("/login")
async def login(loginModal:LoginModel):
    """Login endpoint to authenticate users.

    Args:
        email (str): User's email address.
        password (str): User's password.

    Returns:
        dict: A dictionary containing the login status and user information.
    """
    #check user in db 
    login_result = await check_login(loginModal.email, loginModal.password)
    if login_result["status"] == "success":
        logger.info(f"User {loginModal.email} logged in successfully.")
        return {"status": "success", "user": login_result["user"]}
    else:
        logger.error(f"Login failed for user {loginModal.email}: {login_result['message']}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
@api_routes.post("/signup")
async def signup(signupModal:SignUpModel):
    """Signup endpoint to register new users.

    Args:
        name (str): User's name.
        email (str): User's email address.
        password (str): User's password.
        phone (str): User's phone number.

    Returns:
        dict: A dictionary containing the signup status and user information.
    """
    signup_result = await new_signup(signupModal.name, signupModal.email, signupModal.password, signupModal.phone)
    if signup_result["status"] == "success":
        logger.info(f"User {signupModal.email} signed up successfully.")
        return {"status": "success", "user": signup_result["user"]}
    else:
        logger.error(f"Signup failed for user {signupModal.email}: {signup_result['message']}")
        raise HTTPException(status_code=400, detail="User already exists")
    
@api_routes.get("/user/{user_id}")
async def get_user(user_id: int):
    """Get user information by user ID.

    Args:
        user_id (int): User's ID.

    Returns:
        User: A User object containing user information.
    """
    user = await get_user_by_id(user_id)
    if user:
        logger.info(f"User {user_id} information retrieved successfully.")
        return {"status": "success", "user":user}
    else:
        logger.error(f"User {user_id} not found.")
        raise HTTPException(status_code=404, detail="User not found")
    
@api_routes.post("/profile")
async def new_profile(profileModel:profileModel):
    """Create a new user profile.

    Args:
        profileModel (profileModel): profileModel object containing user information.

    Returns:
        dict: A dictionary containing the profile creation status and user information.
    """
    # Create a new user profile in the database
    result=await create_profile(profileModel.dict())
    if result["status"] != "success":
        logger.error(f"Failed to create user {profileModel.name} profile: {result['message']}")
        raise HTTPException(status_code=400, detail="Profile creation failed")
    logger.info(f"User {profileModel.name} profile created successfully.")
    return {"status": "success",'new_profile_id':result['profile_id'], "user": profileModel}

@api_routes.get("/profile/{user_id}")
async def get_profile_by_userid(user_id: int):
    """Get user profile information by user ID.

    Args:
        user_id (int): User's ID.

    Returns:
        profileModel: A profileModel object containing user profile information.
    """
    # Retrieve the user profile from the database
    user_profile = await get_profile_by_user_id(user_id)
    if user_profile:
        logger.info(f"User {user_id} profile retrieved successfully.")
        return {"status": "success", "user": user_profile}
    else:
        logger.error(f"User {user_id} profile not found.")
        raise HTTPException(status_code=404, detail="User profile not found")   
    



@api_routes.post("/profile/{user_id}/new_resume", response_class=StreamingResponse)
async def new_resumes(NewResume: NewResume):
    """Create a new resume for the user and return it as a PDF.

    Args:
        NewResume (NewResume): NewResume object containing resume information.

    Returns:
        StreamingResponse: A streaming response containing the generated PDF resume.
    """
    # Fetch profile details
    profile_details = await get_profile_by_id(NewResume.user_resume_id)
    print(profile_details)
    logger.debug(f"Profile details for user {NewResume.user_id}: {profile_details}")
    if not profile_details:
        logger.error(f"Profile not found for user_resume_id {NewResume.user_resume_id}")
        raise HTTPException(status_code=404, detail="Profile not found")

    # Generate LaTeX resume
    gen_resume = await create_resume(profile_details, NewResume.job_title, NewResume.job_description)
    if not gen_resume:
        logger.error(f"Failed to generate resume for user {NewResume.user_id}")
        raise HTTPException(status_code=500, detail="Resume generation failed")
    
    NewResume.new_resume = str(gen_resume)
    logger.debug(f"LaTeX code for user {NewResume.user_id}: {NewResume.new_resume}")

    # Save resume metadata
    result = await new_resume(NewResume.dict())
    logger.info(f"Resume creation result: {result}")
    
    if result["status"] != "success":
        logger.error(f"Failed to create resume for user {NewResume.user_id}: {result['message']}")
        raise HTTPException(status_code=400, detail="Resume creation failed")

    # Convert LaTeX to PDF
    try:
        pdf_response = await convert_latex_to_pdf(
            NewResume.new_resume,
            output_filename=f"resume_{NewResume.user_id}"
        )
    except Exception as e:
        logger.error(f"Failed to convert LaTeX to PDF for user {NewResume.user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF conversion failed: {str(e)}")

    logger.info(f"Resume for user {NewResume.user_id} created successfully, resume_id: {result['resume_id']}")
    
    # Add metadata to response headers (optional)
    pdf_response.headers["X-Resume-ID"] = str(result["resume_id"])
    pdf_response.headers["X-Status"] = "success"
    
    return pdf_response



@api_routes.get("/profile/{user_id}/new_resume/{resume_id}")
async def get_resume_by_resumeid(user_id: int, resume_id: int):
    """Get user resume information by user ID and resume ID.

    Args:
        user_id (int): User's ID.
        resume_id (int): Resume's ID.

    Returns:
        UserResume: A UserResume object containing user resume information.
    """
    # Retrieve the user resume from the database
    user_resume = await get_resume_by_id(resume_id)
    if user_resume:
        logger.info(f"User {user_id} resume {resume_id} retrieved successfully.")
        return {"status": "success", "user": user_resume}
    else:
        logger.error(f"User {user_id} resume {resume_id} not found.")
        raise HTTPException(status_code=404, detail="User resume not found")
    
@api_routes.get("/profile/{user_id}/new_resume")
async def get_all_resume_by_userid(user_id: int):
    """Get all resumes for the user by user ID.

    Args:
        user_id (int): User's ID.

    Returns:
        List[UserResume]: A list of UserResume objects containing user resume information.
    """
    # Retrieve all resumes for the user from the database
    user_resumes = await get_resume_by_user_id(user_id)
    if user_resumes:
        logger.info(f"User {user_id} all resumes retrieved successfully.")
        return {"status": "success", "user": user_resumes}
    else:
        logger.error(f"User {user_id} resumes not found.")
        raise HTTPException(status_code=404, detail="User resumes not found")