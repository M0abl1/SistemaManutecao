# Histórico de mudanças

## 2026-11-12 (relatórios)

### Novidades
- **Ordenação do relatório.** Novos campos **Ordenar escolas por** (nome A→Z/Z→A, mais ou menos demandas, conclusão mais recente) e **Ordenar demandas por** (conclusão ou abertura mais antiga/recente, protocolo crescente/decrescente, prioridade). A escolha aparece no cabeçalho impresso e fica salva no aparelho.
- Cache do PWA em `v6`.

## 2026-11-12

### Novidades
- **Tipo de serviço de TI.** Demandas de TI ganharam o campo `servicos_ti`, com um ou mais serviços entre **Corretiva**, **Preventiva**, **Instalação**, **Configuração** e **Outros**. O campo aparece só quando o tipo de OS é TI, é obrigatório nesse caso (na abertura e ao salvar a demanda) e é removido se o tipo deixar de ser TI. A pesquisa encontra demandas pelo serviço e o relatório de TI mostra os serviços em cada linha e a contagem por serviço no topo.
- **Pesquisa sem acento.** Todas as pesquisas e listas de sugestões (escola, tipo de OS, materiais) ignoram acentos, maiúsculas, pontuação e a ordem das palavras. As listas de sugestões nativas do navegador, que diferenciam acentos, foram substituídas por uma lista própria (`public/src/infra/busca.js`).

### Melhorias técnicas
- **Menos leituras no Firestore.** Técnico e supervisor deixaram de baixar a coleção `demandas` inteira: carregam as abertas e as finalizadas mais recentes, com o botão **Carregar demandas mais antigas** (`assinarDemandas` em `public/src/infra/demandas.js`). O relatório de período lê apenas as finalizadas e o individual, só a demanda pedida. Nenhuma consulta nova exige índice composto.
- **Testes das regras.** `tests/firestore.rules.test.mjs` cobre leitura, abertura, protocolo sequencial, auditoria, `servicos_ti`, conclusão e permissões de edição no emulador do Firestore (`npm run test:rules`).
- **Código compartilhado.** Tipos de OS, prioridades, status, cores dos cards, `escapeHtml` e `normalizar` estavam copiados em várias telas e agora ficam em `public/src/infra/demandas.js`.
- **Removido** `public/src/controllers/supervisorController.js`, que nenhuma tela usava.

### Correções
- Demandas novas gravam a data de abertura em `criado_em`, e não mais em `prazo_limite` (nome enganoso, pois não era prazo). Registros antigos continuam funcionando com `prazo_limite`.
- O card do supervisor mostra a data de abertura de demandas novas e antigas pela mesma função (`dataAberturaDemanda`).
- No supervisor, a confirmação de mudança de status só aparece depois de validar parecer, instituição e serviços de TI, em vez de pedir confirmação para algo que seria recusado.
- Comentário que descrevia o protocolo como aleatório corrigido: ele é sequencial.
- Cache do PWA atualizado para `v5`.
