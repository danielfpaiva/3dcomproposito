# 🚀 Deploy de Edge Functions para Nova Supabase

## Funções a Deployar:
1. `contributor-auth` - Autenticação de voluntários por email/password
2. `notify-part-allocated` - Notificações quando peças são atribuídas

---

## 📋 Pré-requisitos:

1. **Supabase CLI instalado**
2. **Login na Supabase CLI**
3. **Link do projeto**

---

## 🔧 Passo-a-Passo:

### 1. Instalar Supabase CLI

**Windows (PowerShell como Admin):**
```powershell
scoop install supabase
```

**OU via npm:**
```bash
npm install -g supabase
```

### 2. Login na Supabase

```bash
supabase login
```

Vai abrir o browser para autenticar.

### 3. Link ao Projeto

```bash
cd c:\wamp64\www\impact-print-connect
supabase link --project-ref bsbqmqfznkozqagdhvoj
```

Vai pedir a **database password** (da nova Supabase).

### 4. Deploy das Funções

```bash
supabase functions deploy contributor-auth
supabase functions deploy notify-part-allocated
```

### 5. Configurar Secrets (Environment Variables)

As Edge Functions precisam destas variáveis:

```bash
supabase secrets set SUPABASE_URL=https://bsbqmqfznkozqagdhvoj.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY da nova Supabase]
```

**Para obter a SERVICE_ROLE_KEY:**
1. Vai a: https://supabase.com/dashboard/project/bsbqmqfznkozqagdhvoj/settings/api
2. Copia a **service_role key** (⚠️ É SECRETA!)

---

## ✅ Validação

Depois de deployar, testa:

### Teste 1: Função contributor-auth

```bash
curl -X POST https://bsbqmqfznkozqagdhvoj.supabase.co/functions/v1/contributor-auth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -d '{"email":"monica.s.antunes@hotmail.com","action":"check"}'
```

**Resultado esperado:**
```json
{
  "exists": true,
  "has_password": false,
  "name": "Moica"
}
```

### Teste 2: No Site em Produção

1. Vai a: https://3dcomproposito.vercel.app/portal
2. Introduz: `monica.s.antunes@hotmail.com`
3. Clica "Continuar"
4. Deve aparecer: "Defina uma password" ✅

---

## 🔍 Ver Logs das Funções

```bash
supabase functions logs contributor-auth
```

Ou no dashboard:
https://supabase.com/dashboard/project/bsbqmqfznkozqagdhvoj/functions/contributor-auth/logs

---

## 🆘 Problemas Comuns

### "supabase: command not found"
- CLI não instalado → Instala com scoop ou npm

### "Project not linked"
- Executa: `supabase link --project-ref bsbqmqfznkozqagdhvoj`

### "Permission denied"
- Verifica que tens permissões de Owner no projeto Supabase

### "Function returns 500"
- Verifica secrets: `supabase secrets list`
- Verifica logs: `supabase functions logs contributor-auth`

---

## 📝 Notas

- As funções são deployadas na **edge network** da Supabase (Deno runtime)
- Código em TypeScript/JavaScript moderno
- Escalam automaticamente
- Zero custo no free tier

---

**Pronto para deployar?** Segue os passos acima! 🚀
