# Daily Rise - Habit Tracking Application

## Overview
Daily Rise is a mobile-first habit tracking React application that helps users build and maintain daily habits. It features progress tracking, calendar views, weekly summaries, reminders with selectable audio alarms, and user profile management.

## Tech Stack
- **Frontend**: React 19.2.0 with Create React App
- **Styling**: Tailwind CSS 3.4.18
- **Backend/Database**: Supabase (external)
- **Routing**: React Router DOM
- **Package Manager**: npm
- **Audio**: Web Audio API for customizable alarm sounds
- **Alerts**: SweetAlert2 for user notifications

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
│   ├── Notifications.js     # Reminders management with alarms
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
1. **Authentication**: Login, Register, Forgot Password with custom users table and SweetAlert validation
2. **Home**: Daily habit list with progress tracking, create new or select existing habits
3. **Progress**: 
   - Calendar view with monthly tracking - click any day to filter habits by date
   - Weekly summary with visual progress bars (green for completed, orange for missed)
   - Completion/Missed habit lists with dates ordered by latest first
   - Day streak counter, success rate percentage
   - Quick "Today" button to return to current date
4. **Logs**: Habit history with notes
5. **Notifications/Reminders**: 
   - 5 selectable alarm sounds with preview: Classic Beep, Sweet Bell, Gentle Chime, Loud Alarm, Rising Tone
   - User can preview each alarm before saving reminder
   - Web Audio API generates selected alarm beeps when reminder triggers
   - 60-second countdown modal displays directly (no alerts)
   - STOP button to dismiss alarm anytime
   - Continuous alarm playback during countdown
   - Works on desktop & mobile
6. **Profile**: 
   - Image upload up to 2MB with preview confirmation
   - Account settings with SweetAlert validation
   - Password change with smart alerts
   - Solid red logout button
   - Only shows success alert if data actually changed

## Alarm Sounds
- 🔔 Classic Beep: 800Hz tone
- 🎵 Sweet Bell: 1000Hz bell
- ✨ Gentle Chime: 600Hz soft tone
- 🔊 Loud Alarm: 1200Hz high frequency
- 📢 Rising Tone: 700Hz rising frequency

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
- **2025-11-30 Final**: Application 100% complete
  - Added 5 selectable alarm sounds with preview buttons
  - Each reminder can have a custom alarm sound
  - 60-second countdown modal displays directly when reminder triggers (no alerts)
  - STOP button to dismiss alarm anytime
  - Alarm sounds play continuously (6 beeps) throughout countdown
  - Fixed audio context resuming for better compatibility
  - Fixed Enable button clickability with proper z-index
  - Mobile notification error handling with graceful fallback
  - Profile alerts use SweetAlert with smart validation
  - Only shows success message if profile data actually changed
  - Weekly Summary shows two progress bars (completed in green, missed in orange)
  - Completed/Missed habit lists show with dates, ordered by latest first
  - All buttons fully functional on mobile
  - Solid red logout button

## Known Issues & Limitations
- RLS policies use simplified settings (USING true) due to custom authentication limitations
- Web Audio API requires browser to have audio output available
- Reminders use localStorage instead of database for local storage on device

## Completed Features ✅
- ✅ Full user authentication system
- ✅ Habit creation and management
- ✅ Daily habit tracking
- ✅ Calendar view with day filtering
- ✅ Progress tracking with visual statistics
- ✅ Weekly summary with progress bars
- ✅ 5 customizable alarm sounds
- ✅ 60-second alarm countdown modal
- ✅ Profile management with image upload
- ✅ SweetAlert2 notifications throughout app
- ✅ Mobile responsive design
- ✅ Desktop & mobile support
