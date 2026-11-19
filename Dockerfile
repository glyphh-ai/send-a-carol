# The image Fly builds from this folder (deploy with ./deploy.sh, never by hand). test/safe.cjs holds this file
# against the code: every file the build id covers, every module server.js loads, and ffmpeg must be in it.
#
# Debian (glibc), not Alpine. @napi-rs/canvas ships a prebuilt binary for both (the lockfile has
# canvas-linux-x64-gnu and canvas-linux-x64-musl), so either would install. The video is the product, and every
# frame of it is an 8 MB buffer drawn by that binary and piped to ffmpeg: glibc is the build of it that is used
# most, and its allocator is the faster one for buffers of that size. The price is a larger image, paid once a deploy.
FROM node:24-bookworm-slim
# ffmpeg makes the videos (libx264 + aac), the animated preview, and reads the song; Debian's build has all three.
# heif-convert (libheif-examples) turns an iPhone's HEIC photo into a JPEG: the canvas library cannot read HEIC, and
# Debian's ffmpeg decodes only one tile of an iPhone's tiled picture.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libheif-examples && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
# the server
COPY server.js config.js store.js brand.js agent.js song.js beat.js render.js email.js admin.js ./
# the player's connector: its tools, its sign-in, its rules and pages, and the MCP Apps bridge its panel carries
COPY connect.js oauth.js connect-rules.js connect-ui.js mcp-app.js ./
# the pages and what they load (the build id is a hash of exactly these); the engine draws the video on the server too
COPY landing.html app.html card.html admin.html art.js templates.js engine.js fonts.js net.js app.js card.js landing.js admin-ui.js style.css ./
COPY legal ./legal
# the template library (its registry and recipes) and its art packs (served at /art/<pack>.js, and drawn on the server)
COPY library ./library
COPY art ./art
COPY fonts ./fonts
COPY assets ./assets
# The landing page's example carols (made by tools/proof.cjs; test/safe.cjs fails if this line and the folder disagree).
COPY examples ./examples
ENV PORT=8080 NODE_NO_WARNINGS=1
CMD ["node", "server.js"]
