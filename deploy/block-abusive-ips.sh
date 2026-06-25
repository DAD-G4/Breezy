#!/usr/bin/env bash
# =============================================================================
#  Réponse à incident — création massive de comptes / posts
#  À exécuter EN ROOT sur le VPS (breezy.mxrine-mz.dev / 91.134.133.186).
#
#  Ce que fait le script :
#    1. Lit les logs nginx HÔTE (vraie IP client en 1er champ).
#    2. Compte par IP les POST /api/auth/register et POST /api/posts.
#    3. Affiche le classement (preuve).
#    4. Bloque AU PARE-FEU (tous ports, tous sites hébergés) les IP au-dessus
#       du seuil — sauf ta propre IP SSH, localhost et les plages privées.
#
#  Usage :
#    sudo bash deploy/block-abusive-ips.sh          # analyse + blocage
#    sudo DO_BLOCK=0 bash deploy/block-abusive-ips.sh   # analyse SEULE (aucun blocage)
# =============================================================================
set -o pipefail

# ---- Réglages (ajustables) -------------------------------------------------
REG_THRESHOLD="${REG_THRESHOLD:-20}"    # inscriptions depuis une IP => abusif
POST_THRESHOLD="${POST_THRESHOLD:-40}"  # créations de post depuis une IP => abusif
DO_BLOCK="${DO_BLOCK:-1}"               # 1 = bloque ; 0 = analyse seule
LOG_GLOB="/var/log/nginx/*access*.log"  # logs hôte (rotés .1 et .gz gérés)

# ---- IP à ne JAMAIS bloquer (anti auto-lockout) ----------------------------
MY_IP="$(echo "${SSH_CONNECTION:-}" | awk '{print $1}')"
echo ">> Ton IP SSH actuelle (jamais bloquée) : ${MY_IP:-inconnue}"
echo ">> Seuils : register >= ${REG_THRESHOLD}  OU  posts >= ${POST_THRESHOLD}   (DO_BLOCK=${DO_BLOCK})"

# ---- Lecture de tous les logs (plain + rotés + gz) -------------------------
read_logs() {
  local f
  for f in $LOG_GLOB $LOG_GLOB.1; do [ -f "$f" ] && cat "$f"; done 2>/dev/null
  for f in $LOG_GLOB.*.gz; do [ -f "$f" ] && zcat "$f"; done 2>/dev/null
}

is_safe_ip() {  # 0 (vrai) si IP à exclure du blocage
  local ip="$1"
  [ -z "$ip" ] && return 0
  [ "$ip" = "$MY_IP" ] && return 0
  case "$ip" in
    127.*|10.*|192.168.*|::1|169.254.*) return 0 ;;
    172.1[6-9].*|172.2[0-9].*|172.3[0-1].*) return 0 ;;
  esac
  return 1
}

echo; echo "===== TOP 20 IP — inscriptions (POST /api/auth/register) ====="
read_logs | grep -aE 'POST /api/auth/register' | awk '{print $1}' | sort | uniq -c | sort -rn | head -20
echo; echo "===== TOP 20 IP — créations de post (POST /api/posts) ====="
read_logs | grep -aE 'POST /api/posts' | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# ---- Comptage par IP -------------------------------------------------------
declare -A REG POST
while read -r c ip; do [ -n "$ip" ] && REG["$ip"]=$c; done < <(read_logs | grep -aE 'POST /api/auth/register' | awk '{print $1}' | sort | uniq -c)
while read -r c ip; do [ -n "$ip" ] && POST["$ip"]=$c; done < <(read_logs | grep -aE 'POST /api/posts' | awk '{print $1}' | sort | uniq -c)

# ---- Sélection des IP abusives --------------------------------------------
BLOCK_LIST=""
for ip in "${!REG[@]}" "${!POST[@]}"; do
  r=${REG["$ip"]:-0}; p=${POST["$ip"]:-0}
  if { [ "$r" -ge "$REG_THRESHOLD" ] || [ "$p" -ge "$POST_THRESHOLD" ]; } && ! is_safe_ip "$ip"; then
    BLOCK_LIST="$BLOCK_LIST $ip"
  fi
done
BLOCK_LIST="$(echo "$BLOCK_LIST" | tr ' ' '\n' | grep -v '^$' | sort -u)"

echo; echo "===== IP jugées ABUSIVES (au-dessus du seuil) ====="
if [ -z "$BLOCK_LIST" ]; then
  echo "(aucune IP au-dessus du seuil — baisse REG_THRESHOLD/POST_THRESHOLD si besoin)"
else
  for ip in $BLOCK_LIST; do echo "  $ip   (register=${REG[$ip]:-0}, posts=${POST[$ip]:-0})"; done
fi

# ---- Blocage pare-feu ------------------------------------------------------
ufw_active() { command -v ufw >/dev/null && ufw status 2>/dev/null | grep -q "Status: active"; }

block_ip() {
  local ip="$1" ipt="iptables"
  case "$ip" in *:*) ipt="ip6tables" ;; esac
  if ufw_active; then
    if ufw status | grep -q "DENY .*$ip"; then echo "  [ufw] déjà bloqué : $ip"
    else ufw insert 1 deny from "$ip" to any && echo "  [ufw] bloqué : $ip"; fi
  else
    if $ipt -C INPUT -s "$ip" -j DROP 2>/dev/null; then echo "  [$ipt] déjà bloqué : $ip"
    else $ipt -I INPUT 1 -s "$ip" -j DROP && echo "  [$ipt] DROP : $ip"; fi
  fi
}

if [ "$DO_BLOCK" = "1" ] && [ -n "$BLOCK_LIST" ]; then
  echo; echo ">> Blocage au pare-feu (tous ports / tous sites)..."
  for ip in $BLOCK_LIST; do block_ip "$ip"; done
  if ! ufw_active; then
    if command -v netfilter-persistent >/dev/null; then netfilter-persistent save >/dev/null 2>&1 && echo "  (règles iptables persistées)"
    elif command -v iptables-save >/dev/null; then mkdir -p /etc/iptables && iptables-save > /etc/iptables/rules.v4 2>/dev/null && echo "  (iptables sauvegardé dans /etc/iptables/rules.v4)"; fi
  fi
  echo ">> Terminé."
elif [ "$DO_BLOCK" != "1" ]; then
  echo; echo ">> DO_BLOCK=0 : analyse seule, aucun blocage effectué."
fi

# ---- Pour DÉBLOQUER une IP plus tard --------------------------------------
#   ufw :       sudo ufw delete deny from <IP>
#   iptables :  sudo iptables -D INPUT -s <IP> -j DROP   (puis netfilter-persistent save)
