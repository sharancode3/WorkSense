# WorkSense — Implementation Details and Phased Engineering Roadmap

---

## Document Control

| Property | Specification |
| :--- | :--- |
| **Document Title** | WorkSense Implementation Details and Phased Engineering Roadmap |
| **Product Name** | **WorkSense** (Strictly locked; legacy aliases 'NEXUS', 'Nexus', 'Woot' are obsolete) |
| **Document Type** | Authoritative Engineering Execution Sequence and Stage-by-Stage Implementation Specification |
| **Status** | Approved Implementation Blueprint |
| **Version** | 1.0.0 |
| **Last Verified Date** | 2026-09-12 |
| **Owner** | WorkSense Engineering Lead & Implementation Architecture Group |
| **Intended Audience** | Frontend Engineers, Backend Engineers, Data Engineers, AI/ML Engineers, DevOps, Hackathon Operators |
| **Execution Principle** | **Dependency-Order Construction:** Every stage produces a complete, demonstrable capability. Intelligence, evidence, permissions, workflows, and interfaces grow together rather than building disconnected frontend screens first. |
| **Related Documents** | `docs/01-PRD.md` through `docs/09-Project-Memory.md` |

---

## Executive Implementation Strategy

WorkSense is constructed in strict dependency order across **18 discrete stages (Stage 0 through Stage 17)**. 

The core system builds outward from the foundational data structures and evidence ledger, through specialized computational engines, bounded language model reasoning, and governed enterprise workflows, culminating in an integrated, role-aware application shell:

```text
Stage 0: Scope Freeze & Decisions
   │
Stage 1: Foundation & Design System ──► Stage 2: Database, Seed Org & RLS
                                                │
Stage 3: Evidence Ledger, Skill Graph & Twins ◄─┘
   │
   ├──────────────────────────┬──────────────────────────┐
   ▼                          ▼                          ▼
Stage 4: Recruitment      Stage 5: Intelligent      Stage 6: Hire Conversion
Intelligence              Interviewing              & Adaptive Onboarding
   │                          │                          │
   └──────────────────────────┼──────────────────────────┘
                              ▼
Stage 7: EnterPro Workflow Integration
   │
   ├──────────────────────────┬──────────────────────────┐
   ▼                          ▼                          ▼
Stage 8: Policy-to-Action  Stage 9: Growth &         Stage 10: Performance
Intelligence              Internal Mobility         Intelligence
   │                          │                          │
   └──────────────────────────┼──────────────────────────┘
                              ▼
Stage 11: Attrition & Retention Intelligence
   │
Stage 12: Workforce Decision Simulator (Google OR-Tools CP-SAT)
   │
Stage 13: Role-Specific Command Centers (7 Workspaces)
   │
Stage 14: Qwen Hardening & Gateway Protection
   │
Stage 15: Governance, Audit & Explainability
   │
Stage 16: Comprehensive Testing & Validation
   │
Stage 17: Deployment & Live Demo Hardening
```

---

## Stage 0 — Freeze the Prototype Scope

Before writing any application code, the operational boundaries, terminology, and unresolved technical decisions are formally locked.

### Scope and Baseline Freezes
1. **Cross-Document Harmonization:** All nine specifications (`docs/01` through `docs/09`) have been verified for zero contradictions.
2. **Golden Demo Narrative Lock:** The core demonstration story is locked to the **90-Day AI Fraud Team** staffing challenge.
3. **Terminology & Identity Lock:** The product is strictly **WorkSense**. All entities follow canonical naming: Candidate Twin, Employee Twin, Evidence Ledger, Temporal Skill Graph, and What-Why-Evidence-What Next UI pattern.
4. **Resolved Technical Decisions:**
   * *Embedding Model:* Standardized on `bge-small-en-v1.5` (384-dimensional dense vectors) for local, zero-cloud-cost pgvector cosine search.
   * *Candidate Ranking:* Transparent, auditable 12-feature weighted deterministic formula baseline for the prototype; full LightGBM LambdaMART is the production roadmap target.
   * *Attrition Prototype Strategy:* Cox Proportional Hazards survival curves across 3/6/12-month horizons paired with pre-calibrated TreeSHAP feature attributions for the demonstration cohort.
   * *Skill Confidence Formulation:* Explicit temporal decay: $	ext{Confidence}(t) = 	ext{Proficiency} 	imes e^{-\lambda \Delta t} 	imes 	ext{Validation Multiplier}$ (where $\lambda = 0.00385$, 180-day half-life).
   * *EnterPro Integration Method:* REST webhooks with HMAC SHA-256 signature verification (`X-EnterPro-Signature`) and timestamp replay protection.
   * *Ingress Tunnel Provider:* Cloudflare Quick Tunnel (`cloudflared`) providing an encrypted outbound-only HTTPS proxy to the Local AI Gateway.

