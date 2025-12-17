# 📔 AI-Powered Journal Application

A modern journaling application built with Spring Boot and enhanced with Google Gemini AI for automatic sentiment analysis, mood detection, and personalized insights.

## 🌟 Features

### Core Functionality
- ✅ **User Authentication & Authorization** - Secure login with Spring Security (Basic Auth)
- ✅ **Role-Based Access Control** - USER and ADMIN roles with different permissions
- ✅ **CRUD Operations** - Create, Read, Update, Delete journal entries
- ✅ **User-Specific Journals** - Each user can only access their own entries

### AI-Powered Features 
- 🎯 **Automatic Mood Detection** - Identifies emotional state (Happy, Sad, Anxious, Grateful, etc.)
- 💭 **Emotion Analysis** - Extracts specific emotions from journal content
- 📊 **Sentiment Scoring** - Rates entries from -1.0 (negative) to 1.0 (positive)
- 📝 **AI-Generated Summaries** - Creates concise 2-3 sentence summaries
- 💪 **Motivational Insights** - Provides personalized encouraging thoughts
- 🔄 **Re-analysis Feature** - Refresh AI analysis for existing entries

### Admin Features
- 👥 View all registered users
- 🔐 Create admin accounts
- 📊 System-wide user management

## 🏗️ Architecture

### Backend Structure
```
com.example
├── controller/          # REST API endpoints
│   ├── JournalEntryControllerv2.java
│   ├── UserController.java
│   ├── AdminController.java
│   └── PublicController.java
├── service/            # Business logic
│   ├── JournalEntryService.java
│   ├── UserService.java
│   ├── GeminiService.java          # AI integration
│   └── UserDetailsServiceImpl.java
├── entity/             # MongoDB documents
│   ├── JournalEntry.java
│   └── User.java
├── repository/         # Data access layer
│   ├── JournalEntryRepository.java
│   └── UserRepository.java
├── dto/               # Data transfer objects
│   ├── GeminiRequest.java
│   ├── GeminiResponse.java
│   └── JournalAnalysis.java
└── config/            # Configuration
    ├── SpringSecurity.java
    └── RestTemplateConfig.java
```

## 🛠️ Tech Stack

**Backend:**
- **Java 17+** - Programming language
- **Spring Boot 3.x** - Application framework
- **Spring Security** - Authentication & authorization
- **Spring Data MongoDB** - Database integration
- **Lombok** - Reduces boilerplate code
- **RestTemplate** - HTTP client for external API calls

**Database:**
- **MongoDB Atlas** - Cloud-hosted NoSQL database

**AI/ML:**
- **Google Gemini API** - Natural language processing and sentiment analysis

**Security:**
- **BCrypt** - Password hashing
- **Basic Authentication** - API security
- **Role-Based Access Control** - Permission management

## 📋 Prerequisites

- Java 17 or higher
- Maven 3.6+
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/journal-app.git
cd journal-app
```

### 2. Configure MongoDB
Update `application.yml` with your MongoDB connection string:
```yaml
spring:
  data:
    mongodb:
      uri: mongodb+srv://username:password@cluster.mongodb.net/journaldb
      database: journaldb
```

### 3. Configure Gemini API
Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

**Option A: Environment Variable (Recommended)**
```bash
export GEMINI_API_KEY=your_api_key_here
```

Update `application.yml`:
```yaml
gemini:
  api:
    key: ${GEMINI_API_KEY}
    url: https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent
```
### 4. Build and Run
```bash
mvn clean install
mvn spring-boot:run
```

The application will start at `http://localhost:8080/journal`

## 🔌 API Endpoints

### Public Endpoints (No Authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/public/create-user` | Register new user |

### Journal Endpoints (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/journal` | Get all user's journal entries |
| POST | `/journal` | Create new entry (with AI analysis) |
| GET | `/journal/id/{id}` | Get specific entry |
| PUT | `/journal/id/{id}` | Update entry |
| DELETE | `/journal/id/{id}` | Delete entry |
| POST | `/journal/reanalyze/{id}` | Re-run AI analysis |

