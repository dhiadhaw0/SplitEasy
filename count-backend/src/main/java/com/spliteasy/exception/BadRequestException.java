package com.spliteasy.exception;

/**
 * Thrown when the request is well-formed but violates a business rule
 * (e.g. shares that do not sum up to the expense total). Handled as HTTP 400.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