### Feature Classification Matrix
* **Fully Functional (Live Computation):** 
  * Role-based access and navigation.
  * AI Document Firewall text extraction.
  * Candidate eligibility filtering and 12-feature ranking calculations.
  * Google OR-Tools CP-SAT workforce allocation optimization.
  * Policy clause pgvector semantic search and deterministic rule evaluation.
  * Local Qwen3-4B natural language reasoning, citations, and adaptive probing.
* **Functional with Synthetic Data:** 
  * 48 synthetic candidate profiles.
  * 600 employee records with longitudinal HRIS history.
  * Pre-calibrated 90-day AI Fraud Team staffing requisition.
* **Simplified but Genuine:** 
  * In-process FastAPI background worker instead of distributed Celery broker.
  * Relational graph traversal in PostgreSQL instead of Neo4j.
  * Single-worker Uvicorn configuration on Render.
* **Production Roadmap (Explicitly Excluded from Prototype):** 
  * Facial recognition, eye-tracking, and vocal affect analysis.
  * Direct multimodal vision within the Qwen model.
  * Continuous online autonomous model retraining.
  * Autoscaled multi-region cloud GPU clusters.

**Stage 0 Exit Condition:** The engineering team possesses unambiguous, written boundaries defining exactly what must execute during live judging.

---

## Stage 1 — Project Foundation and Design System

Construct the technical shell, design tokens, and shared application layout across both light and dark themes.

### Technical Shell Specifications
* **Frontend:** Next.js 14.2+ (App Router), TypeScript, Tailwind CSS, preloaded fonts (`Outfit` and `Inter`).
* **Backend:** FastAPI (Python 3.11.9) modular monolith with Uvicorn server and Pydantic v2 validation.
* **Supabase Integration:** Initialized client SDKs for browser (anon key) and backend (service-role key).
* **Cross-Cutting Utilities:**
  * Shared typed API client with request/response interceptors.
  * Global error boundary and structured exception handlers.
  * Correlation ID middleware generating and propagating `X-Correlation-ID`.
  * Multi-component health check endpoint (`/api/v1/health`).

### Visual Design System Implementation
* **Color Tokens:**
  * Primary Deep Blue: `#0F172A` (Slate 900)
  * Restrained Cyber Lime: `#84CC16` (Lime 500)
  * Dark Theme Surface: `#1E293B` (Slate 800), Border: `#334155` (Slate 700)
  * Light Theme Base: `#FFFFFF`, Surface: `#F8FAFC`, Border: `#E2E8F0`
* **Prohibited Aesthetics:** Strictly no cream or beige global backgrounds, no neon glow effects, no glassmorphism, no animated floating blobs, and no decorative AI-generated SVGs.
* **Reusable Component Library:**
  * `Button`: Primary, Secondary, Outline, Danger, Ghost.
  * `Input`: Text, Number, Select, Textarea, FileDropzone with drag-and-drop validation.
  * `DataTable`: Sortable, filterable, paginated with dense row options.
  * `Drawer` & `ModalDialog`: Focus-trapped, accessible, ESC-dismissible.
  * `StatusBadge`: Strict vocabulary (`VERIFIED`, `STALE`, `PROBATION`, `PENDING_APPROVAL`, `EXCEPTION_REQUIRED`).
  * `EvidenceCard`: Renders the universal **WHAT $
ightarrow$ WHY $
ightarrow$ EVIDENCE $
ightarrow$ WHAT NEXT** contract.
  * `ConfidencePill`: Standardized qualitative bands (`High`, `Moderate`, `Limited`, `Insufficient Evidence`).
  * `WorkflowTimeline`: Step-by-step state tracker with timestamped audit notes.
  * `StatePlaceholders`: Standardized Loading Skeleton, Empty State, Error State, and Offline Banner.

**Stage 1 Exit Condition:** Every role can log in and navigate a polished, responsive application shell in both Light and Dark themes.

