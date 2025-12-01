# Daily Rise - Habit Tracking Application

## Overview
Daily Rise is a mobile-first habit tracking React application that helps users build and maintain daily habits. It features progress tracking, calendar views, weekly summaries, reminders with selectable audio alarms, user profile management, gamified badges that auto-award on habit completion, community groups for accountability, and goal tracking. **Tagline: "Level up your life, every single day"**

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
│   ├── BottomNav.js         # Bottom navigation bar (7 items)
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
│   ├── Community.js         # Community groups & accountability
│   └── Profile.js           # User profile settings
├── utils/                   # Utility functions
│   └── badgeHelper.js       # Badge earning logic
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
   - **4 Dashboard Stat Cards**:
     - Today's Progress (X/Y habits completed)
     - Badges Earned (count)
     - Points (total earned)
     - Communities (groups joined)
   - **4 Unique Features/Highlights** (clickable cards):
     - 🏆 **Gamified Progress**: Auto-earn badges as you complete habits (shows earned badge count)
     - ⚡ **Set & Achieve Goals**: Connect habits with personal goals (shows goal count)
     - 📊 **Smart Insights**: Detailed analytics & trends with calendar view
     - 👥 **Community Accountability**: Join groups and build habits together (shows groups joined count)
   - Daily habit list with progress tracking, create new or select existing habits
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
   - **Edit goals** - Change title, target date, and habit connection
   - Delete goals with confirmation
   - Date validation: Only today or future dates allowed
   - Full CRUD operations with SweetAlert notifications
7. **Badges** (Gamified): 
   - Auto-award badges on habit completion:
     - First Step: 1 completed habit
     - Week Warrior: 7+ habits completed in 7 days
     - 30 Day Master: 20+ habits completed in 30 days
     - Consistency Champion: 50+ total completed habits
   - Display all available badges
   - Show earned badges with dates
   - Progress counter (X badges earned out of total)
   - Beautiful badge icons and styling
8. **Community** (Accountability): 
   - Create community groups/challenges with select dropdown
   - Join other communities
   - Leave communities
   - View all available communities
   - Share progress with friends in communities

9. **Rewards & Points System**:
   - **+10 Points** for each completed habit
   - **Point-based Reward Badges**:
     - 🥉 Bronze Badge: 1000 points
     - 🥈 Silver Badge: 3000 points
     - 🥇 Gold Badge: 5000 points
     - 💎 Diamond Badge: 10000 points
   - **Physical Reward Items** (claimable with points):
     - 👕 Signature T-Shirt: 2000 points
     - 🧥 Premium Hoodie: 5000 points
     - 🏆 Trophy: 7500 points
   - Track claimed rewards and total points earned
   - Rewards page with claim functionality
9. **Profile**: 
   - Image upload up to 2MB with preview confirmation
   - Account settings with SweetAlert validation
   - Password change with smart alerts
   - Solid red logout button
   - Only shows success alert if data actually changed

## Bottom Navigation (5 Items)
1. Home - Dashboard with feature highlights, habits, and 4 stat cards
2. Progress - Calendar view and analytics
3. Logs - Habit history
4. Alerts - Reminders with alarm sounds
5. Rewards - Claim badges and rewards with earned points

## Feature Highlights on Homepage (Clickable Links to)
- 🏆 Gamified Progress → Links to Badges page
- ⚡ Set & Achieve Goals → Links to Goals page
- 📊 Smart Insights → Links to Progress page
- 👥 Community Accountability → Links to Community page

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
- All tables: Allow INSERT, SELECT, UPDATE, DELETE with `WITH CHECK (true)` for custom auth

## Development
The "React App" workflow runs `npm start` on port 5000.

## Deployment
- Type: Static
- Build: `npm run build`
- Output: `build/`

## Recent Changes
- **2025-12-01 Complete Points & Rewards System**: 
  - Fixed community creation error (description now optional with default)
  - Added 4 dashboard stat cards: Today's Progress, Badges Earned, Points, Communities
  - **Dynamic Points System**: +10 when marking habit as done, -10 when unchecking
  - Points toggle up and down based on user actions (not static calculation)
  - Points persist in localStorage per user session
  - Created Rewards page with claimable badges (Bronze/Silver/Gold/Diamond)
  - Added physical rewards: T-Shirt, Hoodie, Trophy
  - Rewards accessible via new bottom nav item
  - Goals now have select dropdown with title examples
  - Communities now have select dropdown with name examples
  - Claimed rewards stored in localStorage

## Known Issues & Limitations
- RLS policies use simplified settings (USING true) due to custom authentication limitations
- Web Audio API requires browser to have audio output available
- Reminders use localStorage instead of database for local storage on device
- Bottom navigation with 7 items may need horizontal scrolling on very small screens

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
- ✅ Goals date validation (today or future only)
- ✅ Badges system with auto-earning on habit completion
- ✅ Dashboard with 3 unique feature highlights
- ✅ Bottom navigation with 7 items
- ✅ Community groups and accountability features
- ✅ Gamified progress tracking (auto-badges)
- ✅ Clickable Enable button in Alerts

## DailyRise Unique Value Proposition
**What makes us different from other habit trackers:**

1. **Gamified Progress Tracking** 🏆
   - Users auto-earn badges and rewards as they complete habits
   - Makes consistency fun and motivating
   - Visual reward system keeps users engaged
   - Automatic achievement recognition

2. **Community Accountability** 👥
   - Join groups or challenges with friends
   - Share progress and encourage each other
   - Build habits together in supportive communities
   - Foster social motivation and engagement

3. **Smart Insights Dashboard** 📊
   - Detailed visual analytics and trends
   - Suggestions to help understand patterns
   - Turns data into actionable insights

These features transform habit-building from a solo task into an engaging, social, and motivational journey.
