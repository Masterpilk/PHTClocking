import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server';
import bcrypt from 'bcrypt';

interface Person { id: string; displayName: string; role: string; }
interface User { id: string; email: string; passwordHash: string; role: string; displayName: string; }
interface Event { personId: string; direction: 'IN' | 'OUT'; timestamp: Date; zoneId?: string | null; note?: string | null; }

let people: Person[] = [];
let users: User[] = [];
let events: Event[] = [];

const mockPrisma = {
  person: {
    findMany: async ({ where }: any) => {
      const q: string = where.q;
      return people.filter(p => p.displayName.toLowerCase().startsWith(q));
    },
    findFirst: async ({ where }: any) => {
      return people.find(p => p.id === where.identifier || p.displayName === where.identifier) || null;
    }
  },
  user: {
    findUnique: async ({ where }: any) => users.find(u => u.email === where.email) || null
  },
  checkEvent: {
    create: async ({ data }: any) => { const ev = { ...data, timestamp: new Date() }; events.push(ev); return ev; }
  },
  $queryRawUnsafe: async () => {
    const map: Record<string, Event> = {};
    for (const ev of events) map[ev.personId] = ev;
    return Object.entries(map)
      .filter(([, ev]) => ev.direction === 'IN')
      .map(([pid, ev]) => {
        const person = people.find(p => p.id === pid)!;
        return { id: person.id, displayName: person.displayName, role: person.role, zone: null, timestamp: ev.timestamp };
      });
  }
};

const app = createApp(mockPrisma as any);

describe('kiosk check', () => {
  beforeEach(async () => {
    people = [{ id: 'p1', displayName: 'Test User', role: 'Cast' }];
    users = [{ id: 'u1', email: 'admin@example.com', passwordHash: await bcrypt.hash('secret', 10), role: 'Admin', displayName: 'Admin' }];
    events = [];
  });

  it('should check in and appear in presence', async () => {
    await request(app)
      .post('/api/v1/kiosk/check')
      .send({ personIdentifier: 'Test User', direction: 'IN' })
      .expect(200);

    const agent = request.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'secret' })
      .expect(200);
    const res = await agent.get('/api/v1/presence/current').expect(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].displayName).toBe('Test User');
  });
});
