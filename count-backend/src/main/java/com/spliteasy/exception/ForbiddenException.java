package com.spliteasy.exception;

/**
 * Thrown when an authenticated user tries to access or modify a group they are not a
 * linked participant of (or an action reserved to the group's creator). Handled as HTTP 403.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
