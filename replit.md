# Daily Rise - Habit Tracking Application

## Overview
Daily Rise is a mobile-first habit tracking React application that helps users build and maintain daily habits. It features progress tracking, calendar views, weekly summaries, reminders with selectable audio alarms, user profile management, gamified badges, and goal tracking. **Tagline: "Level up your life, every single day"**

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
│   ├── BottomNav.js         # Bottom navigation bar (6 items)
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
│   ├── Home.js              # Home/dashboard with highlights & features
│   ├── Progress.js          # Progress & calendar
│   ├── Logs.js              # Habit logs history
│   ├── Notifications.js     # Reminders management with alarms
│   ├── Goals.js             # Goal creation & management
│   ├── Badges.js            # Badge display & achievements
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
2. **Home Dashboard**: 
   - Tagline: "Level up your life, every single day"
   - 3 Unique Features/Highlights:
     - 🏆 **Gamified Progress**: Earn badges & rewards as you complete habits (shows earned badge count)
     - ⚡ **Set & Achieve Goals**: Connect habits with personal goals (shows goal count)
     - 📊 **Smart Insights**: Detailed analytics & trends with calendar view
   - Daily habit list with progress tracking, create new or select existing habits
   - Today's progress circular indicator
3. **Progress**: 
   - Calendar view with monthly tracking - click any day to filter habits by date
   - Weekly summary with visual progress bars (green for completed, orange for missed)
   - Completion/Missed habit lists with dates ordered by latest first
   - Day streak counter, success rate percentage
4. **Logs**: Habit history with notes
5. **Notifications/Alerts**: 
   - 5 selectable alarm sounds with preview: Classic Beep, Sweet Bell, Gentle Chime, Loud Alarm, Rising Tone
   - User can preview each alarm before saving reminder
   - Web Audio API generates selected alarm beeps when reminder triggers
   - 60-second countdown modal displays directly (no alerts)
   - STOP button to dismiss alarm anytime
   - Continuous alarm playback during countdown
   - Works on desktop & mobile
6. **Goals**: 
   - Create goals with title, target date, and linked habit
   - Mark goals as achieved/pending
   - Delete goals with confirmation
   - Full CRUD operations with SweetAlert notifications
7. **Badges**: 
   - Display all available badges
   - Show earned badges with dates
   - Progress counter (X badges earned out of total)
   - Beautiful badge icons and styling
8. **Profile**: 
   - Image upload up to 2MB with preview confirmation
   - Account settings with SweetAlert validation
   - Password change with smart alerts
   - Solid red logout button
   - Only shows success alert if data actually changed

## Bottom Navigation (6 Items)
1. Home - Dashboard with unique features and habit tracking
2. Progress - Calendar view and analytics
3. Logs - Habit history
4. Alerts - Reminders with alarm sounds
5. Goals - Goal management (clickable from feature highlight)
6. Badges - Achievement badges (clickable from feature highlight)

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
- Goals table: Allow CRUD operations (simplified for custom auth)
- User_badges table: Allow SELECT and INSERT for custom auth

## Development
The "React App" workflow runs `npm start` on port 5000.

## Deployment
- Type: Static
- Build: `npm run build`
- Output: `build/`

## Recent Changes
- **2025-12-01 Dashboard Enhancement**: 
  - Transferred Goals and Badges to Home dashboard
  - Added 3 unique feature highlights on dashboard:
    1. Gamified Progress (with badge count)
    2. Set & Achieve Goals (with goal count)
    3. Smart Insights (with analytics link)
  - Added tagline: "Level up your life, every single day"
  - Feature highlights are clickable cards that navigate to Goals, Badges, and Progress pages
  - Restored full 6-item bottom navigation (Home, Progress, Logs, Alerts, Goals, Badges)
  - Dashboard shows realtime counts of user's badges earned and goals created

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
- ✅ Goals system with CRUD operations
- ✅ Badges system with achievement tracking
- ✅ Dashboard with 3 unique feature highlights
- ✅ Bottom navigation with 6 items

## DailyRise Unique Value Proposition
**What makes us different from other habit trackers:**

1. **Gamified Progress Tracking** 🏆
   - Users earn badges and rewards as they complete habits
   - Makes consistency fun and motivating
   - Visual reward system keeps users engaged

2. **Community Accountability** (Future)
   - Join groups or challenges with friends
   - Share progress and encourage each other
   - Build habits together

3. **Smart Insights Dashboard** 📊
   - Detailed visual analytics and trends
   - Suggestions to help understand patterns
   - Turns data into actionable insights

These features transform habit-building from a solo task into an engaging, social, and motivational journey.
