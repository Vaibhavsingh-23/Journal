# 📔 AI-Powered Journal Application

> A full-stack journaling application with **Google Gemini AI** integration for mood detection, emotion analysis, and personalized insights.

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/cloud/atlas)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini%20AI-blue.svg)](https://ai.google.dev/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Author](#-author)

---

## 🌟 Overview

This is a secure, full-stack journal application that helps users track their thoughts, emotions, and mental well-being through AI-powered analysis. Every journal entry is automatically analyzed by Google Gemini AI to detect mood, extract emotions, calculate sentiment scores, and provide personalized motivational insights.

### Key Highlights

- 🤖 **AI-Powered Analysis** - Automatic mood detection and emotion extraction
- 📊 **Progress Tracking** - Track writing streaks and weekly statistics
- 📝 **Weekly Summaries** - AI-generated summaries of your week
- 🎨 **Dark Mode** - Beautiful dark theme support
- 🔒 **Secure** - BCrypt password encryption and role-based access control
- ⚙️ **User Settings** - Customize preferences and manage account

---

## ✨ Features

### 🔐 Authentication & Authorization
- **User Registration** - Create new accounts with secure password encryption
- **Login System** - HTTP Basic Authentication with Spring Security
- **Role-Based Access** - USER and ADMIN roles with different permissions
- **Session Management** - Secure credential storage in localStorage

### 📝 Journal Entry Management
- **Create Entries** - Write journal entries with title and content
- **AI Analysis** - Automatic analysis on every entry:
  - Mood detection (Happy, Sad, Anxious, Grateful, Excited, etc.)
  - Emotion extraction
  - Sentiment score calculation (-1 to +1 scale)
  - AI-generated summary
  - Personalized motivational insights
- **View Entries** - Browse all entries in a card-based grid layout
- **Entry Details** - View full entry with complete AI analysis
- **Edit Entries** - Update existing entries with re-analysis option
- **Delete Entries** - Remove entries with confirmation
- **Draft Auto-Save** - Automatically saves drafts while writing

### 📊 Dashboard Features
- **Progress Widget** - Track your journaling journey:
  - 🔥 Current writing streak
  - 🏆 Longest streak achieved
  - 📝 Entries this week
  - 📚 Total entries count
  - Last entry date
- **Weekly Summary** - AI-generated weekly summaries of your journal entries
- **Entry Cards** - Visual cards showing mood, sentiment, and summary
- **Empty State** - Helpful prompts when no entries exist

### ⚙️ User Settings
- **Email Preferences** - Configure email for weekly summaries
- **Weekly Summary Settings** - Enable/disable and choose delivery day
- **Email Notifications** - Toggle general email notifications
- **Change Password** - Update account password securely
- **Delete Account** - Permanent account deletion with confirmation

### 👑 Admin Features
- **User Management** - View all registered users
- **Create Admin** - Promote users to admin role
- **User Statistics** - See entry counts per user
- **System Overview** - Monitor user activity

### 🎨 UI/UX Features
- **Dark Mode** - Toggle between light and dark themes
- **Responsive Design** - Works on desktop and mobile devices
- **Loading States** - Visual feedback during operations
- **Error Handling** - User-friendly error messages
- **Character Counter** - Real-time character count while writing
- **Mood Emojis** - Visual mood indicators
- **Sentiment Bars** - Color-coded sentiment visualization

---

## 📸 Screenshots

### 🔐 Login Page
Clean and simple authentication interface with signup option.

<img src="screenshots/loginpage.png" alt="Login Page" width="100%"/>

---

### 📊 User Dashboard
Main dashboard showing journal entries with mood indicators, sentiment scores, and AI summaries.

<img src="screenshots/dashboard.png" alt="User Dashboard" width="100%"/>

**Features visible:**
- Welcome message with username
- Navigation buttons (New Entry, Settings, Logout)
- Entry cards with mood badges
- Sentiment visualization bars
- View and Delete actions

---

### ✍️ Create Entry & AI Analysis
Write your thoughts and get instant AI-powered insights.

<img src="screenshots/save-entry.png" alt="AI Analysis Results" width="100%"/>

**AI Analysis includes:**
- 🎭 **Mood Detection** - Identifies your emotional state
- 💭 **Emotions** - Extracts specific emotions from your writing
- 📈 **Sentiment Score** - Quantifies positivity/negativity (0.80 shown)
- 📝 **Summary** - AI-generated concise summary
- 💪 **Motivational Insight** - Personalized encouragement

---

### 🛠️ Admin Dashboard
Comprehensive user management interface for administrators.

<img src="screenshots/admindash.png" alt="Admin Dashboard" width="100%"/>

**Admin capabilities:**
- Create new admin users
- View all registered users
- See user roles (ADMIN/USER badges)
- Monitor journal entry counts
- View user IDs

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Java** | 17 | Programming language |
| **Spring Boot** | 3.4.5 | Application framework |
| **Spring Security** | - | Authentication & authorization |
| **Spring Data MongoDB** | - | Database integration |
| **Maven** | - | Build tool & dependency management |

### Database
| Technology | Purpose |
|------------|---------|
| **MongoDB Atlas** | Cloud-hosted NoSQL database |

### AI Integration
| Technology | Purpose |
|------------|---------|
| **Google Gemini API** | AI-powered text analysis and generation |

### Frontend
| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure and markup |
| **CSS3** | Styling and responsive design |
| **Vanilla JavaScript** | Client-side logic and API calls |

---

## 🏗️ Project Structure

```
Journal/
├── backend/                    # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/journalApp/
│   │   │   │   ├── controller/     # REST API controllers
│   │   │   │   ├── service/        # Business logic
│   │   │   │   ├── repository/     # MongoDB repositories
│   │   │   │   ├── entity/         # Data models
│   │   │   │   └── config/         # Configuration classes
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml                # Maven dependencies
│
├── frontend/                   # Vanilla JavaScript frontend
│   ├── index.html             # Login page
│   ├── signup.html            # User registration
│   ├── dashboard.html         # Main dashboard
│   ├── create-entry.html      # Create new entry
│   ├── entry-details.html     # View entry details
│   ├── settings.html          # User settings
│   ├── admin.html             # Admin dashboard
│   ├── css/
│   │   └── style.css          # All styles (dark mode included)
│   └── js/
│       └── api.js             # API service layer
│
├── screenshots/                # UI screenshots
│   ├── loginpage.png
│   ├── dashboard.png
│   ├── save-entry.png
│   └── admindash.png
│
├── README.md                   # This file
└── QUICKSTART.md              # Quick setup guide
```

---

## � Getting Started

### Prerequisites

- **Java 17** or higher
- **Maven** 3.6+
- **MongoDB Atlas** account (or local MongoDB)
- **Google Gemini API** key

### 1. Clone the Repository

```bash
git clone https://github.com/Vaibhavsingh-23/Journal.git
cd Journal
```

### 2. Configure Backend

Create `backend/src/main/resources/application.properties`:

```properties
# MongoDB Configuration
spring.data.mongodb.uri=mongodb+srv://<username>:<password>@cluster.mongodb.net/journal_db

# Google Gemini API
gemini.api.key=YOUR_GEMINI_API_KEY_HERE

# Server Configuration
server.port=8080
```

### 3. Start Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs on: `http://localhost:8080`

### 4. Start Frontend

**Option A: VS Code Live Server**
1. Open VS Code
2. Install "Live Server" extension
3. Right-click `frontend/index.html`
4. Select "Open with Live Server"

**Option B: Any HTTP Server**
```bash
cd frontend
# Using Python
python -m http.server 5500

# Using Node.js
npx http-server -p 5500
```

Frontend opens at: `http://localhost:5500`

### 5. Create Your First Account

1. Navigate to `http://localhost:5500`
2. Click "Sign up"
3. Create an account
4. Login and start journaling!

---

## 🔌 API Documentation

### Base URL
```
http://localhost:8080
```

### Authentication
All endpoints (except public ones) require HTTP Basic Authentication:
```
Authorization: Basic <base64(username:password)>
```

### Endpoints

#### � Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/public/create-user` | Register new user |

**Request Body:**
```json
{
  "userName": "string",
  "password": "string"
}
```

---

#### 📝 Journal Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/journal` | Get all user's entries | ✅ USER |
| `POST` | `/journal` | Create new entry with AI analysis | ✅ USER |
| `GET` | `/journal/id/{id}` | Get specific entry | ✅ USER |
| `PUT` | `/journal/id/{id}` | Update entry | ✅ USER |
| `DELETE` | `/journal/id/{id}` | Delete entry | ✅ USER |
| `POST` | `/journal/reanalyze/{id}` | Re-run AI analysis | ✅ USER |

**Create Entry Request:**
```json
{
  "title": "My Day",
  "content": "Today was amazing! I achieved my goals and felt great."
}
```

**Response (with AI analysis):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "My Day",
  "content": "Today was amazing!...",
  "date": "2026-02-12T12:00:00",
  "mood": "Happy",
  "emotions": "Joy, Satisfaction, Pride",
  "sentimentScore": 0.85,
  "aiSummary": "The author had a productive and fulfilling day...",
  "motivationalThought": "Your positive energy is contagious! Keep it up!"
}
```

---

#### 📊 Dashboard Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/dashboard/progress` | Get user progress stats | ✅ USER |
| `GET` | `/dashboard/weekly-summary` | Get weekly summary | ✅ USER |
| `POST` | `/dashboard/generate-summary` | Generate new weekly summary | ✅ USER |

