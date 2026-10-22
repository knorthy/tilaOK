# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
A poultry farmer who leaves a phone or laptop running near the flock. They glance at it between chores, sometimes from across the room, and need to know right away whether the birds sound healthy. When they finish a listening session, they want a short report they can act on.

The project is a school prototype (Cavite State University, CEIT, Laboratory #6 "Automate Everyday Events"), but the page is framed as the farmer's tool, not as a lab demo.

## Product Purpose
Respiratory disease in poultry is noticed too late because nobody can listen to every bird all day. tilaOK listens through a microphone and uses a trained audio model to flag respiratory sounds (coughing, snoring, rales). That lets a farmer step in early. Success means the farmer can see quickly whether something needs attention and has a session report to back it up.

## Positioning
It runs fully in the browser, with no server, using a model fine-tuned on real poultry vocalizations. It listens all the time, which a person can't do. It detects respiratory symptoms only and never claims to diagnose a specific disease.

## Operating Context
- Live microphone input, chosen from the device's audio inputs. Audio is not routed through a virtual cable.
- The model judges 1-second windows, several times per second.
- A session runs from Start to Stop. Stopping produces a session report.
- Real-world version: a cheap mic in the poultry house plus this model on a Raspberry Pi or phone, sending SMS or app alerts.

## Capabilities and Constraints
- Classes: Background Noise, Healthy, Unhealthy (labels from metadata.json; "Healthy " has a trailing space and is trimmed for display).
- Alert rule: Unhealthy above the threshold (70% by default, adjustable) in at least 3 of the last 5 predictions.
- Required UI: mic picker, Start/Stop, live confidence for the three classes, a status (listening / healthy / respiratory sounds detected), a timestamped event log (newest first), a count of unhealthy detections in the last hour, and a session report shown on Stop.
- Session report: duration, share of predictions per class, number of alerts, peak Unhealthy confidence, and an overall verdict.
- Must work at phone width. Needs a secure context (localhost or https) for the mic.
- Stack: Next.js 16 App Router, TypeScript, Tailwind v4, @tensorflow/tfjs 3.21.0 plus @tensorflow-models/speech-commands 0.5.4. No other libraries without asking.

## Brand Commitments
- Name: **tilaOK**. "tilaok" is the sound a chicken makes (Filipino onomatopoeia). The capital **OK** shows the chicken is OK. Always write it as "tilaOK".
- Visual preference (chosen 2026-10-22): the category standard, a clean dashboard played straight. Polish benchmark: Vercel / Linear dashboards (crisp, minimal, precise).

## Evidence on Hand
- Model: `public/model/`, Teachable Machine audio model trained on 1,000 samples (400 background, 300 healthy, 300 unhealthy) over 50 epochs.
- Dataset: Poultry Vocalization Signal Dataset (Mendeley, doi:10.17632/zp4nf2dxbh.1).
- We have no accuracy figures, testimonials or field results. Don't invent any.

## Product Principles
- Answer "is the flock OK?" before anything else.
- Don't let one stray sound cause a false alarm. Alerts need sustained evidence.
- Be honest about the limits. The page names what the model can't do: it was trained on clean recordings of chicks at one farm in Nigeria, it judges 1 second at a time, and the training set was small.
- It flags symptoms; it doesn't diagnose.

## Accessibility & Inclusion
Status is never shown by color alone. It must be readable at a glance from a distance and usable outdoors on a phone.
