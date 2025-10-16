FROM node:20

WORKDIR /usr/src/app

COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

WORKDIR /usr/src/app/backend
RUN npm install

WORKDIR /usr/src/app/frontend
RUN npm install

COPY backend ./backend
COPY frontend ./frontend

WORKDIR /usr/src/app/backend
# RUN npm run compile

WORKDIR /usr/src/app/frontend

WORKDIR /usr/src/app/backend

CMD ["bash"]