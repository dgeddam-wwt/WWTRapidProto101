1. The Real Business Problem

The presenting problem looks like "PHI is leaking over unencrypted email." But that's a symptom. The actual business problem is:

Kenstrel has no repeatable, real-time compliance layer embedded in the communication workflow itself — so every message either moves fast and risks a HIPAA violation, or moves slow because a human has to self-police with no tooling support.

Three things are compounding this:

Speed vs. safety is currently a binary tradeoff for staff — there's no middle path that lets them do both.
Fear is itself a productivity tax. Staff hesitation, second-guessing, and manual re-reading of every message is likely costing more throughput than the eventual infrastructure fix would.
This isn't really an infrastructure gap — it's a decision-support gap at the point of authoring. Leadership is thinking about this as "do we need encrypted email/EHR messaging," when the sharper question is "how do we give staff real-time judgment support so speed and compliance aren't in conflict."
2. The Decision the Customer Needs to Make

Leadership needs to decide where to intervene in the workflow — and that's really a choice between three postures:

Build/buy heavy infrastructure (encrypted patient portal, secure messaging platform, EHR-integrated comms) — high cost, high compliance confidence, slow to deploy.
Fix the process with training + audit staff — low cost, but doesn't scale with 1,500+ emails/week and doesn't solve the fear/bottleneck problem.
Insert a lightweight, real-time compliance-assist layer at the point of drafting — augments the human, doesn't replace the workflow, and can be piloted without a large capital commitment.

The prototype's job is to make option three tangible enough that leadership can feel what "frictionless compliance" would look like before they commit budget to a direction.

3. Five Prototype Concepts

Concept A: Shield Agent

A. HIPAA Shield Agent

Description: A lightweight compliance assistant that reviews patient communications before they leave the organization, identifying potential HIPAA Safe Harbor risks and generating a safer version for human review.

Interaction: Staff paste or draft a message; the system automatically scans for names, dates, clinical specialties, and other PHI indicators, highlights them, and provides a sanitized alternative.

Value: Creates a safety layer directly at the point of drafting, allowing employees to move quickly without feeling solely responsible for remembering every compliance rule.

Why prototypable: The entire experience can be demonstrated using synthetic data, browser-based pattern matching, and a simple front-end workflow without requiring backend integrations.

---

Concept B: PHI Risk Highlighter

Description: An inline scanner that highlights potential Safe Harbor identifiers (names, dates, MRNs, addresses) directly in a draft email as the staff member types.

Interaction: Staff pastes/types a draft; risky phrases are underlined/color-coded (red/yellow) in real time, like a spellchecker for PHI.

Value: Makes invisible risk visible instantly — turns "did I mess up?" anxiety into a clear yes/no signal.

Why prototypable: Pure front-end pattern matching against a mock identifier list; no backend or real data needed.

---

Concept C: Compliance Score Dashboard

Description: Every drafted message receives a simulated compliance score/grade with a breakdown of why it passed or failed.

Interaction: Staff drafts a message, clicks "Check," and sees a score (e.g., 92/100) plus flagged line items.

Value: Gives leadership an aggregate, reportable metric — "average compliance score across clinics" — which is exactly the kind of number executives want to see trending upward.

Why prototypable: Score can be derived from the same pattern-matching logic as Concept A, just reframed as a number instead of inline highlights.

---

Concept D: Copilot Draft Assistant

Description: Staff describe in plain language what they want to tell the patient, and an AI drafts a compliant version, flagging or auto-redacting anything risky.

Interaction: Staff type "let the patient know their follow-up is next Tuesday and to bring their medication list," and the tool returns a polished, compliant draft.

Value: Directly attacks "reduced administrative effort" — staff go from composing to reviewing, which is a much lower cognitive load.

Why prototypable: Can be simulated with a scripted/mocked response set (or a real lightweight LLM call in the prototype) without any EHR integration.
---

Concept E: Guided Tree Wizard

Description: A short branching questionnaire that walks staff through whether the content they want to send is safe for standard email or needs a secure channel.

Interaction: Staff answer 3–4 quick questions ("Does this include a diagnosis? A specific date of service?") and get a routing recommendation.

Value: Builds compliance literacy over time — staff start to internalize the Safe Harbor logic instead of just trusting a black box.

Why prototypable: Simple branching logic, no AI or backend required — can be built as a clickable flow in an afternoon.



4. Why This Is Prototype-Worthy
It compresses the entire value proposition — speed and safety, not speed or safety — into a single interaction a non-technical executive can watch and immediately understand.
It requires zero real infrastructure: everything can run client-side with mocked identifier logic and a scripted or lightly-AI-assisted draft engine.
It gives leadership something concrete to react to ("would you want the score shown to staff or just to compliance officers?") rather than abstract architecture discussions.
It naturally opens the conversation about build-vs-buy, since the prototype visibly stops short of being a certified compliance tool — which is exactly where the real decision lives.



5. What This Prototype Should NOT Do
It should not send real emails or connect to any live email system.
It should not touch, store, or simulate storage of real patient data — use clearly fictional sample content only.
It should not claim or imply HIPAA certification or legal sign-off — it's a decision-support demo, not a compliance guarantee.
It should not attempt EHR or patient-portal integration — the "secure channel" routing should be a mocked recommendation, not a working handoff.
It should not make a final send/block decision autonomously — keep a human confirmation step in the loop so it reads as augmentation, not replacement.



6. What You're Missing

A few open questions worth raising before or during the engagement:

False positives/negatives and override logic — who decides when staff can override a flag, and is that decision itself logged for audit purposes?
The actual Safe Harbor identifier list — the prototype needs a believable, accurate stand-in for the 18 HIPAA Safe Harbor identifiers, not a vague "PHI-ish" heuristic — this is where credibility with legal/compliance stakeholders will be won or lost.
Audit trail and reporting — leadership will likely want to know how compliance scores roll up across clinics over time; even a mocked "trend view" could be a strong add-on.
Change management — a tool like this changes staff behavior and accountability; the demo might benefit from acknowledging the training/rollout question even if it's out of scope for the prototype itself.
Liability framing — is this advisory (staff can override) or blocking (staff cannot send until resolved)? That's a philosophical choice leadership needs to weigh in on, and the prototype should probably show both modes to spark that exact conversation.
Multi-clinic variability — different clinics may have different message types or risk tolerance; worth at least name-checking as a v2 consideration.
Patient experience impact — templated/AI-assisted messages need to still feel personal; worth a line in the demo narrative so it doesn't read as "robotic."