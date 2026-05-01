import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Flame,
  Layers,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Plug,
  Sparkles,
} from 'lucide-react';
import { Badge, Button, Card, ProgressBar } from '../components/ui/index.js';
import { IosInstallHint } from '../components/onboarding/IosInstallHint.js';
import { useProgram } from '../store/program.store.js';
import { useHistory } from '../store/history.store.js';
import { useSettings } from '../store/settings.store.js';
import { formatDateFR, relativeDays } from '../utils/format.js';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

export function Today() {
  const navigate = useNavigate();
  const program = useProgram((s) => s.program);
  const setupStatus = useProgram((s) => s.setupStatus);
  const programLoading = useProgram((s) => s.loading);
  const programError = useProgram((s) => s.error);
  const reports = useHistory((s) => s.reports);

  const serverUrl = useSettings((s) => s.serverUrl);
  const bearer = useSettings((s) => s.bearer);
  const isConfigured = Boolean(serverUrl && bearer);
  const today = useMemo(() => new Date(), []);

  // No server configured yet — guide user to onboarding.
  if (!isConfigured) {
    return (
      <EmptyHero
        icon={<Plug size={42} />}
        title="Connecte ton serveur"
        body="Renseigne l'URL et ton token Bearer pour démarrer."
        ctaLabel="Configurer"
        onCta={() => navigate('/onboarding')}
      />
    );
  }

  if (programLoading && !program) {
    return <LoadingHero />;
  }

  if (programError && !program) {
    return (
      <EmptyHero
        icon={<Plug size={42} />}
        title="Connexion impossible"
        body={programError}
        ctaLabel="Vérifier les paramètres"
        onCta={() => navigate('/settings')}
      />
    );
  }

  // Server reachable but setup incomplete (no profile / no program yet).
  if (program === null || (setupStatus && !setupStatus.complete)) {
    const missing = setupStatus?.missing ?? [];
    return (
      <EmptyHero
        icon={<Sparkles size={42} />}
        title="Bientôt prêt"
        body={
          missing.length > 0
            ? `Demande à Claude de générer : ${missing
                .map((m) => (m === 'profile' ? 'ton profil' : 'un programme'))
                .join(' et ')}.`
            : 'Demande à Claude de générer un programme via MCP.'
        }
        ctaLabel="Voir les paramètres"
        onCta={() => navigate('/settings')}
      />
    );
  }

  // Aggregate stats from real reports
  const totalSetsPlanned = program.sessions.reduce(
    (acc, s) =>
      acc +
      s.blocks.reduce(
        (b, blk) => b + blk.exercises.reduce((e, ex) => e + ex.sets.length, 0),
        0,
      ),
    0,
  );
  const last7dVolume = reports
    .filter((r) => today.getTime() - new Date(r.completed_at).getTime() <= 7 * 86_400_000)
    .reduce((acc, r) => acc + r.volume_summary.total_volume_kg, 0);
  const totalSessions = reports.length;
  // Crude streak: consecutive days with at least one report ending in the last 30d.
  const streak = computeStreak(reports.map((r) => r.completed_at), today);
  const lastReport = reports[0] ?? null;

  // Block progress: sessions completed in current 7-day window vs sessions per week.
  const sessionsThisWeek = reports.filter(
    (r) => today.getTime() - new Date(r.completed_at).getTime() <= 7 * 86_400_000,
  ).length;
  const blockProgress = Math.min(
    1,
    sessionsThisWeek / Math.max(1, program.program.sessions_per_week),
  );

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />
      <header style={{ padding: '24px 20px 16px' }}>
        <h1 className="t-large" style={{ margin: 0, color: 'var(--ink)' }}>
          Aujourd'hui
        </h1>
        <div className="t-callout" style={{ color: 'var(--ink-3)', marginTop: 4 }}>
          {formatDateFR(today)}
        </div>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ padding: '0 20px', display: 'grid', gap: 20 }}
      >
        {/* iOS install hint (renders only on iOS Safari, dismissible) */}
        <motion.div variants={itemVariants}>
          <IosInstallHint />
        </motion.div>

        {/* Active program card */}
        <motion.div variants={itemVariants}>
          <Card variant="mesh" padding={20}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Badge variant="accent">Programme actif</Badge>
              <span className="t-footnote" style={{ color: 'var(--ink-3)' }}>
                · {relativeDays(program.program.generated_at, today)}
              </span>
            </div>
            <h2 className="t-title-1" style={{ margin: 0, color: 'var(--ink)' }}>
              {program.program.name}
            </h2>
            {program.program.notes ? (
              <p className="t-callout" style={{ color: 'var(--ink-2)', margin: '8px 0 0' }}>
                {program.program.notes}
              </p>
            ) : null}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              <Badge variant="neutral">{program.program.goal}</Badge>
              <Badge variant="neutral">{program.sessions.length} séances</Badge>
              <Badge variant="neutral">{totalSetsPlanned} sets</Badge>
            </div>
            <div style={{ marginTop: 16 }}>
              <div
                className="t-footnote tabular"
                style={{
                  color: 'var(--ink-3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <span>Cette semaine</span>
                <span>
                  {sessionsThisWeek}/{program.program.sessions_per_week}
                </span>
              </div>
              <ProgressBar value={blockProgress} ariaLabel="progression hebdomadaire" />
            </div>
          </Card>
        </motion.div>

        {/* Stats trio */}
        <motion.div variants={itemVariants}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <Card variant="surface" padding={14}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-3)' }}>
                <Flame size={14} />
                <span className="t-footnote">streak</span>
              </div>
              <div className="tabular" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, marginTop: 8 }}>
                {streak}j
              </div>
            </Card>
            <Card variant="surface" padding={14}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-3)' }}>
                <Layers size={14} />
                <span className="t-footnote">vol. 7j</span>
              </div>
              <div className="tabular" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, marginTop: 8 }}>
                {Math.round(last7dVolume / 1000)}t
              </div>
            </Card>
            <Card variant="surface" padding={14}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-3)' }}>
                <CheckCircle2 size={14} />
                <span className="t-footnote">total</span>
              </div>
              <div className="tabular" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, marginTop: 8 }}>
                {totalSessions}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Sessions list */}
        <motion.div variants={itemVariants}>
          <div className="t-subhead" style={{ color: 'var(--ink-3)', textTransform: 'lowercase', padding: '0 4px' }}>
            séances
          </div>
          <div className="t-footnote" style={{ color: 'var(--ink-4)', padding: '4px 4px 12px' }}>
            choisis librement
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {program.sessions.map((session, i) => {
              const lastDoneReport = reports.find((r) => r.session_id === session.id);
              const totalSets = session.blocks.reduce(
                (b, blk) => b + blk.exercises.reduce((e, ex) => e + ex.sets.length, 0),
                0,
              );
              const exCount = session.blocks.reduce((b, blk) => b + blk.exercises.length, 0);
              return (
                <motion.div key={session.id} variants={itemVariants} custom={i}>
                  <Card variant="surface" padding={16} onClick={() => navigate(`/session/${session.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="t-title-2" style={{ margin: 0, color: 'var(--ink)' }}>
                          {session.name}
                        </h3>
                        <div className="t-footnote tabular" style={{ color: 'var(--ink-3)', marginTop: 4 }}>
                          {session.estimated_duration_minutes}min · {exCount} exos · {totalSets} sets
                        </div>
                        {lastDoneReport ? (
                          <div style={{ marginTop: 8 }}>
                            <Badge variant="success">
                              <CheckCircle2 size={12} />
                              {relativeDays(lastDoneReport.completed_at, today)}
                            </Badge>
                          </div>
                        ) : null}
                      </div>
                      <ChevronRight size={20} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Last session peek */}
        {lastReport ? (
          <motion.div variants={itemVariants}>
            <Card variant="tinted" padding={14}>
              <div
                className="t-caption"
                style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Dernière séance
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span className="t-headline" style={{ flex: 1, color: 'var(--ink)' }}>
                  {lastReport.session_name}
                </span>
                <span className="t-footnote tabular" style={{ color: 'var(--ink-3)' }}>
                  {relativeDays(lastReport.completed_at, today)} · {lastReport.duration_actual_minutes}min
                </span>
              </div>
            </Card>
          </motion.div>
        ) : null}

        {/* CTA */}
        <motion.div variants={itemVariants}>
          <Button
            variant="primary"
            size="xl"
            fullWidth
            leadingIcon={<Dumbbell size={18} />}
            onClick={() => navigate(`/session/${program.sessions[0]!.id}`)}
          >
            Commencer · {program.sessions[0]!.name}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * Streak in days: number of consecutive days (going back from today)
 * with at least one completed session.
 */
function computeStreak(completedAtIsos: string[], ref: Date): number {
  if (completedAtIsos.length === 0) return 0;
  const days = new Set(
    completedAtIsos.map((iso) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  let streak = 0;
  const cursor = new Date(ref);
  // Allow "today" to count as start; if no session today, keep counting yesterday-onward.
  for (let i = 0; i < 365; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (days.has(key)) streak++;
    else if (streak > 0 || i > 0) break;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function LoadingHero() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        padding: 32,
      }}
    >
      <div className="t-callout" style={{ color: 'var(--ink-3)' }}>
        Chargement…
      </div>
    </div>
  );
}

interface EmptyHeroProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  ctaLabel: string;
  onCta: () => void;
}

function EmptyHero({ icon, title, body, ctaLabel, onCta }: EmptyHeroProps) {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          display: 'grid',
          placeItems: 'center',
          marginBottom: 20,
        }}
      >
        {icon}
      </div>
      <h2 className="t-title-2" style={{ margin: 0, color: 'var(--ink)' }}>
        {title}
      </h2>
      <p className="t-callout" style={{ color: 'var(--ink-3)', marginTop: 8, maxWidth: 320 }}>
        {body}
      </p>
      <div style={{ marginTop: 28, width: '100%', maxWidth: 320 }}>
        <Button variant="primary" size="lg" fullWidth onClick={onCta}>
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
