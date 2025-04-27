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