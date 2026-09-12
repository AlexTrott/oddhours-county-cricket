FROM node:22-bookworm-slim
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/county-cricket.sqlite
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build"]
