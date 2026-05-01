import { useState } from 'react';
import { Heart, ArrowRight, Plus, Video } from 'lucide-react';
import { applyTheme, THEMES, type ThemeId, loadTheme } from '../design/themes.js';
import { Badge, Button, IconButton, ProgressBar } from '../components/ui/index.js';

export function DesignPlayground() {
  const [theme, setTheme] = useState<ThemeId>(loadTheme());
  const [progress, setProgress] = useState(0.42);

  const setT = (t: ThemeId) => {
    setTheme(t);
    applyTheme(t);
  };

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', padding: 20, paddingBottom: 120 }}>
      <h1 className="t-large" style={{ margin: '8px 0 4px' }}>Design playground</h1>
      <p className="t-callout" style={{ color: 'var(--ink-3)', margin: '0 0 24px' }}>
        Tous les primitives, en vie.
      </p>

      <Section title="Thème">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {THEMES.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={theme === t ? 'primary' : 'bordered'}
              onClick={() => setT(t)}
            >
              {t}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Badge">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Badge variant="accent">Programme actif</Badge>
          <Badge variant="neutral">4 séances</Badge>
          <Badge variant="success">Terminé</Badge>
          <Badge variant="warn">Setup incomplet</Badge>
          <Badge variant="danger">Hors-ligne</Badge>
          <Badge variant="pr">PR du jour</Badge>
        </div>
      </Section>

      <Section title="Button — variants">
        <div style={{ display: 'grid', gap: 12 }}>
          <Button variant="primary" leadingIcon={<Heart size={16} />}>Démarrer la séance</Button>
          <Button variant="tinted" trailingIcon={<ArrowRight size={16} />}>Voir le détail</Button>
          <Button variant="bordered">Sauvegarder</Button>
          <Button variant="plain">Annuler</Button>
        </div>
      </Section>

      <Section title="Button — sizes">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <Button size="sm">sm</Button>
          <Button size="md">md</Button>
          <Button size="lg">lg</Button>
          <Button size="xl">xl</Button>
        </div>
      </Section>

      <Section title="IconButton">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <IconButton ariaLabel="Voir vidéo" variant="tinted">
            <Video size={18} />
          </IconButton>
          <IconButton ariaLabel="Ajouter" variant="acid">
            <Plus size={18} />
          </IconButton>
        </div>
      </Section>

      <Section title="ProgressBar">
        <div style={{ display: 'grid', gap: 12 }}>
          <ProgressBar value={progress} ariaLabel="Avancement séance" />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="bordered" onClick={() => setProgress((v) => Math.max(0, v - 0.1))}>−10%</Button>
            <Button size="sm" variant="bordered" onClick={() => setProgress((v) => Math.min(1, v + 0.1))}>+10%</Button>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 className="t-title-2" style={{ margin: '0 0 12px' }}>{title}</h2>
      {children}
    </section>
  );
}
