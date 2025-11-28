import uvicorn
from app.api import api_routes
from app.core.logs import logger




if __name__ == "__main__":
    logger.info("Starting the FastAPI application")
    uvicorn.run(api_routes, host="127.0.0.1", port=8000)