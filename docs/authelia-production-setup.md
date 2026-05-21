# Authelia SSO — Production Setup for BilancioFamiliare

## Context

BilancioFamiliare uses custom JWT authentication (email+password). This guide adds Authelia SSO
as a second login path: if the user is already authenticated with Authelia, they enter the app
automatically without re-entering local credentials. The existing login form continues to work
unchanged for users without Authelia.

The integration works via nginx `auth_request`: Authelia injects trusted headers (`Remote-Email`,
`Remote-Name`, `Remote-User`) into requests to `/auth/sso`. Rails reads those headers, finds the
matching local user by email, and issues a JWT.

Security relies on the standard nginx topology: the Rails container (`as:3000`) is not exposed to
the internet — only nginx can reach it. The `location /` block strips the `Remote-*` headers for
all other routes, so they cannot be forged by clients on any endpoint other than `/auth/sso`.

**Only users already registered in the local DB can use SSO** (no auto-provisioning).
The user's email in Authelia must match their email in BilancioFamiliare exactly.

---

## Step 1 — Update `.env` on the server

In the production `.env` file, add:

```env
AUTHELIA_ENABLED=true
```

---

## Step 2 — Edit `nginx/default.conf` on the server

Inside the existing `server { listen 443 ssl; ... }` block, add these two locations
**before** the existing `location /` block:

```nginx
# Internal subrequest to Authelia — not exposed directly
location = /authelia/api/verify {
    internal;
    proxy_pass http://authelia:9091/api/verify;  # adjust host/port if needed
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URL $scheme://$http_host$request_uri;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $http_host;
}

# SSO endpoint: guarded by Authelia
location = /auth/sso {
    auth_request /authelia/api/verify;
    error_page 401 =302 https://$host/authelia?rd=$scheme://$http_host$request_uri;

    auth_request_set $authelia_user  $upstream_http_remote_user;
    auth_request_set $authelia_name  $upstream_http_remote_name;
    auth_request_set $authelia_email $upstream_http_remote_email;

    proxy_pass http://as:3000;
    proxy_set_header Host            $host;
    proxy_set_header X-Real-IP       $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Remote-User     $authelia_user;
    proxy_set_header Remote-Name     $authelia_name;
    proxy_set_header Remote-Email    $authelia_email;
}
```

In the **existing** `location /` block, add these lines to strip Authelia headers from all
other requests (prevents clients from forging them):

```nginx
location / {
    # ... existing config unchanged ...

    proxy_set_header Remote-User  "";
    proxy_set_header Remote-Email "";
    proxy_set_header Remote-Name  "";
}
```

> To find the Authelia container name/port: `docker ps | grep authelia`. Default port is 9091.

---

## Step 3 — Configure Authelia access control

In Authelia's `configuration.yml`, add a rule that protects **only** `/auth/sso`.
The rest of the app uses Rails JWT and must not be blocked by Authelia.

```yaml
access_control:
  default_policy: bypass

  rules:
    - domain: bilancio.yourdomain.com
      policy: one_factor          # or two_factor
      resources:
        - "^/auth/sso$"
```

If other rules already exist, add this one at the top of the `rules` list
(rules are evaluated in order, first match wins).

---

## Step 4 — Ensure nginx and Authelia share a Docker network

The nginx container (`web`) must reach the Authelia container for the internal subrequest.
If Authelia runs in a separate `docker-compose.yml`, add an external network to
`docker-compose.prod.yml`:

```yaml
services:
  web:
    # ... existing config ...
    networks:
      - default
      - authelia_net

networks:
  authelia_net:
    external: true
    name: authelia_default   # verify with: docker network ls
```

---

## Step 5 — Apply changes

```bash
# Reload nginx config (zero downtime)
docker-compose -f docker-compose.prod.yml exec web nginx -s reload

# If docker-compose.prod.yml was changed (network), restart the web service
docker-compose -f docker-compose.prod.yml up -d web

# Restart the Rails container to pick up the new AUTHELIA_ENABLED var
docker-compose -f docker-compose.prod.yml up -d as
```

---

## Step 6 — Verify

**Backend smoke test** (from the server, no browser needed):

```bash
# Expected response: {"status":true,"token":"eyJ..."}
curl -s \
  -H "Remote-Email: your@email.com" \
  -H "Remote-Name: Your Name" \
  https://bilancio.yourdomain.com/auth/sso | jq .
```

> Note: this curl goes through nginx, which adds the headers only if Authelia has already
> authenticated the request. Run it from a session where you are logged into Authelia,
> or add a valid Authelia session cookie to the curl command.

**Full SSO flow** (browser):

1. Log out of BilancioFamiliare (delete `localStorage.token` in DevTools, or open incognito)
2. Log in to Authelia at `https://bilancio.yourdomain.com/authelia`
3. Navigate to `https://bilancio.yourdomain.com`
4. The login page should flash briefly then redirect automatically into the app

**Fallback test** (browser, without Authelia session):

Access the app without being logged into Authelia. The email+password form should appear
normally (the `/auth/sso` probe receives a 401/302 from nginx and the login page falls back to the form).

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `/auth/sso` returns 404 | `AUTHELIA_ENABLED` is not `true` in the Rails container's env |
| `/auth/sso` returns 400 | `Remote-Email` header not set — nginx is not forwarding Authelia headers |
| `/auth/sso` returns 403 | The email from Authelia does not match any non-blocked user in the DB |
| SSO probe always redirects to Authelia login | The Authelia access control rule is not matching `/auth/sso` |
| nginx cannot reach Authelia for subrequest | Containers are on different Docker networks (see Step 4) |
| Login form appears with a brief spinner | Normal behaviour when Authelia is not active — SSO probe fails, form is shown |
