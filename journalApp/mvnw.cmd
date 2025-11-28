@ECHO OFF
SETLOCAL

set MAVEN_CMD=.\mvnw

if defined JAVA_HOME (
  set JAVA_EXE=%JAVA_HOME%\bin\java.exe
) else (
  set JAVA_EXE=java.exe
)

"%JAVA_EXE%" -classpath "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar" ^
 org.apache.maven.wrapper.MavenWrapperMain %*

ENDLOCAL
