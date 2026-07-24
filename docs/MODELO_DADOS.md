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
| `tipo_manutencao` | string | Sim | Categoria, incluindo `TI` |
| `unidade_atendida` | string | Sim | Unidade ou setor solicitante |
| `quem_atendido` | string | Não | Pessoa ou local atendido |
| `prioridade` | string | Sim | `Baixa`, `Média` ou `Alta` |
| `descricao` | string | Não | Relato original da solicitação |
| `status` | string | Sim | `Pendente`, `Em Andamento`, `Concluído` ou `Cancelado` |
| `prazo_limite` | string ISO 8601 | Sim na tela atual | Data usada como abertura na interface atual |
| `observacao_tecnico` | string | Sim | Parecer do atendimento; começa vazio |
| `concluido_em` | string ISO 8601 | Condicional | Gravado ao concluir ou cancelar |
| `status_alterado_por` | map | Após nova alteração | UID, nome e cargo de quem editou a demanda ou alterou seu status |
| `status_alterado_em` | timestamp | Após nova alteração | Data e hora confiável da última edição, gerada pelo servidor |

`tipo_manutencao` identifica a categoria do chamado, mas não limita sua visibilidade: todos os usuários operacionais podem atuar em qualquer categoria.

Os campos editáveis após a criação são `prioridade`, `tipo_manutencao`, `unidade_atendida`, `observacao_tecnico`, `status` e, quando aplicável, `concluido_em`. Protocolo, descrição original, solicitante e data de abertura permanecem protegidos.

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
