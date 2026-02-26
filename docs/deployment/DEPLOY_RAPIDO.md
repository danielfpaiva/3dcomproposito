# 🚀 Deploy Rápido das Edge Functions

## 📋 Passo-a-Passo

### 1. Instalar Supabase CLI (se ainda não tiver)

**Opção A - Via npm (recomendado):**
```bash
npm install -g supabase
```

**Opção B - Via Scoop (Windows):**
```powershell
scoop install supabase
```

**Verificar instalação:**
```bash
supabase --version
```

---

### 2. Login na Supabase

```bash
supabase login
```

Vai abrir o browser para autenticar. Faz login com a conta que tem acesso ao projeto.

---

### 3. Ligar ao Projeto

```bash
cd c:\wamp64\www\impact-print-connect
supabase link --project-ref bsbqmqfznkozqagdhvoj
```

Vai pedir a **database password**. Encontras em:
https://supabase.com/dashboard/project/bsbqmqfznkozqagdhvoj/settings/database

---

### 4. Obter a SERVICE_ROLE_KEY

1. Vai a: https://supabase.com/dashboard/project/bsbqmqfznkozqagdhvoj/settings/api
2. Copia a **service_role** key (⚠️ É SECRETA!)
3. Guarda-a temporariamente num bloco de notas

---

### 5. Configurar Secrets

```bash
supabase secrets set SUPABASE_URL=https://bsbqmqfznkozqagdhvoj.supabase.co

supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(Substitui `eyJhbGci...` pela service_role key que copiaste)

---

### 6. Deploy da Função

```bash
supabase functions deploy contributor-auth
```

Deve mostrar algo como:
```
Deploying function contributor-auth...
Function URL: https://bsbqmqfznkozqagdhvoj.supabase.co/functions/v1/contributor-auth
```

---

### 7. (Opcional) Deploy da outra função

```bash
supabase functions deploy notify-part-allocated
```

---

## ✅ Testar

### Teste 1: Diretamente via curl

```bash
curl -X POST https://bsbqmqfznkozqagdhvoj.supabase.co/functions/v1/contributor-auth ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzYnFtcWZ6bmtvenFhZ2Rodm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTMwMTcsImV4cCI6MjA4NjgyOTAxN30.6cyFvE8lk7251ZMZqCveCZsiZ8ZzSbxSWM7whk1vlFo" ^
  -d "{\"email\":\"monica.s.antunes@hotmail.com\",\"action\":\"check\"}"
```

**Resultado esperado:**
```json
{"exists":true,"has_password":false,"name":"Moica"}
```

### Teste 2: No Site

1. Vai a: https://3dcomproposito.vercel.app/portal
2. Introduz: `monica.s.antunes@hotmail.com`
3. Clica "Continuar"
4. Deve aparecer: "Defina uma password para aceder ao portal" ✅

---

## 🔍 Ver Logs

```bash
supabase functions logs contributor-auth --tail
```

Ou no dashboard:
https://supabase.com/dashboard/project/bsbqmqfznkozqagdhvoj/functions

---

## 🆘 Problemas Comuns

### "command not found: supabase"
- CLI não instalado → `npm install -g supabase`

### "Failed to link project"
- Password incorreta → Verifica em Settings → Database

### "Function deployment failed"
- Verifica que estás na pasta do projeto
- `cd c:\wamp64\www\impact-print-connect`

### "Secrets not found"
- Executa os comandos `supabase secrets set` novamente
- Verifica: `supabase secrets list`

---

## 📝 Comandos Úteis

```bash
# Ver funções deployadas
supabase functions list

# Ver secrets configurados
supabase secrets list

# Ver logs em tempo real
supabase functions logs contributor-auth --tail

# Apagar uma função
supabase functions delete contributor-auth
```

---

**Pronto! Segue os passos acima e a função vai estar a funcionar!** 🎉
