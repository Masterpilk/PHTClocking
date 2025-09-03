import { useState, useEffect } from 'react';
import api from '../lib/api';

interface Person { id: string; displayName: string; role: string; }

export default function Kiosk() {
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN');
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.length > 0) {
        const res = await api.get<Person[]>(`/kiosk/search?query=${encodeURIComponent(query)}`);
        setPeople(res.data);
      } else {
        setPeople([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const check = async (p: Person) => {
    try {
      await api.post('/kiosk/check', { personIdentifier: p.id, direction });
      setMsg(`${p.displayName} ${direction === 'IN' ? 'checked in' : 'checked out'}`);
    } catch (e: any) {
      setMsg('Error');
    }
  };

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl mb-4">Kiosk</h1>
      <div className="mb-4">
        <button className={`px-4 py-2 m-1 ${direction === 'IN' ? 'bg-pht-gold text-pht-ink' : 'bg-gray-700'}`} onClick={() => setDirection('IN')}>Check In</button>
        <button className={`px-4 py-2 m-1 ${direction === 'OUT' ? 'bg-pht-gold text-pht-ink' : 'bg-gray-700'}`} onClick={() => setDirection('OUT')}>Check Out</button>
      </div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" className="w-full p-2 text-black" />
      <ul className="mt-4">
        {people.map(p => (
          <li key={p.id} className="p-2 border-b border-gray-600" onClick={() => check(p)}>{p.displayName}</li>
        ))}
      </ul>
      {msg && <p className="mt-4">{msg}</p>}
    </div>
  );
}
