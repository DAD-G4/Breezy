# 🚀 Déploiement Breezy sur VPS — `breezy.mxriine-mx.dev`

> Runbook destiné à un agent (ou un humain) qui déploie l'application **en production** sur un VPS, derrière le domaine **`breezy.mxriine-mx.dev`** en **HTTPS**.
> Tout tourne en conteneurs via `docker compose`. Suivre les étapes **dans l'ordre**.

---

## 0. Architecture (rappel)

Tout passe par **une seule entrée publique : nginx (443/HTTPS)**, qui sert :

| Chemin public | Cible interne |
|---|---|
| `https://breezy.mxriine-mx.dev/` | `frontend` (Next.js, port 3000) |
| `https://breezy.mxriine-mx.dev/api/*` | 8 microservices (auth, user, post, tag, notification, dm, media, moderation) |
| `https://breezy.mxriine-mx.dev/uploads/*` | `media-service` (fichiers uploadés) |

Bases de données **internes** (jamais exposées publiquement) : PostgreSQL + MongoDB.
Un service `seed` (one-shot) crée des comptes de démo au premier démarrage.

**Point critique** : en `NODE_ENV=production`, les cookies d'auth sont posés avec l'option `secure` → ils ne transitent **que sur HTTPS**. Le TLS est donc **obligatoire**, pas optionnel.

---

## 1. Prérequis

- Un VPS Linux (Ubuntu 22.04+ recommandé), accès `root`/`sudo`.
- Ports **80** et **443** ouverts au pare-feu (UFW : `ufw allow 80,443/tcp`).
- Le domaine **`breezy.mxriine-mx.dev`** dont on contrôle le DNS.

### 1.1 DNS
Créer un enregistrement **A** :
```
breezy.mxriine-mx.dev.   A   <IP_PUBLIQUE_DU_VPS>
```
Vérifier la propagation : `dig +short breezy.mxriine-mx.dev` doit renvoyer l'IP du VPS **avant** de demander le certificat TLS.

### 1.2 Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"   # puis se reconnecter
docker --version && docker compose version
```

---

## 2. Récupérer le code

```bash
cd /opt
git clone https://github.com/DAD-G4/Breezy.git
cd Breezy
git checkout fix/multi-issue-cleanup   # ou la branche/release à déployer
```

---

## 3. Variables d'environnement de production

Créer le fichier **`.env`** à la racine (il est gitignoré) :

```bash
cat > .env <<'EOF'
# --- PostgreSQL ---
POSTGRES_DB=breezy
POSTGRES_USER=breezy
POSTGRES_PASSWORD=__CHANGER_mot_de_passe_fort__

# --- MongoDB (interne) ---
# (l'URI est construite dans docker-compose à partir de POSTGRES_DB)

# --- Auth ---
# Générer un secret fort :  openssl rand -hex 48
JWT_SECRET=__CHANGER_openssl_rand_hex_48__

# --- Production ---
NODE_ENV=production

# --- Front-end (inliné au BUILD de l'image frontend) ---
# Même origine que le site → l'API est sur le même domaine.
NEXT_PUBLIC_API_URL=https://breezy.mxriine-mx.dev/api

# --- Seed (mot de passe des comptes de démo) ---
SEED_PASSWORD=__CHANGER_si_demo_publique__
EOF
```

Générer les secrets :
```bash
sed -i "s|__CHANGER_openssl_rand_hex_48__|$(openssl rand -hex 48)|" .env
sed -i "s|__CHANGER_mot_de_passe_fort__|$(openssl rand -hex 16)|" .env
```

> ⚠️ `NEXT_PUBLIC_API_URL` est **inliné au moment du build** de l'image frontend. Si on le change, il faut **rebuilder** l'image frontend (`docker compose build frontend`).

> ⚠️ `NODE_ENV=production` doit être passé aux **services** (il l'est via le bloc `environment` du compose de prod ci-dessous). C'est ce qui active les cookies `secure`.

---

## 4. Certificat TLS (Let's Encrypt / Certbot)

On obtient le certificat **sur l'hôte** en mode standalone (port 80 libre quelques secondes), puis on le **monte** dans le conteneur nginx.

```bash
sudo apt-get update && sudo apt-get install -y certbot

# S'assurer que rien n'écoute sur le port 80 pendant l'émission :
docker compose down 2>/dev/null || true

sudo certbot certonly --standalone \
  -d breezy.mxriine-mx.dev \
  --non-interactive --agree-tos -m admin@mxriine-mx.dev
