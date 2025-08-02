// Path: guizs/inprout-services-system/Inprout-Services-System-9c7c6d66a45787cd6c5531a8ab5c139813218d8f/Homologação/backend/src/main/java/br/com/inproutservices/inproutsystem/InproutsystemApplication.java
package br.com.inproutservices.inproutsystem;

import jakarta.annotation.PostConstruct; // Importe esta linha
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.util.TimeZone; // Importe esta linha

@SpringBootApplication
@EnableScheduling
public class InproutsystemApplication {

	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("America/Sao_Paulo"));
	}

	public static void main(String[] args) {
		SpringApplication.run(InproutsystemApplication.class, args);
	}

}