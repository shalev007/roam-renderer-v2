FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:web

FROM nginx:alpine AS production

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/web /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]