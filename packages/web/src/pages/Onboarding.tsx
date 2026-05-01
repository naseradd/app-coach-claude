import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Bot, ArrowRight, Plug } from 'lucide-react';
import { Button, Card } from '../components/ui/index.js';
import { useSettings } from '../store/settings.store.js';
import { setApiConfig } from '../api/client.js';
import { apiClient } from '../api/endpoints.js';

const TOTAL_SLIDES = 3;

export function Onboarding() {
  const navigate = useNavigate();
  const setSettings = useSettings((s) => s.set);
  const initialUrl = useSettings((s) => s.serverUrl);
  const initialBearer = useSettings((s) => s.bearer);

  const [slide, setSlide] = useState(0);
  const [serverUrl, setServerUrl] = useState(initialUrl);
  const [token, setToken] = useState(initialBearer);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLast = slide === TOTAL_SLIDES - 1;

  const next = async () => {
    if (!isLast) {
      setSlide((s) => s + 1);
      return;
    }
    if (!serverUrl.trim() || !token.trim()) {
      setError('Renseigne URL et token.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Apply config eagerly so apiClient.health() can reach it.
      const url = serverUrl.trim();
      const bearer = token.trim();
      setApiConfig({ baseUrl: url, bearer });
      await apiClient.health();
      // Persist only after a successful round-trip; useApiBoot picks it up.
      setSettings({ serverUrl: url, bearer });
      navigate('/');
    } catch (e) {
      setError(
        e instanceof Error
          ? `Connexion impossible : ${e.message}`
          : 'Connexion impossible',
      );
      // Roll back the in-memory config so failures don't leak partial state.
      setApiConfig({ baseUrl: '', bearer: '' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        maxWidth: 430,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-canvas)',
      }}
    >
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />

      {/* Top bar with skip */}
      <div
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 16px',
        }}
      >
        {!isLast ? (
          <Button variant="plain" size="sm" onClick={() => setSlide(TOTAL_SLIDES - 1)}>
            Passer
          </Button>
        ) : null}
      </div>

      {/* Slides */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 28px',
        }}
      >
        <AnimatePresence mode="wait">
          {slide === 0 ? (
            <Slide key="s1">
              <SlideHero icon={<Sparkles size={56} />} />
              <h1 className="t-large" style={{ margin: '32px 0 12px', color: 'var(--ink)' }}>
                Coach Claude te suit en temps réel.
              </h1>
              <p className="t-callout" style={{ color: 'var(--ink-2)', maxWidth: 360 }}>
                Une seule app, calme et précise. Tu fais ta séance, Claude voit chaque set.
              </p>
            </Slide>
          ) : null}
          {slide === 1 ? (
            <Slide key="s2">
              <SlideHero icon={<Bot size={56} />} />
              <h1 className="t-large" style={{ margin: '32px 0 12px', color: 'var(--ink)' }}>
                Tu exécutes. Claude apprend.
              </h1>
              <p className="t-callout" style={{ color: 'var(--ink-2)', maxWidth: 360 }}>
                Le programme s'adapte à tes performances réelles. Tu n'as rien à coller dans une
                conversation.
              </p>
            </Slide>
          ) : null}
          {slide === 2 ? (
            <Slide key="s3">
              <SlideHero icon={<Plug size={56} />} />
              <h1 className="t-title-1" style={{ margin: '24px 0 8px', color: 'var(--ink)' }}>
                Connecte ton serveur.
              </h1>
              <p className="t-callout" style={{ color: 'var(--ink-3)', marginBottom: 18 }}>
                Renseigne l'URL et ton token Bearer.
              </p>
              <Card variant="surface" padding={16}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div>
                    <label className="t-subhead" style={{ color: 'var(--ink-3)' }}>
                      URL backend
                    </label>
                    <input
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      placeholder="https://coach.fly.dev"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      style={{
                        marginTop: 6,
                        width: '100%',
                        height: 44,
                        borderRadius: 14,
                        border: '1px solid var(--separator)',
                        background: 'var(--bg-canvas)',
                        padding: '0 14px',
                        fontSize: 15,
                        color: 'var(--ink)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label className="t-subhead" style={{ color: 'var(--ink-3)' }}>
                      Bearer token
                    </label>
                    <input
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      type="password"
                      placeholder="•••"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      style={{
                        marginTop: 6,
                        width: '100%',
                        height: 44,
                        borderRadius: 14,
                        border: '1px solid var(--separator)',
                        background: 'var(--bg-canvas)',
                        padding: '0 14px',
                        fontSize: 15,
                        color: 'var(--ink)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {error ? (
                    <div className="t-footnote" style={{ color: 'var(--danger)' }}>
                      {error}
                    </div>
                  ) : null}
                </div>
              </Card>
            </Slide>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Indicator */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center',
          padding: '8px 0',
        }}
      >
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => {
          const active = i === slide;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              style={{
                position: 'relative',
                width: active ? 24 : 8,
                height: 8,
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
              }}
              aria-label={`Aller au slide ${i + 1}`}
            >
              <motion.span
                layoutId={active ? 'onb-pill' : undefined}
                style={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  borderRadius: 999,
                  background: active ? 'var(--accent)' : 'var(--ink-4)',
                  opacity: active ? 1 : 0.4,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '12px 20px calc(env(safe-area-inset-bottom) + 16px)' }}>
        {isLast ? (
          <Button variant="primary" size="xl" fullWidth onClick={next} disabled={busy}>
            {busy ? 'Connexion…' : 'Connecter'}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="xl"
            fullWidth
            trailingIcon={<ArrowRight size={18} />}
            onClick={next}
          >
            Continuer
          </Button>
        )}
      </div>
    </div>
  );
}

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
    >
      {children}
    </motion.div>
  );
}

function SlideHero({ icon }: { icon: React.ReactNode }) {
  return (
    <div
      style={{
        width: 128,
        height: 128,
        borderRadius: '50%',
        background: 'var(--accent-soft)',
        color: 'var(--accent)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {icon}
    </div>
  );
}
