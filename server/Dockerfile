FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
RUN npm ci --workspace=shared --workspace=server --include-workspace-root
COPY shared ./shared
COPY server ./server
COPY tsconfig.base.json ./
RUN npm run build -w shared && npm run build -w server

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
RUN npm ci --workspace=shared --workspace=server --omit=dev --include-workspace-root
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/server/dist ./server/dist
EXPOSE 3001
CMD ["node", "server/dist/index.js"]
