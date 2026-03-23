FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
