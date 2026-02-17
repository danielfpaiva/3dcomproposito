# PrintImpact Connect

Aplicação web que coordena voluntários com impressoras 3D para fabricar peças de cadeiras de rodas para crianças em Portugal.

**URL**: https://www.3dcomproposito.pt

## Tech Stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Como correr localmente

```sh
# Clonar o repositório
git clone <YOUR_GIT_URL>

# Entrar na pasta do projeto
cd <YOUR_PROJECT_NAME>

# Instalar dependências
npm i

# Iniciar servidor de desenvolvimento
npm run dev
```

## Notificar voluntários quando lhes é atribuída uma peça

A app **não** usa uma API de email. Após atribuires uma peça a um voluntário:

- **No diálogo de alocação:** Após clicar em "Atribuir", o diálogo mostra o **link do portal** do voluntário. Usa **"Copiar link"** para copiar e **"Abrir email"** para abrir o cliente de email com uma mensagem pré-preenchida.
- **Na lista de contribuidores:** Cada linha tem um **ícone de link** (🔗). Clica para copiar o link do portal desse voluntário.

Formato do link do portal: **https://www.3dcomproposito.pt/portal?token=...**

## Deploy

O projeto está deployed no Vercel. Push para o repositório despoleta deploy automático.

- Domínio: https://www.3dcomproposito.pt
