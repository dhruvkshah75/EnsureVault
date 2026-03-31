FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --prefer-offline --no-audit

# Copy application source code
COPY . .

# Provide build-time arguments for the API URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the Next.js application
RUN npm run build

# Expose frontend port
EXPOSE 3000

# Start Next.js production server
CMD ["npm", "run", "start"]
