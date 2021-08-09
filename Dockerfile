FROM node:14

# Copy and build the project
WORKDIR /app
COPY src/ ./src/
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
COPY Makefile ./

# Install packages
RUN yarn

# Compile
RUN yarn build

# Clean up the source directory
RUN rm -rf /src

# Tools
RUN yarn global add @graphprotocol/ipfs-sync

CMD ["make", "scrape"]