**Progress Response:**
```json
{
  "currentStreak": 5,
  "longestStreak": 12,
  "weeklyEntryCount": 3,
  "totalEntries": 47,
  "lastEntryDate": "2026-02-12T10:30:00"
}
```

---

#### ⚙️ User Settings Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `PUT` | `/user` | Update user (password) | ✅ USER |
| `PUT` | `/user/preferences` | Update preferences | ✅ USER |
| `DELETE` | `/user` | Delete account | ✅ USER |

---

#### � Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/admin/all-user` | Get all users | ✅ ADMIN |
| `POST` | `/admin/create-admin-user` | Create admin user | ✅ ADMIN |

---

## � Security

### Authentication & Authorization
- **BCrypt Password Encryption** - All passwords hashed with BCrypt
- **HTTP Basic Authentication** - Secure credential transmission
- **Role-Based Access Control** - USER and ADMIN roles
- **Session Management** - Credentials stored securely in browser localStorage

### Data Security
- **User Isolation** - Users can only access their own journal entries
- **Input Validation** - Server-side validation on all inputs
- **XSS Protection** - HTML escaping on frontend
- **CORS Configuration** - Controlled cross-origin requests

### Best Practices
- Passwords must be at least 4 characters (configurable)
- Account deletion requires double confirmation
- Sensitive operations require re-authentication
- API keys stored in environment variables

---

## 👤 Author

**Vaibhav Singh**

- 🌐 GitHub: [@Vaibhavsingh-23](https://github.com/Vaibhavsingh-23)
- 💼 LinkedIn: [vaibhavsinghnmp](https://www.linkedin.com/in/vaibhavsinghnmp)

---

## ⭐ Acknowledgments

- **Google Gemini AI** - For powerful AI analysis capabilities
- **Spring Boot** - For robust backend framework
- **MongoDB** - For flexible NoSQL database
- **Spring Security** - For comprehensive security features

---

## 📄 License

This project is open source and available for educational purposes.

---

<div align="center">

**Made with ❤️ and ☕**

If you found this project helpful, please consider giving it a ⭐!

</div>
