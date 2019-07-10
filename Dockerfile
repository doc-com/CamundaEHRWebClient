FROM node

WORKDIR /app 

COPY package.json . 

RUN npm install react-scripts -g --silent 
RUN npm install 

COPY . . 

RUN node --max-old-space-size=2048 /usr/local/bin/npm run build 

EXPOSE 80/tcp

CMD node deploy.js