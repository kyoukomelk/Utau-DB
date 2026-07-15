FROM node:18-alpine

WORKDIR /app

# Install dependencies needed for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

# Build the Next.js application
RUN npm run build

# Create data directory for sqlite
RUN mkdir -p data

EXPOSE 3000

ENV DB_PATH=/app/data/cds.db

CMD ["npm", "start"]
