# Perfis, permissões e operação

## Supervisor

O supervisor acessa o painel de gestão e possui visão completa das demandas, inclusive as de TI. Ele pode:

- cadastrar unidades e setores;
- abrir demandas e escolher a categoria TI;
- consultar demandas de todos os status e categorias;
- pesquisar por protocolo, tipo ou conteúdo;
- alterar o status de qualquer demanda.

### Abrir uma demanda

1. Acesse **Painel Principal**.
2. Escolha o tipo de manutenção, a unidade, a prioridade e descreva a solicitação.
3. Para atendimento de tecnologia, escolha **TI**.
4. Selecione **Abrir Chamado** e anote o protocolo apresentado.

O protocolo é sequencial e controlado pelo documento `configuracoes/contador_protocolo` em uma transação do Firestore.

## Técnico

O cargo `tecnico` usa a fila de atendimentos e visualiza demandas ativas, isto é, com status `Pendente` ou `Em Andamento`. Pode iniciar, concluir ou cancelar atendimentos e registrar o parecer técnico.

O parecer é obrigatório para concluir ou cancelar uma demanda.

## TI

O cargo `ti` usa a mesma tela operacional, mas sua consulta é limitada no Firestore a `tipo_manutencao = "TI"`. Além da consulta restrita, a interface verifica novamente a categoria antes de enviar uma atualização.

Esse cargo visualiza somente demandas TI que estejam `Pendente` ou `Em Andamento`. Demandas concluídas e canceladas permanecem disponíveis ao supervisor no histórico geral.

## Fluxo de status

```text
Pendente -> Em Andamento -> Concluído
                         -> Cancelado
```

O supervisor também pode forçar uma alteração entre os status disponíveis. Ao concluir ou cancelar, a aplicação grava `concluido_em`.

## Administração de usuários

Os perfis são documentos em `usuarios/{uid}`. Para trocar a função de uma conta, atualize o campo `cargo` no Console do Firestore ou por uma ferramenta administrativa protegida.

Exemplo de usuário TI:

```json
{
  "nome": "Nome do profissional",
  "email": "profissional@exemplo.com",
  "cargo": "ti",
  "criado_em": "2026-07-23T12:00:00.000Z"
}
```

Evite conceder `supervisor` sem necessidade, pois esse perfil possui visão e controle amplos.

## Checklist de homologação

- Supervisor enxerga demandas TI e não TI.
- Supervisor consegue criar uma demanda escolhendo TI.
- Cargo TI não recebe documentos de outras categorias.
- Cargo TI consegue atualizar uma demanda TI ativa.
- Parecer vazio bloqueia conclusão e cancelamento.
- Cargo técnico mantém o comportamento anterior.
- Usuário sem cargo permitido tem a sessão encerrada.
