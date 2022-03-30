FROM node:8.16.0-alpine

MAINTAINER Dhian Pratama <dhian@smartwalkietalkie.com>

# Global dependencies
RUN apk --no-cache add --virtual native-deps \
    g++ gcc libgcc libstdc++ linux-headers git make python bash openssh && \
    npm install --quiet node-gyp -g

ARG SSH_KEY_FILE=.ssh/id_rsa
ADD ${SSH_KEY_FILE} /root/.ssh/id_rsa
RUN chmod 0600 /root/.ssh/id_rsa && \
    ssh-keyscan github.com >> /root/.ssh/known_hosts

# App dependencies
WORKDIR /app
COPY package.json ./
RUN npm install --allow-root

# Remove unneeded dependencies
RUN apk del native-deps

# Build assets
COPY . ./

# Compile codes to dist
RUN npm run build

# Default runtime configs and helpers
EXPOSE 3000
CMD npm run start
