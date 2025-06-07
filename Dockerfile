# Dockerfile

# Use an official Node.js runtime as a parent image.
# We are using the 'alpine' version for a smaller image size.
FROM node:18-alpine

# Set the working directory in the container.
WORKDIR /app

# Copy the package.json and package-lock.json (or yarn.lock) files.
COPY package*.json ./

# Install project dependencies.
RUN npm install

# Copy the rest of the application's source code.
COPY . .

# Build the application for production.
# This command assumes your build script is named 'build'.
RUN npm run build

# Expose the port that 'serve' will run on.
EXPOSE 3000

CMD ["npm", "run", "start"]

