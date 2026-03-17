import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin } from 'lucide-react';

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressSearchProps {
  onSelect: (lat: number, lng: number, label: string) => void;
}

export const AddressSearch: React.FC<AddressSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = (await res.json()) as GeoResult[];
          setResults(data);
          setOpen(data.length > 0);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (r: GeoResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const label = r.display_name.split(',').slice(0, 2).join(',').trim();
    onSelect(lat, lng, label);
    setQuery(label);
    setOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === 'Enter' && results.length > 0) {
      handleSelect(results[0]);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 bg-black/80 border border-cyber-border/60 rounded px-2 py-1.5 backdrop-blur-sm min-w-[220px]">
        <Search size={12} className="text-cyber-accent/70 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search address..."
          className="bg-transparent text-[11px] font-mono text-white placeholder-gray-500 outline-none w-full min-w-0"
        />
        {loading && (
          <div className="w-3 h-3 border border-cyber-accent/50 border-t-cyber-accent rounded-full animate-spin shrink-0" />
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            className="text-gray-500 hover:text-white shrink-0"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 border border-cyber-border/60 rounded max-h-[200px] overflow-y-auto z-[100] backdrop-blur-md">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-cyber-accent/10 transition-colors border-b border-cyber-border/20 last:border-b-0"
            >
              <MapPin size={12} className="text-cyber-accent/70 mt-0.5 shrink-0" />
              <span className="text-[10px] font-mono text-gray-300 leading-tight line-clamp-2">
                {r.display_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
