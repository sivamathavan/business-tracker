import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, ArrowRight } from 'lucide-react';

export interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  section: string;
  rawRecord: any;
}

interface SearchBarProps {
  items: SearchItem[];
  onSelect: (item: SearchItem) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  items,
  onSelect,
  placeholder = "Search across all sections..."
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter items as query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const filtered = items.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.section.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered.slice(0, 10)); // Limit to 10 matching results
  }, [query, items]);

  // Group results by section
  const groupedResults = results.reduce<Record<string, SearchItem[]>>((groups, item) => {
    const sec = item.section;
    if (!groups[sec]) groups[sec] = [];
    groups[sec].push(item);
    return groups;
  }, {});

  const handleSelectItem = (item: SearchItem) => {
    onSelect(item);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md z-40">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 text-sm bg-brand-card/50 border border-brand-border/60 hover:border-brand-border focus:border-brand-tech/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none transition-all duration-200"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Auto-complete Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl bg-[#12121a]/95 border border-brand-border/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden max-h-[360px] overflow-y-auto z-50">
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No matching records found.
            </div>
          ) : (
            <div className="divide-y divide-brand-border/40">
              {Object.entries(groupedResults).map(([sectionName, sectionItems]) => (
                <div key={sectionName} className="p-2">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-2.5 py-1.5 font-heading">
                    {sectionName}
                  </h4>
                  <div className="space-y-0.5">
                    {sectionItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className="w-full flex items-center justify-between text-left px-2.5 py-2 rounded-lg hover:bg-slate-800/60 group transition-colors duration-150"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-brand-border/40 text-slate-300">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
