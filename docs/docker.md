# PowerBackup Docker/pg_dump Integration

## Local Docker Test

1. **Build and start services:**
   ```sh
   docker-compose up --build
   ```
   This will start a Postgres test instance and run PowerBackup against it.

2. **Custom config:**
   - Edit `config/config.json` to point to the test Postgres DB:
     ```json
     {
       "databases": [
         {
           "name": "testdb",
           "type": "postgres",
           "url": "postgresql://testuser:testpass@postgres:5432/testdb"
         }
       ],
       ...
     }
     ```
   - The hostname `postgres` refers to the service in `docker-compose.yml`.

3. **Manual backup run:**
   ```sh
   docker-compose run --rm powerbackup create-now testdb
   ```

## Requirements
- Docker and Docker Compose installed
- `pg_dump` is now used for all Postgres backups (see `src/backup/dump/pgdump.js`)

## Notes
- For NeonDB or remote Postgres, ensure `pg_dump` is available and network access is allowed.
- You can override the command or config as needed for your environment.
