import sqlite3
import os
import bcrypt
import logging
from contextlib import contextmanager

logger = logging.getLogger(__name__)

def get_db_path():
    return os.path.join(os.path.dirname(__file__), 'database.db')

@contextmanager
def get_db_connection():
    conn = sqlite3.connect(get_db_path())
    try:
        yield conn
    finally:
        conn.close()

TABLE_SCHEMAS = {
    "user": """
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "profile": """
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            profile_name TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            education TEXT,
            experience TEXT,
            skills TEXT,
            certifications TEXT,
            projects TEXT,
            languages TEXT,
            hobbies TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
        )
    """,
    "new_resume": """
        CREATE TABLE IF NOT EXISTS new_resume (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            user_resume_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            job_title TEXT NOT NULL,
            job_description TEXT NOT NULL,
            new_resume TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE,
            FOREIGN KEY (user_resume_id) REFERENCES profile (id) ON DELETE CASCADE
        )
    """
}

def init_db():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        for schema in TABLE_SCHEMAS.values():
            cursor.execute(schema)
        conn.commit()

class BaseRepository:
    def __init__(self, table_name):
        self.table_name = table_name

    def fetch_one(self, query, params):
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchone()

    def fetch_all(self, query, params):
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchall()

    def insert(self, query, params):
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.lastrowid

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__("user")

    def check_login(self, email: str, password: str):
        logger.debug(f"Checking login for email: {email}")
        user = self.fetch_one("SELECT * FROM user WHERE email=?", (email,))
        if user and bcrypt.checkpw(password.encode('utf-8'), user[3].encode('utf-8')):
            logger.info(f"Successful login for email: {email}")
            return {
                "status": "success",
                "user": {"id": user[0], "name": user[1], "email": user[2], "phone": user[4], "created_at": user[5]}
            }
        logger.warning(f"Failed login attempt for email: {email}")
        return {"status": "error", "message": "Invalid credentials"}

    def signup(self, name: str, email: str, password: str, phone: str):
        logger.debug(f"Attempting signup for email: {email}")
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        try:
            self.insert(
                "INSERT INTO user (name, email, password, phone) VALUES (?, ?, ?, ?)",
                (name, email, hashed_password, phone)
            )
            logger.info(f"Successful signup for email: {email}")
            return {"status": "success", "user": {"name": name, "email": email}}
        except sqlite3.IntegrityError:
            logger.error(f"Signup failed for email: {email} - User already exists")
            return {"status": "error", "message": "User already exists"}

    def get_by_id(self, user_id: int):
        user = self.fetch_one("SELECT * FROM user WHERE id=?", (user_id,))
        if user:
            return {
                "id": user[0], "name": user[1], "email": user[2], "phone": user[4], "created_at": user[5]
            }
        return None

class ProfileRepository(BaseRepository):
    def __init__(self):
        super().__init__("profile")

    def create(self, profile_data: dict):
        logger.debug(f"Creating profile for user_id: {profile_data['user_id']}")
        try:
            profile_id = self.insert(
                """
                INSERT INTO profile (user_id, profile_name, name, email, phone, address, education, experience, skills, certifications, projects, languages, hobbies)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    profile_data['user_id'], profile_data['profile_name'], profile_data['name'], profile_data['email'],
                    profile_data['phone'], profile_data['address'], profile_data['education'], profile_data['experience'],
                    profile_data['skills'], profile_data['certifications'], profile_data['projects'], profile_data['languages'],
                    profile_data['hobbies']
                )
            )
            logger.info(f"Profile created successfully for user_id: {profile_data['user_id']}")
            return {"status": "success", "message": "Profile created successfully", "profile_id": profile_id}
        except sqlite3.Error as e:
            logger.error(f"Failed to create profile for user_id: {profile_data['user_id']} - {str(e)}")
            return {"status": "error", "message": str(e)}

    def get_by_user_id(self, user_id: int):
        profiles = self.fetch_all("SELECT * FROM profile WHERE user_id=?", (user_id,))
        return [
            {
                "id": p[0], "user_id": p[1], "profile_name": p[2], "name": p[3], "email": p[4], "phone": p[5],
                "address": p[6], "education": p[7], "experience": p[8], "skills": p[9], "certifications": p[10],
                "projects": p[11], "languages": p[12], "hobbies": p[13], "created_at": p[14]
            } for p in profiles
        ]

    def get_by_id(self, profile_id: int):
        profile = self.fetch_one("SELECT * FROM profile WHERE id=?", (profile_id,))
        if profile:
            return [{
                "id": profile[0], "user_id": profile[1], "profile_name": profile[2], "name": profile[3], "email": profile[4],
                "phone": profile[5], "address": profile[6], "education": profile[7], "experience": profile[8], "skills": profile[9],
                "certifications": profile[10], "projects": profile[11], "languages": profile[12], "hobbies": profile[13],
                "created_at": profile[14]
            }]
        return []

class ResumeRepository(BaseRepository):
    def __init__(self):
        super().__init__("new_resume")

    def create(self, resume_data: dict):
        logger.debug(f"Creating resume for user_id: {resume_data['user_id']}")
        try:
            resume_id = self.insert(
                """
                INSERT INTO new_resume (user_id, user_resume_id, name, job_title, job_description, new_resume)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    resume_data['user_id'], resume_data['user_resume_id'], resume_data['name'], resume_data['job_title'],
                    resume_data['job_description'], resume_data['new_resume']
                )
            )
            logger.info(f"Resume created successfully for user_id: {resume_data['user_id']}")
            return {"status": "success", "message": "Resume created successfully", "resume_id": resume_id}
        except sqlite3.Error as e:
            logger.error(f"Failed to create resume for user_id: {resume_data['user_id']} - {str(e)}")
            return {"status": "error", "message": str(e)}

    def get_by_user_id(self, user_id: int):
        resumes = self.fetch_all("SELECT * FROM new_resume WHERE user_id=?", (user_id,))
        return [
            {
                "id": r[0], "user_id": r[1], "user_resume_id": r[2], "name": r[3], "job_title": r[4],
                "job_description": r[5], "new_resume": r[6], "created_at": r[7]
            } for r in resumes
        ]

    def get_by_id(self, resume_id: int):
        resume = self.fetch_one("SELECT * FROM new_resume WHERE id=?", (resume_id,))
        if resume:
            return {
                "id": resume[0], "user_id": resume[1], "user_resume_id": resume[2], "name": resume[3],
                "job_title": resume[4], "job_description": resume[5], "new_resume": resume[6], "created_at": resume[7]
            }
        return None

init_db()