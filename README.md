Journal App (Spring Boot + MongoDB)
A secure journal management backend built with Spring Boot and MongoDB Atlas, allowing users to register, log in, and manage personal journal entries with role-based access.

🚀 Features
✅ User Registration & Login with JWT

✅ Role-based Access (USER, ADMIN)

✅ Journal Entry CRUD (Create, Read, Update, Delete)

✅ MongoDB Atlas Integration

✅ Secure REST APIs with Spring Security

✅ Logging with rolling policy

🛠️ Tech Stack
Spring Boot

Spring Security + JWT

MongoDB Atlas

Maven

Postman (for API testing)

🔐 API Overview
Method	Endpoint	Purpose
POST	/public/create-user	Register user
POST	/auth/login	Login + JWT
GET	/journals	Get user’s journals
POST	/journals	Add new journal
PUT	/journals/{id}	Update journal
DELETE	/journals/{id}	Delete journal

All /journals endpoints require JWT in the Authorization header.
