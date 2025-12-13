package br.com.inproutservices.inproutsystem.config;

import br.com.inproutservices.inproutsystem.entities.atividades.TipoDocumentacao;
import br.com.inproutservices.inproutsystem.repositories.atividades.TipoDocumentacaoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class DatabaseSeeder {

    @Bean
    CommandLineRunner initDatabase(TipoDocumentacaoRepository tipoDocumentacaoRepository) {
        return args -> {
            if (tipoDocumentacaoRepository.count() == 0) {
                List<String> tiposIniciais = Arrays.asList(
                        "ADEQUAÇÃO LÓGICA",
                        "DOC D",
                        "DOCUMENTAÇÃO CABO DROP",
                        "PDI COM PPI (SEM LAYOUT)",
                        "PDI DIRETO SEM PPI (SEM LAYOUT)",
                        "PPI (SEM LAYOUT)",
                        "REL. FOTOGRÁFICO CELULAR",
                        "REL. FOTOGRÁFICO CORP. (PODE EXCLUIR O ITEM)",
                        "REL. FOTOGRÁFICO E2E",
                        "REL. INTEGRAÇÃO",
                        "REL. VISTORIA",
                        "SCI",
                        "SITE BOOK",
                        "TSSR TIM",
                        "TSSR TIM MW",
                        "LOS MW",
                        "DOC D DESCARTE",
                        "PPI PROJETO FTTH + CAD",
                        "PPI + CAD",
                        "PDI SEM PPI + CAD",
                        "PDI + CAD (PPI FORNECIDO)",
                        "TIM REDE EXTERNA CORPORATIVO",
                        "REVISÃO",
                        "SEM ITEM"
                );

                for (String nome : tiposIniciais) {
                    tipoDocumentacaoRepository.save(new TipoDocumentacao(nome));
                }
                System.out.println("Tipos de Documentação iniciais carregados com sucesso!");
            }
        };
    }
}