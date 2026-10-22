"use client";

// The live flock monitor: mic picker, Start/Stop, live scores, status,
// event log and the session report. TensorFlow.js only runs in the browser,
// so it is imported inside the Start handler, never at the top of this file.

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechCommandRecognizer } from "@tensorflow-models/speech-commands";
import {
  CLASS_NAMES,
  type ClassKey,
  type LogEntry,
  type Reading,
  type Session,
  formatClock,
  formatDuration,
  newSession,
  percent,
  share,
  verdictFor,
} from "@/lib/session";

const HISTORY_SIZE = 60; // readings shown in the history strip
const WINDOW_SIZE = 5; // alert rule: look at the last 5 readings...
const WINDOW_HITS = 3; // ...and alert when 3 of them are unhealthy
const MERGE_MS = 3000; // unhealthy hits closer than this count as one sound
const HOUR_MS = 60 * 60 * 1000;
const UI_REFRESH_MS = 250; // the model fires several times a second; redraw at most 4x/s

// Dev-only demo: open /?demo=healthy or /?demo=alert while running `npm run dev`
// to feed made-up readings instead of the mic. Never active in a production build.
function demoMode(): "healthy" | "alert" | null {
  if (process.env.NODE_ENV !== "development") return null;
  const d = new URLSearchParams(window.location.search).get("demo");
  return d === "healthy" || d === "alert" ? d : null;
}

// Made-up scores in model label order: [Background Noise, Healthy, Unhealthy]
function demoScores(mode: "healthy" | "alert", n: number): Float32Array {
  const sick = mode === "alert" ? n % 10 >= 4 && n % 10 <= 8 : n === 6;
  if (sick) return new Float32Array([0.04, 0.06, 0.9]);
  if (n % 7 === 3) return new Float32Array([0.8, 0.15, 0.05]);
  return new Float32Array([0.08, 0.88, 0.04]);
}

type Phase = "idle" | "loading" | "listening" | "stopped" | "error";
type Scores = Record<ClassKey, number>;

// Map the model's label strings to our keys. "Healthy " has a trailing space,
// so labels are always trimmed before comparing.
function keyForLabel(label: string): ClassKey | null {
  const l = label.trim().toLowerCase();
  if (l === "background noise") return "noise";
  if (l === "healthy") return "healthy";
  if (l === "unhealthy") return "unhealthy";
  return null;
}