---

## Stage 2 — Database, Seed Organization, and Authorization

Establish the unified relational data foundation, Row-Level Security policies, private storage, and a cross-module synthetic organization.

### Relational Schema Deployment (131 Tables across 16 Domains)
* **Core Organizations & Profiles:** `organizations`, `departments`, `teams`, `user_profiles`, `role_assignments`.
* **Talent & Recruitment:** `job_requisitions`, `candidate_profiles`, `candidate_applications`, `candidate_rankings`.
* **Twin & Skill Graph:** `person_twins`, `skills`, `skill_relationships`, `person_skills`, `evidence_items`, `evidence_links`.
* **Interviews & Assessments:** `interview_templates`, `interview_rubrics`, `interview_sessions`, `interview_responses`.
* **Retention & Performance:** `attrition_predictions`, `attrition_case_reviews`, `performance_cycles`, `delivery_artifacts`.
* **Policy & Governance:** `policies`, `policy_sections`, `policy_chunks`, `policy_applicability_rules`, `workflow_requests`, `audit_events`.

### Authorization and Security Implementation
* **Supabase Auth:** JWT token issuance with role claims (`candidate`, `employee`, `manager`, `recruiter`, `hr_bp`, `leadership`, `admin`).
* **Row-Level Security (RLS):** 
  * User can read and update only self profile records.
  * Managers can view only assigned team reports.
  * Recruiters can access only candidates applied to assigned requisitions.
  * Retention hazard curves (`attrition_predictions`) are locked exclusively to the `hr_bp` role.
* **Private Storage Buckets:**
  * `resumes`: Private bucket; access via short-lived signed URLs (900-second expiration).
  * `policies`: Private bucket; readable by authenticated employees.

