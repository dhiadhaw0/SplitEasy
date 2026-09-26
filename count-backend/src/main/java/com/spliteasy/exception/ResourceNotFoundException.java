package com.spliteasy.exception;

/**
 * Thrown when a requested resource (group, participant, expense, ...) does not exist.
 * Handled as HTTP 404.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
