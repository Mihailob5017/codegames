# Use an official Node.js 22 image
FROM node:22-alpine

# Set the working directory to /app
WORKDIR /app

# Copy the package*.json files to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the application code to the working directory
COPY . .

# Build the Vite-React app
RUN npm run build

# Expose the port
EXPOSE 5173

# Run the command to start the development server
CMD ["npm", "run", "dev"]