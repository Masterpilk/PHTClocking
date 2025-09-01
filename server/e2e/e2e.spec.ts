import { test, expect, request as pwRequest } from '@playwright/test';
import bcrypt from 'bcrypt';
import { createApp } from '../src/server';

interface Person { id: string; displayName: string; role: string; }
interface User { id: string; email: string; passwordHash: string; role: string; displayName: string; }
interface Event { personId: string; direction: 'IN' | 'OUT'; timestamp: Date; zoneId?: string | null; note?: string | null; }

let people: Person[] = [];
let users: User[] = [];
let events: Event[] = [];

const mockPrisma = {
  person: {
    findMany: async () => people,
    findFirst: async ({ where }: any) => people.find(p => p.id === where.identifier || p.displayName === where.identifier) || null
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

let server: any;

test.beforeAll(async () => {
  people = [{ id: 'p1', displayName: 'Play User', role: 'Crew' }];
  users = [{ id: 'u1', email: 'admin@example.com', passwordHash: await bcrypt.hash('secret', 10), role: 'Admin', displayName: 'Admin' }];
  events = [];
  server = createApp(mockPrisma as any).listen(3001);
});

test.afterAll(() => {
  server.close();
});

test('kiosk check-in appears in presence', async () => {
  const context = await pwRequest.newContext({ baseURL: 'http://localhost:3001' });
  await context.post('/api/v1/kiosk/check', { data: { personIdentifier: 'Play User', direction: 'IN' } });
  await context.post('/api/v1/auth/login', { data: { email: 'admin@example.com', password: 'secret' } });
  const res = await context.get('/api/v1/presence/current');
  const list = await res.json();
  expect(list.length).toBe(1);
  expect(list[0].displayName).toBe('Play User');
});
