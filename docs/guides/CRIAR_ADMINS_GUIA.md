# 🔐 Guia: Criar Admins na Nova Supabase

## Admins a Criar:
1. **Ana** - anapsousa@gmail.com
2. **Gabriel Gomes** - sempnaproa@gmail.com
3. **Helder Ribeiro** - helder.ribeiro1@gmail.com

---

## 📝 Método 1: Via Interface Supabase (RECOMENDADO)

### Para cada admin, faz o seguinte:

#### Passo 1: Criar User no Authentication

1. Vai a: https://supabase.com/dashboard/project/bsbqmqfznkozqagdhvoj/auth/users

2. Clica em **"Add user"** → **"Create new user"**

3. Preenche:
   - **Email:** [email do admin]
   - **Password:** [cria uma password temporária forte]
   - **Auto Confirm User:** ✅ **IMPORTANTE: Marca esta opção!**

4. Clica em **"Create user"**

5. **COPIA o UUID** do user que foi criado (aparece na lista)

#### Passo 2: Verificar se Profile já Existe

Vai ao **SQL Editor** e executa:

```sql
-- Verificar se já existe profile para este email
SELECT id, email, full_name FROM profiles WHERE email = '[email do admin]';
```

**Se JÁ EXISTIR profile:**
- O profile foi migrado com um UUID diferente
- Precisas APAGAR o profile antigo e criar um novo com o UUID do auth.users

**Se NÃO EXISTIR:**
- Vais criar o profile de raiz

#### Passo 3: Criar/Atualizar Profile e Role

**Opção A: Se o profile JÁ EXISTE (foi migrado):**

```sql
-- 1. Apagar user_role antigo
DELETE FROM user_roles WHERE user_id = (
  SELECT id FROM profiles WHERE email = '[email do admin]'
);

-- 2. Apagar profile antigo
DELETE FROM profiles WHERE email = '[email do admin]';

-- 3. Criar novo profile com UUID do auth.users
INSERT INTO profiles (id, email, full_name, created_at, updated_at)
VALUES (
  '[UUID do auth.users copiado]',
  '[email do admin]',
  '[Nome do admin]',
  now(),
  now()
);

-- 4. Criar user_role
INSERT INTO user_roles (user_id, role)
VALUES ('[UUID do auth.users copiado]', 'admin');
```

**Opção B: Se o profile NÃO EXISTE:**

```sql
-- 1. Criar profile
INSERT INTO profiles (id, email, full_name, created_at, updated_at)
VALUES (
  '[UUID do auth.users copiado]',
  '[email do admin]',
  '[Nome do admin]',
  now(),
  now()
);

-- 2. Criar user_role
INSERT INTO user_roles (user_id, role)
VALUES ('[UUID do auth.users copiado]', 'admin');
```

---

## 🔥 Método 2: Script SQL Rápido (AVANÇADO)

Se preferires, podes executar tudo de uma vez. Mas preciso que me digas:
- Qual a password temporária que queres usar para todos? (vão poder alterar depois)

Então crio um script que:
1. Cria os 3 users no auth.users
2. Atualiza os profiles
3. Atualiza os user_roles

**NOTA:** Este método requer acesso ao schema `auth` com permissões elevadas.

---

## ✅ Validação

Depois de criar cada admin, testa:

1. Vai a: https://3dcomproposito.vercel.app/auth

2. Faz login com:
   - Email: [email do admin]
   - Password: [password temporária criada]

3. Deve redirecionar para `/admin` e mostrar o dashboard! ✅

4. **Pede ao admin para alterar a password** depois do primeiro login!

---

## 📊 Verificar que Tudo Está OK

Executa no SQL Editor:

```sql
-- Deve mostrar 3 admins
SELECT
  au.email,
  p.full_name,
  ur.role,
  au.created_at
FROM auth.users au
JOIN profiles p ON p.id = au.id
JOIN user_roles ur ON ur.user_id = au.id
WHERE ur.role = 'admin'
ORDER BY au.email;
```

**Esperado:** 3 linhas com Ana, Gabriel e Helder como admin.

---

## 🔒 Segurança

- As passwords temporárias devem ser **fortes** (mínimo 8 caracteres, letras + números)
- Envia as passwords de forma **segura** (não por email desprotegido)
- Pede aos admins para **alterarem a password** após primeiro login
- Ativa **2FA** se possível (Supabase suporta)

---

## 🆘 Problemas Comuns

### "Email already in use"
- O user já existe no auth.users
- Apaga-o primeiro: Authentication → Users → Clica no user → Delete

### "violates foreign key constraint"
- O UUID no profiles não corresponde ao auth.users
- Verifica que copiaste o UUID correto do user criado

### "Login failed: Invalid login credentials"
- Password incorreta
- User não foi confirmado (certifica-te que marcaste "Auto Confirm User")

---

**Qual método preferes? Interface (Método 1) ou Script SQL (Método 2)?**
