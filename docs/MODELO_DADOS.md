# Modelo de dados do Firestore

## `usuarios/{uid}`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `nome` | string | Sim | Nome exibido do usuário |
| `email` | string | Sim | E-mail da conta Google |
| `cargo` | string | Sim | `supervisor`, `tecnico`, `ti` ou legado `pendente` |
| `criado_em` | string ISO 8601 | Sim | Data de criação do perfil |

O identificador do documento deve ser o UID retornado pelo Firebase Authentication.

## `demandas/{id}`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `protocolo` | number | Sim | Número sequencial da demanda |
| `tipo_manutencao` | string | Sim | Categoria da OS: elétrica, hidráulica, patrimônio, capina, marcenaria, alvenaria, cobertura, serralheria, montagem de mobiliário/equipamentos, geral, outros ou TI |
| `unidade_atendida` | string | Sim | Unidade ou setor solicitante |
| `quem_atendido` | string | Não | Pessoa ou local atendido |
| `prioridade` | string | Sim | `Normal`, `Alta` ou `Crítico` |
| `descricao` | string | Não | Relato original da solicitação |
| `status` | string | Sim | `Pendente`, `Em Andamento`, `Concluído` ou `Cancelado` |
| `prazo_limite` | string ISO 8601 | Sim na tela atual | Data usada como abertura na interface atual |
| `observacao_tecnico` | string | Sim | Parecer do atendimento; começa vazio |
| `concluido_em` | string ISO 8601 | Condicional | Gravado ao concluir ou cancelar |
| `status_alterado_por` | map | Após nova alteração | UID, nome e cargo de quem editou a demanda ou alterou seu status |
| `status_alterado_em` | timestamp | Após nova alteração | Data e hora confiável da última edição, gerada pelo servidor |

`tipo_manutencao` identifica a categoria do chamado, mas não limita sua visibilidade: todos os usuários operacionais podem atuar em qualquer categoria.

Todos os perfis podem editar `prioridade`, `tipo_manutencao`, `unidade_atendida`, `observacao_tecnico`, `status` e, quando aplicável, `concluido_em`. Somente o supervisor pode alterar `descricao`. Protocolo, solicitante e data de abertura permanecem protegidos.

Todos os perfis operacionais podem excluir documentos de `demandas`. A operação é definitiva; o número do protocolo permanece consumido no contador para evitar reutilização.

## `unidades/{id}`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `nome` | string | Sim | Nome da unidade ou setor |
| `endereco` | string | Sim | Endereço ou localização |
| `criado_em` | string ISO 8601 | Sim | Data do cadastro |
| `id_unidade` | string | Legado/controlador | Código usado pelo controlador modular |

## `configuracoes/contador_protocolo`

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `ultimo_numero` | number | Último protocolo emitido; incrementado em transação |

Na ausência do documento, a tela do supervisor inicia a sequência em `1000`.

## Compatibilidade de dados

A interface aceita registros antigos sem alguns campos opcionais e exibe valores padrão. Para preservar filtros e permissões, novos documentos devem sempre conter `tipo_manutencao`, `status` e `protocolo` com os tipos descritos acima.

Registros antigos com prioridade `Baixa` ou `Média` são apresentados como `Normal` na edição e migrados para o novo valor ao serem salvos.

Registros antigos com categoria `Limpeza` são apresentados como `Capina` e migrados ao serem salvos.

## Coleção `emprestimos` — cessões de uso

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `produto` | string | Sim | Produto emprestado, até 200 caracteres |
| `emprestado_para` | string | Sim | Pessoa ou setor destinatário, até 200 caracteres |
| `numero_tombo` | string | Sim | Número patrimonial, até 80 caracteres |
| `data_emprestimo` | string `YYYY-MM-DD` | Sim | Data da cessão de uso |
| `data_devolucao` | string `YYYY-MM-DD` | Sim | Data prevista de devolução, igual ou posterior à cessão |
| `status` | string | Sim | `Em uso` ou `Devolvido` |
| `devolvido_em` | string `YYYY-MM-DD` | Quando devolvido | Data real da devolução |
| `estado_devolucao` | string | Quando devolvido | `Bom estado`, `Com avarias` ou `Danificado` |
| `devolucao_registrada_por` | map | Quando devolvido | UID, nome e cargo de quem confirmou a devolução |
| `devolucao_registrada_em` | timestamp | Quando devolvido | Momento da confirmação definido pelo servidor |
| `criado_por` | map | Sim | UID, nome e cargo do usuário autenticado |
| `criado_em` | timestamp | Sim | Data de criação definida pelo servidor |

Perfis operacionais podem criar e consultar cessões. A única atualização permitida é a transição definitiva de `Em uso` para `Devolvido`, com data real, estado do bem e autoria validados. A exclusão permanece bloqueada.
