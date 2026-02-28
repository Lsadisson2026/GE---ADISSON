# Deploy na Vercel — Guia Completo

## Arquivos que você precisa adicionar/substituir no projeto

### 1. Adicionar na raiz do projeto:
- `vercel.json` → arquivo novo
- `vite.config.ts` → substituir o atual

### 2. Criar pasta e arquivo:
```
api/
└── import-pdf.ts   ← arquivo novo
```

### 3. Remover do projeto (não precisam ir para a Vercel):
- `server.ts` — substituído pela função serverless em `api/`

---

## Passo a Passo na Vercel

### Deploy do Cliente 1
1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe o repositório Git do projeto
3. Em **Environment Variables**, adicione:
   ```
   GEMINI_API_KEY        = sua_chave_gemini
   VITE_SUPABASE_URL     = https://drdyxlgcayurzidzgywj.supabase.co
   VITE_SUPABASE_ANON_KEY = sb_publishable_FjyHn0zdfFqDNGxT2VI7KA_4SJhGnGO
   ```
4. **Build Command:** `vite build`
5. **Output Directory:** `dist`
6. Clique em **Deploy**

---

### Deploy do Cliente 2
1. Na Vercel → **Add New Project** novamente
2. Importe o **mesmo repositório Git**
3. Em **Environment Variables**, adicione:
   ```
   GEMINI_API_KEY        = sua_chave_gemini
   VITE_SUPABASE_URL     = https://oonwfmctbikkltadxitp.supabase.co
   VITE_SUPABASE_ANON_KEY = sb_publishable_uJ79MkDrw1OGxub6QSPt1w_KjW0Hs83
   ```
4. Mesmos **Build Command** e **Output Directory**
5. Clique em **Deploy**

> Você terá duas URLs diferentes (ex: `cliente1.vercel.app` e `cliente2.vercel.app`)
> apontando para o mesmo código, mas bancos de dados separados.

---

## Variáveis de Ambiente — Resumo

| Variável | Onde é usada |
|---|---|
| `GEMINI_API_KEY` | Serverless function `api/import-pdf.ts` |
| `VITE_SUPABASE_URL` | Frontend (Vite injeta no build) |
| `VITE_SUPABASE_ANON_KEY` | Frontend (Vite injeta no build) |

> ⚠️ Variáveis com prefixo `VITE_` são embutidas no bundle do frontend.
> `GEMINI_API_KEY` sem prefixo fica **apenas no servidor** (seguro).

---

## Verificar se funcionou

Após o deploy, teste:
1. Abrir a URL → login deve funcionar (Supabase conectado)
2. Acessar `/api/import-pdf` via POST → deve retornar 400 "Texto não fornecido" (confirma que a função está ativa)
