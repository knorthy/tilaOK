import Monitor from "@/components/Monitor";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">
          tila<span className="text-healthy">OK</span>
        </h1>
        <p className="text-sm text-muted">Listens to your flock and flags respiratory sounds early.</p>
      </header>

      <main className="flex-1 py-6 sm:py-8">
        <Monitor />
      </main>

      <footer className="grid gap-8 border-t border-line py-8 text-sm leading-relaxed text-muted md:grid-cols-3">
        <div>
          <h2 className="mb-2 font-medium text-fg">How it works</h2>
          <p>
            A microphone near the flock feeds 1-second clips to an AI audio model running right in this browser. Nothing is uploaded.
            Each clip is scored as healthy chicken sounds, unhealthy (coughing, snoring, rales) or background noise.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-medium text-fg">What it can&apos;t do</h2>
          <p>
            tilaOK flags respiratory symptoms. It does not diagnose a disease. It was trained on clean recordings of chicks from one farm in
            Nigeria, and only 300–400 clips per class, so fans, feeders, distance, Philippine breeds or older birds may lower accuracy. It judges
            1 second at a time, so a rooster crow or a sneeze-like noise can cause a false reading.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-medium text-fg">About</h2>
          <p>
            Trained in Teachable Machine on 1,000 clips from the{" "}
            <a className="underline hover:text-fg" href="https://doi.org/10.17632/zp4nf2dxbh.1" target="_blank" rel="noopener noreferrer">
              Poultry Vocalization Signal Dataset
            </a>
            . A Laboratory #6 prototype, Cavite State University CEIT. The name: &ldquo;tilaok&rdquo; is the sound a chicken makes, and the OK means the flock is OK.
          </p>
        </div>
      </footer>
    </div>
  );
}