### Seed Organization Narrative (The Meridian Financial Technologies Fixture)
* **Company Profile:** Meridian Financial Technologies (Fictional fintech enterprise, 600 employees).
* **Department Scope:** Global Engineering Division, Core Platform Group, Risk & Compliance.
* **Key Demonstration Personas:**
  * Executive Lead: VP of Engineering.
  * Department Manager: Marcus Vance (Infrastructure Manager).
  * Retention Target: **Marcus Chen** (Senior Infrastructure Lead, L5, 38 months in band, 6mo hazard 72%).
  * External Candidate: **Sarah Lin** (Staff Machine Learning Engineer applicant, PR #402 citation).
  * Recruiter Persona: Lead Technical Recruiter.
  * HRBP Persona: Strategic People Partner.

**Stage 2 Exit Condition:** Every role sees only authorized records, verified by automated RLS boundary test suites.

---

## Stage 3 — Evidence Ledger, Skill Graph, and Workforce Twin

Build the structural core of WorkSense: continuous twins, dynamic capability confidence, and graph-distance calculation.

### Implementation Scope
* **Continuous Twin Engine (`MOD-06`):**
  * Tracks capabilities, proficiency levels (L1 Foundational to L5 Principal Authority), and evidence links.
  * Distinct views for Candidate Twin (screening artifacts) and Employee Twin (longitudinal milestones).
* **Relational Capability Graph (`MOD-07`):**
  * PostgreSQL recursive Common Table Expression (CTE) queries traversing `skill_relationships`.
  * Computes adjacent skill credit: Candidate with Triton proficiency receives 85% adjacent credit toward CUDA requirements based on validated graph distance.
* **Cryptographic Evidence Ledger:**
  * Every evidence item records `source_type` (`github_pr`, `jira_milestone`, `peer_review`), `external_reference`, `verifier_id`, and a cryptographic SHA-256 content hash.
* **Dynamic Temporal Skill Confidence Engine:**
  * Calculates confidence using evidence count, observation recency, and verification authority:

$$	ext{Skill Confidence} = 	ext{Base Level} 	imes e^{-0.00385 \cdot \Delta t} 	imes 	ext{Validation Factor}$$

  * Produces standardized qualitative bands: `High` ($\ge 0.80$), `Moderate` ($0.50 - 0.79$), `Limited` ($0.25 - 0.49$), `Insufficient Evidence` ($< 0.25$).
  * If $\Delta t > 180$ days, skill automatically flags as `STALE`.

**Stage 3 Exit Condition:** Adding or validating an evidence record visibly recalculates capability confidence and target role readiness in real time.

---

## Stage 4 — Recruitment Intelligence

Implement the end-to-end recruitment pipeline from resume drop to recruiter candidate comparison.

```text
Requisition Ingestion ──► Candidate PDF Upload ──► AI Document Firewall ──► Structured Extraction ──►
Eligibility Filter ──► 12-Feature Pipeline ──► Deterministic Scorer ──► Qwen Explanation ──► Recruiter UI
```

### Working Features
* **AI Document Firewall:** Strips macros and executable binaries; extracts plain text via `pypdf`/`pdfplumber`; encloses raw text in `<untrusted_data>` XML boundary tags.
* **Structured Resume Extraction:** Qwen parses text into a validated Pydantic JSON schema (`CandidateExtractionDTO`), allowing candidate manual review and correction.
* **Candidate Ranking Engine (`MOD-04`):**
  * Computes 12 objective features: mandatory skill match ratio, adjacent graph credits, tenure years (capped at 10 to eliminate age-proxy bias), verified PR count, recency decay weight, and semantic vector similarity.
  * Prototype formula computes an integer match score ($0 - 100$):

$$	ext{Score} = \sum_{i=1}^{12} w_i \cdot 	ext{Feature}_i$$

* **Grounded Explanation Generator:** Qwen synthesizes a comparative candidate rationale citing exact PRs and verified graph adjacencies. Qwen is strictly prohibited from altering or creating the score.
* **Recruiter Candidate Comparison View (`SCR-02`):** Side-by-side comparison matrix displaying mandatory requirements, exact skills, adjacent credits, missing capabilities, evidence quality, and human hiring action buttons.

**Stage 4 Exit Condition:** Uploading a candidate resume generates a validated Candidate Twin and an explainable, evidence-grounded ranking score.

---

## Stage 5 — Structured Intelligent Interview

Implement objective, comparable technical interviewing pairing standard core questions with bounded adaptive probing.

### Working Features
* **Structured Core Framework:** Every candidate applying for a given role receives an identical set of core competency questions derived from `interview_rubrics`.
* **Real-Time Evidence Extraction:** Candidate speech/text responses are parsed to detect concrete technical claims and rubric signal matches.
* **Bounded Information-Gain Probing:**
  * If response confidence is limited ($< 0.60$) and fewer than **two probes** have been executed, Qwen formulates an adaptive probe targeting the specific uncertainty gap.
  * *Example:* Candidate mentions Redis Sentinel failover but omits split-brain recovery $
ightarrow$ Qwen generates targeted probe: *"What specific circuit-breaker pattern prevented split-brain writes during replica promotion?"*
* **Strict Evaluation Prohibitions:** Video analysis, eye-tracking, vocal stress analysis, and automated hiring decisions are architecturally banned.
* **Human Validation Console (`SCR-03`):** Recruiter reviews full transcript, rubric signal extractions, and Qwen summary, clicking `[Validate Rubric Rating]` to commit updates to the Candidate Twin.

**Stage 5 Exit Condition:** The identical competency backbone is preserved across candidates while at least one follow-up probe adapts based on evidence uncertainty.

---

## Stage 6 — Hire Conversion and Adaptive Onboarding

Execute seamless Candidate-to-Employee Twin conversion and personalize onboarding by waiving verified capabilities.

### Working Features
* **Human Hiring Approval Gate:** Recruiter clicks `[Authorize Offer]` in `SCR-02`, dispatching a formal offer workflow to EnterPro.
* **Candidate-to-Employee Twin Conversion:**
  * Database transaction updates `person_twins.person_type` from `candidate` to `employee`.
  * Preserves all validated screening evidence and interview evaluation transcripts.
  * Generates an employee record and triggers initial onboarding generation.
* **Adaptive Capability-Gap Onboarding Logic:**
  * Calculates genuine development needs via set-difference logic:

$$	ext{Onboarding Gaps} = 	ext{Target Role Requirements} \setminus 	ext{Verified Twin Capabilities}$$

  * *Example:* Sarah Lin demonstrates verified mastery in PyTorch and Triton during screening $
ightarrow$ Technical onboarding modules for PyTorch/Triton are marked `WAIVED (Pre-verified in Screening)`.
  * Mandatory legal compliance tasks (Corporate InfoSec, Data Privacy) are retained as `MANDATORY`.
* **Onboarding Dashboard (`SCR-04`):** Displays 30/60/90-day progress, people to meet, buddy recommendations, and pending access provisioning tickets.

**Stage 6 Exit Condition:** A hired candidate retains all screening evidence and receives an onboarding journey with pre-verified skills automatically waived.

---

## Stage 7 — EnterPro Workflow Integration

Connect high-stakes mutations to **EnterPro** signed enterprise workflows with complete state synchronization.

### Working Workflows
* **Workflow A — Adaptive Onboarding Access Request:**
  * Trigger: Critical onboarding blocker detected (e.g., GPU cluster access required).
  * Flow: Request drafted $
ightarrow$ Manager sign-off $
ightarrow$ EnterPro execution $
ightarrow$ Signed webhook callback $
ightarrow$ Access provisioned $
ightarrow$ Audit logged.
* **Workflow B — Policy Remote Work Exception:**
  * Trigger: Employee submits out-of-state remote work request exceeding probation limits.
  * Flow: Deterministic rule flags exception $
ightarrow$ Submitted to EnterPro $
ightarrow$ Department Director approval $
ightarrow$ Signed callback $
ightarrow$ State updated.

### Workflow Engine Architecture
* **State Machine Alignment:** Enforces EnterPro's 10-state lifecycle (`DRAFT`, `SUBMITTED`, `PENDING_APPROVAL`, `APPROVED`, `EXECUTING`, `COMPLETED`, `REJECTED`, `CANCELLED`, `FAILED`, `EXPIRED`).
* **Cryptographic Callback Security:** Webhook endpoint `/api/v1/workflows/callbacks` verifies HMAC SHA-256 signature (`X-EnterPro-Signature`) and enforces timestamp replay checks ($< 300	ext{s}$).
* **Idempotency Safeguard:** Ingests unique `event_id` to ensure duplicate webhook deliveries are safely ignored.

**Stage 7 Exit Condition:** Judges observe a recommendation transform into an auditable, human-approved EnterPro workflow with live state synchronization.

---

## Stage 8 — Policy-to-Action Intelligence

Deliver a source-grounded policy reasoning engine that combines dense vector retrieval with deterministic rules and explicit abstention.

```text
Employee Query ──► Intent Parser ──► pgvector 384d Search (SQL Org Filter) ──►
Deterministic Rules Engine ──► Grounded Qwen Synthesis ──► Citations & Action Form
```

### Working Features
* **Hierarchical Policy Ingestion:** Policies chunked by section headings (300-500 tokens, 50 token overlap) preserving section IDs, versions, and effective dates.
* **Vector Semantic Search:** Embeds query into 384d vector; executes cosine distance search in pgvector with mandatory `WHERE organization_id = ... AND is_active = true` pre-filtering.
* **Deterministic Policy Rules Engine:** Independent Python evaluator testing tenure, probation status, and requested duration.
* **Automated Contradiction Detection:** Cross-compares clauses exhibiting high semantic similarity but conflicting deontic constraints, alerting HR administrators.
* **Grounded Policy Studio (`SCR-09`):** Surfaces plain-language answers, exact section citations (`Policy v4.1 §5.2`), applicability status, and pre-filled EnterPro exception forms.
* **Calibrated Abstention:** If evidence is missing or contradictory, outputs `abstained: true` with a plain-language explanation and an `[Open HR Ticket]` button.

**Stage 8 Exit Condition:** System successfully validates an eligible policy inquiry and gracefully abstains on a conflicting/unsupported policy question.

---

## Stage 9 — Employee Growth and Internal Mobility

Empower employees with transparent capability visibility, gap analysis, and aspirational career mobility paths.

### Working Features
* **Personal Workforce Twin Canvas (`SCR-05`):** Displays verified competencies, proficiency levels (L1-L5), confidence bands, and chronological evidence timeline.
* **Organizational Skill Graph Explorer (`SCR-06`):** Interactive graph visualizer displaying capability prerequisites, transferability paths, and adjacent technologies.
* **Internal Mobility Hub (`SCR-07`):** Recommends open internal requisitions, temporary projects, and mentoring opportunities based on skill proximity and verified readiness indices.
* **Aspiration Privacy Safeguard:** An employee's aspirational roles and internal applications remain strictly confidential from their direct manager until formal interview stages.

**Stage 9 Exit Condition:** An employee can inspect an internal gig, understand exact missing capability prerequisites, and view verified actions to achieve readiness.

---

## Stage 10 — Performance Intelligence

Transform performance management into a factual, continuous Evidence Ledger that synthesizes real deliverables while strictly barring automated ratings.

### Working Features
* **Continuous Delivery Evidence Synthesis:** Ingests merged pull requests, closed Jira milestones, customer commendations, and incident post-mortems into `delivery_artifacts`.
* **Objective Work Summary Generation:** Qwen synthesizes factual summaries of technical deliverables citing concrete artifact references.
* **Rating Prohibition Invariant:** Qwen is architecturally prohibited from assigning formal performance ratings (e.g., assigning 1-5 scores). Formal ratings belong exclusively to human managers.
* **Statistical Performance Calibration Signals:** Calculates departmental rating distributions ($Z$-score analysis) to identify anomalous grading patterns, prompting human calibration reviews using neutral, non-accusatory language.

**Stage 10 Exit Condition:** WorkSense generates a delivery summary where every assertion is backed by a clickable citation in the Evidence Ledger.

---

## Stage 11 — Attrition and Retention Intelligence

Implement ethical, time-to-event longitudinal retention modeling that connects calibrated risk forecasts directly to reviewed internal mobility interventions.

### Working Features
* **Continuous Survival Analysis Engine (`MOD-13`):** Formulates voluntary departure as a time-to-event hazard rate using Cox Proportional Hazards modeling across 3-month, 6-month, and 12-month horizons.
* **TreeSHAP Risk Decomposition:** Identifies exact feature contributions, separating risk drivers (tenure stagnation: $+34\%$) from protective organizational factors (team collaboration: $-18\%$).
* **Role-Level Security Enforcement:** All retention screens (`SCR-08`) and prediction tables are restricted strictly to the `hr_bp` role via Supabase RLS.
* **Ethical Data Prohibitions:** Medical leave records, private messages, keystrokes, camera feeds, and protected demographic traits are strictly excluded from feature pipelines.
* **Governed Retention Intervention Flow:** Matches high-risk talent to open internal strategic projects (e.g., matching Marcus Chen to the AI Fraud Team infrastructure), dispatching an EnterPro mobility request.

**Stage 11 Exit Condition:** WorkSense transitions from risk alert $
ightarrow$ TreeSHAP explanation $
ightarrow$ internal opportunity match $
ightarrow$ EnterPro workflow without claiming uncalibrated certainty.

---

## Stage 12 — Workforce Decision Simulator

Implement the flagship decision-support engine: combinatorial headcount optimization using **Google OR-Tools CP-SAT**.

```text
Leadership Headcount Mandate ──► Parameter Extraction ──► Capability Retrieval ──►
Google OR-Tools CP-SAT Solver ──► Strategy A / B / C Matrix ──► Qwen Tradeoff Brief ──► EnterPro Plan
```

### Mathematical Formulation
$$\min \quad Z = w_1 \cdot 	ext{Cost} + w_2 \cdot 	ext{Time} + w_3 \cdot 	ext{Disruption} - w_4 \cdot 	ext{CapabilityMatch}$$

* **Subject to Constraints:**
  1. Headcount coverage: $\sum x_{ij} + \sum y_{ij} + z_j \ge 	ext{Target}_j$
  2. Budget limit: $	ext{TotalCost} \le 	ext{BudgetCeiling}$
  3. Deadline feasibility: $\max(	ext{Time}) \le 	ext{DeadlineDays}$
  4. Non-duplication: $\sum x_{ij} \le 1$

### Strategy Evaluation Matrix (The 90-Day AI Fraud Team)
* **Strategy A (Internal Heavy):** 5 transfers, 2 upskills, 1 external hire. Ready in 45 days, $95,000 cost, High operational disruption.
* **Strategy B (Balanced Hybrid - RECOMMENDED):** 3 transfers, 3 upskills, 2 external hires. Ready in 70 days, $140,000 cost, Moderate disruption.
* **Strategy C (External Heavy):** 1 transfer, 7 external hires. Ready in 110 days (FAILS 90d deadline), $210,000 cost (EXCEEDS budget), Low disruption.

### Working Features
* **Interactive Simulator Canvas (`SCR-10`):** Leadership adjusts sliders for budget, deadline, and team size; the OR-Tools solver recalculates optimal allocations in $< 500	ext{ms}$.
* **Qwen Tradeoff Synthesis:** Formulates comparative narrative explaining cost, timing, and disruption tradeoffs without altering the solver's mathematical outputs.

**Stage 12 Exit Condition:** Adjusting a budget or deadline constraint produces a materially different feasible allocation strategy and explanation.

---

## Stage 13 — Role-Specific Command Centers

Assemble the ten flagship interfaces into seven focused, role-governed workspaces.

### Workspace Inventory
1. **Candidate Portal:** Application status, resume upload, and Structured Interview Room (`SCR-03`).
2. **Employee Workspace:** Personal Twin Canvas (`SCR-05`), Skill Graph (`SCR-06`), Adaptive Onboarding (`SCR-04`), and Policy Studio (`SCR-09`).
3. **Manager Workspace:** Team Capability Hub, onboarding blocker resolution, and performance delivery endorsements.
4. **Recruiter Workspace:** Requisition Console (`SCR-01`), Candidate Comparison Matrix (`SCR-02`), and interview evaluations.
5. **HRBP Workspace:** Retention Risk Console (`SCR-08`), Policy Studio Governance (`SCR-09`), and internal mobility interventions.
6. **Executive Leadership Workspace:** Strategic Workforce Simulator (`SCR-10`) and organizational capability readiness dashboards.
7. **Admin Workspace:** Model Registry, system health telemetry, and immutable audit event ledger.

**Stage 13 Exit Condition:** Every role logs into a tailored workspace presenting only authorized actions and views.

---

## Stage 14 — Qwen Integration and Hardening

Implement a single, hardened Qwen Gateway (`MOD-16`) protecting local Ollama execution on the operator's laptop.

### Gateway Architecture (`backend/gateway/local_ai_gateway.py`)
* **Localhost Socket Isolation:** Ollama listens on `127.0.0.1:11434`; public clients route strictly through the gateway on port `8001`.
* **Bearer Token Authentication:** Enforces pre-shared `X-WorkSense-Tunnel-Auth` secret header on all inbound tunnel calls.
* **Concurrency Semaphore:** In-process `asyncio.Semaphore(1)` ensures only one inference runs at a time, safeguarding 4 GB laptop GPUs.
* **Client SLA Timeout:** Hard 15.0-second timeout cancels stalled inference requests and triggers immediate graceful degradation.
* **Task Allow-List Validation:** Enforces strict Pydantic JSON schemas across six allowed tasks (`Q-TASK-01` through `Q-TASK-06`).
* **Prompt Safety Hardening:** Rejects arbitrary prompt injection attempts; wraps all untrusted inputs inside `<untrusted_data>` XML tags.

**Stage 14 Exit Condition:** Qwen is incapable of bypassing permissions, invoking arbitrary shell commands, or generating unvalidated outputs without rejection.

---

## Stage 15 — Governance, Audit, and Explainability

Deploy the cryptographic audit infrastructure tracking every model inference, human override, and workflow state transition.

### Working Features
* **Immutable Audit Event Ledger:** Table `audit_events` logs timestamp, actor UUID, action type, before/after JSON states, and cryptographic SHA-256 event hashes.
* **Model & Prompt Registry:** Table `model_registry` records model name, version, quantization hash, prompt template version, and approval timestamps.
* **Human Override Tracking:** Any recruiter ranking override or manager calibration adjustment requires an explicit text justification logged to audit tables.
* **Complete Flow Reconstructability:** Every hiring offer, transfer, or exception can be traced back to its underlying evidence artifacts, model versions, and human sign-offs.

**Stage 15 Exit Condition:** The entire 90-day AI Fraud Team staffing journey can be reconstructed sequentially from immutable audit logs.

---

## Stage 16 — Comprehensive Testing and Validation

Execute rigorous multi-tier testing covering functional paths, security boundaries, and mathematical solvers.

### Test Suites
* **Unit Tests (`tests/unit/`):**
  * 12-feature candidate ranking pipeline validation.
  * Temporal skill decay calculations ($e^{-\lambda t}$).
  * Pydantic schema validation for all six Qwen task DTOs.
* **Integration Tests (`tests/integration/`):**
  * End-to-end Candidate-to-Employee Twin conversion.
  * EnterPro signed webhook callback verification and idempotency check.
  * pgvector cosine similarity retrieval with SQL organization pre-filtering.
  * Google OR-Tools CP-SAT constraint validation under budget/deadline limits.
* **Security & Authorization Tests (`tests/security/`):**
  * RLS boundary enforcement: Non-HR roles attempting to query `attrition_predictions` receive empty sets.
  * AI Document Firewall: Ingestion of prompt-injected resumes neutralizing command executions.
  * Secret isolation: Verifying that Next.js client bundles contain zero service-role keys.

**Stage 16 Exit Condition:** All critical golden-path and security test suites pass with 100% recorded verification.

---

## Stage 17 — Deployment and Live Demo Hardening

Deploy the hybrid cloud-edge topology, configure fallback states, and rehearse the live presentation runbook.

### Deployment Targets
* **Frontend:** Next.js 14+ deployed on Vercel Global Edge.
* **Backend:** FastAPI Web Service deployed on Render (single worker configuration).
* **Data Platform:** Supabase Managed Cloud (PostgreSQL 15+, Auth, Storage, pgvector).
* **Local AI Host:** Local Ollama daemon running `qwen3:4b-instruct-2507-q4_K_M` on operator laptop GPU, connected via Cloudflare Tunnel.
* **Workflow Engine:** EnterPro sandbox integration with signed webhook callbacks.

### Operational Fallback Modes
* **Level 0 (Full Live):** All cloud services, local Qwen inference, and EnterPro webhooks operational.
* **Level 1 (AI-Degraded):** Laptop sleeps or Wi-Fi drops; stored candidate rankings, skill graphs, and survival curves continue functioning from Supabase; UI renders an amber status badge.
* **Level 2 (Workflow-Degraded):** EnterPro unreachable; mutations queue locally as `PENDING_APPROVAL`.
* **Level 3 (Controlled Seeded Demo):** Pre-calibrated Golden Demo cards showcased for Sarah Lin and Marcus Chen.
* **Level 4 (Static Backup Walkthrough):** High-resolution screenshot deck and video recording.

### Live Demo Rehearsal Checklist
- [ ] Laptop connected to continuous AC wall power; sleep disabled.
- [ ] Ollama loaded with `qwen3:4b-instruct-2507-q4_K_M`.
- [ ] Local AI Gateway running on port 8001; Cloudflare Tunnel active.
- [ ] Render `QWEN_GATEWAY_URL` environment variable synchronized.
- [ ] Backend `/api/v1/health` reports status `healthy` across all components.
- [ ] Database re-seeded to pristine Golden Demo state (`seed_demo_data.py`).
- [ ] Browser tabs pre-loaded across Dark and Light themes.

**Stage 17 Exit Condition:** The complete 90-day AI Fraud Team demonstration executes repeatedly from a clean start and recovers from simulated network failures.

---

## Final Working Prototype: The Connected Narrative

The completed WorkSense prototype proves an unbroken, evidence-backed lifecycle:

```text
1. Strategic Need:
   Leadership specifies an 8-person AI Fraud Team in 90 days ($180k budget).
   │
2. Combinatorial Optimization:
   Google OR-Tools CP-SAT solves allocations, selecting Strategy B (Balanced Hybrid).
   │
3. Retention Discovery:
   Marcus Chen (Senior Infra Lead) is flagged with 72% attrition risk; TreeSHAP
   reveals tenure stagnation in band L5 (+34%).
   │
4. Governed Mobility Intervention:
   Marcus is matched to lead AI Fraud infrastructure; HRBP approves transfer via EnterPro.
   │
5. External Screening:
   Sarah Lin ranks #1 (94% match) for Staff ML; Triton credits CUDA adjacency citing PR #402.
   │
6. Structured Adaptive Interview:
   Sarah answers caching core question; Qwen generates adaptive probe on Redis split-brain;
   recruiter validates rubric evidence.
   │
7. Twin Continuity & Adaptive Onboarding:
   Sarah is hired; Candidate Twin converts to Employee Twin; pre-verified capabilities waive
   redundant onboarding modules.
   │
8. Governed Action Execution:
   EnterPro provisions GPU cluster access and resolves onboarding blockers via signed webhooks.
   │
9. Full Traceability:
   The entire lifecycle is cryptographically anchored to the Evidence Ledger and Audit Trail.
```

WorkSense delivers not a superficial dashboard collection or generic chatbot, but a deep, trustworthy, and role-aware workforce decision intelligence platform.
