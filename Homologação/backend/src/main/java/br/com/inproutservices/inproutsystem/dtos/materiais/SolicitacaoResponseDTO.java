package br.com.inproutservices.inproutsystem.dtos.materiais;

import br.com.inproutservices.inproutsystem.entities.atividades.Comentario; // Import Necessário
import br.com.inproutservices.inproutsystem.entities.index.Lpu;
import br.com.inproutservices.inproutsystem.entities.materiais.ItemSolicitacao;
import br.com.inproutservices.inproutsystem.entities.materiais.Solicitacao;
import br.com.inproutservices.inproutsystem.entities.atividades.OS;
import br.com.inproutservices.inproutsystem.entities.usuario.Usuario;
import br.com.inproutservices.inproutsystem.enums.materiais.StatusSolicitacao;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SolicitacaoResponseDTO(
        Long id,
        String nomeSolicitante,
        LocalDateTime dataSolicitacao,
        String justificativa,
        StatusSolicitacao status,
        List<ItemSolicitacaoResponseDTO> itens,
        String nomeAprovadorCoordenador,
        LocalDateTime dataAcaoCoordenador,
        String nomeAprovadorController,
        LocalDateTime dataAcaoController,
        String motivoRecusa,
        OsSimpleDTO os,
        LpuSimpleDTO lpu,
        List<ComentarioSimplesDTO> comentarios // <--- NOVO CAMPO ADICIONADO
) {
    public SolicitacaoResponseDTO(Solicitacao entity) {
        this(
                entity.getId(),
                entity.getSolicitante() != null ? entity.getSolicitante().getNome() : null,
                entity.getDataSolicitacao(),
                entity.getJustificativa(),
                entity.getStatus(),
                entity.getItens().stream().map(ItemSolicitacaoResponseDTO::new).collect(Collectors.toList()),
                entity.getAprovadorCoordenador() != null ? entity.getAprovadorCoordenador().getNome() : null,
                entity.getDataAcaoCoordenador(),
                entity.getAprovadorController() != null ? entity.getAprovadorController().getNome() : null,
                entity.getDataAcaoController(),
                entity.getMotivoRecusa(),
                new OsSimpleDTO(entity.getOs()),
                new LpuSimpleDTO(entity.getLpu()),
                // Mapeia a lista de comentários da entidade para o DTO simples
                entity.getComentarios().stream().map(ComentarioSimplesDTO::new).collect(Collectors.toList())
        );
    }

    // --- DTOs ANINHADOS ---

    // Novo DTO para exibir os comentários de forma resumida
    public record ComentarioSimplesDTO(String autor, String texto, LocalDateTime dataHora) {
        public ComentarioSimplesDTO(Comentario c) {
            this(c.getAutor().getNome(), c.getTexto(), c.getDataHora());
        }
    }

    // DTO aninhado para o Item
    public record ItemSolicitacaoResponseDTO(
            Long id,
            MaterialSimpleDTO material,
            BigDecimal quantidadeSolicitada
    ) {
        public ItemSolicitacaoResponseDTO(ItemSolicitacao itemEntity) {
            this(
                    itemEntity.getId(),
                    new MaterialSimpleDTO(itemEntity.getMaterial()),
                    itemEntity.getQuantidadeSolicitada()
            );
        }
    }

    // DTOs aninhados para Material, OS e LPU
    public record MaterialSimpleDTO(Long id, String descricao, BigDecimal saldoFisico, String unidadeMedida) {
        public MaterialSimpleDTO(br.com.inproutservices.inproutsystem.entities.materiais.Material materialEntity) {
            this(
                    materialEntity.getId(),
                    materialEntity.getDescricao(),
                    materialEntity.getSaldoFisico(),
                    materialEntity.getUnidadeMedida()
            );
        }
    }

    public record OsSimpleDTO(Long id, String os, SegmentoSimpleDTO segmento) {
        public OsSimpleDTO(OS osEntity) {
            this(
                    osEntity.getId(),
                    osEntity.getOs(),
                    osEntity.getSegmento() != null ? new SegmentoSimpleDTO(osEntity.getSegmento()) : null
            );
        }
    }

    public record LpuSimpleDTO(Long id, String codigoLpu) {
        public LpuSimpleDTO(Lpu lpuEntity) {
            this(lpuEntity.getId(), lpuEntity.getCodigoLpu());
        }
    }

    public record SegmentoSimpleDTO(Long id, String nome) {
        public SegmentoSimpleDTO(br.com.inproutservices.inproutsystem.entities.index.Segmento segmento) {
            this(segmento.getId(), segmento.getNome());
        }
    }
}