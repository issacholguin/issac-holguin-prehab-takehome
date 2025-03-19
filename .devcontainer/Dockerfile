FROM node:18.20.5

# Install basic development tools
RUN apt update && apt install -y less git

# Ensure default node user has access to global node_modules
RUN mkdir -p /usr/local/lib/node_modules && chown -R node:node /usr/local/lib/node_modules

# Set default user to node
USER node

# Set working directory
WORKDIR /workspace

# Install global packages (avoid modifying /usr/local/bin)
RUN mkdir -p /usr/local/lib/node_modules \
    && npm install -g npm@10.8.2 --prefix /usr/local/lib/node_modules

# Ensure PATH includes global node_modules binaries
ENV PATH="/usr/local/lib/node_modules/bin:${PATH}"
