FROM node:18.20.5

# Install basic development tools
RUN apt update && apt install -y less git

# Create workspace directory and set permissions
RUN mkdir -p /workspace /home/node/.npm-global && \
    chown -R node:node /workspace /home/node/.npm-global

# Set working directory
WORKDIR /workspace

# Switch to node user
USER node

# Configure npm to use custom directory for global installations
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH="/home/node/.npm-global/bin:$PATH"

# Install global packages
RUN npm install -g npm@10.8.2
