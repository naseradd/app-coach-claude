import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { Button, Card } from '../ui/index.js';

const STORAGE_KEY = 'coach.installHintDismissed';

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

/**
 * Subtle one-time hint to help iOS users add the PWA to their home screen.
 *
 * Visibility rules:
 *  - iOS device (iPhone/iPad/iPod user-agent)
 *  - Not already in standalone mode (`navigator.standalone === false`)
 *  - User hasn't dismissed the hint previously
 *
 * Dismissal is persisted in localStorage so the hint disappears for good.
 */
export function IosInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nav = navigator as NavigatorWithStandalone;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = nav.standalone === true;
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    setVisible(isIOS && !isStandalone && !dismissed);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Storage may be unavailable in private mode; non-critical.
    }
    setVisible(false);
  };

  return (
    <Card variant="tinted" padding={16}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: 12,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Smartphone size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="t-headline" style={{ margin: 0, color: 'var(--ink)' }}>
            Ajoute Coach à ton écran d'accueil
          </h3>
          <p
            className="t-footnote"
            style={{ margin: '4px 0 0', color: 'var(--ink-2)', lineHeight: 1.4 }}
          >
            Tape sur l'icône Partage de Safari (carré + flèche), puis « Sur l'écran
            d'accueil ». Tu profites du plein écran et des haptiques.
          </p>
          <div style={{ marginTop: 10 }}>
            <Button variant="plain" size="sm" onClick={dismiss}>
              Compris
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
