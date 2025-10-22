package br.com.inproutservices.inproutsystem.dtos.atividades;

import java.util.List;

public class ImportResponseDTO {
    private List<OsResponseDto> oses;
    private List<String> warnings;

    public ImportResponseDTO(List<OsResponseDto> oses, List<String> warnings) {
        this.oses = oses;
        this.warnings = warnings;
    }

    public List<OsResponseDto> getOses() {
        return oses;
    }

    public List<String> getWarnings() {
        return warnings;
    }
}