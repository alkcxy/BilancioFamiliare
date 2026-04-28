# Production Database Upgrade Guide

This guide covers what needs to happen to the production database when deploying the Rails 8 + Vue 3 version of BilancioFamiliare for the first time.

---

## Background

The production database was originally created for Rails 5.2. It was tested against Rails 8.0.2 directly (with 10,970 operations, 78 types, 4 users, 372 withdrawals) and is **fully compatible** — no manual SQL or schema changes are needed for the existing tables.

The only required step is running `bin/rails db:migrate` to create two new tables introduced in Rails 8 (Solid Cache and Solid Cable).

---

## What changes

### Existing tables — no changes

All original tables (`users`, `operations`, `types`, `withdrawals`) are unchanged. Column types, indexes, and constraints remain exactly as they were.

### New tables added by migration

Two new tables are created by `bin/rails db:migrate`:

#### `solid_cache_entries`

Stores cached responses in the database (replaces Memcache/Dalli).

```sql
CREATE TABLE solid_cache_entries (
  id         BIGINT PRIMARY KEY AUTO_INCREMENT,
  key        BLOB(1024)      NOT NULL,
  value      LONGBLOB        NOT NULL,
  created_at DATETIME(6)     NOT NULL,
  key_hash   BIGINT          NOT NULL,
  byte_size  INT             NOT NULL
);
-- Indexes: key_hash (unique), (key_hash, byte_size), byte_size
```

#### `solid_cable_messages`

Stores ActionCable broadcast messages in the database (replaces Redis).

```sql
CREATE TABLE solid_cable_messages (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  channel      BLOB(1024)  NOT NULL,
  payload      LONGBLOB    NOT NULL,
  created_at   DATETIME(6) NOT NULL,
  channel_hash BIGINT      NOT NULL
);
-- Indexes: channel, channel_hash, created_at
```

Both tables use the same database as the application (no separate database needed).

---

## Migration history fix (one-time, already applied)

When the production DB was first tested against Rails 8, one migration had a mismatched timestamp.

The migration file `create_types` was named `20160620144751_create_types.rb` in the codebase but was recorded as `20160620144842` in the production `schema_migrations` table. This caused `bin/rails db:migrate` to try to re-run it.

**Fix applied:** the file was renamed to `20160620144842_create_types.rb` to match production. This fix is already in the repository — no manual action needed.

---

## Deployment steps

1. **Deploy the new code** (pull the `master` branch after merge).

2. **Run migrations:**

   ```bash
   # In Docker:
   docker-compose exec web bin/rails db:migrate

   # Or directly on the server:
   bin/rails db:migrate
   ```

   Expected output:
   ```
   == 20260427133110 CreateSolidCacheEntries: migrating ==========================
   -- create_table(:solid_cache_entries)
      -> 0.xxxs
   == 20260427133110 CreateSolidCacheEntries: migrated ==========================

   == 20260427133111 CreateSolidCableMessages: migrating ========================
   -- create_table(:solid_cable_messages)
      -> 0.xxxs
   == 20260427133111 CreateSolidCableMessages: migrated =========================
   ```

3. **Restart the server** (Puma picks up the new config for Solid Cache/Cable).

4. **Verify:** log in, create an operation, verify it appears in real-time in a second tab.

---

## Rollback

If you need to roll back to the Rails 5.2 version:

1. Drop the two new tables:

   ```sql
   DROP TABLE IF EXISTS solid_cache_entries;
   DROP TABLE IF EXISTS solid_cable_messages;
   ```

2. Remove their entries from `schema_migrations`:

   ```sql
   DELETE FROM schema_migrations WHERE version IN ('20260427133110', '20260427133111');
   ```

3. Restore the old codebase and restart.

All original tables are untouched and fully backwards-compatible.

---

## What was removed (no action needed)

- **Dalli / Memcache:** the `dalli` gem and any Memcache server are no longer needed. Caching is now handled by Solid Cache (database).
- **Redis:** no longer needed. ActionCable now uses Solid Cable (database). If Redis was running as a separate service, it can be stopped and removed.
