import { useState } from 'react';
import { Heart, ArrowRight, Plus, Video, Dumbbell, Bell, User } from 'lucide-react';
import { applyTheme, THEMES, type ThemeId, loadTheme } from '../design/themes.js';
import {
  Badge,
  Button,
  Card,
  IconButton,
  ListGroup,
  ListRow,
  MediaThumb,
  NavBar,
  ProgressBar,
  Segmented,
  RPESegmented,
  Sheet,
  Stepper,
  TabBar,
  Toggle,
  type TabId,
} from '../components/ui/index.js';

export function DesignPlayground() {
  const [theme, setTheme] = useState<ThemeId>(loadTheme());
  const [progress, setProgress] = useState(0.42);
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState(80);
  const [rpe, setRpe] = useState(7);
  const [notif, setNotif] = useState(true);
  const [haptic, setHaptic] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLargeOpen, setSheetLargeOpen] = useState(false);
  const [tab, setTab] = useState<TabId>('coach');

  const setT = (t: ThemeId) => {
    setTheme(t);
    applyTheme(t);
  };

  return (
    <>
      <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh' }}>
        <NavBar
          title="Playground"
          subtitle="Tous les primitives, en vie."
          trailing={
            <IconButton ariaLabel="Vidéo" variant="tinted">
              <Video size={18} />
            </IconButton>
          }
        />
        <div style={{ padding: '0 20px 120px' }}>

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

      <Section title="Card — variants">
        <div style={{ display: 'grid', gap: 12 }}>
          <Card variant="surface">
            <div className="t-headline">Surface</div>
            <div className="t-footnote" style={{ color: 'var(--ink-3)' }}>
              Card par défaut, fond bg-surface.
            </div>
          </Card>
          <Card variant="elev">
            <div className="t-headline">Élevée</div>
            <div className="t-footnote" style={{ color: 'var(--ink-3)' }}>
              Shadow plus prononcée.
            </div>
          </Card>
          <Card variant="tinted">
            <div className="t-headline">Tinted</div>
            <div className="t-footnote" style={{ color: 'var(--ink-3)' }}>
              Fond bg-tinted, accent doux.
            </div>
          </Card>
          <Card variant="outlined">
            <div className="t-headline">Outlined</div>
            <div className="t-footnote" style={{ color: 'var(--ink-3)' }}>
              Bordure 1px separator.
            </div>
          </Card>
          <Card variant="mesh" padding={20}>
            <Badge variant="accent">Programme actif</Badge>
            <div className="t-title-1" style={{ marginTop: 8 }}>Force & hypertrophie</div>
            <div className="t-callout" style={{ color: 'var(--ink-3)', marginTop: 4 }}>
              Bloc 1 · semaine 4
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Segmented">
        <Segmented
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lbs', label: 'lbs' },
          ]}
          value={unit}
          onChange={setUnit}
          ariaLabel="Unité"
        />
      </Section>

      <Section title="Stepper">
        <div style={{ display: 'grid', gap: 16 }}>
          <Stepper
            label="Reps"
            value={reps}
            min={0}
            max={50}
            onChange={setReps}
            hint="Cible : 8-12"
          />
          <Stepper
            label="Poids"
            value={weight}
            unit={unit}
            min={0}
            step={2.5}
            onChange={setWeight}
          />
        </div>
      </Section>

      <Section title="RPESegmented">
        <RPESegmented value={rpe} onChange={setRpe} />
      </Section>

      <Section title="Toggle">
        <div style={{ display: 'grid', gap: 12 }}>
          <Row>
            <span className="t-body">Notifications</span>
            <Toggle checked={notif} onChange={setNotif} ariaLabel="Notifications" />
          </Row>
          <Row>
            <span className="t-body">Haptique</span>
            <Toggle checked={haptic} onChange={setHaptic} ariaLabel="Haptique" />
          </Row>
        </div>
      </Section>

      <Section title="ListGroup + ListRow">
        <ListGroup header="paramètres">
          <ListRow
            leading={<Bell size={18} style={{ color: 'var(--ink-2)' }} />}
            label="Notifications"
            subtitle="Rappels de séance"
            trailing="Activé"
            showChevron
            onClick={() => undefined}
          />
          <ListRow
            leading={<User size={18} style={{ color: 'var(--ink-2)' }} />}
            label="Profil"
            subtitle="Dany · 30 ans"
            showChevron
            onClick={() => undefined}
          />
          <ListRow
            leading={<Dumbbell size={18} style={{ color: 'var(--ink-2)' }} />}
            label="Programme"
            subtitle="Force & hypertrophie · 4 séances"
            trailing="Actif"
            showChevron
            onClick={() => undefined}
          />
        </ListGroup>
      </Section>

      <Section title="MediaThumb">
        <div style={{ display: 'grid', gap: 12 }}>
          <MediaThumb
            src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=60"
            alt="Démo bench press"
          />
          <MediaThumb src={null} alt="Pas de média" />
        </div>
      </Section>

      <Section title="Sheet">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button variant="tinted" onClick={() => setSheetOpen(true)}>
            Ouvrir sheet medium
          </Button>
          <Button variant="bordered" onClick={() => setSheetLargeOpen(true)}>
            Ouvrir sheet large
          </Button>
        </div>
      </Section>

      <Section title="NavBar + TabBar">
        <Card variant="tinted">
          <div className="t-callout" style={{ color: 'var(--ink-3)' }}>
            Scroll pour voir la NavBar collapse en compact (top de la page).
            La TabBar est fixée en bas — onglet actif :{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{tab}</span>.
          </div>
        </Card>
      </Section>

        </div>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} detent="medium">
        <h3 className="t-title-3" style={{ margin: '0 0 12px' }}>Sheet medium</h3>
        <p className="t-callout" style={{ color: 'var(--ink-3)' }}>
          Drag vers le bas ou tap sur le scrim pour fermer. ESC marche aussi.
        </p>
        <div style={{ marginTop: 16 }}>
          <Button fullWidth onClick={() => setSheetOpen(false)}>Fermer</Button>
        </div>
      </Sheet>

      <Sheet open={sheetLargeOpen} onClose={() => setSheetLargeOpen(false)} detent="large">
        <h3 className="t-title-3" style={{ margin: '0 0 12px' }}>Sheet large</h3>
        <MediaThumb
          src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=60"
          alt="Démo"
        />
        <p className="t-callout" style={{ color: 'var(--ink-3)', marginTop: 12 }}>
          Detent large = 86vh. Idéal pour player vidéo + cues.
        </p>
        <div style={{ marginTop: 16 }}>
          <Button fullWidth variant="tinted" onClick={() => setSheetLargeOpen(false)}>Fermer</Button>
        </div>
      </Sheet>

      <TabBar active={tab} onChange={setTab} />
    </>
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

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: 'var(--bg-surface)',
        padding: '10px 16px',
        borderRadius: 14,
      }}
    >
      {children}
    </div>
  );
}
