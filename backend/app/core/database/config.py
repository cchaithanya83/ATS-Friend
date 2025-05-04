import sqlitecloud
import os
import bcrypt
import logging
import json
from contextlib import contextmanager
from dotenv import load_dotenv
from typing import Optional, List, Dict

load_dotenv()

logger = logging.getLogger(__name__)

def get_db_path():
    return os.getenv("SQLLITECLOUD")

@contextmanager
def get_db_connection():
    conn = sqlitecloud.connect(get_db_path())
    try:
        yield conn
    finally:
        conn.close()

# Centralized field configuration for ProfileModel
PROFILE_FIELDS = [
    {"name": "name", "sql_type": "TEXT NOT NULL", "is_json": False},
    {"name": "email", "sql_type": "TEXT NOT NULL", "is_json": False},
    {"name": "phone", "sql_type": "TEXT", "is_json": False},
    {"name": "address", "sql_type": "TEXT", "is_json": False},
    {"name": "links", "sql_type": "TEXT", "is_json": True, "json_type": "list[str]"},
    {"name": "certifications", "sql_type": "TEXT", "is_json": True, "json_type": "list[dict]"},
    {"name": "projects", "sql_type": "TEXT", "is_json": True, "json_type": "list[dict]"},
    {"name": "languages", "sql_type": "TEXT", "is_json": True, "json_type": "list[str]"},
    {"name": "education", "sql_type": "TEXT", "is_json": True, "json_type": "list[dict]"},
    {"name": "experience", "sql_type": "TEXT", "is_json": True, "json_type": "list[dict]"},
    {"name": "skills", "sql_type": "TEXT", "is_json": True, "json_type": "list[str]"},
]

def generate_profile_schema():
    """Generate the profile table schema based on PROFILE_FIELDS."""
    columns = [
        "id INTEGER PRIMARY KEY AUTOINCREMENT",
        "user_id INTEGER NOT NULL",
        "profile_name TEXT NOT NULL",
    ]
    columns.extend(f"{field['name']} {field['sql_type']}" for field in PROFILE_FIELDS)
    columns.append("created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    columns.append("FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE")
    return f"""
        CREATE TABLE IF NOT EXISTS profile (
            {', '.join(columns)}
        )
    """

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
    "profile": generate_profile_schema(),
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
    """,
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
        except sqlitecloud.IntegrityError:
            logger.error(f"Signup failed for email: {email} - User already exists")
            return {"status": "error", "message": "User already exists"}

    def get_by_id(self, user_id: int):
        user = self.fetch_one("SELECT * FROM user WHERE id=?", (user_id,))
        if user:
            return {
                "id": user[0], "name": user[1], "email": user[2], "phone": user[4], "created_at": user[5]
            }
        return None

    def update(self, user_id: int, update_data: dict):
        logger.debug(f"Attempting to update user ID: {user_id} with data: {list(update_data.keys())}")

        if not update_data:
            logger.warning(f"No update data provided for user ID: {user_id}")
            return {"status": "success", "message": "No changes provided."}

        if 'password' in update_data and update_data['password']:
            try:
                hashed_password = bcrypt.hashpw(update_data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                update_data['password'] = hashed_password
                logger.debug(f"Password hashed for user ID: {user_id}")
            except Exception as e:
                logger.error(f"Password hashing failed for user ID: {user_id}: {str(e)}")
                return {"status": "error", "message": "Password hashing failed"}
        elif 'password' in update_data:
            del update_data['password']
            if not update_data:
                logger.warning(f"Password was blank, no other changes provided for user ID: {user_id}")
                return {"status": "success", "message": "No effective changes provided."}

        set_clause = ", ".join([f"{key} = ?" for key in update_data.keys()])
        query = f"UPDATE user SET {set_clause} WHERE id = ?"
        params = list(update_data.values()) + [user_id]

        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, tuple(params))
                conn.commit()
                if cursor.rowcount == 0:
                    logger.warning(f"Update attempt for non-existent user ID: {user_id}")
                    return {"status": "error", "message": "User not found or no changes made"}
                logger.info(f"User ID: {user_id} updated successfully. Fields: {list(update_data.keys())}")
                return {"status": "success", "message": "User updated successfully"}
        except sqlitecloud.Error as e:
            logger.error(f"Database error updating user ID: {user_id} - {str(e)}")
            return {"status": "error", "message": f"Database error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error updating user ID: {user_id} - {str(e)}")
            return {"status": "error", "message": "An unexpected error occurred"}

class ProfileRepository(BaseRepository):
    def __init__(self):
        super().__init__("profile")

    def create(self, profile_data: dict):
        logger.debug(f"Creating profile for user_id: {profile_data['user_id']}")
        try:
            # Serialize structured fields to JSON
            profile_data_serialized = profile_data.copy()
            for field in PROFILE_FIELDS:
                if field['is_json'] and field['name'] in profile_data_serialized and profile_data_serialized[field['name']] is not None:
                    profile_data_serialized[field['name']] = json.dumps(profile_data_serialized[field['name']])
                elif field['name'] not in profile_data_serialized or profile_data_serialized[field['name']] is None:
                    profile_data_serialized[field['name']] = None

            # Generate INSERT query dynamically
            columns = ["user_id", "profile_name"] + [field['name'] for field in PROFILE_FIELDS]
            placeholders = ", ".join(["?" for _ in columns])
            query = f"""
                INSERT INTO profile ({', '.join(columns)})
                VALUES ({placeholders})
            """
            values = (
                profile_data_serialized['user_id'],
                profile_data_serialized['profile_name'],
                *[profile_data_serialized[field['name']] for field in PROFILE_FIELDS]
            )

            profile_id = self.insert(query, values)
            logger.info(f"Profile created successfully for user_id: {profile_data['user_id']}")
            return {"status": "success", "message": "Profile created successfully", "profile_id": profile_id}
        except sqlitecloud.Error as e:
            logger.error(f"Failed to create profile for user_id: {profile_data['user_id']} - {str(e)}")
            return {"status": "error", "message": str(e)}
        except json.JSONDecodeError as e:
            logger.error(f"JSON serialization failed for profile data: {str(e)}")
            return {"status": "error", "message": "Invalid data format"}

    def get_by_user_id(self, user_id: int):
        profiles = self.fetch_all("SELECT * FROM profile WHERE user_id=?", (user_id,))
        return [
            self._deserialize_profile(p) for p in profiles
        ]

    def get_by_id(self, profile_id: int):
        profile = self.fetch_one("SELECT * FROM profile WHERE id=?", (profile_id,))
        if profile:
            return self._deserialize_profile(profile)
        return None

    def _deserialize_profile(self, profile: tuple) -> dict:
        """Deserialize profile data from database row."""
        try:
            result = {
                "id": profile[0],
                "user_id": profile[1],
                "profile_name": profile[2],
                "created_at": profile[-1]
            }
            # Map fields from PROFILE_FIELDS (starting at index 3, after id, user_id, profile_name)
            for i, field in enumerate(PROFILE_FIELDS, start=3):
                if field['is_json'] and profile[i]:
                    result[field['name']] = json.loads(profile[i])
                else:
                    result[field['name']] = profile[i]
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Failed to deserialize profile ID {profile[0]}: {str(e)}")
            return None

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
        except sqlitecloud.Error as e:
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