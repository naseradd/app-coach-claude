import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Flame, Layers, CheckCircle2, ChevronRight, Dumbbell } from 'lucide-react';
import { Badge, Button, Card, ProgressBar } from '../components/ui/index.js';
import { mockProgram, mockReports, formatDateFR, relativeDays } from '../mocks/index.js';

const today = new Date('2026-04-30T10:00:00Z');

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

export function Today() {
  const navigate = useNavigate();
  const program = mockProgram;
  const reports = mockReports;
  const lastReport = reports[0];

  // Compute aggregate stats
  const totalSetsPlanned = program.sessions.reduce(
    (acc, s) => acc + s.blocks.reduce((b, blk) => b + blk.exercises.reduce((e, ex) => e + ex.sets.length, 0), 0),
    0,
  );
  const last7dVolume = reports
    .filter((r) => {
      const d = new Date(r.completed_at).getTime();
      return today.getTime() - d <= 7 * 24 * 3600 * 1000;
    })
    .reduce((acc, r) => acc + r.volume_summary.total_volume_kg, 0);
  const totalSessions = reports.length;
  const streak = 3; // mock

  // Block progress mock: 3 séances complétées sur 4 dans le bloc actuel
  const blockProgress = 3 / 4;

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />
      {/* Large title header */}
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
        {/* Active program card */}
        <motion.div variants={itemVariants}>
          <Card variant="mesh" padding={20}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Badge variant="accent">Programme actif</Badge>
              <span className="t-footnote" style={{ color: 'var(--ink-3)' }}>
                · démarré il y a 8j
              </span>
            </div>
            <h2 className="t-title-1" style={{ margin: 0, color: 'var(--ink)' }}>
              {program.program.name}
            </h2>
            <p className="t-callout" style={{ color: 'var(--ink-2)', margin: '8px 0 0' }}>
              {program.program.notes}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              <Badge variant="neutral">{program.program.goal}</Badge>
              <Badge variant="neutral">{program.sessions.length} séances</Badge>
              <Badge variant="neutral">{totalSetsPlanned} sets</Badge>
            </div>
            <div style={{ marginTop: 16 }}>
              <div
                className="t-footnote tabular"
                style={{ color: 'var(--ink-3)', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
              >
                <span>Bloc 1 · semaine 2</span>
                <span>{Math.round(blockProgress * 100)}%</span>
              </div>
              <ProgressBar value={blockProgress} ariaLabel="progression du bloc" />
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
                <motion.div
                  key={session.id}
                  variants={itemVariants}
                  custom={i}
                >
                  <Card variant="surface" padding={16} onClick={() => navigate(`/session/${session.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="t-title-2" style={{ margin: 0, color: 'var(--ink)' }}>
                          {session.name}
                        </h3>
                        <div
                          className="t-footnote tabular"
                          style={{ color: 'var(--ink-3)', marginTop: 4 }}
                        >
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
              <div className="t-caption" style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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

        {/* CTA: shortcut to start a session */}
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
