# Arch DPI Backend

This is the backend service for the Arch DPI system, built with **Bun**, **Hono**, **Prisma**, and **PostgreSQL**.

## Setup

1.  **Install Dependencies**:
    ```bash
    bun install
    ```

2.  **Environment Variables**:
    Ensure `.env` exists with:
    ```env
    DATABASE_URL="postgresql://postgres:mysecretpassword@localhost"
    JWT_SECRET="supersecretjwtkey"
    DPI_SECRET_KEY="12345678901234567890123456789012"
    ```

3.  **Database**:
    ```bash
    bunx prisma db push
    ```

4.  **Run**:
    ```bash
    bun run src/index.ts
    ```

## API Endpoints

### Auth
- `POST /auth/register`: `{ username, phoneNumber, password }`
- `POST /auth/login`: `{ identifier, password }`

### Location
- `POST /location/initial`: `{ latitude, longitude }` (Requires Auth)
- `GET /location/my-dpi`: Get current user's DPI (Requires Auth)

### Share
- `POST /share/request`: `{ targetIdentifier, type, validForHours }` (Requires Auth)
- `POST /share/:id/respond`: `{ action: "APPROVE"|"DENY", pin: "..." }` (Requires Auth)
- `GET /share/incoming`: List incoming requests (Requires Auth)
- `GET /share/outgoing`: List outgoing requests (Requires Auth)
- `GET /share/:id/details`: View shared location if approved and active (Requires Auth)

## DPI Logic
DPIs are generated using deterministic AES-256 encryption of the coordinates. This ensures that the same location always yields the same DPI string, while being reversible by the server.
