# PHT Clocking

Lightweight crew check-in/out and fire roll-call system for Pendle Hippodrome Theatre.

## Development

```bash
npm install
npm run prisma:migrate
npm run dev
```

Backend runs on http://localhost:8080 and frontend on http://localhost:5173.

Seed database:
```bash
npm run seed --workspace server
```

Run tests:
```bash
npm test
```

### Docker
```
docker-compose up --build
```

## Branding
Edit colours in `frontend/src/styles/brand.css` or via future settings API.
