FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate


# Copy the rest of the application code
COPY . .

RUN npx prisma migrate
# Install bash and python3 for local code execution
RUN apk add --no-cache bash python3
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh



EXPOSE 4000

CMD ["/wait-for-it.sh", "db:5432", "--", "npm", "run", "dev"]