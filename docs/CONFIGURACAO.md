# Configuração e implantação

## Requisitos

- Projeto no Firebase com Authentication e Cloud Firestore.
- Login Google habilitado em **Authentication > Sign-in method**.
- Domínio da aplicação autorizado em **Authentication > Settings > Authorized domains**.
- Navegador moderno e servidor HTTP para desenvolvimento local.

## Configuração da aplicação

As configurações públicas do aplicativo Web ficam em `public/src/config/firebase.js`. Copie os valores exibidos em **Project settings > Your apps > Web app**. A chave da aplicação Web é pública por natureza e não substitui regras de segurança. Não adicione ao projeto arquivos de conta de serviço, chaves privadas, tokens ou credenciais do Admin SDK.

## Primeiro acesso

1. Inicie a aplicação por HTTP e autentique uma conta Google.
2. O primeiro acesso cria `usuarios/{uid}` com cargo `tecnico`.
3. No Console do Firestore, altere o campo `cargo` do administrador para `supervisor`.
4. Para um profissional de TI, defina o campo como `ti`.

Valores de cargo aceitos pela interface:

| Valor | Destino | Escopo |
| --- | --- | --- |
| `supervisor` | Painel do supervisor | Todas as demandas e unidades |
| `tecnico` | Painel colaborativo | Cria, consulta e atualiza todos os chamados |
| `ti` | Painel colaborativo | Cria, consulta e atualiza todos os chamados |
| `pendente` | Tela de espera | Sem acesso operacional até liberação |

Os valores são sensíveis a maiúsculas e minúsculas. Use exatamente `supervisor`, `tecnico` e `ti`.

## Regras do Firestore

A filtragem da interface melhora a experiência, mas não é uma barreira de segurança. As regras publicadas no Firestore devem, no mínimo:

- permitir leitura do próprio documento em `usuarios/{uid}`;
- permitir ao supervisor ler e alterar todas as demandas;
- permitir aos cargos operacionais ler e criar chamados de qualquer categoria;
- restringir atualizações aos campos operacionais, como `status`, `observacao_tecnico`, auditoria e `concluido_em`;
- confirmar nas regras que a identidade gravada na auditoria corresponde ao usuário autenticado;
- permitir que apenas supervisores cadastrem unidades e novas demandas.

Após publicar regras novas, valide os três perfis no Rules Playground ou no Emulator Suite. Todos os cargos operacionais consultam a mesma fila ordenada por protocolo; os cargos permanecem registrados para identificação e auditoria.

## Execução local

Sirva a raiz do repositório por HTTP. Exemplos: Live Server no VS Code ou qualquer servidor estático. A abertura direta por `file://` não funciona corretamente porque a aplicação usa módulos ES.

## Implantação

O repositório mantém `firebase.json` e `firestore.rules` versionados, mas ignora `.firebaserc`, caches e credenciais locais. No ambiente responsável pela publicação:

```powershell
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use <id-do-projeto>
npx -y firebase-tools@latest deploy --only hosting,firestore:rules
```

Revise as regras antes de uma liberação ampla e valide os três perfis depois de cada alteração de autorização.

## Aplicativo instalável (PWA)

O sistema é publicado como PWA, sem custo adicional no Firebase:

- `public/manifest.webmanifest` define nome, cores e ícones do app.
- `public/sw.js` guarda as telas, estilos, scripts e o SDK do Firebase para abrir o app sem internet. Os arquivos do próprio sistema são sempre buscados na rede primeiro, então cada publicação chega aos aparelhos sem ação do usuário.
- `public/src/config/firebase.js` ativa o cache local do Firestore: as telas mostram os últimos dados carregados quando não há rede, e as alterações feitas offline são enviadas quando a conexão volta.

Para instalar no Android, abra `https://manutencaoseduc-33d37.firebaseapp.com` no Chrome e toque em **Instalar app** (ou menu **⋮ > Adicionar à tela inicial**). Instale sempre pelo domínio `firebaseapp.com`, que é o usado pelo login.

A sessão fica salva no aparelho: quem já entrou abre o app direto no painel do seu cargo, sem passar pelo botão de login. Para trocar de conta, use **Sair** no painel.

Ao criar, renomear ou remover arquivos de `public/`, atualize a lista `ARQUIVOS_APP` em `public/sw.js` e incremente `VERSAO`; um arquivo listado que não existir impede a instalação do service worker.

Limitações do modo offline: o login Google exige internet, e uma gravação feita sem rede fica pendente até a conexão voltar, por isso a tela pode continuar aguardando a confirmação nesse intervalo.

## Diagnóstico

- **Login retorna à página inicial:** confira o documento `usuarios/{uid}` e o valor de `cargo`.
- **Permissão negada ao carregar demandas:** confira as regras do Firestore e se a consulta permitida corresponde ao cargo.
- **Popup do Google bloqueado:** autorize popups e confirme o domínio no Firebase Authentication.
- **App não oferece instalação ou mostra telas antigas:** nas ferramentas do desenvolvedor, em **Application > Service workers**, confirme que `sw.js` está ativo; se necessário, use **Unregister** e recarregue a página.
- **Demanda TI não aparece:** confirme que `tipo_manutencao` contém exatamente `TI` e que o status está `Pendente` ou `Em Andamento`.
