📔 AI-Powered Journal Application

A secure journaling application built using Spring Boot and Google Gemini AI that analyzes journal entries to detect mood, emotions, sentiment, and provides AI-generated summaries and motivational insights.

✨ Features

Secure user authentication (Spring Security – Basic Auth)

Role-based access (USER / ADMIN)

CRUD operations on journal entries

User-specific data isolation

AI-based mood detection & sentiment analysis

AI summary and motivational feedback

Admin user management

🏗️ Project Structure
Journal/
├── backend/    # Spring Boot REST APIs
└── frontend/   # HTML, CSS, JavaScript UI

🛠️ Tech Stack

Backend: Java 17, Spring Boot, Spring Security

Database: MongoDB Atlas

AI: Google Gemini API

Frontend: HTML, CSS, JavaScript

⚙️ Run Locally (Backend)
mvn clean install
mvn spring-boot:run


Server runs at:

http://localhost:8080

🔌 API Highlights
Method	Endpoint	Description
POST	/public/create-user	Register user
GET	/journal	Get user journals
POST	/journal	Create entry with AI
PUT	/journal/id/{id}	Update entry
DELETE	/journal/id/{id}	Delete entry
POST	/journal/reanalyze/{id}	Re-analyze AI
GET	/admin/all-user	Admin: all users
📸 Screenshots

### Login Page
![Login](screenshots/login.png)

### Dashboard
![Dashboard](screenshots/dashboard.png)

### AI Analysis Output
![AI Analysis](screenshots/ai-analysis.png)



🔐 Security

BCrypt password encryption

Role-based authorization

Users can access only their own data

👤 Author

Vaibhav Singh
GitHub: https://github.com/Vaibhavsingh-23

LinkedIn: https://www.linkedin.com/in/vaibhavsinghnmp

⭐ Acknowledgments

Google Gemini AI

Spring Boot

MongoDB
