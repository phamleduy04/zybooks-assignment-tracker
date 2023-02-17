FROM node:alpine as ts-compiler
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
WORKDIR /home/container

COPY . .

RUN yarn install
RUN yarn run build

FROM node:alpine as ts-remover
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
WORKDIR /home/container

COPY --from=ts-compiler /home/container/package.json ./
COPY --from=ts-compiler /home/container/dist ./

RUN yarn install --production

FROM node:slim
WORKDIR /home/container
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV EXECUTABLE_PATH /usr/bin/google-chrome

# Install Google Chrome
RUN apt-get update && apt-get install gnupg wget -y && \
    wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && \
    apt-get install google-chrome-stable -y --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY --from=ts-remover /home/container ./
CMD ["node", "Bot.js"]