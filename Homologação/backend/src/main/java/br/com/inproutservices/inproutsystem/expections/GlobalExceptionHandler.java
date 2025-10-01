package br.com.inproutservices.inproutsystem.exceptions;

import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.exceptions.materiais.ResourceNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    // Método para criar uma resposta de erro padronizada em JSON
    private Map<String, String> createErrorResponse(String message) {
        return Collections.singletonMap("message", message);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return new ResponseEntity<>(createErrorResponse(errors), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, String>> handleBusinessException(BusinessException ex) {
        return new ResponseEntity<>(createErrorResponse(ex.getMessage()), HttpStatus.BAD_REQUEST);
    }

    // Tratamento para IDs inválidos (nulos ou mal formatados)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        ex.printStackTrace(); // Loga o erro completo no servidor
        return new ResponseEntity<>(createErrorResponse("Requisição inválida: " + ex.getMessage()), HttpStatus.BAD_REQUEST);
    }

    // Tratamento para recursos não encontrados
    @ExceptionHandler({ResourceNotFoundException.class, EntityNotFoundException.class})
    public ResponseEntity<Map<String, String>> handleResourceNotFoundException(RuntimeException ex) {
        return new ResponseEntity<>(createErrorResponse(ex.getMessage()), HttpStatus.NOT_FOUND);
    }

    // Tratamento genérico para qualquer outra exceção
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAllExceptions(Exception ex) {
        ex.printStackTrace(); // Logar o erro real no servidor para depuração
        return new ResponseEntity<>(createErrorResponse("Ocorreu um erro interno inesperado no servidor."), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}