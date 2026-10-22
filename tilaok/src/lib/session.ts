// Plain helpers for a listening session. No React or TensorFlow here,
// so this file is easy to read and test on its own.

export type ClassKey = "noise" | "healthy" | "unhealthy";

export const CLASS_NAMES: Record<ClassKey, string> = {
  noise: "Background noise",
  healthy: "Healthy",
  unhealthy: "Unhealthy",
};

// One reading from the model (it judges ~1 second of audio each time).
export type Reading = {
  top: ClassKey; // the class with the highest score
  hit: boolean; // Unhealthy score was above the threshold
};

export type LogEntry = {
  id: number;
  at: number; // timestamp (ms)
  kind: "start" | "stop" | "unhealthy" | "alert" | "clear";
  text: string;
};

// Everything we count during one Start → Stop session.
export type Session = {
  startedAt: number;
  stoppedAt: number | null;
  counts: Record<ClassKey, number>;
  total: number;
  alerts: number; // times the alert switched on
  detections: number; // unhealthy sound events (hits close together count once)
  peak: { score: number; at: number } | null;
};

export function newSession(now: number): Session {
  return {
    startedAt: now,
    stoppedAt: null,
    counts: { noise: 0, healthy: 0, unhealthy: 0 },
    total: 0,
    alerts: 0,
    detections: 0,
    peak: null,
  };
}

export type Verdict = {
  tone: "healthy" | "alert" | "warn" | "noise";
  title: string;
  advice: string;
};

// Turn the session numbers into one plain-language verdict.
export function verdictFor(s: Session): Verdict {
  const noiseShare = s.total ? s.counts.noise / s.total : 0;

  if (s.alerts > 0) {
    return {
      tone: "alert",
      title: "Respiratory sounds detected",
      advice: `Sustained coughing, snoring or rale sounds came up ${s.alerts === 1 ? "once" : `${s.alerts} times`}. Check the birds closely and separate any that cough or wheeze. tilaOK flags symptoms only. It can't tell which disease it is.`,
    };
  }
  if (noiseShare > 0.8) {
    return {
      tone: "noise",
      title: "Mostly background noise",
      advice: "The mic barely heard the birds. Move it closer to the flock and listen again.",
    };
  }
  if (s.detections > 0) {
    return {
      tone: "warn",
      title: "A few unhealthy sounds, no alert",
      advice: `${plural(s.detections, "unhealthy sound")}, but never 3 in 5 seconds. These may be stray noises. Keep an eye on the flock.`,
    };
  }
  return {
    tone: "healthy",
    title: "Flock sounded healthy",
    advice: "No respiratory sounds were picked up during this session.",
  };
}

export function share(s: Session, key: ClassKey): number {
  return s.total ? s.counts[key] / s.total : 0;
}

// 75 → "1:15", 3725 → "1:02:05"
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

// "9:42 PM", or "9:42:07 PM" with seconds
export function formatClock(at: number, seconds = false): string {
  return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: seconds ? "2-digit" : undefined });
}

export function percent(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
