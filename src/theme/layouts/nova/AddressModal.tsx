import { useEffect, useRef, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';
import { useLocationStore } from '../../../stores/locationStore';

interface Suggestion {
  place_id: string;
  description: string;
}

interface AddressModalProps {
  current: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

const AddressModal = ({ current, onSave, onClose }: AddressModalProps) => {
  const setLocation = useLocationStore((s) => s.setLocation);

  const [query, setQuery] = useState(current);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const search = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setIsFetching(true);
      try {
        const res = await apiGet<Suggestion[]>(ENDPOINTS.address.autocomplete, { query: value.trim() });
        setSuggestions(Array.isArray(res) ? res : []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsFetching(false);
      }
    }, 300);
  };

  const selectSuggestion = async (suggestion: Suggestion) => {
    setSuggestions([]);
    setQuery(suggestion.description);
    setIsResolving(true);
    try {
      const res = await apiPost<{ data: { lat: number; lng: number; formatted_address: string } }>(
        ENDPOINTS.address.coordinates,
        { place_id: suggestion.place_id },
      );
      const { lat, lng, formatted_address } = res.data;
      const address = formatted_address || suggestion.description;
      setLocation(lat, lng, address);
      onSave(address);
      onClose();
    } catch {
      // Fallback: save the typed text without coordinates
      setLocation(0, 0, suggestion.description);
      onSave(suggestion.description);
      onClose();
    } finally {
      setIsResolving(false);
    }
  };

  const saveManual = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  };

  return (
    <div
      className="qn-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label="Delivery address"
    >
      <div className="qn-modal qn-address-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="qn-modal__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="qn-address-modal__head">
          <div className="qn-address-modal__icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <h2 className="qn-address-modal__title">Delivery address</h2>
            <p className="qn-address-modal__sub">Where should we bring your order?</p>
          </div>
        </div>

        <div className="qn-address-modal__search">
          <input
            ref={inputRef}
            className="qn-address-modal__input"
            value={query}
            onChange={(e) => search(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && suggestions.length === 0 && saveManual()}
            placeholder="Search your address…"
            autoComplete="off"
          />
          {isFetching && <span className="qn-address-modal__spinner" aria-hidden />}
        </div>

        {suggestions.length > 0 && (
          <ul className="qn-address-modal__suggestions" role="listbox">
            {suggestions.map((s) => (
              <li key={s.place_id} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="qn-address-modal__suggestion"
                  onClick={() => selectSuggestion(s)}
                  disabled={isResolving}
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                  {s.description}
                </button>
              </li>
            ))}
          </ul>
        )}

        {suggestions.length === 0 && query.trim() && !isFetching && (
          <button
            type="button"
            className="qn-btn qn-btn--primary qn-btn--full"
            onClick={saveManual}
            style={{ marginTop: '8px' }}
          >
            Use "{query.trim()}"
          </button>
        )}

        {!query.trim() && (
          <p className="qn-address-modal__hint">
            Start typing to search for your address
          </p>
        )}
      </div>
    </div>
  );
};

export default AddressModal;
