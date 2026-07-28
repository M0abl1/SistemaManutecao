# Sistema de Manutenção SEDUC

Sistema web para registrar, acompanhar e concluir demandas de manutenção. A aplicação usa autenticação Google e Cloud Firestore, com uma interface separada para supervisores e técnicos.

## Recursos

- Login com conta Google.
- Controle de acesso por perfil: `supervisor`, `tecnico` e `ti`.
- Cadastro de unidades/setores e abertura de chamados.
- Categorias adicionais: cobertura/telhados, serralheria, montagem de mobiliário e equipamentos, geral e outros.
- Pesquisa de escola/unidade em lista suspensa ao abrir um chamado.
- Numeração sequencial de protocolos.
- Atualização em tempo real das demandas.
- Ordenação padrão com pendentes/em andamento mais antigos primeiro e concluídas abaixo.
- Alteração do status: **Pendente**, **Em Andamento**, **Concluído** e **Cancelado**.
- Parecer técnico obrigatório ao concluir ou cancelar uma demanda.
- Sidebar para todos os perfis, com filas exclusivas de TI e manutenção geral; o cadastro de unidades/setores permanece exclusivo do supervisor.
- Edição de prioridade, tipo de OS, instituição e parecer técnico diretamente na demanda; o supervisor também pode corrigir o relato original.
- Busca de demandas por protocolo, escola/unidade em lista suspensa, prioridade ou data de solicitação.
- Exclusão de demandas por usuários operacionais, protegida por confirmação explícita e aviso de ação permanente.
- Página colaborativa de cessão de uso com produto, destinatário, tombo, datas prevista e real, status e estado do bem na devolução.
- Relatórios mensais de TI e manutenção geral, agrupados por unidade e preparados para impressão ou PDF.
- Prioridades Normal, Alta e Crítico, com listagem de pendentes na ordem Crítico, Alta e Normal.
- Cards coloridos por prioridade: Normal em amarelo, Alta/Grave em vermelho, Crítico em vermelho intenso e concluídos em verde.
- Separação das demandas concluídas entre TI e manutenção geral.
- Exibição para o técnico da prioridade e da solicitação detalhada do supervisor.

## Perfis de acesso

| Perfil | Permissões principais |
| --- | --- |
| Supervisor | Cadastra unidades e também cria, consulta e atualiza qualquer chamado. |
| Técnico | Cria, consulta e atualiza todos os chamados, incluindo o relato técnico. |
| TI | Cria, consulta e atualiza todos os chamados, incluindo o relato técnico. |

Os perfis ficam na coleção `usuarios` do Firestore, vinculados ao UID da conta autenticada.

## Estrutura

```text
SistemaManutecao/
├── public/                    # Raiz publicada pelo Firebase Hosting
│   ├── index.html             # Tela de login
│   ├── views/
│   │   ├── supervisor.html    # Painel de supervisão
│   │   └── tecnico.html       # Fila técnica e de TI
│   ├── css/                   # Estilos das telas
│   └── src/
│       ├── config/firebase.js # Inicialização do Firebase Web
│       ├── controllers/       # Fluxos de login e supervisão
│       ├── models/            # Acesso aos dados de autenticação
│       └── infra/             # Logger
├── docs/                      # Documentação técnica e operacional
├── firebase.json              # Hosting e referência das regras
└── firestore.rules            # Regras de segurança versionadas
```

## Executar localmente

Como o projeto é estático, use um servidor HTTP local apontando para `public/`. Por exemplo, com a extensão **Live Server** do VS Code, execute `public/index.html`.

Não abra o arquivo diretamente pelo explorador (`file://`), pois os módulos JavaScript precisam ser carregados por HTTP.

## Configuração do Firebase

1. Crie ou selecione um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Habilite o método **Google** em Authentication > Sign-in method.
3. Crie um banco **Cloud Firestore**.
4. Cadastre uma aplicação Web e atualize `public/src/config/firebase.js` com a configuração gerada pelo Firebase.
5. Crie o primeiro documento de supervisor em `usuarios/{uid}`:

```json
{
  "nome": "Nome do Supervisor",
  "email": "supervisor@exemplo.com",
  "cargo": "supervisor",
  "criado_em": "2026-01-01T00:00:00.000Z"
}
```

Novos usuários autenticados entram como `tecnico`.

Para liberar um profissional de TI, defina `"cargo": "ti"` no documento `usuarios/{uid}`. O supervisor continua vendo as demandas de todas as categorias.

> A configuração web do Firebase identifica a aplicação no navegador. Não inclua no repositório chaves de conta de serviço, senhas ou arquivos do Admin SDK.

## Publicação no Firebase Hosting

Com o Firebase CLI instalado e autenticado, publique o site a partir da pasta do projeto:

```powershell
npx -y firebase-tools@latest deploy --only hosting,firestore:rules
```

O comando publica o conteúdo de `public/` e as regras versionadas. Mantenha as regras restritivas: a interface sozinha não substitui a segurança do banco.

## Tecnologias

- HTML, CSS e JavaScript (ES Modules)
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

## Documentação

- [Configuração e implantação](docs/CONFIGURACAO.md)
- [Perfis, permissões e operação](docs/OPERACAO.md)
- [Modelo de dados do Firestore](docs/MODELO_DADOS.md)

## Validação manual recomendada

1. Entre como `supervisor`, crie uma demanda TI e outra de qualquer categoria e confirme que ambas aparecem no painel.
2. Entre como `ti`, filtre as demandas de TI e de manutenção geral e edite prioridade, tipo, instituição e parecer.
3. Entre como `tecnico` e confirme os mesmos filtros e edição, sem acesso ao cadastro de unidades/setores.
4. Conclua ou cancele uma demanda com parecer preenchido e confira o registro no painel do supervisor.
