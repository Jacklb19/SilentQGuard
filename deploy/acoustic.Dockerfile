FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY apps/acoustic/package.json apps/acoustic/package.json
COPY apps/gateway/package.json apps/gateway/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY . .
RUN npm run proto:generate && npx tsc
RUN npm prune --omit=dev

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production ACOUSTIC_HOST=0.0.0.0
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/packages/contracts/acoustic.proto ./packages/contracts/acoustic.proto
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 50051
CMD ["node", "dist/apps/acoustic/src/index.js"]