```

Les certificats sont alors dans :
```
/etc/letsencrypt/live/breezy.mxriine-mx.dev/fullchain.pem
/etc/letsencrypt/live/breezy.mxriine-mx.dev/privkey.pem
```

### Renouvellement automatique
```bash
# Test à blanc
sudo certbot renew --dry-run
# Cron : renouvelle + recharge nginx du conteneur (3h du matin)
echo '0 3 * * * certbot renew --quiet --deploy-hook "docker exec breezy-nginx nginx -s reload"' | sudo tee /etc/cron.d/breezy-certbot
```

---

## 5. Configuration nginx de production

Remplacer le contenu de **`nginx.conf`** par la version ci-dessous (ajoute : redirection 80→443, TLS, `server_name`, proxy du frontend sur `/`, en-têtes CORS pointant vers le domaine). **Les blocs `location /api/*` et `/uploads` sont conservés à l'identique** ; on ajoute le serveur 443 et le proxy `/`.

```nginx
events { worker_connections 1024; }

http {
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=20r/s;

    # ---- HTTP : redirection vers HTTPS + challenge ACME ----
    server {
        listen 80;
        server_name breezy.mxriine-mx.dev;

        location /.well-known/acme-challenge/ { root /var/www/certbot; }
        location / { return 301 https://$host$request_uri; }
    }

    # ---- HTTPS ----
    server {
        listen 443 ssl;
        http2 on;
        server_name breezy.mxriine-mx.dev;

        ssl_certificate     /etc/letsencrypt/live/breezy.mxriine-mx.dev/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/breezy.mxriine-mx.dev/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        resolver 127.0.0.11 valid=10s ipv6=off;

        # CORS (même origine en prod → surtout pour cohérence)
        add_header Access-Control-Allow-Origin "https://breezy.mxriine-mx.dev" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Max-Age 86400 always;
        if ($request_method = 'OPTIONS') { return 204; }

        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Strict-Transport-Security "max-age=31536000" always;

        client_max_body_size 50M;

        # ---- API (un location par service) ----
        location /api/auth {
            limit_req zone=auth burst=20 nodelay;
            set $u auth-service:3001; proxy_pass http://$u;
            proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        location /api/users        { limit_req zone=general burst=100 nodelay; set $u user-service:3002;         proxy_pass http://$u; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
        location /api/posts        { limit_req zone=general burst=100 nodelay; set $u post-service:3003;         proxy_pass http://$u; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
        location /api/tags         { limit_req zone=general burst=100 nodelay; set $u tag-service:3004;          proxy_pass http://$u; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
        location /api/notifications{ limit_req zone=general burst=100 nodelay; set $u notification-service:3005; proxy_pass http://$u; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
        location /api/dms          { limit_req zone=general burst=100 nodelay; set $u dm-service:3006;           proxy_pass http://$u; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
        location /api/media        { limit_req zone=general burst=100 nodelay; set $u media-service:3007;        proxy_pass http://$u; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; client_max_body_size 50M; }
        location /api/moderation   { limit_req zone=general burst=100 nodelay; set $u moderation-service:3008;   proxy_pass http://$u; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
        location /api/health       { set $u auth-service:3001; proxy_pass http://$u; proxy_set_header Host $host; }

        # ---- Médias uploadés ----
        location /uploads {
            set $u media-service:3007; proxy_pass http://$u;
        }

        # ---- Frontend Next.js (tout le reste) ----
        location / {
            set $u frontend:3000; proxy_pass http://$u;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

---

## 6. Override Docker Compose de production

Créer **`docker-compose.prod.yml`** à la racine. Il : passe `NODE_ENV=production` à tous les services, monte les certificats + le webroot ACME dans nginx, ouvre le 443, et **n'expose plus** le frontend directement (il passe par nginx).

```yaml
services:
  nginx:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - certbot_webroot:/var/www/certbot

  frontend:
    ports: []          # plus d'accès direct : tout passe par nginx
    build:
      context: ./front
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}

  auth-service:         { environment: { NODE_ENV: production } }
  user-service:         { environment: { NODE_ENV: production } }
  post-service:         { environment: { NODE_ENV: production } }
  tag-service:          { environment: { NODE_ENV: production } }
  notification-service: { environment: { NODE_ENV: production } }
  dm-service:           { environment: { NODE_ENV: production } }
  media-service:        { environment: { NODE_ENV: production } }
  moderation-service:   { environment: { NODE_ENV: production } }
  seed:                 { environment: { NODE_ENV: production } }

volumes:
  certbot_webroot:
```

> ⚠️ Le bloc `environment` d'un service en override **remplace** celui du fichier de base. Si après coup l'auth/DB casse, vérifier que les variables `POSTGRES_URI`, `MONGO_URI`, `JWT_SECRET`, `PORT` du `docker-compose.yml` de base sont toujours présentes pour chaque service (Compose **fusionne** les maps `environment` — normalement OK — mais vérifier avec `docker compose -f docker-compose.yml -f docker-compose.prod.yml config`).

Toutes les commandes ci-dessous utilisent **les deux fichiers** :
```bash
alias dc='docker compose -f docker-compose.yml -f docker-compose.prod.yml'
```

---

## 7. Build & lancement

```bash
# Valider la config fusionnée (NODE_ENV, NEXT_PUBLIC_API_URL, volumes certs…)
dc config | less

# Build (le frontend est rebuildé avec NEXT_PUBLIC_API_URL de prod)
dc build

# Démarrage
dc up -d
```

Le service `seed` crée les comptes de démo au premier démarrage (idempotent).
Comptes principaux : `mxriine` (admin), `maverick` (moderator), `doggo` (user) — mot de passe = `SEED_PASSWORD`.

---

## 8. Vérification

```bash
# Tous "running" sauf seed = "exited (0)"
dc ps

# Santé API (doit répondre 200, postgres connected)
curl -s https://breezy.mxriine-mx.dev/api/health

# Le site répond
curl -sI https://breezy.mxriine-mx.dev/ | head -1     # HTTP/2 200

# Auth de bout en bout (cookies posés, secure)
curl -s -i -X POST https://breezy.mxriine-mx.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"mxriine@breezy.dev\",\"password\":\"$SEED_PASSWORD\"}" | grep -i "set-cookie\|HTTP"
```

Puis ouvrir **https://breezy.mxriine-mx.dev** dans un navigateur et se connecter.

---

## 9. Exploitation / maintenance

```bash
dc logs -f --tail=50 auth-service     # logs d'un service
dc restart user-service               # redémarrer un service
dc pull && dc build && dc up -d       # mettre à jour après un git pull
dc down                               # tout arrêter (conserve les volumes/données)
```

Mise à jour du code :
```bash
git pull
dc build
dc up -d
```

Sauvegarde des données (volumes Docker `breezy_postgres_data`, `breezy_mongo_data`, `breezy_media_uploads`) :
```bash
docker run --rm -v breezy_postgres_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/pg-$(date +%F).tgz -C /data .
```

---

## 10. Checklist sécurité prod

- [ ] `JWT_SECRET` = aléatoire fort (≥ 48 octets), jamais commité.
- [ ] `POSTGRES_PASSWORD` fort, jamais commité.
- [ ] `NODE_ENV=production` actif (cookies `secure`).
- [ ] HTTPS valide (certificat Let's Encrypt) + renouvellement cron en place.
- [ ] Postgres/Mongo **non** exposés publiquement (ils sont bind `127.0.0.1` dans le compose de base — vérifier qu'aucun override ne les publie).
- [ ] Frontend non exposé en direct (port 3000 fermé ; accès via nginx).
- [ ] `SEED_PASSWORD` changé si l'instance est publique (sinon comptes de démo triviaux).
- [ ] Pare-feu : seuls 80/443 (+ SSH) ouverts.
- [ ] `HSTS` activé (présent dans le nginx ci-dessus).

---

## 11. Dépannage

| Symptôme | Cause probable | Action |
|---|---|---|
| Login renvoie 200 mais on est déconnecté au refresh | Cookies `secure` non transmis (pas de HTTPS) ou domaine ≠ | Vérifier `NODE_ENV=production` **et** accès en `https://` sur le bon domaine |
| `502 Bad Gateway` au démarrage | Services encore en train de synchroniser la base | Attendre ~20-30 s puis réessayer ; `dc logs auth-service` |
| Images uploadées en 404 | `location /uploads` absent ou media-service down | Vérifier nginx + `dc ps media-service` |
| `certbot` échoue | DNS pas encore propagé ou port 80 occupé | `dig +short breezy.mxriine-mx.dev` ; `dc down` avant l'émission |
| Le front affiche l'ancienne API | `NEXT_PUBLIC_API_URL` changé sans rebuild | `dc build frontend && dc up -d frontend` |
| `Set-Cookie` absent en prod | Domaines différents front/api | Tout servir sous **un seul** domaine (cette doc le fait) |

---

## 12. Notes pour l'agent qui déploie

- Le code est un **monorepo npm workspaces** : les images se buildent depuis la racine (`context: .`) sauf le frontend (`context: ./front`).
- Ne **pas** committer `.env` ni les certificats.
- Si tu modifies `nginx.conf`, recharge sans tout casser : `docker exec breezy-nginx nginx -t && docker exec breezy-nginx nginx -s reload`.
- Le **temps-réel** (notifs/messages/présence) est en *polling* (~25 s), pas en WebSocket : c'est normal, pas un bug de déploiement.
- En cas de doute sur la fusion des deux compose : `dc config` est la source de vérité de ce qui sera réellement lancé.
