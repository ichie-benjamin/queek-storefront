import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from '../../../types/product';
import type { VendorCollection } from '../../view-types';
import { ratingStr } from './helpers';

interface FloatingSearchProps {
  products: Product[];
  collections: VendorCollection[];
  initialQuery: string;
  onCommit: (query: string) => void;
  onClose: () => void;
}

const FloatingSearch = ({ products, collections, initialQuery, onCommit, onClose }: FloatingSearchProps) => {
  const [query, setQuery] = useState(initialQuery || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const productSuggestions = useMemo(() => {
    if (!query.trim()) return products.slice(0, 5);
    const q = query.toLowerCase();
    return products.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.categories.some((c) => c.name.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [query, products]);

  const categorySuggestions = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => p.categories.forEach((c) => { if (c.slug && !map.has(c.slug)) map.set(c.slug, c.name); }));
    if (!query.trim()) return Array.from(map.entries()).slice(0, 4);
    const q = query.toLowerCase();
    return Array.from(map.entries()).filter(([, name]) => name.toLowerCase().includes(q)).slice(0, 4);
  }, [query, products]);

  const collectionMatches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return collections.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 2);
  }, [query, collections]);

  const commit = (q: string) => {
    if (!q.trim()) return;
    onCommit(q.trim());
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit(query);
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="qn-search-overlay" onClick={onClose}>
      <div className="qn-search-panel" onClick={(e) => e.stopPropagation()}>

        <div className="qn-search-handle" />

        <p className="qn-search-label">
          {query.trim() ? 'Results' : 'Popular items'}
        </p>

        <div className="qn-search-results">

          {productSuggestions.map((p) => (
            <button key={p.id} type="button" className="qn-search-row" onClick={() => commit(p.title)}>
              <div className="qn-search-row__avatar qn-search-row__avatar--img">
                <img src={p.media.thumbnail || p.media.image || '/vite.svg'} alt={p.title} />
              </div>
              <div className="qn-search-row__body">
                <span className="qn-search-row__label">{p.title}</span>
                {p.review_summary.rating > 0 && (
                  <span className="qn-search-row__sub">
                    <span className="qn-search-row__star">★</span> {ratingStr(p.review_summary.rating)}
                  </span>
                )}
              </div>
            </button>
          ))}

          {collectionMatches.map((col) => (
            <button key={col.id} type="button" className="qn-search-row" onClick={() => commit(col.name)}>
              <div
                className="qn-search-row__avatar qn-search-row__avatar--img"
                style={col.image ? { backgroundImage: `url(${col.image})`, backgroundSize: 'cover' } : undefined}
              >
                {!col.image && <span>{col.name.charAt(0)}</span>}
              </div>
              <div className="qn-search-row__body">
                <span className="qn-search-row__label">{col.name}</span>
                {col.products_count > 0 && <span className="qn-search-row__sub">{col.products_count} items</span>}
              </div>
            </button>
          ))}

          {categorySuggestions.map(([slug, name]) => (
            <button key={slug} type="button" className="qn-search-row qn-search-row--category" onClick={() => commit(name)}>
              <div className="qn-search-row__avatar qn-search-row__avatar--icon">
                <svg viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
              <div className="qn-search-row__body">
                <span className="qn-search-row__label">{name}</span>
              </div>
            </button>
          ))}

          {query.trim() && (
            <button type="button" className="qn-search-row qn-search-row--category" onClick={() => commit(query)}>
              <div className="qn-search-row__avatar qn-search-row__avatar--icon">
                <svg viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
              <div className="qn-search-row__body">
                <span className="qn-search-row__label">Search "<strong>{query}</strong>"</span>
              </div>
            </button>
          )}
        </div>

        <div className="qn-search-bar">
          <svg className="qn-search-bar__icon" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="qn-search-bar__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search items, categories…"
            aria-label="Search"
          />
          {query && (
            <button type="button" className="qn-search-bar__clear" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Clear">
              <svg viewBox="0 0 12 12" fill="none">
                <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <button type="button" className="qn-search-bar__submit" onClick={() => commit(query)} aria-label="Search">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export const FloatingSearchFab = ({ onClick }: { onClick: () => void }) => (
  <button type="button" className="qn-search-fab" onClick={onClick} aria-label="Search items and categories">
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    <span>Search items, categories…</span>
  </button>
);

export default FloatingSearch;
