package br.com.inproutservices.inproutsystem.exceptions.materiais;

public class BusinessException extends RuntimeException {
    public BusinessException(String msg) {
        super(msg);
    }
}