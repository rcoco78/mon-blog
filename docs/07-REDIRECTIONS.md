# 🔄 Configuration des Redirections - corentinrobert.fr

## ⚠️ Problème de Boucle de Redirection

### Symptôme
- `ERR_TOO_MANY_REDIRECTS` sur `www.corentinrobert.fr`
- Boucle : `corentinrobert.fr` → `www.corentinrobert.fr` → `corentinrobert.fr`

### Cause
Vercel redirige automatiquement `corentinrobert.fr` vers `www.corentinrobert.fr` (probablement via configuration DNS ou Vercel), alors que notre `vercel.json` redirige `www` → `non-www`.

## ✅ Solution

### Option 1 : Configuration Vercel (Recommandé)

Dans le dashboard Vercel :
1. **Settings** → **Domains**
2. Vérifier que `corentinrobert.fr` est le domaine **principal**
3. Si `www.corentinrobert.fr` est ajouté :
   - Soit le **supprimer** complètement
   - Soit le configurer pour rediriger vers `corentinrobert.fr` (pas l'inverse)

### Option 2 : Configuration DNS (OVH)

Si vous gardez les deux domaines :
1. **Domaine racine** (`corentinrobert.fr`) : A record vers IP Vercel
2. **www** (`www.corentinrobert.fr`) : CNAME vers `corentinrobert.fr`
3. Laisser Vercel gérer la redirection via le dashboard

### Option 3 : Vercel.json uniquement

Le `vercel.json` actuel contient :
- Redirection HTTP → HTTPS ✅
- Redirection www → non-www ✅

**Important** : Si Vercel redirige automatiquement non-www → www, il faut désactiver cette redirection dans le dashboard Vercel.

## 🔍 Vérification

```bash
# Tester les redirections
curl -I https://corentinrobert.fr
curl -I https://www.corentinrobert.fr
curl -I http://corentinrobert.fr
curl -I http://www.corentinrobert.fr
```

**Résultat attendu** :
- `corentinrobert.fr` → 200 OK (pas de redirection)
- `www.corentinrobert.fr` → 301/308 vers `corentinrobert.fr`
- `http://*` → 301/308 vers `https://corentinrobert.fr`

## 📝 Configuration Actuelle

```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "header",
          "key": "x-forwarded-proto",
          "value": "http"
        }
      ],
      "destination": "https://corentinrobert.fr/$1",
      "permanent": true
    },
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "host",
          "key": "host",
          "value": "www.corentinrobert.fr"
        }
      ],
      "destination": "https://corentinrobert.fr/$1",
      "permanent": true
    }
  ]
}
```

## 🚨 Action Requise

**Vérifier dans le dashboard Vercel** :
- Settings → Domains → `corentinrobert.fr`
- S'assurer qu'il n'y a pas de redirection automatique vers www
- Si `www.corentinrobert.fr` est présent, le supprimer ou le configurer correctement


