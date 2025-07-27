package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.repositories.atividades.FeriadoRepository;
import br.com.inproutservices.inproutsystem.services.config.PrazoService;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;

@Service
// O nome da interface aqui está correto, implementando a que definimos no pacote de config
public class PrazoServiceImpl implements PrazoService {

    private final FeriadoRepository feriadoRepository;

    public PrazoServiceImpl(FeriadoRepository feriadoRepository) {
        this.feriadoRepository = feriadoRepository;
    }

    /**
     * Calcula uma data futura com base em um número de dias úteis,
     * pulando fins de semana e feriados.
     * @param dataInicial A data de início da contagem.
     * @param diasUteis O número de dias úteis a serem adicionados.
     * @return A data final do prazo.
     */
    @Override
    public LocalDate calcularPrazoEmDiasUteis(LocalDate dataInicial, int diasUteis) {
        LocalDate dataResultado = dataInicial;
        int diasAdicionados = 0;
        while (diasAdicionados < diasUteis) {
            dataResultado = dataResultado.plusDays(1);
            DayOfWeek diaDaSemana = dataResultado.getDayOfWeek();

            // Verifica se não é sábado, domingo ou um feriado
            if (diaDaSemana != DayOfWeek.SATURDAY &&
                    diaDaSemana != DayOfWeek.SUNDAY &&
                    !feriadoRepository.existsByData(dataResultado)) {
                diasAdicionados++;
            }
        }
        return dataResultado;
    }

    // --- NOVO MÉTODO ADICIONADO ---
    /**
     * Busca o dia útil anterior a uma data de referência.
     * Se a data anterior for um fim de semana ou feriado, ele continua voltando
     * no tempo até encontrar um dia útil.
     * @param dataReferencia A data a partir da qual a busca retroativa começa.
     * @return O primeiro dia útil encontrado antes da data de referência.
     */
    @Override
    public LocalDate getDiaUtilAnterior(LocalDate dataReferencia) {
        LocalDate diaAnterior = dataReferencia.minusDays(1);

        // Enquanto o dia anterior for um fim de semana ou feriado, continue voltando um dia
        while (isFimDeSemana(diaAnterior) || isFeriado(diaAnterior)) {
            diaAnterior = diaAnterior.minusDays(1);
        }

        return diaAnterior;
    }

    // Métodos auxiliares privados para deixar o código mais limpo
    private boolean isFimDeSemana(LocalDate data) {
        DayOfWeek diaDaSemana = data.getDayOfWeek();
        return diaDaSemana == DayOfWeek.SATURDAY || diaDaSemana == DayOfWeek.SUNDAY;
    }

    private boolean isFeriado(LocalDate data) {
        // O método existsByData já faz a consulta no banco de forma otimizada
        return feriadoRepository.existsByData(data);
    }
}