### User Management (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/user` | Update current user |
| DELETE | `/user` | Delete current user |

### Admin Endpoints (Admin Role Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/all-user` | Get all users |
| POST | `/admin/create-admin-user` | Create admin account |

## 📝 API Usage Examples

### Create a Journal Entry with AI Analysis
```bash
curl -X POST http://localhost:8080/journal/journal \
  -u username:password \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Amazing Day",
    "content": "Today was incredible! I completed my project and feel so accomplished."
  }'
```

**Response:**
```json
{
  "id": "674a1b2c3d4e5f6g7h8i9j0k",
  "title": "Amazing Day",
  "content": "Today was incredible!...",
  "date": "2025-11-29T10:30:45.123",
  "mood": "Happy",
  "emotions": "Joy, Pride, Accomplishment",
  "aiSummary": "The writer completed a challenging project and feels accomplished.",
  "motivationalThought": "Your hard work has paid off! Keep embracing challenges.",
  "sentimentScore": 0.9,
  "analysisCompleted": true
}
```

## 🎨 AI Analysis Features Explained

### Mood Detection
AI identifies the primary emotional state:
- 😊 Happy
- 😔 Sad
- 😰 Anxious
- 🙏 Grateful
- 🤔 Reflective
- 😐 Neutral

### Sentiment Score
A numerical value representing overall sentiment:
- **1.0 to 0.5**: Very positive
- **0.5 to 0.0**: Slightly positive to neutral
- **0.0 to -0.5**: Slightly negative
- **-0.5 to -1.0**: Very negative

### Emotions
Specific emotions detected in the entry:
- Joy, Pride, Hope, Excitement (positive)
- Worry, Fear, Sadness, Frustration (negative)

### AI Summary
2-3 sentence concise summary of the journal entry

### Motivational Thought
Personalized encouraging message based on the entry's content and mood

## 🔐 Security Features

- **Password Encryption**: BCrypt hashing
- **Authentication**: HTTP Basic Authentication
- **Authorization**: Role-based access control (RBAC)
- **API Security**: All endpoints (except `/public/**`) require authentication
- **User Isolation**: Users can only access their own journal entries

## 🗄️ Database Schema

### User Collection
```json
{
  "_id": ObjectId,
  "username": String (unique, indexed),
  "password": String (BCrypt hashed),
  "roles": [String],
  "journalEntries": [DBRef to JournalEntry]
}
```

### JournalEntry Collection
```json
{
  "_id": ObjectId,
  "title": String,
  "content": String,
  "date": DateTime,
  "mood": String,
  "emotions": String,
  "aiSummary": String,
  "motivationalThought": String,
  "sentimentScore": Double,
  "analysisCompleted": Boolean
}
```

## 🧪 Testing

Import the Postman collection from `/postman` directory for complete API testing.

### Test Sequence:
1. Create a user via `/public/create-user`
2. Login using Basic Auth
3. Create journal entries with different moods
4. View AI analysis results
5. Test update and delete operations

## 🚀 Future Enhancements

- [ ] Frontend UI (React/Angular)
- [ ] Email notifications
- [ ] Mood analytics dashboard
- [ ] Export journals to PDF
- [ ] Image attachments
- [ ] Search and filtering
- [ ] Calendar view
- [ ] Mood trends visualization
- [ ] Dark mode

## 📚 Learning Resources

This project demonstrates:
- RESTful API design
- Spring Boot application development
- MongoDB integration
- External API integration (Gemini)
- Security implementation
- AI/ML integration in backend
- Error handling and logging

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Vaibhav Singh**
- GitHub: https://github.com/Vaibhavsingh-23
- LinkedIn: www.linkedin.com/in/vaibhavsinghnmp

## 🙏 Acknowledgments

- Google Gemini AI for sentiment analysis
- Spring Boot team
- MongoDB team
- Open source community

---

⭐ If you find this project useful, please consider giving it a star!

## 📞 Contact

For questions or support, please open an issue or contact vs5626461@gmail.com
