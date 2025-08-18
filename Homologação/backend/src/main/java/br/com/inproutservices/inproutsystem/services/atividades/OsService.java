package br.com.inproutservices.inproutsystem.services.atividades;

import br.com.inproutservices.inproutsystem.dtos.atividades.LpuComLancamentoDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsRequestDto;
import br.com.inproutservices.inproutsystem.dtos.atividades.OsResponseDto;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface OsService {

    List<LpuComLancamentoDto> getLpusWithLastApprovedLaunch(Long osId);
    List<OS> getAllOsByUsuario(Long usuarioId);
    OS getOsById(Long id);
    void deleteOs(Long id);
    void importarOsDePlanilha(MultipartFile file) throws IOException;
    OS createOs(OsRequestDto osDto);
    OS updateOs(Long id, OsRequestDto osDto);
    Page<OS> getAllOsPaginado(Pageable pageable);
    Page<OsResponseDto> getAllOsPaginadoDto(Pageable pageable);
}