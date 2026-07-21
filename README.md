# Sistema de Manutenção SEDUC

Sistema web para registrar, acompanhar e concluir demandas de manutenção. A aplicação usa autenticação Google e Cloud Firestore, com uma interface separada para supervisores e técnicos.

## Recursos

- Login com conta Google.
- Controle de acesso por perfil: `supervisor` e `tecnico`.
- Cadastro de unidades/setores e abertura de chamados.
- Numeração sequencial de protocolos.
- Atualização em tempo real das demandas.
- Alteração do status: **Pendente**, **Em Andamento**, **Concluído** e **Cancelado**.
- Parecer técnico obrigatório ao concluir ou cancelar uma demanda.
- Filtros na listagem por todos os campos, número de protocolo ou tipo de demanda.
- Exibição para o técnico da prioridade e da solicitação detalhada do supervisor.

## Perfis de acesso

| Perfil | Permissões principais |
| --- | --- |
| Supervisor | Cadastra unidades, abre chamados, consulta a fila completa e atualiza qualquer demanda. |
| Técnico | Consulta demandas ativas, registra o parecer técnico e atualiza o status do atendimento. |

Os perfis ficam na coleção `usuarios` do Firestore, vinculados ao UID da conta autenticada.

## Estrutura

```text
SistemaManutecao/
├── index.html                 # Tela de login
├── views/
│   ├── supervisor.html        # Painel de supervisão
│   └── tecnico.html           # Fila de atendimentos técnicos
├── css/                       # Estilos das telas
└── src/
    ├── config/firebase.js     # Inicialização do Firebase Web
    ├── controllers/           # Fluxos de login e supervisão
    ├── models/                # Acesso aos dados de autenticação
    └── infra/                 # Logger
```

## Executar localmente

Como o projeto é estático, use um servidor HTTP local. Por exemplo, com a extensão **Live Server** do VS Code, abra a pasta do projeto e execute `index.html`.

Não abra o arquivo diretamente pelo explorador (`file://`), pois os módulos JavaScript precisam ser carregados por HTTP.

## Configuração do Firebase

1. Crie ou selecione um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Habilite o método **Google** em Authentication > Sign-in method.
3. Crie um banco **Cloud Firestore**.
4. Cadastre uma aplicação Web e atualize `src/config/firebase.js` com a configuração gerada pelo Firebase.
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

> A configuração web do Firebase identifica a aplicação no navegador. Não inclua no repositório chaves de conta de serviço, senhas ou arquivos do Admin SDK.

## Publicação no Firebase Hosting

Com o Firebase CLI instalado e autenticado, publique o site a partir da pasta do projeto:

```powershell
firebase.cmd deploy --only hosting
```

Mantenha as regras do Firestore restritivas: a interface sozinha não substitui as regras de segurança do banco.

## Tecnologias

- HTML, CSS e JavaScript (ES Modules)
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting
