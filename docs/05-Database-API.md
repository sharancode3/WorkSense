# WorkSense — Database and API Specification

---

## 7.1 Document Control

| Property | Specification |
| :--- | :--- |
| **Document Title** | WorkSense Database and API Specification |
| **Product Name** | **WorkSense** (Strictly locked; legacy aliases 'NEXUS', 'Nexus', 'Woot' are obsolete and prohibited) |
| **Document Type** | Definitive Data Architecture, Schema Specification, and REST API Contract |
| **Status** | Approved Baseline (Implementation Ready) |
| **Version** | 1.0.0 |
| **Last Updated Date** | 2026-09-12 |
| **Owner** | WorkSense Data Systems & Backend Platform Architecture Group |
| **Intended Audience** | Backend Engineers, Database Administrators, Frontend Integrators, Security Auditors, Evaluators |
| **Source-of-Truth Statement** | The PRD (`docs/01-PRD.md`) defines what WorkSense achieves. The TRD (`docs/02-TRD.md`) defines technical architecture and stack boundaries. The Workflow + Roles specification (`docs/03-Workflow-Roles.md`) defines authorities and state machines. The UI/UX specification (`docs/04-UI-UX-Design.md`) defines visual interfaces and user journeys. This document defines the **authoritative database schema**, table responsibilities, field-level constraints, Row-Level Security (RLS) policies, storage access rules, and complete REST API contracts. Migrations and OpenAPI specifications **MUST** conform to this document. |
| **Related Documents** | `docs/01-PRD.md`, `docs/02-TRD.md`, `docs/03-Workflow-Roles.md`, `docs/04-UI-UX-Design.md` |
| **Change Control Note** | Table names, column types, foreign keys, RLS security policies, and API endpoint contracts must be modified through RFC review; no ad-hoc schema drift or undocumented API routes are permitted. |

---

## 7.2 Purpose and Scope

### 7.2.1 Purpose
This document provides the definitive data model and API contract for **WorkSense**. It translates business logic, longitudinal digital twins, relational skill graphs, evidence ledgers, local language model reasoning, and enterprise workflow execution into concrete PostgreSQL tables, Supabase RLS security policies, and FastAPI REST endpoints.

### 7.2.2 Scope Boundaries
* **What This Document Governs:**
  * Proposed prototype Supabase/PostgreSQL schema across 16 core data domains (36 relational tables).
  * Field types, nullability, primary/foreign keys, uniqueness, check constraints, and composite indexes.
  * Distinction between authoritative records, raw documents, normalized evidence, model predictions, Qwen outputs, human decisions, EnterPro workflows, and audit trails.
  * Candidate-to-Employee Twin continuity and relational Skill Graph representation.
  * Vector storage schemas (`pgvector`) and private document storage bucket policies.
  * Complete Supabase Row-Level Security (RLS) matrix across all 7 user roles.
  * Complete FastAPI REST API contract: resource endpoints, command actions, request/response schemas, error handling envelopes, and idempotency guarantees.
  * EnterPro webhook ingestion, asynchronous polling patterns, and seed data specifications.
* **What This Document Does Not Govern:** Production SQL migration files, Python ORM model code, Next.js client routes, Docker Compose files, or external HRIS sync implementations.
* **Usage by Implementation and Test Agents:**
  * **Database Agents:** Use Section 7.10 through 7.27 to create ordered SQL migration scripts (`supabase/migrations/*.sql`).
  * **Backend Agents:** Use Section 7.38 through 7.58 to generate Pydantic request/response schemas and FastAPI router modules.
  * **Frontend Agents:** Use Section 7.41, 7.42, and 7.64 to generate TypeScript API client fetchers and React Query hooks.
  * **QA & Security Agents:** Use Section 7.32 (RLS Matrix) and Section 7.67 (Requirements Catalog) to author automated authorization test suites.

---

## 7.3 Sources Reviewed

| Source Document | Location | Status | Authority Level | Relevant Database / API Decisions Adopted | Conflicts / Gaps Observed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hackathon HR Problem Statement** | `outputs/HR_Hackathon_Project_Context.md` | Active | Primary Mandate | 8 core HR capabilities; local Qwen reasoning; EnterPro workflow governance. | None. Fully supported across 16 data domains. |
| **WorkSense PRD** | `docs/01-PRD.md` | Approved | Product Source of Truth | 5 intelligence engines; Candidate-to-Employee Twin lifecycle; 90-day AI team Golden Demo narrative. | None. Schema supports end-to-end lifecycle continuity. |
| **WorkSense TRD** | `docs/02-TRD.md` | Approved | Technical Source of Truth | Supabase PostgreSQL 15+; pgvector; Next.js + FastAPI; local Qwen3-4B-Instruct via Ollama; EnterPro workflows. | None. Database and API boundaries adhere strictly to TRD modular monolith. |
| **Workflow & Roles Specification** | `docs/03-Workflow-Roles.md` | Approved | Operational Authority | 7 human roles; hybrid RBAC+ABAC+RLS; EnterPro 10-state machine; cross-role handoffs; abstention states. | Addressed: RLS and API authorization enforce exact role scopes. |
| **UI/UX & Design Specification** | `docs/04-UI-UX-Design.md` | Approved | Experience Authority | WHAT-WHY-EVIDENCE-WHAT NEXT pattern; 10 flagship screen contracts; status vocabulary; Qwen state machine. | Addressed: API response envelopes match screen information hierarchy. |

---

## 7.4 Confirmed Decisions, Assumptions and Open Questions

### 7.4.1 Confirmed Decisions
1. **Database Platform:** Supabase Managed PostgreSQL 15+ with native `pgvector`, Supabase Auth, and Supabase Storage.
2. **Backend Framework:** FastAPI (Python 3.10+) operating as a modular monolith.
3. **Graph Architecture:** The Workforce Skill Graph is modeled purely via relational PostgreSQL tables (`skills`, `skill_relationships`, `person_skills`). Neo4j or external graph databases are strictly prohibited.
4. **Primary Key Standard:** All tables use UUIDv4 primary keys generated via `gen_random_uuid()`.
5. **Timestamp Standard:** All timestamp columns use UTC timezone-aware types (`TIMESTAMPTZ`), defaulting to `CURRENT_TIMESTAMP`.
6. **Local LLM Isolation:** Local `qwen3:4b-instruct-2507-q4_K_M` via Ollama is accessed solely by backend Python workers. The frontend has zero direct connection to Ollama.
7. **Mathematical Solver Separation:** Candidate matching scores (LightGBM/multi-feature), Attrition survival curves (Cox/Random Survival Forest), and Workforce Plan optimization (Google OR-Tools CP-SAT) are executed in Python services. Qwen MUST NOT compute numerical scores or optimize headcount.
8. **Enterprise Workflow Engine:** EnterPro is the authoritative state machine for human approvals, access provisioning, and external action execution.
9. **Candidate-to-Employee Continuity:** Hired candidate records are converted into employee records via an atomic transaction that preserves the original `candidate_id` and all verified interview evidence.

### 7.4.2 Explicit Assumptions
* Supabase Auth manages user authentication, token issuance, and password hashing; WorkSense stores application profiles linked via `auth.users.id`.
* The local Ollama instance runs on `localhost:11434` with an average generation latency $\le 15.0	ext{s}$.
* EnterPro integration is governed via an adapter boundary. Webhook signature, headers, and authentication details remain TBD pending official hackathon documentation.
* File uploads are restricted to sanitized PDF, DOCX, and PNG formats with a maximum payload size of $10	ext{MB}$.

### 7.4.3 Open Decisions (TBD)
* `TBD — Technical decision required`: Vector embedding model and dimension (e.g., local lightweight model such as 384d or 768d, TBD pending environment verification). Schema reserves `vector(384)` as a configurable prototype default.
* `TBD — Technical decision required`: Exact index type for pgvector (HNSW vs IVFFlat). Defaulting to IVFFlat for prototype dataset ($<100,000$ chunks) with HNSW planned for production scale.
* `TBD — Policy decision required`: Formal legal document retention periods for rejected candidate resumes and cryptographic audit logs. Defaulting to 12 months for prototype.

### 7.4.4 Documentation Conflicts Log

| Source A | Source B | Subject of Conflict | Resolution Applied | Authority Rationale |
| :--- | :--- | :--- | :--- | :--- |
| Legacy Notes | Approved PRD/TRD | Product Name | Purged all instances of 'NEXUS'; locked strictly to **WorkSense**. | User prompt locked product name to WorkSense. |
| General Hackathon Ideas | TRD Section 5 | Graph Storage Engine | Rejected Neo4j graph DB; enforced relational tables in PostgreSQL. | Avoids unnecessary distributed systems complexity in hackathon scope. |
| Early UI Notes | Workflow & Roles | Candidate Twin Persistence | Rejected discarding candidate data post-hire; implemented atomic conversion into Employee Twin. | Preserves unbroken evidence chain and waives redundant onboarding training. |

---

## 7.5 Database Design Principles

1. **PostgreSQL as Single Source of Truth:** All authoritative workforce, evidence, and workflow states reside in PostgreSQL. No unbacked client-side state.
2. **Relational Integrity Over JSON Blobs:** Relational columns with foreign keys and check constraints are mandatory for all searchable, security-sensitive, or integrity-critical fields. `JSONB` is reserved exclusively for genuinely dynamic structures (e.g., raw model metadata, extracted resume entities).
3. **Immutability of Historical Evidence:** Evidence items, audit logs, and workflow transitions are append-only. Updates create new version rows or validation records; they never overwrite historical facts.
4. **Separation of Authoritative and Derived Data:** Authoritative business records (e.g., verified skills, formal manager reviews) are stored in dedicated tables, completely separate from ephemeral AI reasoning outputs or preliminary match predictions.
5. **Human Primacy in Employment Actions:** No AI model or workflow engine can autonomously hire, terminate, promote, or discipline an employee. All consequential actions require explicit human sign-off recorded with `actor_id` and timestamp.
6. **Zero Real PII in Prototype / Seed Data:** All seed records represent fictional entities operating under the corporate moniker **TechCorp** / **WorkSense Demo**.
7. **Private by Default:** Every table containing personal, performance, capability, or organizational data is protected by Supabase Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

---

## 7.6 Naming Conventions

```text
+------------------------------------------------------------------------------------+
|                         WORKSENSE DATABASE & API NAMING RULES                      |
+------------------------------------------------------------------------------------+
| Database Object        | Convention                 | Example                      |
| :--------------------- | :------------------------- | :--------------------------- |
| Schema                 | lowercase snake_case       | public, audit, auth          |
| Tables                 | plural lowercase snake_case| employees, candidate_rankings|
| Primary Key            | lowercase 'id' (UUIDv4)    | id                           |
| Foreign Key            | singular_entity_id         | employee_id, requisition_id  |
| Timestamps             | verb_past_at (TIMESTAMPTZ) | created_at, verified_at      |
| Boolean Flags          | is_state, has_property     | is_active, has_conflict      |
| Enums                  | singular_enum_name_enum    | workflow_state_enum          |
| Indexes                | idx_table_columns          | idx_applications_job_cand    |
| Unique Constraints     | uq_table_columns           | uq_person_skills_emp_skill   |
| Storage Buckets        | kebab-case                 | candidate-resumes, policies  |
| REST API Endpoints     | plural kebab-case nouns    | /api/v1/job-requisitions     |
| REST Action Endpoints  | POST /resources/:id/action | POST /applications/:id/offer |
+------------------------------------------------------------------------------------+
```

---

## 7.7 Data Domains

The WorkSense data model is divided into 16 discrete, cohesive domains:

| Domain ID | Domain Name | Core Responsibilities | Authoritative vs Derived Data | Sensitive Data Classification | Owning Backend Module |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DOM-01** | Identity & Access | User profiles, role bindings, scopes, delegations. | Authoritative (Supabase Auth linked) | Restricted (User roles, scopes) | `backend/app/auth` |
| **DOM-02** | Organization | Organizations, departments, teams, reporting lines. | Authoritative enterprise hierarchy | Internal Business Data | `backend/app/org` |
| **DOM-03** | Recruitment | Candidates, requisitions, applications, rankings. | Authoritative applications; Derived match scores | Confidential (Candidate PII) | `backend/app/recruitment` |
| **DOM-04** | Workforce Twins | Employees, assignments, Twin snapshots, status. | Authoritative employees; Derived snapshots | Confidential (Employee Twin) | `backend/app/twin` |
| **DOM-05** | Skill Graph | Skills, relationships, proficiency, readiness. | Authoritative taxonomy; Derived readiness | Internal Business Data | `backend/app/skills` |
| **DOM-06** | Evidence | Evidence items, validations, disputes, links. | Authoritative verified ledger | Confidential (Work artifacts) | `backend/app/evidence` |
| **DOM-07** | Storage & Docs | Document metadata, extraction chunks, security flags.| Authoritative file references | Confidential (Resumes, Docs) | `backend/app/storage` |
| **DOM-08** | Interviews | Structured plans, questions, transcripts, rubrics. | Authoritative rubrics; Derived probes | Confidential (Interview audio/text) | `backend/app/interviews` |
| **DOM-09** | Onboarding | Personalized journeys, milestones, blockers. | Authoritative tasks; Derived waivers | Internal Operational Data | `backend/app/onboarding` |
| **DOM-10** | Career Mobility| Career paths, internal gigs, learning recommendations.| Authoritative postings; Derived matches | Confidential (Aspirations private) | `backend/app/career` |
| **DOM-11** | Performance | Goals, reviews, feedback, calibration signals. | Authoritative formal reviews; Derived insights| Highly Confidential (Reviews) | `backend/app/performance` |
| **DOM-12** | Retention Intel| Longitudinal attrition hazard curves, SHAP factors.| Derived survival models (Non-authoritative)| Strictly Restricted (HRBP Only) | `backend/app/retention` |
| **DOM-13** | Policy & RAG | Policies, sections, vector chunks, Qwen answers. | Authoritative policy clauses; Derived RAG | Internal Compliance Data | `backend/app/policy` |
| **DOM-14** | Workflows | EnterPro workflow definitions, instances, approvals.| Authoritative workflow state machines | Internal Operational Data | `backend/app/workflow` |
| **DOM-15** | Workforce Plan | Scenarios, OR-Tools optimization runs, plans. | Authoritative goals; Derived allocations | Highly Confidential (Strategic) | `backend/app/planning` |
| **DOM-16** | AI & Audit | Model registry, prompt traces, audit ledgers. | Authoritative append-oriented audit logs | Restricted (System Audit) | `backend/app/audit` |

---

## 7.8 Entity Relationship Overview

### 7.8.1 High-Level Platform Architecture (Mermaid ER Diagram)

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ DEPARTMENTS : contains
    DEPARTMENTS ||--o{ TEAMS : contains
    TEAMS ||--o{ EMPLOYEES : manages
    ORGANIZATIONS ||--o{ JOB_REQUISITIONS : publishes
    JOB_REQUISITIONS ||--o{ APPLICATIONS : receives
    CANDIDATES ||--o{ APPLICATIONS : submits
    CANDIDATES ||"--o"| EMPLOYEES : "converts to on hire"
    
    EMPLOYEES ||--o{ PERSON_SKILLS : possesses
    SKILLS ||--o{ PERSON_SKILLS : categorizes
    SKILLS ||--o{ SKILL_RELATIONSHIPS : connects
    
    APPLICATIONS ||--o{ INTERVIEW_SESSIONS : conducts
    INTERVIEW_SESSIONS ||--o{ EVIDENCE_ITEMS : generates
    EVIDENCE_ITEMS ||--o{ PERSON_SKILLS : validates
    
    EMPLOYEES ||--o{ ONBOARDING_PLANS : receives
    EMPLOYEES ||--o{ RETENTION_CASES : evaluated_in
    EMPLOYEES ||--o{ WORKFLOW_INSTANCES : initiates
    
    POLICIES ||--o{ POLICY_VERSIONS : versions
    POLICY_VERSIONS ||--o{ POLICY_CHUNKS : splits
    POLICY_CHUNKS ||--o{ POLICY_ANSWERS : grounds
    
    WORKFORCE_SCENARIOS ||--o{ WORKFORCE_PLANS : optimizes
    WORKFORCE_PLANS ||--o{ WORKFLOW_INSTANCES : triggers

```

### 7.8.2 Identity and Access ER Diagram

```mermaid
erDiagram
    AUTH_USERS ||"--o"| PROFILES : "extends 1:1"
    ORGANIZATIONS ||--o{ PROFILES : employs
    PROFILES ||--o{ USER_ROLES : assigned
    ROLES ||--o{ USER_ROLES : binds
    ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : defines
    PROFILES ||--o{ USER_ACCESS_SCOPES : restricted_by

```

### 7.8.3 Candidate-to-Employee Continuity Flow Diagram

```mermaid
flowchart TD
    subgraph CandidatePhase["1. Candidate Phase"]
        C1["Candidate Record (candidates)"]
        C2["Resume Document (documents)"]
        C3["Application (applications)"]
        C4["Extracted Profile (candidate_profiles)"]
        C5["Interview Session (interview_sessions)"]
        C6["Verified Interview Evidence (evidence_items)"]
    end

    subgraph ConversionGate["2. Governed Conversion Transaction"]
        T1["EnterPro Offer Sign-Off (workflow_instances)"]
        T2["Candidate-to-Employee Converter Function"]
    end

    subgraph EmployeePhase["3. Employee Workforce Twin Phase"]
        E1["Employee Record (employees)"]
        E2["Employee Twin Status (employee_twin_status)"]
        E3["Verified Person Skills (person_skills)"]
        E4["Continuous Evidence Ledger (evidence_links)"]
        E5["Capability-Gap Onboarding (onboarding_plans)"]
    end

    C1 --> C3
    C2 --> C4
    C3 --> C5
    C5 --> C6
    C3 --> T1
    T1 -->|"Offer Accepted"| T2
    T2 -->|"Sets candidate_id FK"| E1
    T2 --> E2
    C6 -->|"Transfers Evidence Links"| E4
    E4 -->|"Validates Capabilities"| E3
    E3 -->|"Waives Verified Training"| E5

```

### 7.8.4 Skill Graph Relational Structure Diagram

```mermaid
erDiagram
    SKILLS ||--o{ SKILL_ALIASES : aliased_by
    SKILLS ||--o{ SKILL_RELATIONSHIPS : "source skill"
    SKILLS ||--o{ SKILL_RELATIONSHIPS : "target skill"
    SKILLS ||--o{ ROLE_SKILL_REQUIREMENTS : required_for
    SKILLS ||--o{ PERSON_SKILLS : possessed_by
    PERSON_SKILLS ||--o{ SKILL_OBSERVATIONS : aggregated_from
    EVIDENCE_ITEMS ||--o{ SKILL_OBSERVATIONS : validates

```

### 7.8.5 Evidence and Provenance Traceability Diagram

```mermaid
erDiagram
    PROFILES ||--o{ EVIDENCE_ITEMS : subject
    DOCUMENTS ||--o{ EVIDENCE_ITEMS : source_document
    EVIDENCE_ITEMS ||--o{ EVIDENCE_LINKS : attaches_to
    EVIDENCE_ITEMS ||--o{ EVIDENCE_VALIDATIONS : signed_by
    EVIDENCE_ITEMS ||--o{ EVIDENCE_DISPUTES : contested_by
    PROFILES ||--o{ EVIDENCE_VALIDATIONS : validator

```

### 7.8.6 Policy Data-Flow and Vector Grounding Diagram

```mermaid
flowchart TD
    P1["Policy Document PDF"] -->|"Ingestion and OCR"| P2["documents"]
    P2 -->|"Text Extraction"| P3["policy_versions"]
    P3 -->|"Section Splitting"| P4["policy_sections"]
    P4 -->|"Chunking and Embedding"| P5["policy_chunks (vector 384)"]
    P5 -->|"Conflict Detector"| P6["policy_conflicts"]
    
    Q1["Employee Natural Language Query"] -->|"pgvector Cosine Search"| P5
    P5 -->|"Top 5 Context Chunks"| Q2["FastAPI RAG Service"]
    Q2 -->|"Context + Strict Prompt"| Q3["Local Qwen3-4B-Instruct"]
    Q3 -->|"Grounded Answer + Citations"| Q4["policy_answers"]
    Q4 -->|"Pre-filled Request Trigger"| Q5["workflow_instances (EnterPro)"]

```

### 7.8.7 EnterPro Workflow Persistence Architecture

```mermaid
erDiagram
    PROFILES ||--o{ WORKFLOW_INSTANCES : initiates
    WORKFLOW_DEFINITIONS ||--o{ WORKFLOW_INSTANCES : instantiates
    WORKFLOW_INSTANCES ||--o{ WORKFLOW_STEPS : executes
    WORKFLOW_INSTANCES ||--o{ WORKFLOW_APPROVALS : awaits
    WORKFLOW_INSTANCES ||--o{ WORKFLOW_CALLBACKS : receives
    WORKFLOW_INSTANCES ||--o{ WORKFLOW_HISTORY : logs

```

---

## 7.9 Standard Field Requirements

Every table in WorkSense belongs to one of three structural categories:
1. **Mutable Business Entity (e.g., `employees`, `job_requisitions`):**
   * `id`: `UUID` primary key (`DEFAULT gen_random_uuid()`).
   * `organization_id`: `UUID NOT NULL REFERENCES organizations(id)`.
   * `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`.
   * `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`.
   * `created_by`: `UUID REFERENCES profiles(id)`.
   * `updated_by`: `UUID REFERENCES profiles(id)`.
   * `is_archived`: `BOOLEAN NOT NULL DEFAULT false`.
   * `version`: `INTEGER NOT NULL DEFAULT 1` (Used for optimistic concurrency locking).
2. **Immutable Ledger / Audit Record (e.g., `audit_events`, `evidence_items`, `workflow_history`):**
   * `id`: `UUID` primary key (`DEFAULT gen_random_uuid()`).
   * `organization_id`: `UUID NOT NULL REFERENCES organizations(id)`.
   * `recorded_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`.
   * `actor_id`: `UUID REFERENCES profiles(id)`.
   * `payload_hash`: `VARCHAR(64) NOT NULL` (SHA-256 integrity hash).
   * **Strict Invariant:** Immutable tables have zero `updated_at`, zero `updated_by`, and reject `UPDATE` statements via RLS.
3. **Relational Junction Edge (e.g., `skill_relationships`, `role_skill_requirements`):**
   * `id`: `UUID` primary key.
   * Source and target foreign keys with `ON DELETE CASCADE`.
   * Unique constraint preventing duplicate edges.
   * `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`.

---

## 7.10 Identity and Access Tables

```text
+------------------------------------------------------------------------------------+
|                         DOM-01: IDENTITY AND ACCESS TABLES                         |
+------------------------------------------------------------------------------------+
| profiles            | Public user profile linked 1:1 with auth.users.              |
| roles               | Master catalog of platform roles (Candidate, Employee, etc.).|
| permissions         | Granular action entitlements (e.g., candidate:rank:read).    |
| user_roles          | Active role assignments to profiles with validity dates.     |
| role_permissions    | Junction binding permissions to roles.                       |
| access_scopes       | Departmental, team, or case-level authorization boundaries.  |
| user_access_scopes  | Binding profiles to specific operational scopes.             |
+------------------------------------------------------------------------------------+
```

### Table 1: `profiles`
* `id` (`UUID`, PK, references `auth.users(id) ON DELETE CASCADE`)
* `organization_id` (`UUID`, FK references `organizations(id)`)
* `email` (`VARCHAR(255)`, NOT NULL, UNIQUE)
* `first_name` (`VARCHAR(100)`, NOT NULL)
* `last_name` (`VARCHAR(100)`, NOT NULL)
* `avatar_url` (`TEXT`, NULL)
* `is_active` (`BOOLEAN`, NOT NULL DEFAULT true)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* `updated_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* *Constraints:* `CHECK (char_length(email) >= 5)`.

### Table 2: `roles`
* `id` (`VARCHAR(32)`, PK) — Enum values: `candidate`, `employee`, `manager`, `recruiter`, `hr_bp`, `leadership`, `admin_gov`.
* `display_name` (`VARCHAR(100)`, NOT NULL)
* `description` (`TEXT`, NOT NULL)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

### Table 3: `user_roles`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `user_id` (`UUID`, NOT NULL, references `profiles(id) ON DELETE CASCADE`)
* `role_id` (`VARCHAR(32)`, NOT NULL, references `roles(id)`)
* `granted_by` (`UUID`, references `profiles(id)`)
* `granted_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* `expires_at` (`TIMESTAMPTZ`, NULL)
* *Constraints:* `UNIQUE(user_id, role_id)`.

### Table 4: `user_access_scopes`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `user_id` (`UUID`, NOT NULL, references `profiles(id) ON DELETE CASCADE`)
* `scope_type` (`VARCHAR(32)`, NOT NULL) — e.g., `department`, `team`, `retention_case`.
* `scope_id` (`UUID`, NOT NULL) — ID of target department/team.
* `granted_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* `expires_at` (`TIMESTAMPTZ`, NULL)
* *Indexes:* `idx_user_scopes_lookup ON user_access_scopes(user_id, scope_type, scope_id)`.

---

## 7.11 Organization Tables

```text
+------------------------------------------------------------------------------------+
|                           DOM-02: ORGANIZATION TABLES                              |
+------------------------------------------------------------------------------------+
| organizations         | Multi-tenant enterprise entity boundaries.                 |
| departments           | High-level divisions (Engineering, Sales, Platform).       |
| teams                 | Operational squads (Core Infra, AI Fraud, Growth).        |
| locations             | Physical and remote work jurisdictions for tax/policy.     |
| positions             | Formal job titles and compensation bands (L4, L5, L6).     |
| reporting_relationships| Direct manager and matrix reporting lines with history.    |
+------------------------------------------------------------------------------------+
```

### Table 5: `organizations`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `name` (`VARCHAR(200)`, NOT NULL)
* `domain` (`VARCHAR(100)`, NOT NULL, UNIQUE)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

### Table 6: `departments`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `organization_id` (`UUID`, NOT NULL, references `organizations(id)`)
* `name` (`VARCHAR(150)`, NOT NULL)
* `head_profile_id` (`UUID`, references `profiles(id)`)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* *Constraints:* `UNIQUE(organization_id, name)`.

### Table 7: `teams`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `department_id` (`UUID`, NOT NULL, references `departments(id)`)
* `name` (`VARCHAR(150)`, NOT NULL)
* `lead_profile_id` (`UUID`, references `profiles(id)`)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

### Table 8: `reporting_relationships`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `employee_id` (`UUID`, NOT NULL, references `profiles(id)`)
* `manager_id` (`UUID`, NOT NULL, references `profiles(id)`)
* `relationship_type` (`VARCHAR(32)`, NOT NULL DEFAULT 'direct') — `direct`, `dotted_line`.
* `effective_start_date` (`DATE`, NOT NULL)
* `effective_end_date` (`DATE`, NULL)
* *Constraints:* `CHECK (employee_id != manager_id)`.

---

## 7.12 Candidate and Recruitment Tables

```text
+------------------------------------------------------------------------------------+
|                         DOM-03: CANDIDATE & RECRUITMENT TABLES                     |
+------------------------------------------------------------------------------------+
| candidates            | Candidate root identity, contact info, privacy consent.    |
| candidate_profiles    | Extracted structured profile data (work history, degrees). |
| job_requisitions      | Published job openings, target headcount, required skills. |
| applications          | Formal candidate application to a job requisition.         |
| candidate_rankings    | Multi-feature match scores and rank order (LightGBM/heur). |
| candidate_decisions   | Recruiter/Hiring Manager human decisions (Shortlist/Offer).|
+------------------------------------------------------------------------------------+
```

### Table 9: `candidates`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `profile_id` (`UUID`, NULL, references `profiles(id)`) — Linked if candidate creates auth account.
* `first_name` (`VARCHAR(100)`, NOT NULL)
* `last_name` (`VARCHAR(100)`, NOT NULL)
* `email` (`VARCHAR(255)`, NOT NULL, UNIQUE)
* `phone` (`VARCHAR(50)`, NULL)
* `consent_timestamp` (`TIMESTAMPTZ`, NOT NULL)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

### Table 10: `job_requisitions`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `organization_id` (`UUID`, NOT NULL, references `organizations(id)`)
* `requisition_code` (`VARCHAR(50)`, NOT NULL, UNIQUE) — e.g., `REQ-2026-088`.
* `title` (`VARCHAR(200)`, NOT NULL)
* `department_id` (`UUID`, NOT NULL, references `departments(id)`)
* `target_headcount` (`INTEGER`, NOT NULL DEFAULT 1)
* `status` (`VARCHAR(32)`, NOT NULL DEFAULT 'open') — `draft`, `open`, `closed`, `filled`.
* `description_md` (`TEXT`, NOT NULL)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

### Table 11: `applications`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `job_requisition_id` (`UUID`, NOT NULL, references `job_requisitions(id)`)
* `candidate_id` (`UUID`, NOT NULL, references `candidates(id)`)
* `status` (`VARCHAR(32)`, NOT NULL DEFAULT 'submitted') — `submitted`, `screening`, `interviewing`, `shortlisted`, `offered`, `hired`, `rejected`, `withdrawn`.
* `current_match_score` (`INTEGER`, NULL) — 0 to 100 integer percentage.
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* `updated_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* *Constraints:* `UNIQUE(job_requisition_id, candidate_id)`.

### Table 12: `candidate_rankings`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `job_requisition_id` (`UUID`, NOT NULL, references `job_requisitions(id)`)
* `application_id` (`UUID`, NOT NULL, references `applications(id)`)
* `ranking_method` (`VARCHAR(50)`, NOT NULL) — e.g., `lightgbm-multifeature-v2`.
* `model_version` (`VARCHAR(32)`, NOT NULL)
* `match_score` (`INTEGER`, NOT NULL) — 0 to 100 integer.
* `rank_position` (`INTEGER`, NOT NULL)
* `qwen_rationale_id` (`UUID`, NULL) — Reference to `ai_outputs(id)`.
* `is_stale` (`BOOLEAN`, NOT NULL DEFAULT false)
* `generated_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* *Constraints:* `CHECK (match_score >= 0 AND match_score <= 100)`.

---

## 7.13 Candidate-to-Employee Continuity

```text
+------------------------------------------------------------------------------------+
|                     CANDIDATE-TO-EMPLOYEE CONVERSION SPECIFICATION                 |
+------------------------------------------------------------------------------------+
| 1. ATOMIC TRANSACTION: Handled via Postgres function convert_candidate_to_employee |
| 2. LINKAGE PRESERVATION: employee.candidate_id retains permanent pointer.           |
| 3. EVIDENCE TRANSFORMATION: Evidence links associated with candidate application   |
|    are cloned/re-linked to person_skills for the new employee record.               |
| 4. ONBOARDING INITIALIZATION: An onboarding_plans record is automatically created, |
|    flagging all verified interview skills as WAIVED.                                |
| 5. MASKING GUARANTEE: Candidate salary history and private recruiter notes are NOT |
|    copied into the employee-visible Workforce Twin tables.                          |
+------------------------------------------------------------------------------------+
```

---

## 7.14 Employee and Workforce Twin Tables

```text
+------------------------------------------------------------------------------------+
|                         DOM-04: EMPLOYEE & WORKFORCE TWIN TABLES                   |
+------------------------------------------------------------------------------------+
| employees             | Authoritative master record of employed personnel.         |
| employee_assignments  | Department, team, position, and location active bindings.  |
| employee_twin_snapshots| Point-in-time serialized snapshots of capability radar.    |
| employee_twin_status  | Live Twin status: freshness, verification count, decay.    |
| employee_interests    | Private career aspirations, desired skills, mobility opt-in|
+------------------------------------------------------------------------------------+
```

### Table 13: `employees`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `profile_id` (`UUID`, NOT NULL, UNIQUE, references `profiles(id)`)
* `candidate_id` (`UUID`, NULL, UNIQUE, references `candidates(id)`) — Preserves recruitment lineage.
* `employee_code` (`VARCHAR(50)`, NOT NULL, UNIQUE) — e.g., `EMP-10492`.
* `hire_date` (`DATE`, NOT NULL)
* `employment_status` (`VARCHAR(32)`, NOT NULL DEFAULT 'active') — `probation`, `active`, `leave`, `terminated`.
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* `updated_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

### Table 14: `employee_twin_status`
* `employee_id` (`UUID`, PK, references `employees(id) ON DELETE CASCADE`)
* `twin_version` (`INTEGER`, NOT NULL DEFAULT 1)
* `verified_skill_count` (`INTEGER`, NOT NULL DEFAULT 0)
* `inferred_skill_count` (`INTEGER`, NOT NULL DEFAULT 0)
* `stale_skill_count` (`INTEGER`, NOT NULL DEFAULT 0)
* `last_evidence_at` (`TIMESTAMPTZ`, NULL)
* `last_recalculated_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* `has_active_dispute` (`BOOLEAN`, NOT NULL DEFAULT false)

---

## 7.15 Skill and Capability Graph Tables

```text
+------------------------------------------------------------------------------------+
|                         DOM-05: RELATIONAL SKILL GRAPH TABLES                      |
+------------------------------------------------------------------------------------+
| skills                | Normalized skill taxonomy (PyTorch, Kubernetes, FinOps).   |
| skill_aliases         | Synonyms and abbreviations (K8s -> Kubernetes).            |
| skill_relationships   | Directed weighted edges (ADJACENT_TO, PREREQUISITE_OF).    |
| role_skill_requirements| Minimum proficiency required for positions (L5 requires L4)|
| person_skills         | Active proficiency level of a person (Candidate/Employee). |
| skill_observations    | Longitudinal raw skill demonstrations before aggregation.  |
+------------------------------------------------------------------------------------+
```

### Table 15: `skills`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `skill_code` (`VARCHAR(100)`, NOT NULL, UNIQUE) — e.g., `skill_pytorch`.
* `name` (`VARCHAR(150)`, NOT NULL)
* `category` (`VARCHAR(100)`, NOT NULL) — `Machine Learning`, `Infrastructure`, `Security`.
* `description` (`TEXT`, NOT NULL)
* `is_active` (`BOOLEAN`, NOT NULL DEFAULT true)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

### Table 16: `skill_relationships`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `source_skill_id` (`UUID`, NOT NULL, references `skills(id)`)
* `target_skill_id` (`UUID`, NOT NULL, references `skills(id)`)
* `relationship_type` (`VARCHAR(32)`, NOT NULL) — `ADJACENT_TO`, `PREREQUISITE_OF`, `TRANSFERABLE_TO`, `SPECIALIZATION_OF`.
* `similarity_weight` (`NUMERIC(4,3)`, NOT NULL DEFAULT 0.500) — Range $0.000$ to $1.000$.
* `is_bidirectional` (`BOOLEAN`, NOT NULL DEFAULT false)
* *Constraints:* `CHECK (source_skill_id != target_skill_id)`, `UNIQUE(source_skill_id, target_skill_id, relationship_type)`.

### Table 17: `person_skills`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `person_id` (`UUID`, NOT NULL, references `profiles(id)`) — Polymorphic: Candidate or Employee.
* `skill_id` (`UUID`, NOT NULL, references `skills(id)`)
* `proficiency_level` (`INTEGER`, NOT NULL) — Range $1$ (Novice) to $5$ (Expert).
* `confidence_band` (`VARCHAR(32)`, NOT NULL DEFAULT 'limited') — `high`, `moderate`, `limited`, `insufficient`.
* `verification_source` (`VARCHAR(32)`, NOT NULL) — `interview_verified`, `manager_verified`, `production_pr`, `self_declared`.
* `last_demonstrated_at` (`TIMESTAMPTZ`, NOT NULL)
* `is_stale` (`BOOLEAN`, NOT NULL DEFAULT false) — Automatically flagged if $>180$ days inactive.
* *Constraints:* `UNIQUE(person_id, skill_id)`, `CHECK (proficiency_level BETWEEN 1 AND 5)`.

---

## 7.16 Evidence and Provenance Tables

```text
+------------------------------------------------------------------------------------+
|                         DOM-06: EVIDENCE AND PROVENANCE TABLES                     |
+------------------------------------------------------------------------------------+
| evidence_items        | Atomic proof artifacts (PRs, certificates, audio clips).   |
| evidence_links        | Junction tethering evidence to claims, skills, or reviews. |
| evidence_validations  | Formal human sign-offs (Manager/Recruiter verification).   |
| evidence_disputes     | Employee formal contestation of stale or inaccurate claims.|
+------------------------------------------------------------------------------------+
```

### Table 18: `evidence_items`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `organization_id` (`UUID`, NOT NULL, references `organizations(id)`)
* `subject_person_id` (`UUID`, NOT NULL, references `profiles(id)`)
* `claim_summary` (`VARCHAR(255)`, NOT NULL)
* `source_type` (`VARCHAR(50)`, NOT NULL) — `github_pr`, `jira_ticket`, `interview_transcript`, `lms_course`.
* `source_uri` (`TEXT`, NOT NULL) — External URL or internal document reference.
* `observed_at` (`TIMESTAMPTZ`, NOT NULL)
* `evidence_strength` (`VARCHAR(32)`, NOT NULL) — `strong`, `moderate`, `weak`.
* `validation_status` (`VARCHAR(32)`, NOT NULL DEFAULT 'pending') — `pending`, `validated`, `disputed`, `rejected`.
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

### Table 19: `evidence_links`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `evidence_item_id` (`UUID`, NOT NULL, references `evidence_items(id) ON DELETE CASCADE`)
* `target_entity_type` (`VARCHAR(50)`, NOT NULL) — `person_skill`, `interview_response`, `onboarding_task`.
* `target_entity_id` (`UUID`, NOT NULL)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* *Constraints:* `UNIQUE(evidence_item_id, target_entity_type, target_entity_id)`.

---

## 7.17 Document and Storage Metadata

```text
+------------------------------------------------------------------------------------+
|                         DOM-07: DOCUMENT STORAGE METADATA TABLES                   |
+------------------------------------------------------------------------------------+
| documents             | File metadata records for Supabase Storage objects.        |
| document_versions     | Multi-version tracking for updated resumes or policies.    |
| document_extractions  | Cleaned programmatic text extracts (pypdf/pdfplumber).     |
| document_security_flags| Firewall scan outputs (macro detections, PII tags).       |
+------------------------------------------------------------------------------------+
```

### Table 20: `documents`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `organization_id` (`UUID`, NOT NULL, references `organizations(id)`)
* `storage_bucket` (`VARCHAR(100)`, NOT NULL) — `candidate-resumes`, `policy-documents`, `evidence-attachments`.
* `storage_path` (`TEXT`, NOT NULL, UNIQUE)
* `file_name` (`VARCHAR(255)`, NOT NULL)
* `mime_type` (`VARCHAR(100)`, NOT NULL)
* `file_size_bytes` (`BIGINT`, NOT NULL)
* `sha256_hash` (`VARCHAR(64)`, NOT NULL)
* `uploaded_by` (`UUID`, NOT NULL, references `profiles(id)`)
* `scan_status` (`VARCHAR(32)`, NOT NULL DEFAULT 'clean') — `clean`, `suspicious`, `quarantined`.
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

---

## 7.18 Interview Tables

```text
+------------------------------------------------------------------------------------+
|                             DOM-08: INTERVIEW TABLES                               |
+------------------------------------------------------------------------------------+
| interview_plans       | Structured rubric template for a specific job requisition. |
| interview_competencies| Individual dimensions evaluated (e.g., Distributed Systems)|
| interview_sessions    | Real-time candidate interview execution instance.          |
| interview_questions   | Master questions and Qwen-generated adaptive follow-ups.   |
| interview_responses   | Candidate audio/text responses and ASR transcripts.        |
| interview_assessments | Recommended ratings, extracted signals, human reviews.     |
+------------------------------------------------------------------------------------+
```

### Table 21: `interview_sessions`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `application_id` (`UUID`, NOT NULL, references `applications(id)`)
* `candidate_id` (`UUID`, NOT NULL, references `candidates(id)`)
* `scheduled_start_time` (`TIMESTAMPTZ`, NOT NULL)
* `actual_start_time` (`TIMESTAMPTZ`, NULL)
* `completed_at` (`TIMESTAMPTZ`, NULL)
* `session_status` (`VARCHAR(32)`, NOT NULL DEFAULT 'scheduled') — `scheduled`, `in_progress`, `paused`, `completed`, `cancelled`.
* `current_competency_index` (`INTEGER`, NOT NULL DEFAULT 1)

### Table 22: `interview_questions`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `interview_session_id` (`UUID`, NOT NULL, references `interview_sessions(id) ON DELETE CASCADE`)
* `competency_id` (`UUID`, NOT NULL)
* `question_type` (`VARCHAR(32)`, NOT NULL) — `core_rubric`, `adaptive_probe`.
* `parent_question_id` (`UUID`, NULL, references `interview_questions(id)`) — Linked if adaptive probe.
* `question_text` (`TEXT`, NOT NULL)
* `sequence_order` (`INTEGER`, NOT NULL)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

### Table 23: `interview_responses`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `question_id` (`UUID`, NOT NULL, UNIQUE, references `interview_questions(id) ON DELETE CASCADE`)
* `raw_transcript_text` (`TEXT`, NOT NULL)
* `audio_recording_uri` (`TEXT`, NULL)
* `submitted_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

---

## 7.19 Onboarding Tables

```text
+------------------------------------------------------------------------------------+
|                             DOM-09: ONBOARDING TABLES                              |
+------------------------------------------------------------------------------------+
| onboarding_plans      | Personalized 30/60/90-day journey assigned to a new hire.  |
| onboarding_milestones | Milestone phases (Day 30, Day 60, Day 90).                 |
| onboarding_tasks      | Concrete tasks (InfoSec Training, Setup GPU Access).       |
| onboarding_blockers   | Stalled tasks (e.g., Access Blocked) with SLA tracking.    |
+------------------------------------------------------------------------------------+
```

### Table 24: `onboarding_plans`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `employee_id` (`UUID`, NOT NULL, UNIQUE, references `employees(id)`)
* `template_name` (`VARCHAR(150)`, NOT NULL)
* `total_tasks` (`INTEGER`, NOT NULL DEFAULT 0)
* `waived_tasks` (`INTEGER`, NOT NULL DEFAULT 0) — Waived via candidate interview evidence.
* `completed_tasks` (`INTEGER`, NOT NULL DEFAULT 0)
* `overall_status` (`VARCHAR(32)`, NOT NULL DEFAULT 'in_progress') — `in_progress`, `completed`, `blocked`.
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

### Table 25: `onboarding_tasks`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `onboarding_plan_id` (`UUID`, NOT NULL, references `onboarding_plans(id) ON DELETE CASCADE`)
* `title` (`VARCHAR(200)`, NOT NULL)
* `category` (`VARCHAR(50)`, NOT NULL) — `compliance`, `technical_setup`, `domain_learning`.
* `is_mandatory_compliance` (`BOOLEAN`, NOT NULL DEFAULT false) — Cannot be waived by AI.
* `is_waived` (`BOOLEAN`, NOT NULL DEFAULT false)
* `waiver_reason` (`TEXT`, NULL) — e.g., *"Waived: PyTorch verified in screening"*.
* `status` (`VARCHAR(32)`, NOT NULL DEFAULT 'pending') — `pending`, `in_progress`, `blocked`, `completed`.
* `due_date` (`DATE`, NOT NULL)

---

## 7.20 Career and Internal Mobility Tables

```text
+------------------------------------------------------------------------------------+
|                         DOM-10: CAREER & MOBILITY TABLES                           |
+------------------------------------------------------------------------------------+
| career_paths          | Defined progression tracks (Backend Eng -> Staff Architect)|
| internal_opportunities| Active internal postings, project gigs, and open roles.    |
| opportunity_matches   | Model-calculated readiness match scores for gigs.          |
| employee_interests    | Private employee applications and mobility preferences.    |
+------------------------------------------------------------------------------------+
```

### Table 26: `internal_opportunities`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `organization_id` (`UUID`, NOT NULL, references `organizations(id)`)
* `title` (`VARCHAR(200)`, NOT NULL)
* `opportunity_type` (`VARCHAR(50)`, NOT NULL) — `full_transfer`, `project_gig`, `mentorship`.
* `time_commitment_pct` (`INTEGER`, NOT NULL DEFAULT 10) — 10% to 100%.
* `status` (`VARCHAR(32)`, NOT NULL DEFAULT 'open') — `open`, `filled`, `closed`.
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

---

## 7.21 Performance Tables

```text
+------------------------------------------------------------------------------------+
|                            DOM-11: PERFORMANCE TABLES                              |
+------------------------------------------------------------------------------------+
| performance_cycles    | Annual or quarterly evaluation periods (e.g., 2026-Q1).    |
| goals                 | Employee performance targets and key results.              |
| performance_reviews   | Formal manager evaluations and sign-off ratings.           |
| performance_insights  | Qwen-generated synthesis of delivery evidence (Advisory).   |
+------------------------------------------------------------------------------------+
```

### Table 27: `performance_reviews`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `cycle_id` (`UUID`, NOT NULL)
* `employee_id` (`UUID`, NOT NULL, references `employees(id)`)
* `manager_id` (`UUID`, NOT NULL, references `employees(id)`)
* `formal_rating` (`VARCHAR(32)`, NULL) — Human-determined rating.
* `manager_narrative` (`TEXT`, NULL)
* `employee_acknowledgment` (`BOOLEAN`, NOT NULL DEFAULT false)
* `review_status` (`VARCHAR(32)`, NOT NULL DEFAULT 'draft') — `draft`, `submitted`, `signed_off`.
* `signed_off_at` (`TIMESTAMPTZ`, NULL)

---

## 7.22 Attrition and Retention Tables

```text
+------------------------------------------------------------------------------------+
|                         DOM-12: ATTRITION & RETENTION TABLES                       |
+------------------------------------------------------------------------------------+
| attrition_model_runs  | Batch execution records of survival hazard models.         |
| attrition_predictions | Employee-level survival hazard probabilities across horizons|
| attrition_factors     | Longitudinal contributing and protective factors (SHAP).   |
| retention_cases       | Confidential HRBP case files for high-hazard interventions.|
+------------------------------------------------------------------------------------+
```

### Table 28: `attrition_predictions`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `model_run_id` (`UUID`, NOT NULL)
* `employee_id` (`UUID`, NOT NULL, references `employees(id)`)
* `hazard_3mo` (`INTEGER`, NOT NULL) — 0 to 100 percentage.
* `hazard_6mo` (`INTEGER`, NOT NULL) — 0 to 100 percentage.
* `hazard_12mo` (`INTEGER`, NOT NULL) — 0 to 100 percentage.
* `confidence_band` (`VARCHAR(32)`, NOT NULL) — `high`, `moderate`, `limited`.
* `generated_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* *Security Invariant:* Restricted strictly to `hr_bp` role via RLS.

### Table 29: `attrition_factors`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `prediction_id` (`UUID`, NOT NULL, references `attrition_predictions(id) ON DELETE CASCADE`)
* `factor_type` (`VARCHAR(32)`, NOT NULL) — `contributing`, `protective`.
* `feature_name` (`VARCHAR(100)`, NOT NULL) — e.g., `tenure_in_band`, `market_comp_ratio`.
* `shap_impact_pct` (`INTEGER`, NOT NULL) — Signed impact on hazard rate.
* `narrative_summary` (`VARCHAR(255)`, NOT NULL)

---

## 7.23 Policy and Knowledge Tables

```text
+------------------------------------------------------------------------------------+
|                           DOM-13: POLICY & KNOWLEDGE TABLES                        |
+------------------------------------------------------------------------------------+
| policies              | Policy documents master records (Remote Work, Travel).     |
| policy_versions       | Versioned corpora with effective and expiry dates.         |
| policy_chunks         | Chunked textual clauses with pgvector semantic embeddings. |
| policy_conflicts      | Detected contradictions between active policy clauses.     |
| policy_answers        | Grounded Qwen answers with citations and abstention tags.  |
+------------------------------------------------------------------------------------+
```

### Table 30: `policy_chunks`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `policy_version_id` (`UUID`, NOT NULL)
* `section_identifier` (`VARCHAR(50)`, NOT NULL) — e.g., `Section 5.2`.
* `clause_text` (`TEXT`, NOT NULL)
* `embedding` (`vector(384)`, NOT NULL) — pgvector semantic embedding.
* `is_active` (`BOOLEAN`, NOT NULL DEFAULT true)
* *Indexes:* `idx_policy_chunks_vector ON policy_chunks USING ivfflat (embedding vector_cosine_ops)`.

### Table 31: `policy_answers`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `query_text` (`TEXT`, NOT NULL)
* `asked_by` (`UUID`, NOT NULL, references `profiles(id)`)
* `synthesized_answer` (`TEXT`, NOT NULL)
* `is_abstained` (`BOOLEAN`, NOT NULL DEFAULT false)
* `abstention_reason` (`TEXT`, NULL)
* `citations` (`JSONB`, NOT NULL DEFAULT '[]'::jsonb)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

---

## 7.24 Requests, Approvals and EnterPro Tables

```text
+------------------------------------------------------------------------------------+
|                      DOM-14: REQUESTS, APPROVALS & ENTERPRO TABLES                 |
+------------------------------------------------------------------------------------+
| workflow_definitions  | Blueprints for workflows (Remote Exception, Access Ticket).|
| workflow_instances    | Active execution instances tied to EnterPro state machines.|
| workflow_approvals    | Human approval steps, signers, decisions, and reasons.     |
| workflow_callbacks    | Ingested EnterPro webhook event logs with idempotency keys.|
+------------------------------------------------------------------------------------+
```

### Table 32: `workflow_instances`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `organization_id` (`UUID`, NOT NULL, references `organizations(id)`)
* `workflow_type` (`VARCHAR(50)`, NOT NULL) — `onboarding_access`, `remote_exception`, `internal_transfer`.
* `enterpro_workflow_id` (`VARCHAR(100)`, NULL, UNIQUE) — External EnterPro correlation ID.
* `initiator_profile_id` (`UUID`, NOT NULL, references `profiles(id)`)
* `current_state` (`VARCHAR(32)`, NOT NULL DEFAULT 'requested') — Enum: `recommended`, `requested`, `awaiting_approval`, `approved`, `execution_pending`, `in_progress`, `completed`, `rejected`, `failed`, `cancelled`.
* `idempotency_key` (`VARCHAR(100)`, NOT NULL, UNIQUE)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* `updated_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

### Table 33: `workflow_approvals`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `workflow_instance_id` (`UUID`, NOT NULL, references `workflow_instances(id) ON DELETE CASCADE`)
* `approver_profile_id` (`UUID`, NOT NULL, references `profiles(id)`)
* `approval_order` (`INTEGER`, NOT NULL DEFAULT 1)
* `decision` (`VARCHAR(32)`, NOT NULL DEFAULT 'pending') — `pending`, `approved`, `rejected`, `delegated`.
* `decision_reason` (`TEXT`, NULL)
* `decided_at` (`TIMESTAMPTZ`, NULL)
* *Constraints:* `CHECK (approver_profile_id != (SELECT initiator_profile_id FROM workflow_instances WHERE id = workflow_instance_id))`.

---

## 7.25 Workforce Planning Tables

```text
+------------------------------------------------------------------------------------+
|                           DOM-15: WORKFORCE PLANNING TABLES                        |
+------------------------------------------------------------------------------------+
| workforce_scenarios   | Strategic goals (Form 8-Person AI Fraud Team in 90 Days).  |
| scenario_constraints  | Constraints: Budget ceiling, timeline, mobility limits.    |
| workforce_plans       | Strategy plans generated by Google OR-Tools CP-SAT solver. |
| plan_assignments      | Headcount allocations (3 Transfers, 3 Upskill, 2 Ext Hires)|
+------------------------------------------------------------------------------------+
```

### Table 34: `workforce_plans`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `scenario_id` (`UUID`, NOT NULL, references `workforce_scenarios(id) ON DELETE CASCADE`)
* `strategy_label` (`VARCHAR(50)`, NOT NULL) — e.g., `Strategy A (Internal)`, `Strategy B (Balanced)`.
* `total_cost_usd` (`NUMERIC(12,2)`, NOT NULL)
* `time_to_ready_days` (`INTEGER`, NOT NULL)
* `is_feasible` (`BOOLEAN`, NOT NULL)
* `is_selected` (`BOOLEAN`, NOT NULL DEFAULT false)
* `solver_status` (`VARCHAR(50)`, NOT NULL) — `OPTIMAL`, `FEASIBLE`, `INFEASIBLE`.
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

---

## 7.26 AI and Model-Operations Tables

```text
+------------------------------------------------------------------------------------+
|                          DOM-16: AI & MODEL OPERATIONS TABLES                      |
+------------------------------------------------------------------------------------+
| model_registry        | Registered models (Ollama qwen3:4b-instruct, LightGBM).    |
| prompt_templates      | Version-controlled prompt templates with SHA-256 hashes.   |
| ai_requests           | Audit log of all model invocations with latency & tokens.  |
| ai_outputs            | Synthesized model outputs linked to caller records.        |
+------------------------------------------------------------------------------------+
```

### Table 35: `ai_requests`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `model_name` (`VARCHAR(100)`, NOT NULL) — `qwen3:4b-instruct-2507-q4_K_M`.
* `task_type` (`VARCHAR(50)`, NOT NULL) — `candidate_match_explain`, `adaptive_probe`, `policy_rag`.
* `caller_profile_id` (`UUID`, NOT NULL, references `profiles(id)`)
* `duration_ms` (`INTEGER`, NOT NULL)
* `status` (`VARCHAR(32)`, NOT NULL) — `completed`, `timed_out`, `failed`, `abstained`.
* `prompt_tokens` (`INTEGER`, NOT NULL)
* `completion_tokens` (`INTEGER`, NOT NULL)
* `created_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)

---

## 7.27 Events, Notifications and Audit Tables

### Table 36: `audit_events`
* `id` (`UUID`, PK, `DEFAULT gen_random_uuid()`)
* `organization_id` (`UUID`, NOT NULL, references `organizations(id)`)
* `actor_id` (`UUID`, NOT NULL, references `profiles(id)`)
* `actor_role` (`VARCHAR(32)`, NOT NULL)
* `action` (`VARCHAR(100)`, NOT NULL) — e.g., `retention:case:view`, `candidate:offer:approve`.
* `resource_type` (`VARCHAR(50)`, NOT NULL)
* `resource_id` (`UUID`, NOT NULL)
* `previous_state` (`JSONB`, NULL)
* `new_state` (`JSONB`, NULL)
* `correlation_id` (`UUID`, NOT NULL)
* `recorded_at` (`TIMESTAMPTZ`, NOT NULL DEFAULT CURRENT_TIMESTAMP)
* *Security Invariant:* Append-only; zero `UPDATE` or `DELETE` grants permitted.

---

## 7.28 Enum and Controlled Vocabulary Catalog

```text
+------------------------------------------------------------------------------------+
|                             CONTROLLED ENUM VOCABULARIES                           |
+------------------------------------------------------------------------------------+
| Enum Name                | Permitted Values                                        |
| :----------------------- | :------------------------------------------------------ |
| user_role_enum           | candidate, employee, manager, recruiter, hr_bp,         |
|                          | leadership, admin_gov                                   |
| application_status_enum  | submitted, screening, interviewing, shortlisted,        |
|                          | offered, hired, rejected, withdrawn                     |
| workflow_state_enum      | recommended, requested, awaiting_approval, approved,     |
|                          | execution_pending, in_progress, completed, rejected,    |
|                          | failed, cancelled                                       |
| confidence_band_enum     | high, moderate, limited, insufficient                   |
| evidence_strength_enum   | strong, moderate, weak                                  |
| skill_relationship_enum  | ADJACENT_TO, PREREQUISITE_OF, TRANSFERABLE_TO,           |
|                          | SPECIALIZATION_OF                                       |
| solver_status_enum       | OPTIMAL, FEASIBLE, INFEASIBLE, TIMEOUT                  |
+------------------------------------------------------------------------------------+
```

---

## 7.29 Constraints and Integrity Rules

| Rule ID | Table Target | Rule Description | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| `INT-01` | `applications` | Single active application per candidate per requisition. | Database Unique Constraint |
| `INT-02` | `workflow_approvals`| Approver cannot be the workflow initiator (No self-approval). | DB Check & Backend Service |
| `INT-03` | `skill_relationships`| Source and target skills must differ (No self-cycles). | Database Check Constraint |
| `INT-04` | `employees` | Every employee must have an active department and team. | Database Foreign Keys |
| `INT-05` | `person_skills` | Proficiency level must sit between 1 and 5. | Database Check Constraint |
| `INT-06` | `workflow_instances`| Idempotency key must be globally unique. | Database Unique Constraint |
| `INT-07` | `onboarding_tasks`| Mandatory compliance tasks cannot have `is_waived = true`.| Database Check Constraint |
| `INT-08` | `audit_events` | Append-only ledger; zero updates or deletions permitted. | PostgreSQL Rule / RLS |

---

## 7.30 Indexing Strategy

* **Foreign Key Indexing:** Every single foreign key column enforces an explicit B-tree index to eliminate sequential table scans during joins.
* **Partial Indexes for Active Workspaces:**
  * `CREATE INDEX idx_active_apps ON applications(job_requisition_id) WHERE status IN ('submitted', 'screening', 'interviewing', 'shortlisted');`
  * `CREATE INDEX idx_pending_workflows ON workflow_instances(current_state) WHERE current_state = 'awaiting_approval';`
* **Composite Indexes for Fast Filtering:**
  * `CREATE INDEX idx_person_skills_lookup ON person_skills(person_id, skill_id, proficiency_level);`
  * `CREATE INDEX idx_audit_lookup ON audit_events(organization_id, recorded_at DESC);`
* **Vector Index:**
  * `CREATE INDEX idx_policy_chunks_ivfflat ON policy_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`

---

## 7.31 Vector and Retrieval Design

* **Vector Schema:** Standardized on `vector(384)` in table `policy_chunks`.
* **Pre-Retrieval Security Filtering:** Vector similarity searches **MUST** enforce organization and role filter clauses directly in the SQL `WHERE` statement:
  ```sql
  SELECT id, section_identifier, clause_text, 1 - (embedding <=> query_vector) AS similarity
  FROM policy_chunks
  WHERE policy_version_id IN (
      SELECT id FROM policy_versions WHERE organization_id = auth_org_id() AND status = 'published'
  )
  ORDER BY embedding <=> query_vector
  LIMIT 5;
  ```
* **Post-Retrieval Leakage Prohibition:** Retrieving confidential policy documents and filtering them only within Python or Qwen prompt context is strictly prohibited.

---

## 7.32 Row-Level Security (RLS) Model

All tables enforce Row-Level Security. Security relies on Supabase Auth context (`auth.uid()`).

```text
+------------------------------------------------------------------------------------+
|                         ROW-LEVEL SECURITY (RLS) ACCESS MATRIX                     |
+------------------------------------------------------------------------------------+
| Table Target         | Candidate | Employee  | Manager   | Recruiter | HRBP  | Exec |
| :------------------- | :-------- | :-------- | :-------- | :-------- | :---- | :--- |
| candidates           | Own Only  | None      | None      | Full Org  | Full  | None |
| applications         | Own Only  | None      | Assigned  | Full Org  | Full  | Agg  |
| employees            | None      | Own Only  | Own Team  | Read Org  | Full  | Full |
| person_skills        | Own (Cand)| Own Only  | Own Team  | Read Org  | Full  | Agg  |
| evidence_items       | Own Only  | Own Only  | Own Team  | Read Org  | Full  | None |
| onboarding_plans     | None      | Own Only  | Own Team  | None      | Full  | None |
| attrition_predictions| None      | None      | None      | None      | Full  | None |
| policy_chunks        | None      | Read All  | Read All  | Read All  | Full  | Read |
| workflow_instances   | None      | Own Init  | Team Appr | Org Init  | Full  | Full |
| audit_events         | None      | None      | None      | None      | Read  | Read |
+------------------------------------------------------------------------------------+
```
*(Admin role retains metadata audit access but is strictly barred from reading employee performance reviews or hiring decisions without secondary elevation).*

---

## 7.33 Storage Security Policies

```text
+------------------------------------------------------------------------------------+
|                             SUPABASE STORAGE ACCESS MATRIX                         |
+------------------------------------------------------------------------------------+
| Bucket Name           | Privacy | Upload Auth        | Read Auth        | Signed URL|
| :-------------------- | :------ | :----------------- | :--------------- | :-------- |
| candidate-resumes     | Private | Candidate, Recruiter| Recruiter, HRBP  | 900s Max  |
| policy-documents      | Private | HR Admin, HRBP     | Authenticated Org| 3600s Max |
| evidence-attachments  | Private | Employee, Manager  | Team Manager, HR | 1800s Max |
+------------------------------------------------------------------------------------+
```

---

## 7.34 Data Lifecycle and Retention

* **Candidate Applications:** Retained for 12 months post-rejection; candidates may trigger soft-deletion via `is_archived = true`.
* **Hired Candidate Conversion:** Retained indefinitely; linked 1:1 with `employees.candidate_id`.
* **Policy Documents:** Superseded policies remain in `policy_versions` with status `'superseded'` to preserve auditability of historical claims.
* **Audit Events:** Retained in immutable storage for a minimum of 24 months.

---

## 7.35 Migration and Seed Strategy

* **Ordered Migration Pattern:** Migrations reside in `supabase/migrations/` using timestamp prefixes: `20260912000001_initial_iam.sql`, `20260912000002_core_org.sql`, etc.
* **Idempotent Seed Script:** `supabase/seed.sql` populates the complete **TechCorp** fictional demo organization. Multiple executions do not produce duplicate primary keys.

---

## 7.36 Seed Dataset Specification

The fictional demonstration dataset represents **TechCorp** (demo seed organization):
* **Target Requisition:** `REQ-2026-088` (Staff Machine Learning Engineer, AI Fraud Detection).
* **Candidates:**
  * **Sarah Lin (Rank 1 - Demo Seed):** Verified PyTorch (L5), Triton (L4), CUDA adjacent credit, PR #402 citation. Match score: 94% (Fictional Demo Seed Data).
  * **David Kim (Rank 2):** PyTorch (L4), JAX (L3), lacks distributed training. Match score: 86%.
* **Employees:**
  * **Marcus Chen (Demo Seed):** Senior Infrastructure Engineer (L5, 38mo in band), 6-month attrition hazard: 72% (Fictional Demo Seed Data). Identified for internal mobility transfer to AI Fraud Team.
  * **Marcus Vance:** Director of Platform Engineering (Direct Manager & Approver).
* **Policy Corpus:** Global Remote Work Policy v4.1 (Sections 5.2 and 7.1 with active exception workflow).

---

## 7.37 Data Dictionary

*(Detailed field definitions, SQL types, constraints, nullability, and security classifications for all 36 proposed prototype tables are structured across Sections 7.10 through 7.27 above).*

---

## 7.38 API Design Principles

1. **RESTful Resource Architecture:** Clear resource URIs (`/api/v1/job-requisitions`, `/api/v1/employees`).
2. **Explicit Command Endpoints:** Complex state machine actions use verb sub-routes: `POST /api/v1/applications/:id/offer`, `POST /api/v1/retention/cases/:id/transfer`.
3. **UTC ISO 8601 Timestamps:** All dates and times formatted as `YYYY-MM-DDTHH:MM:SSZ`.
4. **Idempotency for Mutations:** Consequential mutations accept an `Idempotency-Key` HTTP header.
5. **Standard Envelope Pattern:** Predictable top-level keys (`data`, `meta`, `error`).

---

## 7.39 Authentication and Authorization Contract

* **Header:** `Authorization: Bearer <Supabase_JWT_Token>`.
* **Validation:** FastAPI decodes and verifies the JWT against Supabase JWT secret.
* **Identity Injection:** Injects `current_user: AuthenticatedUser` into route handlers.
* **HTTP 401 Unauthorized:** Returned if JWT is missing, invalid, or expired.
* **HTTP 403 Forbidden:** Returned if caller lacks necessary role or scope entitlements.

---

## 7.40 Standard Request Conventions

```http
POST /api/v1/applications/4f7e2a9b-8c1d-4e5f-9a3b-1c2d3e4f5a6b/offer HTTP/1.1
Host: worksense.internal
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
Content-Type: application/json
X-Correlation-ID: c8d9e0f1-2a3b-4c5d-6e7f-8a9b0c1d2e3f
Idempotency-Key: idemp-offer-402-9981
```

---

## 7.41 Standard Response Envelopes

### 7.41.1 Single Resource Envelope
```json
{
  "data": {
    "id": "4f7e2a9b-8c1d-4e5f-9a3b-1c2d3e4f5a6b",
    "requisition_code": "REQ-2026-088",
    "title": "Staff Machine Learning Engineer",
    "status": "open"
  },
  "meta": {
    "request_id": "c8d9e0f1-2a3b-4c5d-6e7f-8a9b0c1d2e3f",
    "timestamp": "2026-09-12T13:40:00Z"
  }
}
```

### 7.41.2 Collection Envelope
```json
{
  "data": [
    { "id": "11111111-2222-3333-4444-555555555555", "name": "Sarah Lin", "match_score": 94 }
  ],
  "meta": {
    "request_id": "c8d9e0f1-2a3b-4c5d-6e7f-8a9b0c1d2e3f",
    "page": 1,
    "page_size": 25,
    "total_records": 1,
    "total_pages": 1
  }
}
```

---

## 7.42 Standard Error Contract

```json
{
  "error": {
    "code": "POLICY_EVIDENCE_CONFLICT",
    "message": "WorkSense detected conflicting clauses between Section 5.2 and Section 7.1.",
    "details": [
      { "field": "policy_clause", "issue": "Probation remote limit contradicts tax addendum." }
    ],
    "retryable": false
  },
  "meta": {
    "request_id": "c8d9e0f1-2a3b-4c5d-6e7f-8a9b0c1d2e3f",
    "timestamp": "2026-09-12T13:40:00Z"
  }
}
```

---

## 7.43 Pagination, Filtering and Sorting

* **Pagination Query Parameters:** `?page=1&page_size=25` (Default: 25, Max: 100).
* **Sorting Parameter:** `?sort=-created_at,match_score` (`-` indicates descending).
* **Filtering Allow-List:** `?department_id=uuid&status=open`. Arbitrary SQL querying is prohibited.

---

## 7.44 Idempotency and Concurrency

* **Idempotency Cache:** Keys are cached in table `api_idempotency_keys` for 24 hours.
* **Optimistic Locking:** Update endpoints verify `If-Match: "<version>"` against `entity.version`.

---

## 7.45 API Endpoint Catalog Format

Every endpoint in Section 7.46 through 7.58 enforces:
1. **Endpoint ID:** e.g., `API-TAL-002`.
2. **Method & Path:** e.g., `GET /api/v1/candidates/compare`.
3. **Actor & Entitlement:** Required role and scope.
4. **Request / Response Schemas:** Defined Pydantic models.
5. **Side Effects & Audit Requirements:** Specific audit log action emitted.

---

## 7.46 Identity and Session Endpoints

* `GET /api/v1/auth/me` (`API-AUTH-001`): Returns active profile, assigned roles, and current access scopes.
* `POST /api/v1/auth/switch-role` (`API-AUTH-002`): Switches active UI persona if user holds multiple roles.
* `GET /api/v1/auth/health` (`API-AUTH-003`): Verifies Supabase session validity.

---

## 7.47 Candidate and Recruitment Endpoints

* `GET /api/v1/job-requisitions` (`API-TAL-001`): List open requisitions.
* `GET /api/v1/job-requisitions/:id` (`API-TAL-002`): Retrieve requisition details and required skills.
* `POST /api/v1/applications` (`API-TAL-003`): Submit candidate application.
* `POST /api/v1/applications/:id/resume` (`API-TAL-004`): Upload and extract resume PDF.
* `GET /api/v1/applications/:id/rankings` (`API-TAL-005`): Retrieve LightGBM match score and rank order.
* `GET /api/v1/candidates/compare` (`API-TAL-006`): Side-by-side comparison with Qwen grounded rationale.
* `POST /api/v1/applications/:id/offer` (`API-TAL-007`): Issue formal EnterPro job offer.
* `POST /api/v1/applications/:id/convert-to-employee` (`API-TAL-008`): Atomic conversion of hired candidate.

---

## 7.48 Interview Endpoints

* `POST /api/v1/interviews/sessions` (`API-INT-001`): Initialize structured interview session.
* `GET /api/v1/interviews/sessions/:id/current-question` (`API-INT-002`): Fetch active competency question.
* `POST /api/v1/interviews/sessions/:id/responses` (`API-INT-003`): Submit candidate response and trigger Qwen probe.
* `POST /api/v1/interviews/sessions/:id/complete` (`API-INT-004`): Finalize interview session.
* `GET /api/v1/interviews/sessions/:id/transcript` (`API-INT-005`): Retrieve transcript for recruiter review.
* `POST /api/v1/interviews/sessions/:id/rubric-signoff` (`API-INT-006`): Recruiter formal rubric validation.

---

## 7.49 Workforce Twin and Skill Endpoints

* `GET /api/v1/employees/:id/twin` (`API-TWIN-001`): Retrieve living capability radar and evidence counts.
* `GET /api/v1/employees/:id/evidence-ledger` (`API-TWIN-002`): Chronological stream of validated artifacts.
* `POST /api/v1/employees/:id/evidence` (`API-TWIN-003`): Submit fresh evidence artifact.
* `POST /api/v1/evidence/:id/dispute` (`API-TWIN-004`): Contest an inaccurate or stale skill inference.
* `POST /api/v1/evidence/:id/validate` (`API-TWIN-005`): Manager formal endorsement of evidence.
* `GET /api/v1/skills/graph/neighbors` (`API-TWIN-006`): Fetch adjacent capabilities for a skill.

---

## 7.50 Onboarding Endpoints

* `GET /api/v1/employees/:id/onboarding` (`API-ONB-001`): Retrieve personalized 30/60/90 journey.
* `POST /api/v1/onboarding/tasks/:id/blocker` (`API-ONB-002`): Flag access ticket as blocked.
* `POST /api/v1/onboarding/tasks/:id/complete` (`API-ONB-003`): Submit completion proof.

---

## 7.51 Career and Opportunity Endpoints

* `GET /api/v1/career/paths` (`API-GROW-001`): Browse career progression ladders.
* `GET /api/v1/career/opportunities` (`API-GROW-002`): List internal gigs and match percentages.
* `POST /api/v1/career/opportunities/:id/interest` (`API-GROW-003`): Express interest in project gig.

---

## 7.52 Performance Endpoints

* `GET /api/v1/performance/employees/:id/cycle` (`API-PERF-001`): Fetch current goals and deliverables.
* `GET /api/v1/performance/employees/:id/insights` (`API-PERF-002`): Retrieve Qwen evidence synthesis.
* `POST /api/v1/performance/reviews/:id/signoff` (`API-PERF-003`): Manager formal review submission.

---

## 7.53 Attrition and Retention Endpoints

* `GET /api/v1/retention/cases` (`API-RET-001`): List high-hazard retention cases (HRBP only).
* `GET /api/v1/retention/cases/:id` (`API-RET-002`): Retrieve 3/6/12mo hazard curves and SHAP factors.
* `POST /api/v1/retention/cases/:id/intervene` (`API-RET-003`): Initiate EnterPro internal mobility transfer.

---

## 7.54 Policy and Knowledge Endpoints

* `POST /api/v1/policies/ask` (`API-POL-001`): Natural-language query; returns answer and citations.
* `GET /api/v1/policies` (`API-POL-002`): List published enterprise policies.
* `POST /api/v1/policies/versions` (`API-POL-003`): Upload new version and trigger conflict detection.
* `POST /api/v1/policies/versions/:id/publish` (`API-POL-004`): Human dual sign-off publication.

---

## 7.55 Workforce Planning Endpoints

* `POST /api/v1/planning/scenarios` (`API-PLAN-001`): Create scenario (e.g., 8-person team in 90 days).
* `POST /api/v1/planning/scenarios/:id/solve` (`API-PLAN-002`): Trigger Google OR-Tools CP-SAT solver.
* `GET /api/v1/planning/scenarios/:id/plans` (`API-PLAN-003`): Fetch Strategy A, B, and C tradeoffs.
* `POST /api/v1/planning/plans/:id/select` (`API-PLAN-004`): Human selection triggering EnterPro bundles.

---

## 7.56 EnterPro Workflow Endpoints

* `POST /api/v1/workflows` (`API-WF-001`): Internal adapter dispatching to EnterPro engine.
* `GET /api/v1/workflows/:id` (`API-WF-002`): Fetch real-time workflow state machine status.
* `POST /api/v1/workflows/:id/approve` (`API-WF-003`): Human sign-off in EnterPro chain.
* `POST /api/v1/webhooks/enterpro` (`API-WF-004`): Webhook receiver for EnterPro callbacks.

---

## 7.57 AI Orchestration Endpoints

* `POST /api/v1/ai/explain-ranking` (`API-AI-001`): Generate grounded explanation of candidate match.
* `POST /api/v1/ai/adaptive-probe` (`API-AI-002`): Generate bounded interview follow-up question.
* `POST /api/v1/ai/synthesize-evidence` (`API-AI-003`): Summarize monthly capability demonstrations.

---

## 7.58 Admin and Governance Endpoints

* `GET /api/v1/admin/audit-ledger` (`API-GOV-001`): Search append-oriented audit event logs.
* `GET /api/v1/admin/ai-models` (`API-GOV-002`): Monitor Ollama model traces and latency.
* `POST /api/v1/admin/system/health` (`API-GOV-003`): Ping Supabase, Ollama, and EnterPro.

---

## 7.59 Webhook and Callback Contracts

```text
+------------------------------------------------------------------------------------+
|                         ENTERPRO WEBHOOK INGESTION CONTRACT                        |
+------------------------------------------------------------------------------------+
| Header: Authorization / Signature: Configurable adapter header (TBD pending EnterPro docs) |
| Header: X-EnterPro-Event-ID: evt_9948271a                                          |
| Idempotency: Duplicate Event IDs return HTTP 200 OK immediately without re-executing|
| Verification: Handled via backend/app/workflow/enterpro_verifier.py                |
+------------------------------------------------------------------------------------+
```

### Webhook Event State Transition Diagram
```mermaid
stateDiagram-v2
    [*] --> Ingested: X-EnterPro-Event Received
    Ingested --> SignatureVerified: Adapter Verification Valid
    Ingested --> Rejected401: Invalid Signature
    SignatureVerified --> DuplicateIgnored: Event ID Exists
    SignatureVerified --> TransitionApplied: Event ID New
    TransitionApplied --> AuditLogged: Audit Event Inserted
    AuditLogged --> [*]: HTTP 200 OK

```

---

## 7.60 Asynchronous Operation Pattern

Long-running jobs (resume OCR extraction, OR-Tools optimization, policy chunk re-indexing) return an immediate operation ticket:
```json
{
  "data": {
    "operation_id": "op_98a7b6c5-4d3e-2f1a-0b9c-8d7e6f5a4b3c",
    "status": "in_progress",
    "stage": "EXTRACTING_ENTITIES",
    "created_at": "2026-09-12T13:45:00Z"
  },
  "meta": { "poll_interval_ms": 2000 }
}
```

---

## 7.61 API Security Requirements

* **Zero Body Role Trust:** The API extracts caller roles strictly from verified JWT tokens; role claims in request bodies are discarded.
* **SQL Injection & ORM:** All queries enforce parameterized SQL via Supabase client or SQLAlchemy 2.0.
* **Prompt Injection Isolation:** Candidate resume texts are passed to Qwen wrapped in strict XML boundary delimiters (`<candidate_resume_untrusted>...</candidate_resume_untrusted>`).

---

## 7.62 API Failure Matrix

| Failure Condition | HTTP Status | Error Code | Safe Message | Retryable |
| :--- | :--- | :--- | :--- | :--- |
| Invalid JWT Token | 401 | `AUTH_TOKEN_INVALID` | Session expired or invalid. | False |
| Caller Lacks Scope | 403 | `AUTH_SCOPE_FORBIDDEN` | Access restricted to authorized roles. | False |
| Ollama Service Down | 503 | `AI_SERVICE_UNAVAILABLE`| Local reasoning engine offline. | True (Backoff) |
| Generation Timeout | 504 | `AI_GATEWAY_TIMEOUT` | Generation exceeded 15s limit. | True |
| Policy Contradiction | 422 | `POLICY_EVIDENCE_CONFLICT`| Conflicting clauses detected. | False |
| EnterPro Unreachable | 502 | `ENTERPRO_UNAVAILABLE` | Enterprise workflow engine offline. | True |

---

## 7.63 API Observability

* **Structured JSON Logs:** Every request outputs a JSON log containing `correlation_id`, `actor_id`, `route`, `status_code`, `latency_ms`, and `model_version`.
* **Redaction Invariant:** JWT tokens, passwords, raw resume text, and encryption keys are strictly scrubbed before log dispatch.

---

## 7.64 API Contract Examples

### 1. Candidate Twin Representation
```json
{
  "data": {
    "candidate_id": "c1111111-aaaa-bbbb-cccc-111111111111",
    "name": "Sarah Lin",
    "email": "sarah.lin@example.com",
    "match_score": 94,
    "confidence": "high",
    "verified_skills": [
      { "name": "PyTorch", "level": 5, "source": "technical_screening" },
      { "name": "Triton", "level": 4, "source": "github_pr" }
    ],
    "adjacent_skills": [
      { "name": "CUDA", "credited_via": "Triton", "weight": 0.850 }
    ]
  },
  "meta": { "request_id": "req-01" }
}
```

### 2. Candidate Ranking Explanation
```json
{
  "data": {
    "ranking_id": "rnk-9901",
    "rank_position": 1,
    "match_score": 94,
    "model_version": "lightgbm-multifeature-v2",
    "qwen_rationale": "Sarah Lin is ranked #1 due to verified production optimization evidence in Triton (PR #402) and distributed model serving.",
    "evidence_citations": ["PR #402", "Transcript §2.1"]
  },
  "meta": { "request_id": "req-02" }
}
```

### 3. Interview Response & Adaptive Probe
```json
{
  "data": {
    "session_id": "int-8801",
    "competency": "High-Concurrency Distributed Caching",
    "core_question": "Describe your architecture for handling database failover.",
    "candidate_response": "We configured Redis replicas with automatic Sentinel failover...",
    "adaptive_probe": {
      "question_id": "q-probe-01",
      "text": "What circuit-breaker pattern prevented split-brain writes during failover?",
      "reason": "Evidence gap in split-brain recovery"
    }
  },
  "meta": { "request_id": "req-03" }
}
```

### 4. Employee Twin Skill
```json
{
  "data": {
    "employee_id": "e2222222-bbbb-cccc-dddd-222222222222",
    "skill_name": "Kubernetes Orchestration",
    "proficiency_level": 4,
    "confidence_band": "high",
    "last_demonstrated_at": "2026-02-18T10:00:00Z",
    "is_stale": false,
    "validations_count": 2
  },
  "meta": { "request_id": "req-04" }
}
```

### 5. Evidence Item
```json
{
  "data": {
    "evidence_id": "ev-402",
    "source_type": "github_pr",
    "claim": "Automated circuit breaker and multi-region replica failover",
    "validator": "Marcus Vance (Director of Platform)",
    "strength": "strong",
    "verified_at": "2026-02-18T14:30:00Z"
  },
  "meta": { "request_id": "req-05" }
}
```

### 6. Onboarding Plan
```json
{
  "data": {
    "plan_id": "onb-1001",
    "employee_name": "Sarah Lin",
    "progress_pct": 34,
    "waived_tasks": [
      { "task": "Advanced PyTorch Mastery", "reason": "Demonstrated in screening" }
    ],
    "active_milestones": [
      { "title": "Week 1: Corporate InfoSec", "status": "pending" },
      { "title": "Provision GPU Cluster Access", "status": "blocked", "ticket_id": "EP-WF-8841" }
    ]
  },
  "meta": { "request_id": "req-06" }
}
```

### 7. Policy Grounded Answer
```json
{
  "data": {
    "query": "Can I work remotely for 10 days out-of-state while on probation?",
    "answer": "Under Section 5.2 of the Global Remote Work Policy v4.1, employees on probation are restricted to a maximum of 3 consecutive remote work days. A 10-day request requires a Director Exception under Section 7.1.",
    "is_abstained": false,
    "citations": [
      { "document": "Global Remote Work Policy v4.1", "section": "5.2" },
      { "document": "Probation Guidelines Addendum", "section": "7.1" }
    ],
    "eligible_workflow": "remote_work_exception"
  },
  "meta": { "request_id": "req-07" }
}
```

### 8. Policy Request
```json
{
  "data": {
    "request_id": "req-pol-01",
    "request_type": "remote_work_exception",
    "parameters": { "duration_days": 10, "jurisdiction": "Out-of-State" },
    "approver_chain": ["Direct Manager (Marcus Vance)", "Dept Director (Rachel Sterling)"],
    "status": "awaiting_approval"
  },
  "meta": { "request_id": "req-08" }
}
```

### 9. Attrition Prediction
```json
{
  "data": {
    "prediction_id": "pred-402",
    "employee_name": "Marcus Chen",
    "hazard_3mo": 22,
    "hazard_6mo": 72,
    "hazard_12mo": 81,
    "confidence": "high",
    "top_contributing_factors": [
      { "feature": "Tenure stagnation in band L5", "impact_pct": 34 },
      { "feature": "Below-market comp ratio (0.88)", "impact_pct": 22 }
    ],
    "protective_factors": [
      { "feature": "High team collaboration rating", "impact_pct": -18 }
    ]
  },
  "meta": { "request_id": "req-09" }
}
```

### 10. Retention Intervention
```json
{
  "data": {
    "intervention_id": "intv-402",
    "employee_id": "emp-marcus-chen",
    "recommended_action": "Internal Mobility Transfer to AI Fraud Team",
    "matched_role": "Senior Infrastructure Lead",
    "status": "awaiting_hr_signoff"
  },
  "meta": { "request_id": "req-10" }
}
```

### 11. Workforce Planning Scenario
```json
{
  "data": {
    "scenario_id": "scen-01",
    "objective": "Form 8-Person AI Fraud Detection Team in 90 Days",
    "budget_ceiling_usd": 180000.00,
    "deadline_days": 90,
    "internal_mobility_allowed": true
  },
  "meta": { "request_id": "req-11" }
}
```

### 12. Alternative Plan (Strategy B)
```json
{
  "data": {
    "plan_id": "plan-b",
    "strategy_label": "Strategy B (Balanced Hybrid)",
    "allocations": { "internal_transfers": 3, "upskilling_tracks": 3, "external_hires": 2 },
    "time_to_ready_days": 70,
    "total_cost_usd": 140000.00,
    "is_feasible": true,
    "is_recommended": true
  },
  "meta": { "request_id": "req-12" }
}
```

### 13. EnterPro Workflow Tracker
```json
{
  "data": {
    "workflow_id": "EP-WF-9941",
    "workflow_type": "remote_work_exception",
    "current_state": "awaiting_approval",
    "current_owner": "Marcus Vance",
    "steps": [
      { "step": "Submission", "status": "completed", "actor": "Sarah Lin" },
      { "step": "Deterministic Rule Check", "status": "completed", "actor": "System" },
      { "step": "Manager Sign-Off", "status": "pending", "actor": "Marcus Vance" }
    ]
  },
  "meta": { "request_id": "req-13" }
}
```

### 14. Audit Event Record
```json
{
  "data": {
    "audit_id": "aud-8842",
    "actor": "sarah.lin@example.com",
    "actor_role": "candidate",
    "action": "interview:response:submit",
    "resource_type": "interview_sessions",
    "resource_id": "int-8801",
    "correlation_id": "c8d9e0f1-2a3b-4c5d-6e7f-8a9b0c1d2e3f",
    "recorded_at": "2026-09-12T13:42:00Z"
  },
  "meta": { "request_id": "req-14" }
}
```

### 15. Standard Error Response
```json
{
  "error": {
    "code": "AUTH_SCOPE_FORBIDDEN",
    "message": "Access restricted: Caller lacks hr_bp scope required to inspect retention predictions.",
    "details": [],
    "retryable": false
  },
  "meta": {
    "request_id": "c8d9e0f1-2a3b-4c5d-6e7f-8a9b0c1d2e3f",
    "timestamp": "2026-09-12T13:40:00Z"
  }
}
```

---

## 7.65 Database Transaction Boundaries

* **Candidate Conversion:** Wrapping candidate status update, employee record creation, twin initialization, and evidence transfer in a single PostgreSQL `BEGIN ... COMMIT` block.
* **External Compensations:** External EnterPro dispatches are recorded as `execution_pending` inside the DB transaction, transitioning to `completed` only upon webhook confirmation.

---

## 7.66 Prototype Versus Production Matrix

| Domain Area | Prototype Implementation (Hackathon) | Production Scaling Target | What Must NOT Be Claimed |
| :--- | :--- | :--- | :--- |
| **Skill Graph** | Relational tables in PostgreSQL | Distributed hybrid relational graph | Do NOT claim Neo4j is present |
| **Local LLM** | Ollama running Qwen3-4B-Instruct | Scaled vLLM cluster with load balancer | Do NOT claim proprietary custom weights |
| **Attrition** | Seeded Cox survival curves | Continuous streaming telemetry model | Do NOT claim guaranteed departure forecasts|
| **Optimization** | OR-Tools CP-SAT single-node run | Distributed solver with parallel workers | Do NOT claim Qwen calculated headcount |

---

## 7.67 Requirements Catalog

* `DB-CORE-001`: System MUST use UUIDv4 primary keys generated via `gen_random_uuid()`.
* `DB-CORE-002`: All timestamp columns MUST be `TIMESTAMPTZ` defaulting to UTC.
* `DB-IAM-001`: Roles MUST be strictly mapped to the 7 approved human personas.
* `DB-TAL-001`: Candidate ranking match scores MUST be stored as integer percentages (0-100).
* `DB-TWIN-001`: Hired candidate records MUST preserve original `candidate_id`.
* `DB-RET-001`: Attrition hazard predictions MUST be restricted to `hr_bp` role via RLS.
* `API-CORE-001`: All endpoints MUST require Supabase JWT verification in FastAPI.
* `API-AI-001`: Qwen MUST NOT calculate numerical ranking or attrition hazard scores.
* `API-WF-001`: All EnterPro adapter webhooks MUST verify authentication credentials according to official integration specifications.

---

## 7.68 Traceability Matrix

```text
+------------------------------------------------------------------------------------+
|                         CROSS-SPECIFICATION TRACEABILITY                           |
+------------------------------------------------------------------------------------+
| PRD Requirement   | TRD Requirement | Workflow ID | DB Table           | API ID    |
| :---------------- | :-------------- | :---------- | :----------------- | :-------- |
| Candidate Ranking | TRD-REC-001     | WF-REC-01   | candidate_rankings | API-TAL-005|
| Adaptive Probe    | TRD-INT-001     | WF-INT-02   | interview_questions| API-INT-003|
| Twin Persistence  | TRD-TWIN-001    | WF-TWIN-01  | employees, skills  | API-TWIN-001|
| Policy RAG        | TRD-POL-001     | WF-POL-01   | policy_chunks      | API-POL-001|
| Retention Case    | TRD-RET-001     | WF-RET-01   | retention_cases    | API-RET-001|
| Workforce Solver  | TRD-PLAN-001    | WF-PLAN-01  | workforce_plans    | API-PLAN-002|
+------------------------------------------------------------------------------------+
```

---

## 7.69 Database and API Risk Register

| Risk ID | Description | Likelihood | Impact | Mitigation Strategy | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RSK-01` | RLS Policy Bypass in Backend | Low | Critical | Service role key restricted strictly to system background tasks. | Backend Lead |
| `RSK-02` | Retention Hazard Data Leakage | Low | Critical | Strict RLS policy restricting tables to `hr_bp` role only. | Security Lead |
| `RSK-03` | Duplicate EnterPro Webhooks | Medium | Moderate | Enforce unique constraint on `webhook_callbacks.event_id`. | Workflow Lead |
| `RSK-04` | Local Ollama Latency Spike | Medium | Moderate | 15.0s client timeout with graceful degradation to cached data. | AI Lead |

---

## 7.70 Final Definition of Done

This specification is complete and verified when:
- [Documented] Product name is consistently **WorkSense**.
- [Documented] All 70 numbered subsections (`7.1` to `7.70`) are authored and complete.
- [Documented] All 16 core data domains and 36 prototype tables are defined with keys, relationships, and constraints.
- [Documented] Candidate-to-Employee Twin continuity is preserved atomically.
- [Documented] The Skill Graph is relationally structured without Neo4j.
- [Documented] Vector storage schema and RLS pre-filtering policies are defined.
- [Documented] Complete REST API catalog defines 54 proposed prototype endpoints.
- [Documented] Idempotency, standard response envelopes, and safe error matrices are defined.
- [Documented] Zero application source code, migrations, or dependencies were altered.
