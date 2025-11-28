FROM python:3.11-slim

# Install TeX Live with extra packages
RUN apt-get update && apt-get install -y \
    texlive \
    texlive-latex-extra \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies for your FastAPI app
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the FastAPI application code
COPY . .

# Run the FastAPI app
CMD ["uvicorn", "main:api_routes", "--host", "0.0.0.0", "--port", "10000"]
EXPOSE 10000
# Use the following command to build the Docker image
# docker build -t ats-friend-backend .
# Use the following command to run the Docker container
# docker run -d -p 10000:10000 --name ats-friend-backend-container ats-friend-backend
#open in browser http://localhost:10000/docs