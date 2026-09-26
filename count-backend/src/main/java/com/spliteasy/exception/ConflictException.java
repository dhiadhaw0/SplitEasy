package com.spliteasy.exception;

/**
 * Thrown when the request conflicts with the current state of the resource
 * (e.g. email already registered, participant name already taken, participant still
 * referenced by an expense). Handled as HTTP 409.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
