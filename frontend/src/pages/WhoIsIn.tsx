import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Present { id: string; displayName: string; role: string; zone: string | null; timestamp: string; }

export default function WhoIsIn() {
  const [list, setList] = useState<Present[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Present[]>('/presence/current');
        setList(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Who's In</h1>
      <p className="mb-2">{list.length} in the building</p>
      <ul>
        {list.map(p => (
          <li key={p.id} className="border-b border-gray-700 py-1">{p.displayName} <span className="text-sm">({p.role}) {p.zone ? `- ${p.zone}` : ''}</span></li>
        ))}
      </ul>
    </div>
  );
}
