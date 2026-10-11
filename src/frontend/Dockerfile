FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ARG VITE_API_BASE_URL=http://localhost:5000
ARG VITE_KEYCLOAK_URL=http://localhost:8080
ARG VITE_KEYCLOAK_REALM=contractiq
ARG VITE_KEYCLOAK_CLIENT_ID=contractiq-frontend

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

RUN npm run build

FROM nginx:1.27-alpine AS runtime
RUN addgroup -S contractiq && adduser -S contractiq -G contractiq

# SPA routing: all paths serve index.html
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --retries=3 CMD wget -q -O- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
