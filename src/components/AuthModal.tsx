import { useEffect, useRef, useState } from 'react';
import { QueekSdkError } from '@queekai/client-sdk';
import { requestOtp, verifyOtp, fetchMe } from '../services/auth';
import { useUserStore } from '../stores/userStore';

const cleanPhone = (raw: string) => raw.replace(/\D/g, '').replace(/^(234|0)/, '');

type Step = 'phone' | 'otp' | 'signup';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const OTP_LENGTH = 4;

const OtpBoxes = ({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: () => void;
  disabled: boolean;
}) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, raw: string) => {
    const char = raw.replace(/\D/g, '').slice(-1);
    const next = value.split('');
    next[i] = char;
    const joined = next.join('').slice(0, OTP_LENGTH);
    onChange(joined);
    if (char && i < OTP_LENGTH - 1) focus(i + 1);
    if (joined.length === OTP_LENGTH) onComplete();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[i]) {
        const next = value.split('');
        next[i] = '';
        onChange(next.join(''));
      } else if (i > 0) {
        focus(i - 1);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1);
    } else if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) {
      focus(i + 1);
    } else if (e.key === 'Enter' && value.length === OTP_LENGTH) {
      onComplete();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    focus(focusIdx);
    if (pasted.length === OTP_LENGTH) onComplete();
  };

  return (
    <div className="qn-otp-boxes">
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`qn-otp-box${value[i] ? ' is-filled' : ''}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          onPaste={handlePaste}
          disabled={disabled}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
};

const STEPS: Step[] = ['phone', 'otp', 'signup'];

export const AuthModal = ({ onClose, onSuccess }: AuthModalProps) => {
  const setUser = useUserStore((s) => s.setUser);

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 'phone') phoneRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const stepIndex = STEPS.indexOf(step);

  const handlePhoneSubmit = async () => {
    const cleaned = cleanPhone(phone);
    if (!cleaned) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await requestOtp(cleaned);
      if (res.debug_code) {
        const code = String(res.debug_code).padStart(OTP_LENGTH, '0').slice(0, OTP_LENGTH);
        setOtp(code);
      }
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length < OTP_LENGTH) return;
    setError(null);
    setIsLoading(true);
    try {
      await verifyOtp(cleanPhone(phone), otp);
      const user = await fetchMe();
      if (!user) throw new Error('Could not load your account. Please try again.');
      setUser(user);
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err instanceof QueekSdkError && err.code === 'account_not_found') {
        setStep('signup');
      } else {
        setError(err instanceof Error ? err.message : 'Incorrect code. Try again.');
        setOtp('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="qn-modal-overlay qn-auth-overlay"
      role="dialog"
      aria-modal
      aria-label="Sign in"
    >
      <div className="qn-auth-modal" onClick={(e) => e.stopPropagation()}>

        {/* Step dots */}
        <div className="qn-auth-modal__steps">
          {Array.from({ length: step === 'signup' ? 3 : 2 }).map((_, i) => (
            <span
              key={i}
              className={`qn-auth-modal__step-dot${i === stepIndex ? ' is-active' : i < stepIndex ? ' is-done' : ''}`}
            />
          ))}
        </div>

        <button type="button" className="qn-auth-modal__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Phone step */}
        {step === 'phone' && (
          <div className="qn-auth-modal__step">
            <div className="qn-auth-modal__step-head">
              <h2 className="qn-auth-modal__title">Sign in</h2>
              <p className="qn-auth-modal__sub">Enter your phone number to continue</p>
            </div>

            <div className="qn-auth-field">
              <label className="qn-auth-field__label" htmlFor="auth-phone">Phone number</label>
              <div className="qn-auth-field__wrap">
                <span className="qn-auth-field__prefix">
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
                    <rect x="3" y="1" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M7 12h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  ref={phoneRef}
                  id="auth-phone"
                  className="qn-auth-field__input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePhoneSubmit()}
                  placeholder="+234 800 000 0000"
                  autoComplete="tel"
                />
              </div>
            </div>

            {error && <p className="qn-auth-error">{error}</p>}

            <button
              type="button"
              className="qn-auth-cta"
              onClick={handlePhoneSubmit}
              disabled={isLoading || !phone.trim()}
            >
              {isLoading
                ? <span className="qn-auth-cta__spinner" />
                : <>Continue <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></>
              }
            </button>

            <p className="qn-auth-terms">By continuing you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</p>
          </div>
        )}

        {/* OTP step */}
        {step === 'otp' && (
          <div className="qn-auth-modal__step">
            <div className="qn-auth-modal__step-head">
              <h2 className="qn-auth-modal__title">Enter code</h2>
              <p className="qn-auth-modal__sub">4-digit code sent to {phone}</p>
            </div>

            <OtpBoxes
              value={otp}
              onChange={setOtp}
              onComplete={handleOtpSubmit}
              disabled={isLoading}
            />

            {error && <p className="qn-auth-error">{error}</p>}

            <button
              type="button"
              className="qn-auth-cta"
              onClick={handleOtpSubmit}
              disabled={isLoading || otp.length < OTP_LENGTH}
            >
              {isLoading
                ? <span className="qn-auth-cta__spinner" />
                : <>Verify <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></>
              }
            </button>

            <button
              type="button"
              className="qn-auth-ghost"
              onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
            >
              ← Change number
            </button>
          </div>
        )}

        {/* Signup step — registration via Queek app */}
        {step === 'signup' && (
          <div className="qn-auth-modal__step">
            <div className="qn-auth-modal__step-head">
              <h2 className="qn-auth-modal__title">New here?</h2>
              <p className="qn-auth-modal__sub">This phone number isn't registered yet.</p>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--qn-text-muted)', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              To create a Queek account, download the <strong>Queek</strong> app and sign up from there. Once your account is active, you can sign in here.
            </p>

            <button
              type="button"
              className="qn-auth-ghost"
              onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
            >
              ← Try a different number
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
