# DailyRise - React Application

## Overview
DailyRise is a React-based web application created with Create React App. It uses Tailwind CSS for styling and integrates with Supabase for backend services.

## Project Setup
- **Framework**: React 19.2.0 with Create React App
- **Styling**: Tailwind CSS 3.4.18
- **Backend**: Supabase (supabase-js 2.86.0)
- **Package Manager**: npm
- **Build System**: webpack (via react-scripts)

## Project Structure
```
/
├── public/          # Static assets and index.html
├── src/             # Source code
│   ├── App.js       # Main application component
│   ├── supabase.js  # Supabase client configuration
│   └── index.js     # Application entry point
├── package.json     # Dependencies and scripts
└── tailwind.config.js # Tailwind configuration
```

## Development
The app runs on port 5000 (required for Replit) and is configured to:
- Bind to 0.0.0.0 to work with Replit's proxy system
- Disable host checking (DANGEROUSLY_DISABLE_HOST_CHECK=true)
- Suppress automatic browser opening

### Running Locally
The "React App" workflow is configured to run `npm start`, which starts the development server.

## Deployment
The project is configured for static deployment:
- Build command: `npm run build`
- Output directory: `build/`
- Deployment type: Static hosting

## External Services
- **Supabase**: Backend-as-a-Service
  - URL: https://lhycgazbueihthngnkpa.supabase.co
  - API key is stored in src/supabase.js (anon key, safe for client-side)

## Recent Changes
- **2025-11-30**: Initial Replit environment setup
  - Configured environment variables for port 5000 and host settings
  - Set up React App workflow
  - Configured static deployment settings
  - Project successfully imported and running
