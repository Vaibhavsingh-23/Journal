package com.example.exception;

/**
 * Thrown when attempting to create a user with a username that already exists.
 * Maps to HTTP 409 Conflict via GlobalExceptionHandler.
 */
public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String username) {
        super("Username already exists: " + username);
    }
}
