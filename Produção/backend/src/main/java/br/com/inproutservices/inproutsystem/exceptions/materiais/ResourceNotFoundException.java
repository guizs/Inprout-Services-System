package br.com.inproutservices.inproutsystem.exceptions.materiais;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String msg) {
        super(msg);
    }
}