FROM node:9.3.0-alpine

RUN mkdir -p /src/app

WORKDIR /src/app

COPY . /src/app

RUN yarn install

EXPOSE 8080

CMD [ "npm", "start" ]