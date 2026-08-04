# Synapse
Synapse is a full-stack AI-powered application built with React and Node.js. It provides an interactive interface for working with AI-powered features through a separate backend API.

## Features
* AI-powered functionality using the Gemini API
* React-based frontend
* Node.js and Express backend
* MongoDB database integration
* REST API architecture
* Separate frontend and backend structure

## Tech Stack
### Frontend
* React
* Vite
* JavaScript
* CSS
### Backend
* Node.js
* Express.js
* MongoDB
* Gemini API
## Project Structure
```text
synapse/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── gemini.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── public/
├── src/
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

## Installation
Clone the repository:
git clone YOUR_REPOSITORY_URL
cd synapse
Install frontend dependencies:

npm install

Install backend dependencies:

cd backend
npm install

## Environment Variables
Create a `.env` file inside the `backend` folder.

MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key

## Running the Project
Start the frontend:
npm run dev

Start the backend from the `backend` folder:

node server.js

The frontend and backend should then run as separate services.

## Author
Built as a full-stack development project.
