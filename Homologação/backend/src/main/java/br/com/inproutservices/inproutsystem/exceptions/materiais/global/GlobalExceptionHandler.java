package br.com.inproutservices.inproutsystem.exceptions.materiais.global;

import br.com.inproutservices.inproutsystem.exceptions.materiais.BusinessException;
import br.com.inproutservices.inproutsystem.exceptions.materiais.ResourceNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

// Esta anotação torna a classe um "observador" global de exceções para todos os controllers.
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Captura a BusinessException e a transforma em uma resposta HTTP 400 (Bad Request).
     * Esta é a correção principal para o seu problema.
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<String> handleBusinessException(BusinessException ex) {
        // Retorna o status 400 e a mensagem da exceção no corpo da resposta.
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    /**
     * Captura exceções de "recurso não encontrado" e as transforma em HTTP 404 (Not Found).
     * Isso melhora o tratamento de erros para quando um ID não é encontrado.
     */
    @ExceptionHandler({ ResourceNotFoundException.class, EntityNotFoundException.class })
    public ResponseEntity<String> handleResourceNotFoundException(RuntimeException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    /**
     * Um handler genérico para qualquer outra exceção não tratada,
     * garantindo que o servidor sempre retorne um erro 500 com uma mensagem padrão.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGenericException(Exception ex) {
        // Log do erro no servidor para depuração (boa prática)
        ex.printStackTrace();
        return new ResponseEntity<>("Ocorreu um erro inesperado no servidor.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
}