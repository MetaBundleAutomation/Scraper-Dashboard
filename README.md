# Scraper-Dashboard

Frontend (React + TypeScript) interface to issue scrape commands and display logs from scraper responses.

## Features

- "Spawn Scraper" button to trigger backend API calls
- Console panel to display logs and responses
- Auto-scrolling log display

## Development

### Requirements

- Node.js 16+
- npm or yarn

### Setup

1. Install dependencies:
```
npm install
```

2. Run the development server:
```
npm start
```

The dashboard will be available at http://localhost:3000

## Building for Production

```
npm run build
```

## Docker Deployment

```
docker build -t scraper-dashboard:latest .
docker run -p 3000:3000 scraper-dashboard:latest
```
