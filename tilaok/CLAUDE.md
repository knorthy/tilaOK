# tilaOK – Project Context

## What this is
tilaOK is a school prototype for Laboratory #6 "Automate Everyday Events"
(Cavite State University, CEIT). It is a poultry respiratory-disease monitor: a microphone listens
to a flock and an AI audio model flags coughing, snoring and rale sounds so a farmer can act early.

This repo is a Next.js web app that runs the trained model live in the browser.

## The model
- Trained in Google Teachable Machine (Audio Project), exported as TensorFlow.js.
- Files live in `public/model/`: `model.json`, `metadata.json`, `weights.bin` (~5.7 MB).
  Served at `/model/model.json` and `/model/metadata.json`. Never rename or edit these files.
- Base: Google speech-commands (BROWSER_FFT), fine-tuned with transfer learning.
- Input: 1-second audio windows converted to spectrograms (shape 43 x 232 x 1).
- Classes (exact strings from metadata.json, in this order):
  - `"Background Noise"`
  - `"Healthy "`  ← has a trailing space; always `.trim()` labels for display and comparisons
  - `"Unhealthy"`
- Training data: 400 Background Noise, 300 Healthy, 300 Unhealthy samples (1,000 total),
  50 epochs. Source: Poultry Vocalization Signal Dataset (Mendeley, doi:10.17632/zp4nf2dxbh.1),
  fed into Teachable Machine through VB-Audio Virtual Cable.

## Tech stack
- Next.js (App Router), TypeScript, Tailwind CSS. Windows + PowerShell, npm.
- ML packages (pinned; speech-commands 0.5.4 needs tfjs 3.x, not 4.x):
  ```
  npm i @tensorflow/tfjs@3.21.0 @tensorflow-models/speech-commands@0.5.4
  ```

## Next.js rules for the ML code (important)
- TensorFlow.js and the microphone only exist in the browser. Any component that touches them
  must be a Client Component (`"use client"`), and the libraries must be imported dynamically
  inside an effect or click handler, never at module top level (it breaks SSR / `next build`):
  ```ts
  const tf = await import("@tensorflow/tfjs");          // import tfjs first (registers backends)
  await tf.ready();
  const speechCommands = await import("@tensorflow-models/speech-commands");
  // must be absolute URLs; a bare "/model/..." path throws "Unsupported URL scheme"
  const base = window.location.origin;
  const recognizer = speechCommands.create(
    "BROWSER_FFT", undefined, `${base}/model/model.json`, `${base}/model/metadata.json`);
  await recognizer.ensureModelLoaded();
  const labels = recognizer.wordLabels();
  ```
  Alternatively, load the monitor component with `next/dynamic` and `{ ssr: false }`.
- Keep the recognizer in a `useRef`, not state. Create it once.
- Listen:
  ```ts
  await recognizer.listen(async result => {
    const scores = Array.from(result.scores as Float32Array); // in label order
  }, {
    probabilityThreshold: 0,
    invokeCallbackOnNoiseAndUnknown: true,
    overlapFactor: 0.5,
    includeSpectrogram: true,
    audioTrackConstraints: { deviceId: selectedMicId }, // from enumerateDevices()
  });
  ```
- Check `recognizer.isListening()` before calling `listen` or `stopListening` (both throw if
  called in the wrong state). React Strict Mode runs effects twice in dev, so guard against that.
- Stop listening in the effect cleanup / on unmount, and before restarting with a different mic.
- Throttle UI updates from the listen callback (it fires several times per second).

## How it is run and tested
- `npm run dev` → http://localhost:3000. `localhost` is a secure context, so the mic works.
- Mic device names only appear after the user grants microphone permission once.
- Windows speaker output set to "CABLE Input (VB-Audio Virtual Cable)"; in the page, the mic
  dropdown is set to "CABLE Output (VB-Audio Virtual Cable)".
- Held-out test WAV clips (never used in training) are played on the laptop; the model hears them
  through the cable. Nothing is audible through the speakers while routed this way.
- Deploying to Vercel gives an https link, which the mic also requires.

## UI requirements
- Mic dropdown (audioinput devices only); restart listening on change.
- Start / Stop Listening button.
- Live confidence bars for the three classes.
- Status card: grey "Listening...", green "Flock sounds healthy", red "Respiratory sounds detected".
- Alert rule: red only when Unhealthy > threshold (default 70%) in at least 3 of the last 5
  predictions, so one stray noise doesn't trigger it. Threshold adjustable with a slider.
- Event log with timestamps, newest first (e.g. "9:42 PM – Unhealthy sound detected (91%)").
- Counter of unhealthy detections in the last hour.
- Clean farm IoT dashboard look; responsive down to phone width.

## Framing (for copy on the page)
- Sector: Agriculture (poultry). Problem: respiratory disease is noticed too late because no one
  can listen to every bird all day.
- Real-world version: a cheap mic in the poultry house + this model on a Raspberry Pi or phone,
  sending SMS/app alerts.
- It detects respiratory symptoms only; it does not diagnose a specific disease. Don't claim it does.

## Known limitations (don't hide these in the UI)
- Trained on clean recordings from chicks at one farm in Nigeria; live farm audio
  (fans, feeders, distance, Philippine breeds, older birds) may lower accuracy.
- Judges 1 second at a time; a rooster crow or sneeze-like noise can cause a false reading.
- Teachable Machine froze at ~3,800 samples, so training was capped at 300–400 per class.

## Working preferences
- Small, readable code with comments a classmate can follow.
- Don't add libraries beyond tfjs and speech-commands (plus what Next.js/Tailwind already provide)
  without asking.
