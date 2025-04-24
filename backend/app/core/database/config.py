import sqlite3
from datetime import datetime
from contextlib import contextmanager
import os
import bcrypt

def get_db_path():
    """Get the path to the SQLite database file."""
    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    return db_path

def init_db():
    """Initialize the SQLite database and create tables if they do not exist."""
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
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
    ''')

    cursor.execute('''
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
            FOREIGN KEY (user_resume_id) REFERENCES user_resume (id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()

async def check_login(email: str, password: str):
    """Login function to authenticate users.

    Args:
        email (str): User's email address.
        password (str): User's password.

    Returns:
        dict: A dictionary containing the login status and user information.
    """
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM user WHERE email=?', (email,))
    user = cursor.fetchone()
    
    conn.close()
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user[3].encode('utf-8')):
        user_info = {
            "id": user[0],
            "name": user[1],
            "email": user[2],
            "phone": user[4],
            "created_at": user[5]
        }
        return {"status": "success", "user": user_info}
    else:
        return {"status": "error", "message": "Invalid credentials"}

async def new_signup(name: str, email: str, password: str, phone: str):
    """Signup function to register new users.

    Args:
        name (str): User's name.
        email (str): User's email address.
        password (str): User's password.
        phone (str): User's phone number.

    Returns:
        dict: A dictionary containing the signup status and user information.
    """
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        cursor.execute('INSERT INTO user (name, email, password, phone) VALUES (?, ?, ?, ?)', 
                      (name, email, hashed_password, phone))
        conn.commit()
        return {"status": "success", "user": {"name": name, "email": email}}
    except sqlite3.IntegrityError:
        return {"status": "error", "message": "User already exists"}
    finally:
        conn.close()

async def get_user_by_id(user_id: int):
    """Get user information by user ID.

    Args:
        user_id (int): User's ID.

    Returns:
        dict: A dictionary containing user information.
    """
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM user WHERE id=?', (user_id,))
    user = cursor.fetchone()
    
    conn.close()
    
    if user:
        return {
            "id": user[0],
            "name": user[1],
            "email": user[2],
            "phone": user[4],
            "created_at": user[5]
        }
    else:
        return None
    
async def create_profile(userResume: dict):
    """Create a new user profile.

    Args:
        userResume (dict): Dictionary containing user profile information.

    Returns:
        dict: A dictionary containing the profile creation status, profile information, and the inserted profile ID.
    """
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO profile (user_id, profile_name, name, email, phone, address, education, experience, skills, certifications, projects, languages, hobbies)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
        ''', (
            userResume['user_id'],
            userResume['profile_name'],
            userResume['name'],
            userResume['email'],
            userResume['phone'],
            userResume['address'],
            userResume['education'],
            userResume['experience'],
            userResume['skills'],
            userResume['certifications'],
            userResume['projects'],
            userResume['languages'],
            userResume['hobbies']
        ))
        # Fetch the returned id
        profile_id = cursor.fetchone()[0]
        conn.commit()
        return {
            "status": "success",
            "message": "Profile created successfully",
            "profile_id": profile_id
        }
    except sqlite3.Error as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

async def get_profile_by_user_id(user_id: int):
    """Get user profile information by user ID.

    Args:
        user_id (int): User's ID.

    Returns:
        dict: A dictionary containing user profile information.
    """
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM profile WHERE user_id=?', (user_id,))
    profile = cursor.fetchall()
    
    conn.close()
    
    if profile[0]!=None:
        return [{
            "id": Profile[0],
            "user_id": Profile[1],
            "name": Profile[2],
            "email": Profile[3],
            "phone": Profile[4],
            "address": Profile[5],
            "education": Profile[6],
            "experience": Profile[7],
            "skills": Profile[8],
            "certifications": Profile[9],
            "projects": Profile[10],
            "languages": Profile[11],
            "hobbies": Profile[12],
            "created_at": Profile[13]
        }for Profile in profile]
    else:
        return None

async def get_profile_by_id(profile_id: int):
    """Get user profile information by profile ID.

    Args:
        profile_id (int): Profile ID.

    Returns:
        dict: A dictionary containing user profile information.
    """
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM profile WHERE id=?', (profile_id,))
    profile = cursor.fetchone()
    
    conn.close()
    
    if profile:
        return [{
            "id": profile[0],
            "user_id": profile[1],
            "name": profile[3],
            "email": profile[4],
            "phone": profile[5],
            "address": profile[6],
            "education": profile[7],
            "experience": profile[8],
            "skills": profile[9],
            "certifications": profile[10],
            "projects": profile[11],
            "languages": profile[12],
            "hobbies": profile[13],

        }]
    else:
        return None

async def get_all_profiles():
    """Get all user profiles.

    Returns:
        list: A list of dictionaries containing user profile information.
    """
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM user_resume')
    profiles = cursor.fetchall()
    
    conn.close()
    
    return [
        {
            "id": profile[0],
            "user_id": profile[1],
            "name": profile[2],
            "email": profile[3],
            "phone": profile[4],
            "address": profile[5],
            "education": profile[6],
            "experience": profile[7],
            "skills": profile[8],
            "certifications": profile[9],
            "projects": profile[10],
            "languages": profile[11],
            "hobbies": profile[12],
            "created_at": profile[13]
        }
        for profile in profiles
    ]

async def new_resume(NewResume: dict):

    """Create a new resume for a user.

    Args:
        NewResume (dict): Dictionary containing resume information.

    Returns:
        dict: A dictionary containing the resume creation status, resume information, and the inserted resume ID.
    """
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO new_resume (user_id, user_resume_id, name, job_title, job_description, new_resume)
            VALUES (?, ?, ?, ?, ?, ?) RETURNING id
        ''', (
            NewResume['user_id'],
            NewResume['user_resume_id'],
            NewResume['name'],
            NewResume['job_title'],
            NewResume['job_description'],
            NewResume['new_resume']
        ))
        # Fetch the returned id
        resume_id = cursor.fetchone()[0]
        conn.commit()
        return {
            "status": "success",
            "message": "Resume created successfully",
            "resume_id": resume_id
        }
    except sqlite3.Error as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

async def get_resume_by_user_id(user_id: int):
    """Get user resume information by user ID.

    Args:
        user_id (int): User's ID.

    Returns:
        dict: A dictionary containing user resume information.
    """
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM new_resume WHERE user_id=?', (user_id,))
    resume = cursor.fetchall()
    
    conn.close()
    
    if resume!=[]:
        return [{
            "id": resume[0],
            "user_id": resume[1],
            "user_resume_id": resume[2],
            "name": resume[3],
            "job_title": resume[4],
            "job_description": resume[5],
            "new_resume": resume[6],
            "created_at": resume[7]
        } for resume in resume]
    else:
        return None

async def get_resume_by_id(resume_id: int):
    """Get user resume information by resume ID.

    Args:
        resume_id (int): Resume ID.

    Returns:
        dict: A dictionary containing user resume information.
    """
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM new_resume WHERE id=?', (resume_id,))
    resume = cursor.fetchone()
    
    conn.close()
    
    if resume:
        return {
            "id": resume[0],
            "user_id": resume[1],
            "user_resume_id": resume[2],
            "name": resume[3],
            "job_title": resume[4],
            "job_description": resume[5],
            "new_resume": resume[6],
            "created_at": resume[7]
        }
    else:
        return None
    


init_db()