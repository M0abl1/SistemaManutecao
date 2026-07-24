# Perfis, permissões e operação

## Supervisor

O supervisor acessa o painel de gestão e possui visão completa das demandas, inclusive as de TI. Ele pode:

- cadastrar unidades e setores;
- abrir demandas e escolher a categoria TI;
- consultar demandas de todos os status e categorias;
- filtrar pela sidebar as demandas de TI ou de manutenção geral;
- pesquisar por prioridade, protocolo ou data de solicitação;
- editar prioridade, tipo de OS, instituição, relato original, parecer técnico e status.

### Abrir uma demanda

1. Acesse **Painel Principal**.
2. Escolha o tipo de manutenção, a unidade, a prioridade e descreva a solicitação.
3. Para atendimento de tecnologia, escolha **TI**.
4. Selecione **Abrir Chamado** e anote o protocolo apresentado.

As categorias disponíveis incluem **Cobertura (Telhados)**, **Serralheria**, **Montagem de Mobiliário e Equipamentos**, **Geral** e **Outros**, além das categorias existentes.

O protocolo é sequencial e controlado pelo documento `configuracoes/contador_protocolo` em uma transação do Firestore.

## Técnico

O cargo `tecnico` usa o painel colaborativo com sidebar para abrir, visualizar e atualizar chamados de qualquer categoria e status. Pode separar demandas de TI e manutenção geral, pesquisar e editar prioridade, tipo de OS, instituição e parecer técnico.

Ao abrir um chamado, a unidade deve ser escolhida na lista mantida pelo supervisor. Técnico e TI podem consultar unidades, mas somente o supervisor pode cadastrá-las.

O campo **Pesquisar escola / unidade** permite digitar parte do nome e selecionar uma opção da lista suspensa. O sistema bloqueia a abertura se o texto não corresponder a uma escola cadastrada.

O parecer é obrigatório para concluir ou cancelar uma demanda.

Todos os usuários operacionais podem excluir uma demanda pelo botão **Excluir demanda**. Antes da exclusão, o sistema exibe o número do protocolo e exige confirmação. A exclusão é permanente e não altera nem reutiliza o contador de protocolos.

## TI

O cargo `ti` usa o mesmo painel colaborativo e possui as mesmas permissões operacionais sobre os chamados. A distinção de cargo permanece apenas para identificação e auditoria de quem realizou cada alteração.

## Sidebar e busca

- **Todas as demandas:** remove o filtro de categoria.
- **Demandas de TI:** mostra somente `tipo_manutencao = TI`.
- **Manutenção geral:** mostra todas as categorias diferentes de TI.
- As filas de status mostram pendentes, em andamento ou canceladas; as concluídas são separadas entre **TI** e **manutenção geral**.
- Na listagem padrão, pendentes e em andamento aparecem primeiro, dos protocolos mais antigos para os mais novos. Concluídas ficam abaixo e canceladas por último.
- Ao selecionar **Prioridade** em **Todas**, a listagem mostra pendentes na ordem **Crítico, Alta e Normal**. Em uma aba de status, a aba prevalece e a ordenação é aplicada somente às demandas daquele status.
- As demais buscas aceitam número do protocolo e data de solicitação.
- **Unidades / Setores** aparece somente no painel do supervisor.
- O **relato original** também é editável somente pelo supervisor.

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
- Cargos técnico e TI visualizam e atualizam chamados de todas as categorias e status.
- Cargos técnico e TI conseguem abrir novos chamados.
- Parecer vazio bloqueia conclusão e cancelamento.
- Toda edição ou alteração de status registra o responsável autenticado e o horário do servidor.
- Usuário sem perfil/cargo válido não acessa os dados operacionais.
