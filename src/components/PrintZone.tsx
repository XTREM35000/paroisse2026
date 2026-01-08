import React, { useState } from 'react';
import type { PublicAd } from '@/types/advertisements';
import { Button } from './ui/button';

export default function PrintZone({ ads }: { ads: PublicAd[] }) {
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setSelectedIds(s => ({ ...s, [id]: !s[id] }));

  const selected = ads.filter(a => selectedIds[a.id]);

  const handlePrint = () => {
    // Basic print: open a new window with printable content
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Impression</title></head><body>${selected.map(a => `<div style="page-break-after:always; width:210mm; height:297mm; display:flex; align-items:center; justify-content:center;"><img src="${a.image_url}" style="max-width:100%; max-height:100%;"/></div>`).join('')}</body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="bg-card border border-border rounded p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ads.map(ad => (
          <label key={ad.id} className="flex items-center gap-2">
            <input type="checkbox" checked={!!selectedIds[ad.id]} onChange={() => toggle(ad.id)} />
            <img src={ad.image_url} alt={ad.title} className="w-24 h-16 object-cover rounded" />
            <div className="flex-1 text-sm">
              <div className="font-semibold">{ad.title}</div>
              <div className="text-muted-foreground text-xs">{ad.subtitle}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={handlePrint} disabled={selected.length === 0}>Imprimer les affiches sélectionnées</Button>
      </div>
    </div>
  );
}
