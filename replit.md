# Daily Rise - Habit Tracking Application

## Overview
Daily Rise is a mobile-first habit tracking React application that helps users build and maintain daily habits. It features progress tracking, calendar views, weekly summaries, reminders with audio alerts, and user profile management.

## Tech Stack
- **Frontend**: React 19.2.0 with Create React App
- **Styling**: Tailwind CSS 3.4.18
- **Backend/Database**: Supabase (external)
- **Routing**: React Router DOM
- **Package Manager**: npm
- **Audio**: Web Audio API for alarm notifications

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
├── components/              # Reusable UI components
│   ├── Layout.js            # Main layout with bottom nav
│   ├── BottomNav.js         # Bottom navigation bar
│   ├── Header.js            # Page header
│   ├── HabitCard.js         # Habit display card
│   ├── AddHabitModal.js     # Add/edit habit modal
│   └── SelectHabitModal.js  # Select existing habit modal
├── contexts/                # React contexts
│   └── AuthContext.js       # Authentication context
├── hooks/                   # Custom hooks
├── lib/                     # External integrations
│   └── supabaseClient.js    # Supabase client
├── pages/                   # Page components
│   ├── Login.js             # Login page
│   ├── Register.js          # Registration page
│   ├── ForgotPassword.js    # Password reset
│   ├── Home.js              # Home/dashboard
│   ├── Progress.js          # Progress & calendar
│   ├── Logs.js              # Habit logs history
│   ├── Notifications.js     # Reminders management
│   └── Profile.js           # User profile settings
├── utils/                   # Utility functions
├── App.js                   # Main app with routing
├── App.css                  # App styles (empty, using Tailwind)
├── index.js                 # Entry point
└── index.css                # Global styles & Tailwind
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
1. **Authentication**: Login, Register, Forgot Password with custom users table
2. **Home**: Daily habit list with progress tracking, create new or select existing habits
3. **Progress**: 
   - Calendar view with monthly tracking - **click any day to view habits for that date**
   - Today's Habits status showing completed vs missed vs not-logged habits
   - Weekly summary with completion statistics
   - Day streak counter
   - Success rate percentage
   - Quick "Today" button to return to current date
4. **Logs**: Habit history with notes
5. **Notifications**: 
   - Reminder management with alarm sounds
   - Web Audio API generates alarm beeps when reminder time arrives
   - Desktop notifications with persistent interaction
   - Fallback alerts for browsers without notification permission
6. **Profile**: Image upload with preview confirmation, account settings, password change

## Environment Variables
- `REACT_APP_SUPABASE_URL`: Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Supabase anonymous key
- `PORT`: 5000 (development)
- `HOST`: 0.0.0.0 (development)
- `DANGEROUSLY_DISABLE_HOST_CHECK`: true (for Replit proxy)

## RLS Policies (Supabase)
Simplified row-level security policies to work with custom authentication:
- Users table: Allow INSERT for registration, SELECT for all, UPDATE for profile changes
- Habits table: Allow CRUD operations (simplified for custom auth)
- Habit_logs table: Allow CRUD operations (simplified for custom auth)

## Development
The "React App" workflow runs `npm start` on port 5000.

## Deployment
- Type: Static
- Build: `npm run build`
- Output: `build/`

## Recent Changes
- **2025-11-30**: Complete application with full functionality
  - Fixed Add Habit modal layout (max-h-[85vh] prevents full page coverage)
  - Added "Create New Habit" and "Select Habit" buttons on empty state
  - Enhanced SelectHabitModal with gradient header, better styling, and hover effects
  - Added image upload preview with confirmation before saving
  - Fixed Reminders button visibility (pb-32 on Notifications page)
  - Enhanced Add Reminder modal with improved layout and scroll
  - Added "Today's Habits" section to Progress showing done/missed/not-logged
  - Implemented Web Audio API for alarm sounds (3 beeps at reminder time)
  - Added desktop notifications with audio and persistent interaction
  - **NEW: Made calendar days clickable to filter habits by date**
  - **NEW: Shows "Habits for [Date]" with dynamic date display**
  - **NEW: Added "Today" quick-access button**
  - **NEW: Displays not-logged habits for days with no activity**

## Known Issues & Limitations
- RLS policies use simplified settings (USING true) due to custom authentication limitations
- Web Audio API may require user interaction in some browsers before playing sound
- Reminders use localStorage instead of database for local storage on device
