# Daily Rise - Habit Tracking Application

## Overview
Daily Rise is a mobile-first habit tracking React application that helps users build and maintain daily habits. It features progress tracking, calendar views, weekly summaries, reminders, and user profile management.

## Tech Stack
- **Frontend**: React 19.2.0 with Create React App
- **Styling**: Tailwind CSS 3.4.18
- **Backend/Database**: Supabase (external)
- **Routing**: React Router DOM
- **Package Manager**: npm

## Design System
### Colors
- Primary: #043915 (Dark Green)
- Dark: #000000 (Black)
- Light: #ffffff (White)

### Typography
- Primary Font: Poppins (headings)
- Secondary Font: Roboto (body text)
- Heading Size: 14-16px
- Body Size: 11px

## Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── Layout.js        # Main layout with bottom nav
│   ├── BottomNav.js     # Bottom navigation bar
│   ├── Header.js        # Page header
│   ├── HabitCard.js     # Habit display card
│   └── AddHabitModal.js # Add/edit habit modal
├── contexts/            # React contexts
│   └── AuthContext.js   # Authentication context
├── hooks/               # Custom hooks
├── lib/                 # External integrations
│   └── supabaseClient.js # Supabase client
├── pages/               # Page components
│   ├── Login.js         # Login page
│   ├── Register.js      # Registration page
│   ├── ForgotPassword.js # Password reset
│   ├── Home.js          # Home/dashboard
│   ├── Progress.js      # Progress & calendar
│   ├── Logs.js          # Habit logs history
│   ├── Notifications.js # Reminders management
│   └── Profile.js       # User profile settings
├── utils/               # Utility functions
├── App.js               # Main app with routing
├── App.css              # App styles (empty, using Tailwind)
├── index.js             # Entry point
└── index.css            # Global styles & Tailwind
```

## Database Schema (Supabase)
- **users**: id, email, password, firstname, lastname, age, gender, image
- **habits**: id, name, category, frequency, user_id
- **habit_logs**: id, log_date, status, notes, habit_id
- **goals**: id, title, target_date, is_achieve, habit_id, user_id
- **badges**: id, name, icon, points_required
- **user_badges**: id, earned_at, badge_id, user_id
- **community**: id, name, description
- **community_members**: id, joined_at, role, community_id, user_id

## Features
1. **Authentication**: Login, Register, Forgot Password
2. **Home**: Daily habit list with progress tracking
3. **Progress**: Calendar view, weekly summary, statistics
4. **Logs**: Habit history with notes
5. **Notifications**: Reminder management
6. **Profile**: Image upload, account settings, password change

## Environment Variables
- `REACT_APP_SUPABASE_URL`: Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Supabase anonymous key
- `PORT`: 5000 (development)
- `HOST`: 0.0.0.0 (development)
- `DANGEROUSLY_DISABLE_HOST_CHECK`: true (for Replit proxy)

## Development
The "React App" workflow runs `npm start` on port 5000.

## Deployment
- Type: Static
- Build: `npm run build`
- Output: `build/`

## Recent Changes
- **2025-11-30**: Complete application implementation
  - Authentication system (login, register, forgot password)
  - Home page with habit tracking
  - Progress page with calendar and statistics
  - Logs page with habit history
  - Notifications/reminders management
  - Profile with image upload and settings
  - Mobile-first responsive design
  - Custom color palette and typography