export default function Monitor() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [micId, setMicId] = useState("");
  const [threshold, setThreshold] = useState(0.7);

  // A snapshot of the refs below, copied into state every UI_REFRESH_MS.
  const [view, setView] = useState<{
    scores: Scores;
    history: Reading[];
    alertOn: boolean;
    log: LogEntry[];
    lastHour: number;
    session: Session | null;
    now: number;
  }>({
    scores: { noise: 0, healthy: 0, unhealthy: 0 },
    history: [],
    alertOn: false,
    log: [],
    lastHour: 0,
    session: null,
    now: 0,
  });

  // Fast-changing data lives in refs so the model callback never re-renders React.
  const recognizerRef = useRef<SpeechCommandRecognizer | null>(null);
  const keysRef = useRef<(ClassKey | null)[]>([]);
  const thresholdRef = useRef(threshold);
  const scoresRef = useRef<Scores>({ noise: 0, healthy: 0, unhealthy: 0 });
  const historyRef = useRef<Reading[]>([]);
  const windowRef = useRef<boolean[]>([]);
  const alertRef = useRef(false);
  const logRef = useRef<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const soundRef = useRef<{ entry: LogEntry; lastAt: number; peak: number } | null>(null);
  const detectionTimesRef = useRef<number[]>([]);
  const sessionRef = useRef<Session | null>(null);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  const addLog = useCallback((kind: LogEntry["kind"], text: string, at = Date.now()) => {
    const entry: LogEntry = { id: ++logIdRef.current, at, kind, text };
    logRef.current = [entry, ...logRef.current].slice(0, 200); // newest first
    return entry;
  }, []);

  // Copy the refs into state so React redraws.
  const refreshView = useCallback(() => {
    const now = Date.now();
    detectionTimesRef.current = detectionTimesRef.current.filter((t) => now - t < HOUR_MS);
    setView({
      scores: { ...scoresRef.current },
      history: [...historyRef.current],
      alertOn: alertRef.current,
      log: [...logRef.current],
      lastHour: detectionTimesRef.current.length,
      session: sessionRef.current ? { ...sessionRef.current } : null,
      now,
    });
  }, []);

  // List microphones. Names only show up after mic permission is granted once.
  const loadMics = useCallback(() => {
    navigator.mediaDevices
      ?.enumerateDevices?.()
      .then((devices) => setMics(devices.filter((d) => d.kind === "audioinput" && d.deviceId)));
  }, []);

  useEffect(() => {
    loadMics();
    navigator.mediaDevices?.addEventListener?.("devicechange", loadMics);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", loadMics);
  }, [loadMics]);

  // Called by the model for every ~1 second window it judges.
  const onResult = useCallback(
    (raw: Float32Array) => {
      const s = sessionRef.current;
      if (!s) return;
      const now = Date.now();

      const scores: Scores = { noise: 0, healthy: 0, unhealthy: 0 };
      keysRef.current.forEach((key, i) => {
        if (key) scores[key] = raw[i] ?? 0;
      });
      scoresRef.current = scores;

      const top = (Object.keys(scores) as ClassKey[]).reduce((a, b) => (scores[b] > scores[a] ? b : a));
      const hit = scores.unhealthy > thresholdRef.current;

      // Session counts
      s.counts[top]++;
      s.total++;
      if (!s.peak || scores.unhealthy > s.peak.score) s.peak = { score: scores.unhealthy, at: now };

      // Alert rule: 3 of the last 5 readings above the threshold
      windowRef.current = [...windowRef.current, hit].slice(-WINDOW_SIZE);
      const alertNow = windowRef.current.filter(Boolean).length >= WINDOW_HITS;

      // Unhealthy sounds: hits close together become one log entry with the peak confidence
      if (hit) {
        const open = soundRef.current;
        if (open && now - open.lastAt < MERGE_MS) {
          open.lastAt = now;
          open.peak = Math.max(open.peak, scores.unhealthy);
          open.entry.text = `Unhealthy sound detected (${percent(open.peak)})`;
        } else {
          const entry = addLog("unhealthy", `Unhealthy sound detected (${percent(scores.unhealthy)})`, now);
          soundRef.current = { entry, lastAt: now, peak: scores.unhealthy };
          detectionTimesRef.current.push(now);
          s.detections++;
        }
      }

      if (alertNow && !alertRef.current) {
        s.alerts++;
        addLog("alert", "Alert: respiratory sounds in 3 of the last 5 seconds", now);
      } else if (!alertNow && alertRef.current) {
        addLog("clear", "Alert cleared", now);
      }
      alertRef.current = alertNow;

      historyRef.current = [...historyRef.current, { top, hit, alert: alertNow }].slice(-HISTORY_SIZE);
    },
    [addLog],
  );

  const startListening = useCallback(
    async (deviceId: string) => {
      const demo = demoMode();
      if (demo) {
        let n = 0;
        demoTimerRef.current = setInterval(() => onResult(demoScores(demo, n++)), 500);
        return;
      }
      const recognizer = recognizerRef.current;
      if (!recognizer || recognizer.isListening()) return;
      await recognizer.listen(async (result) => onResult(result.scores as Float32Array), {
        probabilityThreshold: 0,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.5,
        audioTrackConstraints: deviceId ? { deviceId: { exact: deviceId } } : undefined,
      });
    },
    [onResult],
  );

  const start = async () => {
    setError("");
    setPhase("loading");
    try {
      // Load the model once, the first time Start is pressed.
      if (demoMode()) {
        keysRef.current = ["noise", "healthy", "unhealthy"];
      } else if (!recognizerRef.current) {
        const tf = await import("@tensorflow/tfjs"); // tfjs first: it registers the backends
        await tf.ready();
        const speechCommands = await import("@tensorflow-models/speech-commands");
        // speech-commands needs full URLs (http://...), not paths like "/model/model.json".
        const base = window.location.origin;
        const recognizer = speechCommands.create("BROWSER_FFT", undefined, `${base}/model/model.json`, `${base}/model/metadata.json`);
        await recognizer.ensureModelLoaded();
        keysRef.current = recognizer.wordLabels().map(keyForLabel);
        recognizerRef.current = recognizer;
      }

      // Fresh session
      const now = Date.now();
      sessionRef.current = newSession(now);
      historyRef.current = [];
      windowRef.current = [];
      alertRef.current = false;
      soundRef.current = null;
      scoresRef.current = { noise: 0, healthy: 0, unhealthy: 0 };
      addLog("start", "Started listening", now);

      await startListening(micId);
      setPhase("listening");
      loadMics(); // permission is granted now, so real mic names are available
      refreshView();
    } catch (e) {
      sessionRef.current = null;
      setPhase("error");
      setError(explainError(e));
      refreshView();
    }
  };

  const stop = async () => {
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    const recognizer = recognizerRef.current;
    if (recognizer?.isListening()) await recognizer.stopListening();
    if (sessionRef.current) sessionRef.current.stoppedAt = Date.now();
    alertRef.current = false;
    scoresRef.current = { noise: 0, healthy: 0, unhealthy: 0 }; // live bars only show while listening
    addLog("stop", "Stopped listening");
    setPhase("stopped");
    refreshView();
  };

  // Switching mics while listening restarts the stream, but keeps the session.
  const changeMic = async (id: string) => {
    setMicId(id);
    const recognizer = recognizerRef.current;
    if (phase !== "listening" || !recognizer) return;
    try {
      if (recognizer.isListening()) await recognizer.stopListening();
      await startListening(id);
    } catch (e) {
      setPhase("error");
      setError(explainError(e));
    }
  };

  // Redraw on a timer while listening (throttles the fast model callback).
  useEffect(() => {
    if (phase !== "listening") return;
    const timer = setInterval(refreshView, UI_REFRESH_MS);
    return () => clearInterval(timer);
  }, [phase, refreshView]);

  // Stop the mic when the page unmounts. Guarded, because Strict Mode runs effects twice in dev.
  useEffect(() => {
    return () => {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
      const recognizer = recognizerRef.current;
      if (recognizer?.isListening()) recognizer.stopListening().catch(() => {});
    };
  }, []);

  const listening = phase === "listening";
  const busy = phase === "loading";
  const status = statusFor(phase, view, error);
  const lastHourLabel = "Unhealthy sounds, last hour";

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-[360px]">
          <span className="text-sm text-muted">Microphone</span>
          <select
            value={micId}
            onChange={(e) => changeMic(e.target.value)}
            disabled={busy}
            className="field h-11 w-full min-w-0 truncate rounded-md border border-line bg-surface px-3 text-[15px] disabled:opacity-60"
          >
            <option value="">Default microphone</option>
            {mics.map((m, i) => (
              <option key={m.deviceId} value={m.deviceId}>
                {m.label || `Microphone ${i + 1}`}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={listening ? stop : start}
          disabled={busy}
          aria-busy={busy}
          className={
            listening
              ? "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-surface px-5 font-medium text-fg transition-colors hover:bg-subtle sm:w-56"
              : "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-fg px-5 font-medium text-bg transition-opacity hover:opacity-85 disabled:opacity-60 sm:w-56"
          }
        >
          {listening ? (
            <>
              <span className="rec-dot size-2.5 rounded-full bg-fg" aria-hidden />
              Stop listening
            </>
          ) : busy ? (
            "Loading model…"
          ) : (
            <>
              <IconMic />
              {phase === "stopped" ? "Start a new session" : "Start listening"}
            </>
          )}
        </button>
      </div>

      {/* Status band */}
      <section
        aria-live="polite"
        className={`status-band flex flex-col gap-4 rounded-xl border px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-8 tone-${status.tone}`}
      >
        <div className="flex items-start gap-4">
          <span className="mt-1 shrink-0 tone-ink">
            <StatusIcon tone={status.tone} />
          </span>
          <div>
            <h2 className="text-balance text-[clamp(1.75rem,4.5vw,2.75rem)] font-semibold leading-tight tracking-[-0.03em] tone-ink">
              {status.title}
            </h2>
            <p className="mt-1.5 max-w-[60ch] text-[15px] text-muted sm:text-base">{status.detail}</p>
          </div>
        </div>
        {view.session && (
          <div className="flex shrink-0 gap-6 sm:text-right">
            <Stat label={listening ? "Listening for" : "Session length"} value={formatDuration((view.session.stoppedAt ?? view.now) - view.session.startedAt)} />
            <Stat label={lastHourLabel} value={String(view.lastHour)} />
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        {/* Live confidence */}
        <section className="panel">
          <PanelHead title="Live confidence" note={listening ? "Updates several times a second" : "Shows while listening"} />
          <div className="flex flex-col gap-4 p-5">
            {(["unhealthy", "healthy", "noise"] as ClassKey[]).map((key) => (
              <ConfidenceBar key={key} cls={key} value={view.scores[key]} threshold={key === "unhealthy" ? threshold : undefined} />
            ))}
          </div>
          <div className="border-t border-line p-5">
            <label htmlFor="threshold" className="flex items-baseline justify-between gap-4 text-sm">
              <span className="font-medium">Alert threshold</span>
              <span className="font-mono tabular-nums">{percent(threshold)}</span>
            </label>
            <input
              id="threshold"
              type="range"
              min={0.5}
              max={0.95}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="range mt-3 w-full"
            />
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Alerts when Unhealthy is above {percent(threshold)} in {WINDOW_HITS} of the last {WINDOW_SIZE} readings, so one stray noise won&apos;t set it off.
            </p>
          </div>
          <div className="border-t border-line p-5">
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h3 className="text-sm font-medium">Last {HISTORY_SIZE} readings</h3>
              <span className="text-xs text-muted">older → newer</span>
            </div>
            <HistoryStrip history={view.history} />
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <li className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-healthy" aria-hidden />Healthy</li>
              <li className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-alert" aria-hidden />Unhealthy</li>
              <li className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-noise" aria-hidden />Background</li>
              <li className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-alert" aria-hidden />Alert on</li>
            </ul>
          </div>
        </section>

        {/* Event log */}
        <section className="panel flex flex-col">
          <PanelHead title="Event log" note="Newest first" />
          <EventLog log={view.log} />
        </section>
      </div>

      <SessionReport session={view.session} live={listening} now={view.now} threshold={threshold} />
    </div>
  );
}

/* ---------- status ---------- */

type Tone = "idle" | "healthy" | "alert" | "warn" | "noise";

function statusFor(phase: Phase, view: { history: Reading[]; alertOn: boolean; session: Session | null }, error: string) {
  if (phase === "error") return { tone: "warn" as Tone, title: "Couldn't start listening", detail: error };
  if (phase === "loading") return { tone: "idle" as Tone, title: "Loading the model…", detail: "This takes a few seconds the first time. Allow microphone access if your browser asks." };
  if (phase === "stopped") {
    // After Stop, the band shows the session's verdict: the answer the farmer came for.
    const s = view.session;
    if (!s || !s.total) return { tone: "idle" as Tone, title: "Stopped", detail: "No readings were taken. Press Start to listen again." };
    const v = verdictFor(s);
    return { tone: v.tone as Tone, title: v.title, detail: `Session ended after ${formatDuration((s.stoppedAt ?? s.startedAt) - s.startedAt)}. The full report is below.` };
  }
  if (phase === "idle") return { tone: "idle" as Tone, title: "Not listening", detail: "Place the device near the flock, pick a microphone, and press Start listening." };

  if (view.alertOn) {
    return { tone: "alert" as Tone, title: "Respiratory sounds detected", detail: "Coughing, snoring or rale sounds keep coming up. Check the flock." };
  }
  // Use the last few readings so the status doesn't flicker on every second.
  const recent = view.history.slice(-WINDOW_SIZE);
  const healthy = recent.filter((r) => r.top === "healthy").length;
  if (recent.length >= WINDOW_SIZE && healthy >= WINDOW_HITS) {
    return { tone: "healthy" as Tone, title: "Flock sounds healthy", detail: "Normal chicken sounds, with no respiratory symptoms heard." };
  }
  return { tone: "idle" as Tone, title: "Listening…", detail: "Waiting to hear the birds clearly. Mostly background noise so far." };
}

function StatusIcon({ tone }: { tone: Tone }) {
  if (tone === "healthy") return <IconCheck />;
  if (tone === "alert" || tone === "warn") return <IconAlert />;
  return <IconWave />;
}

/* ---------- pieces ---------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-medium tabular-nums tracking-tight sm:text-3xl">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

function PanelHead({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-3.5">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {note && <span className="text-xs text-muted">{note}</span>}
    </div>
  );
}

const BAR_COLOR: Record<ClassKey, string> = { unhealthy: "bg-alert", healthy: "bg-healthy", noise: "bg-noise" };

function ConfidenceBar({ cls, value, threshold }: { cls: ClassKey; value: number; threshold?: number }) {
  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)_3.25rem] items-center gap-3 text-sm max-sm:grid-cols-[7.75rem_minmax(0,1fr)_3rem]">
      <span>{CLASS_NAMES[cls]}</span>
      <div
        className="relative h-2.5 rounded-full bg-subtle"
        role="meter"
        aria-label={`${CLASS_NAMES[cls]} confidence`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
      >
        <div className={`bar-fill h-full rounded-full ${BAR_COLOR[cls]}`} style={{ width: `${value * 100}%` }} />
        {threshold !== undefined && (
          <span className="absolute -top-1 -bottom-1 w-px bg-fg/50" style={{ left: `${threshold * 100}%` }} title={`Threshold ${percent(threshold)}`} />
        )}
      </div>
      <span className="text-right font-mono tabular-nums">{percent(value)}</span>
    </div>
  );
}

const TICK_COLOR: Record<ClassKey, string> = { unhealthy: "bg-alert", healthy: "bg-healthy", noise: "bg-noise" };

function HistoryStrip({ history }: { history: Reading[] }) {
  const empty = HISTORY_SIZE - history.length;
  const unhealthy = history.filter((r) => r.top === "unhealthy").length;
  return (
    <div
      role="img"
      aria-label={history.length ? `Last ${history.length} readings: ${unhealthy} unhealthy` : "No readings yet"}
      className="flex h-9 gap-[2px]"
    >
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e${i}`} className="mb-[5px] flex-1 rounded-[2px] bg-subtle" />
      ))}
      {history.map((r, i) => (
        <span key={i} className="flex flex-1 flex-col gap-[2px]">
          <span className={`flex-1 rounded-[2px] ${TICK_COLOR[r.top]}`} />
          <span className={`h-[3px] rounded-[1px] ${r.alert ? "bg-alert" : "bg-transparent"}`} />
        </span>
      ))}
    </div>
  );
}

const LOG_DOT: Record<LogEntry["kind"], string> = {
  start: "bg-noise",
  stop: "bg-noise",
  unhealthy: "bg-alert",
  alert: "bg-alert",
  clear: "bg-healthy",
};

function EventLog({ log }: { log: LogEntry[] }) {
  if (!log.length) {
    return <p className="p-5 text-sm text-muted">Nothing yet. Events show up here once you start listening.</p>;
  }
  return (
    <ol className="max-h-[22rem] flex-1 overflow-y-auto">
      {log.map((e) => (
        <li key={e.id} className="flex items-baseline gap-3 border-b border-line px-5 py-2.5 text-sm last:border-b-0">
          <time className="w-[4.75rem] shrink-0 font-mono text-xs tabular-nums text-muted">{formatClock(e.at)}</time>
          <span className={`size-1.5 shrink-0 translate-y-[-1px] rounded-full ${LOG_DOT[e.kind]}`} aria-hidden />
          <span className={e.kind === "alert" ? "font-medium text-alert" : ""}>{e.text}</span>
        </li>
      ))}
    </ol>
  );
}

function SessionReport({ session, live, now, threshold }: { session: Session | null; live: boolean; now: number; threshold: number }) {
  if (!session) {
    return (
      <section className="panel">
        <PanelHead title="Session report" />
        <p className="p-5 text-sm text-muted">No session yet. When you stop listening, a summary of what tilaOK heard appears here.</p>
      </section>
    );
  }

  const verdict = verdictFor(session);
  const end = session.stoppedAt ?? now;
  const classes: ClassKey[] = ["healthy", "unhealthy", "noise"];

  return (
    <section className="panel" aria-labelledby="report-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3.5">
        <h2 id="report-title" className="text-[15px] font-semibold">Session report</h2>
        <span className="text-xs text-muted">
          {formatClock(session.startedAt, true)} – {session.stoppedAt ? formatClock(session.stoppedAt, true) : "now"}
          {live && " · updating live, final when you stop"}
        </span>
      </div>

      <div className={`flex items-start gap-3 border-b border-line px-5 py-6 tone-${verdict.tone} report-verdict`}>
        <span className="mt-1 shrink-0 tone-ink">
          <StatusIcon tone={verdict.tone} />
        </span>
        <div>
          <h3 className="text-2xl font-semibold tracking-[-0.02em] tone-ink">{session.total ? verdict.title : "No readings yet"}</h3>
          <p className="mt-1 max-w-[70ch] text-sm leading-relaxed text-muted">
            {session.total ? verdict.advice : "The model needs a second or two of audio before it reports anything."}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 border-b border-line sm:grid-cols-4">
        <ReportStat label="Duration" value={formatDuration(end - session.startedAt)} />
        <ReportStat label="Readings" value={String(session.total)} />
        <ReportStat label="Alerts" value={String(session.alerts)} accent={session.alerts > 0} />
        <ReportStat
          label="Peak unhealthy"
          value={session.peak ? percent(session.peak.score) : "–"}
          sub={session.peak && session.peak.score > 0.05 ? `at ${formatClock(session.peak.at)}` : undefined}
        />
      </dl>

      <div className="p-5">
        <h3 className="text-sm font-medium">What the model heard</h3>
        <p className="mt-0.5 text-xs text-muted">Share of readings where each class scored highest</p>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-subtle" aria-hidden>
          {classes.map((key) => (
            <span key={key} className={`h-full ${BAR_COLOR[key]}`} style={{ width: `${share(session, key) * 100}%` }} />
          ))}
        </div>
        <table className="mt-3 w-full max-w-md text-sm">
          <tbody>
            {classes.map((key) => (
              <tr key={key}>
                <td className="py-1 pr-3">
                  <span className="flex items-center gap-2">
                    <span className={`size-2 rounded-sm ${BAR_COLOR[key]}`} aria-hidden />
                    {CLASS_NAMES[key]}
                  </span>
                </td>
                <td className="py-1 pr-3 text-right font-mono tabular-nums">{percent(share(session, key))}</td>
                <td className="py-1 text-right font-mono text-xs tabular-nums text-muted">{session.counts[key]} {session.counts[key] === 1 ? "reading" : "readings"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-muted">
          {session.counts.unhealthy} {session.counts.unhealthy === 1 ? "reading" : "readings"} leaned unhealthy; {session.detections}{" "}
          {session.detections === 1 ? "sound" : "sounds"} crossed the {percent(threshold)} threshold and went in the log. Each reading judges about 1 second of audio.
        </p>
      </div>
    </section>
  );
}

function ReportStat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="border-line px-5 py-4 [&:not(:last-child)]:border-r max-sm:[&:nth-child(2)]:border-r-0 max-sm:[&:nth-child(-n+2)]:border-b">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-1 font-mono text-2xl font-medium tabular-nums tracking-tight ${accent ? "text-alert" : ""}`}>{value}</dd>
      {sub && <dd className="text-xs text-muted">{sub}</dd>}
    </div>
  );
}

function explainError(e: unknown): string {
  const name = e instanceof Error ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Microphone access was blocked. Allow the mic from your browser's address bar, then press Start again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "That microphone isn't available. Plug it in or pick another one, then press Start again.";
  }
  return `Something went wrong: ${e instanceof Error ? e.message : String(e)}`;
}

/* ---------- icons (one 1.75px stroke set) ---------- */

function Svg({ children, size = 26 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}
function IconCheck() {
  return <Svg><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.75 2.75L16 10" /></Svg>;
}
function IconAlert() {
  return <Svg><path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4.5M12 17h.01" /></Svg>;
}
function IconWave() {
  return <Svg><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2M21 12h0" /></Svg>;
}
function IconMic() {
  return <Svg size={18}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></Svg>;
}
