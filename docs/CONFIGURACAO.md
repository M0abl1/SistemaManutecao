# Configuração e implantação

## Requisitos

- Projeto no Firebase com Authentication e Cloud Firestore.
- Login Google habilitado em **Authentication > Sign-in method**.
- Domínio da aplicação autorizado em **Authentication > Settings > Authorized domains**.
- Navegador moderno e servidor HTTP para desenvolvimento local.

## Configuração da aplicação

As credenciais públicas do aplicativo Web ficam em `src/config/firebase.js`. Copie os valores exibidos em **Project settings > Your apps > Web app**. Não adicione ao projeto arquivos de conta de serviço, chaves privadas ou credenciais do Admin SDK.

## Primeiro acesso

1. Inicie a aplicação por HTTP e autentique uma conta Google.
2. O primeiro acesso cria `usuarios/{uid}` com cargo `tecnico`.
3. No Console do Firestore, altere o campo `cargo` do administrador para `supervisor`.
4. Para um profissional de TI, defina o campo como `ti`.

Valores de cargo aceitos pela interface:

| Valor | Destino | Escopo |
| --- | --- | --- |
| `supervisor` | Painel do supervisor | Todas as demandas e unidades |
| `tecnico` | Painel técnico | Demandas ativas da fila técnica |
| `ti` | Painel técnico | Somente demandas ativas com `tipo_manutencao = "TI"` |
| `pendente` | Tela de espera | Sem acesso operacional até liberação |

Os valores são sensíveis a maiúsculas e minúsculas. Use exatamente `supervisor`, `tecnico` e `ti`.

## Regras do Firestore

A filtragem da interface melhora a experiência, mas não é uma barreira de segurança. As regras publicadas no Firestore devem, no mínimo:

- permitir leitura do próprio documento em `usuarios/{uid}`;
- permitir ao supervisor ler e alterar todas as demandas;
- permitir ao cargo TI ler e atualizar apenas documentos cujo `tipo_manutencao` seja `TI`;
- impedir o cargo TI de alterar `tipo_manutencao` para contornar a restrição;
- restringir a atualização técnica aos campos operacionais, como `status`, `observacao_tecnico` e `concluido_em`;
- permitir que apenas supervisores cadastrem unidades e novas demandas.

Após publicar regras novas, valide os três perfis no Rules Playground ou no Emulator Suite. A consulta do cargo TI já inclui `where("tipo_manutencao", "==", "TI")`, condição necessária para regras que limitam a leitura por categoria.

## Execução local

Sirva a raiz do repositório por HTTP. Exemplos: Live Server no VS Code ou qualquer servidor estático. A abertura direta por `file://` não funciona corretamente porque a aplicação usa módulos ES.

## Implantação

O repositório ignora `.firebaserc`, `firebase.json` e `firestore.rules`; portanto, a configuração do Firebase CLI é local. No ambiente responsável pela publicação:

```powershell
firebase login
firebase use <id-do-projeto>
firebase deploy --only hosting
```

Se as regras forem mantidas fora deste repositório, publique-as e registre a versão usada no processo operacional antes de liberar a aplicação.

## Diagnóstico

- **Login retorna à página inicial:** confira o documento `usuarios/{uid}` e o valor de `cargo`.
- **Permissão negada ao carregar demandas:** confira as regras do Firestore e se a consulta permitida corresponde ao cargo.
- **Popup do Google bloqueado:** autorize popups e confirme o domínio no Firebase Authentication.
- **Demanda TI não aparece:** confirme que `tipo_manutencao` contém exatamente `TI` e que o status está `Pendente` ou `Em Andamento`.
