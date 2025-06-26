FROM node:18-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install additional tools and Python for Sesame CSM
RUN apt-get update && apt-get install -y \
    ffmpeg \
    scrot \
    python3 \
    python3-pip \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Clone and set up Sesame CSM
WORKDIR /opt
RUN git clone https://github.com/SesameAILabs/csm.git && \
    cd csm && \
    pip3 install -r requirements.txt && \
    pip3 install huggingface_hub

# Download Sesame model
RUN python3 -m huggingface_hub.cli download sesame-ai/csm-tiny --local-dir /opt/csm/models/csm-tiny

# Return to app directory
WORKDIR /app

# Copy application code
COPY . .

# Expose the application port
EXPOSE 9100

# Command to run the application
CMD ["node", "src/core/server.js"]
