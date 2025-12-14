package br.com.inproutservices.inproutsystem.entities.index;

import br.com.inproutservices.inproutsystem.entities.geral.Banco;
import br.com.inproutservices.inproutsystem.enums.index.TipoPix;
import jakarta.persistence.*;

@Entity
@Table(name = "prestador")
public class Prestador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String codigoPrestador;

    private String prestador;
    private String razaoSocial;
    private String cidade;
    @Column(length = 2)
    private String uf;
    private String regiao;
    private String rg;
    private String cpf;
    private String cnpj;
    @Column(name = "codigo_banco_legado")
    private String codigoBanco;
    @Column(name = "nome_banco_legado")
    private String banco;
    private String agencia;
    private String conta;
    private String tipoDeConta;
    private String telefone;
    private String email;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "banco_id")
    private Banco bancoReferencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_pix")

    private TipoPix tipoPix;
    private String chavePix;
    private String observacoes;

    @Column(nullable = false)
    private boolean ativo = true;

    public String getCodigoBanco() {
        if (this.bancoReferencia != null) {
            return this.bancoReferencia.getCodigo();
        }
        return codigoBanco;
    }

    public String getBanco() {
        if (this.bancoReferencia != null) {
            return this.bancoReferencia.getNome();
        }
        return banco;
    }

    public void setCodigoBanco(String codigoBanco) {
        this.codigoBanco = codigoBanco;
    }

    public void setBanco(String banco) {
        this.banco = banco;
    }

    public Banco getBancoReferencia() {
        return bancoReferencia;
    }

    public void setBancoReferencia(Banco bancoReferencia) {
        this.bancoReferencia = bancoReferencia;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigoPrestador() {
        return codigoPrestador;
    }

    public void setCodigoPrestador(String codigoPrestador) {
        this.codigoPrestador = codigoPrestador;
    }

    public String getPrestador() {
        return prestador;
    }

    public void setPrestador(String prestador) {
        this.prestador = prestador;
    }

    public String getRazaoSocial() {
        return razaoSocial;
    }

    public void setRazaoSocial(String razaoSocial) {
        this.razaoSocial = razaoSocial;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getUf() {
        return uf;
    }

    public void setUf(String uf) {
        this.uf = uf;
    }

    public String getRegiao() {
        return regiao;
    }

    public void setRegiao(String regiao) {
        this.regiao = regiao;
    }

    public String getRg() {
        return rg;
    }

    public void setRg(String rg) {
        this.rg = rg;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getCnpj() {
        return cnpj;
    }

    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
    }

    public String getAgencia() {
        return agencia;
    }

    public void setAgencia(String agencia) {
        this.agencia = agencia;
    }

    public String getConta() {
        return conta;
    }

    public void setConta(String conta) {
        this.conta = conta;
    }

    public String getTipoDeConta() {
        return tipoDeConta;
    }

    public void setTipoDeConta(String tipoDeConta) {
        this.tipoDeConta = tipoDeConta;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public TipoPix getTipoPix() {
        return tipoPix;
    }

    public void setTipoPix(TipoPix tipoPix) {
        this.tipoPix = tipoPix;
    }

    public String getChavePix() {
        return chavePix;
    }

    public void setChavePix(String chavePix) {
        this.chavePix = chavePix;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }
}
