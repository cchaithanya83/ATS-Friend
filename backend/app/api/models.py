from pydantic import BaseModel
from typing import Any, Dict, List, Optional, Union
from datetime import datetime

class SignUpModel(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    created_at: datetime

class LoginModel(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime

class profileModel(BaseModel):
    profile_name: str
    user_id: int
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    certifications: Optional[str] = None
    projects: Optional[str] = None
    languages: Optional[str] = None
    hobbies: Optional[str] = None
    created_at: datetime

class NewResume(BaseModel):
    user_id: int
    user_resume_id: int
    name: str
    job_title: str
    job_description: str
    new_resume: Optional[str] = None
    created_at: datetime