FROM node:alpine

WORKDIR /app
COPY package*.json ./
COPY yarn* ./
RUN yarn
COPY . .

CMD [ "yarn", "start" ]
