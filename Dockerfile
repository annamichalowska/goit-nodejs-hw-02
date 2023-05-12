FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . . 

EXPOSE 3000

CMD ["node", "app.js"]

// docker build . -t test-container
// docker ps
// docker ps -a
// docker run -P -d test-container
// docker logs <CONTAINER ID FROM DOCKER PS>
// docker stop <CONTAINER ID FROM DOCKER PS>
// docker run -p 42234:3000 -d test-container