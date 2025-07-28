# Data Catalog API

## Quick Start

1. **Copy the environment template and edit if needed:**
   ```sh
   cp env.example .env
   ```

2. **Build and start the application and database:**
   ```sh
   docker-compose up --build
   ```

3. **Access the API:**
   - API: http://localhost:3000
   - Database: localhost:5432 (user: postgres, password: postgres, db: data_catalog)

## Stopping Services

```sh
docker-compose down
```

## Notes
- All migrations and Prisma client generation are handled at build time.
- No Redis or extra services are included.
- For development, you can use the same setup and just restart the containers after code changes.