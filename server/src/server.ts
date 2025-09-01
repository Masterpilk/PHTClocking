import express from 'express';
import session from 'express-session';
import SQLiteStoreFactory from 'connect-sqlite3';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const SQLiteStore = SQLiteStoreFactory(session);

export type Direction = 'IN' | 'OUT';

export interface PrismaLike {
  person: {
    findMany(args: any): Promise<any[]>;
    findFirst(args: any): Promise<any | null>;
  };
  user: {
    findUnique(args: any): Promise<any | null>;
  };
  checkEvent: {
    create(args: any): Promise<any>;
  };
  $queryRawUnsafe(query: string): Promise<any>;
}

export function createApp(prisma: PrismaLike) {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(
    session({
      store: new SQLiteStore({ db: 'sessions.db', dir: './data' }),
      secret: process.env.SESSION_SECRET || 'secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, httpOnly: true, sameSite: 'lax' }
    })
  );

  // Auth endpoints
  app.post('/api/v1/auth/login', async (req, res) => {
    const schema = z.object({ email: z.string().email(), password: z.string() });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
    const user = await prisma.user.findUnique({ where: { email: result.data.email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const bcrypt = await import('bcrypt');
    const valid = await bcrypt.compare(result.data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    (req.session as any).userId = user.id;
    (req.session as any).role = user.role;
    res.json({ id: user.id, email: user.email, role: user.role, displayName: user.displayName });
  });

  app.post('/api/v1/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get('/api/v1/auth/me', (req, res) => {
    if ((req.session as any).userId) {
      res.json({ id: (req.session as any).userId, role: (req.session as any).role });
    } else {
      res.status(401).json({ error: 'Not logged in' });
    }
  });

  function requireRole(roles: string[]) {
    return (req: any, res: any, next: any) => {
      if (!req.session.userId || !roles.includes(req.session.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };
  }

  app.get('/api/v1/kiosk/search', async (req, res) => {
    const q = String(req.query.query || '').toLowerCase();
    if (!q) return res.json([]);
    const people = await prisma.person.findMany({ where: { q } });
    res.json(people.map((p: any) => ({ id: p.id, displayName: p.displayName, role: p.role })));
  });

  app.post('/api/v1/kiosk/check', async (req, res) => {
    const schema = z.object({
      personIdentifier: z.string(),
      direction: z.enum(['IN', 'OUT']),
      zoneId: z.string().optional(),
      note: z.string().optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const { personIdentifier, direction, zoneId, note } = parsed.data;
    const person = await prisma.person.findFirst({ where: { identifier: personIdentifier } });
    if (!person) return res.status(404).json({ error: 'Person not found' });
    const event = await prisma.checkEvent.create({
      data: {
        personId: person.id,
        direction,
        zoneId,
        note,
        method: 'KIOSK'
      }
    });
    res.json({ ok: true, event });
  });

  app.get('/api/v1/presence/current', requireRole(['Admin', 'FireMarshal', 'StageManager']), async (_req, res) => {
    const lastEvents = await prisma.$queryRawUnsafe('presence');
    res.json(lastEvents);
  });

  return app;
}
