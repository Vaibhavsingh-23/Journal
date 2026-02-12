# Use Maven with Eclipse Temurin JDK 17 to build
FROM maven:3.9-eclipse-temurin-17 AS build

# Set working directory
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Use Eclipse Temurin JRE for runtime (smaller image)
FROM eclipse-temurin:17-jre

# Set working directory
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 10000

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
