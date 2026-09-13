"""Authoritative HR Policy Reasoning & RAG Service (Stage 6).

Implements file validation, deterministic PDF/text extraction, section-aware chunking,
hybrid lexical-semantic retrieval with organization isolation and RBAC filtering,
bounded Qwen grounded answering with exact citations, and human-in-the-loop action proposals.
"""

import hashlib
import io
import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

import numpy as np
from pypdf import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.core.errors import NotFoundError, ValidationError
from app.schemas.policy import (
    PolicyCitation,
    PolicyQueryResponse,
    PolicyUploadResponse,
    ProposedPolicyAction,
)
from app.services.qwen_gateway import qwen_gateway
from app.services.workforce_service import workforce_service

logger = logging.getLogger("worksense.policy_rag")


class PolicyRAGService:
    """Enterprise HR Policy Reasoning Engine."""

    def __init__(self):
        # In-memory vector/chunk registry for the prototype:
        # Dict[chunk_id, chunk_dict]
        self._chunks: Dict[str, Dict[str, Any]] = {}
        # Dict[query_id, query_dict]
        self._queries: Dict[str, Dict[str, Any]] = {}
        # Dict[action_id, action_dict]
        self._action_requests: Dict[str, Dict[str, Any]] = {}

        # Seed canonical policy documents and pre-indexed chunks
        self._seed_authoritative_policies()

    def _seed_authoritative_policies(self):
        """Seed pre-indexed chunks for TechCorp & AcmeCorp standard HR policies."""
        org_id = "00000000-0000-0000-0000-000000000001"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Ensure standard policies exist in workforce_service
        if not any(p.get("policy_code") == "POL-PROB-01" for p in workforce_service._policy_documents.values()):
            prob_id = "75000000-0000-0000-0000-000000000002"
            prob_ver_id = "76000000-0000-0000-0000-000000000002"
            workforce_service._policy_documents[prob_id] = {
                "id": prob_id,
                "organization_id": org_id,
                "title": "Probationary Period & Evaluation Policy",
                "policy_code": "POL-PROB-01",
                "category": "probation",
                "description": "Standard 90-day evaluation, Day 45 check-in, and regular confirmation workflow",
                "document_owner_id": "30000000-0000-0000-0000-000000000005",
                "access_classification": "all_employees",
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            workforce_service._policy_versions[prob_ver_id] = {
                "id": prob_ver_id,
                "policy_document_id": prob_id,
                "version_number": "2.0",
                "status": "active",
                "effective_date": "2026-01-01",
                "review_date": "2026-12-31",
                "expiry_date": "2027-01-01",
                "file_name": "techcorp_probation_policy_v2.0.pdf",
                "file_size_bytes": 142800,
                "mime_type": "application/pdf",
                "storage_path": "policy-documents/techcorp_probation_policy_v2.0.pdf",
                "sha256_hash": "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
                "superseded_by_version_id": None,
                "uploaded_by_id": "30000000-0000-0000-0000-000000000005",
                "created_at": now_iso,
            }

        if not any(p.get("policy_code") == "POL-BEN-01" for p in workforce_service._policy_documents.values()):
            ben_id = "75000000-0000-0000-0000-000000000003"
            ben_ver_id = "76000000-0000-0000-0000-000000000003"
            workforce_service._policy_documents[ben_id] = {
                "id": ben_id,
                "organization_id": org_id,
                "title": "Employee Benefits & Learning Development Policy",
                "policy_code": "POL-BEN-01",
                "category": "benefits",
                "description": "Health coverage, tuition reimbursement, and $2,500 annual learning stipend",
                "document_owner_id": "30000000-0000-0000-0000-000000000005",
                "access_classification": "all_employees",
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            workforce_service._policy_versions[ben_ver_id] = {
                "id": ben_ver_id,
                "policy_document_id": ben_id,
                "version_number": "1.5",
                "status": "active",
                "effective_date": "2026-01-01",
                "review_date": "2026-12-31",
                "expiry_date": "2027-01-01",
                "file_name": "techcorp_benefits_policy_v1.5.pdf",
                "file_size_bytes": 198400,
                "mime_type": "application/pdf",
                "storage_path": "policy-documents/techcorp_benefits_policy_v1.5.pdf",
                "sha256_hash": "f0e1d2c3b4a5968778695a4b3c2d1e0fa1b2c3d4e5f60718293a4b5c6d7e8f90",
                "superseded_by_version_id": None,
                "uploaded_by_id": "30000000-0000-0000-0000-000000000005",
                "created_at": now_iso,
            }

        policies = list(workforce_service._policy_documents.values())
        if not policies:
            return

        for policy in policies:
            doc_id = policy["id"]
            code = policy["policy_code"]
            title = policy["title"]
            policy_org_id = policy["organization_id"]
            category = policy.get("category", "general")
            access_class = policy.get("access_classification", "all_employees")

            versions = [v for v in workforce_service._policy_versions.values() if v.get("policy_document_id") == doc_id]
            active_version = next((v for v in versions if v["status"] == "active"), versions[0] if versions else None)
            if not active_version:
                continue

            ver_id = active_version["id"]
            ver_num = active_version["version_number"]
            eff_date = str(active_version.get("effective_date", "2026-01-01"))

            # Create realistic structured policy chunks based on the policy code
            seeded_sections = self._generate_canonical_policy_sections(code, title, category)
            for idx, sec in enumerate(seeded_sections):
                chunk_id = str(uuid4())
                self._chunks[chunk_id] = {
                    "id": chunk_id,
                    "policy_document_id": doc_id,
                    "policy_version_id": ver_id,
                    "policy_title": title,
                    "policy_code": code,
                    "version_number": ver_num,
                    "effective_date": eff_date,
                    "organization_id": policy_org_id,
                    "page_number": sec["page"],
                    "section_heading": sec["heading"],
                    "chunk_text": sec["text"],
                    "chunk_index": idx,
                    "token_count": len(sec["text"].split()),
                    "access_classification": access_class,
                    "status": active_version["status"],
                    "created_at": datetime.now(timezone.utc),
                }

    def _generate_canonical_policy_sections(self, code: str, title: str, category: str) -> List[Dict[str, Any]]:
        """Generates realistic compliance and operating clauses for seeded policies."""
        if code in ["POL-REM-01", "POL-REMOTE-01"]:
            return [
                {
                    "page": 1,
                    "heading": "1. Eligibility and Scope",
                    "text": (
                        "Full-time and part-time permanent employees who have successfully completed their probationary period "
                        "(standard 90 days) are eligible to request hybrid or full remote work arrangements. Contractors and interns "
                        "are evaluated on a project-by-project basis. Eligibility requires a performance rating of 'Meets Expectations' "
                        "or above in the preceding review cycle."
                    ),
                },
                {
                    "page": 1,
                    "heading": "2. Working Hours and Core Availability",
                    "text": (
                        "Remote employees must maintain availability during standard core collaboration hours: 10:00 AM to 4:00 PM "
                        "local office time. Employees are expected to attend scheduled team ceremonies, sprint standups, and cross-functional "
                        "syncs via approved video conferencing."
                    ),
                },
                {
                    "page": 2,
                    "heading": "3. Home Office Equipment and Technology Stipend",
                    "text": (
                        "The organization provides a standard hardware kit consisting of a corporate laptop, dual monitors, and peripheral items. "
                        "Approved remote employees receive a one-time home office setup stipend of $1,000 USD (net) reimbursable via Expensify, "
                        "and a recurring monthly internet and utilities subsidy of $75 USD."
                    ),
                },
                {
                    "page": 2,
                    "heading": "4. Formal Request and Manager Approval Workflow",
                    "text": (
                        "To initiate a remote or hybrid arrangement, the employee must submit a formal Remote Work Request through the "
                        "WorkSense Policy Action Portal at least 14 days prior to the proposed effective date. The arrangement requires "
                        "written approval from the Direct Manager and sign-off from Department HRBP."
                    ),
                },
                {
                    "page": 3,
                    "heading": "5. Revocation and Performance Exceptions",
                    "text": (
                        "Remote work arrangements may be revoked with 30 days written notice if business needs shift, or immediately "
                        "if the employee enters a formal Performance Improvement Plan (PIP) or commits an information security violation."
                    ),
                },
            ]
        elif code == "POL-PROB-01":
            return [
                {
                    "page": 1,
                    "heading": "1. Standard Probationary Period Duration",
                    "text": (
                        "All newly hired regular employees are subject to a mandatory 90-calendar-day probationary period commencing on their "
                        "first day of employment. During this period, job performance, adherence to company values, attendance, and capability "
                        "progression are actively evaluated by the direct manager."
                    ),
                },
                {
                    "page": 1,
                    "heading": "2. Mid-Point Check-In (Day 45)",
                    "text": (
                        "At or before Day 45 of employment, the direct manager must conduct a formal 1:1 probationary progress review. "
                        "Documented feedback must identify demonstrated strengths and explicitly flag any emerging skill or delivery gaps. "
                        "A written summary must be recorded in WorkSense."
                    ),
                },
                {
                    "page": 2,
                    "heading": "3. Final Confirmation and Extension Conditions",
                    "text": (
                        "Prior to Day 90, the manager must submit either a Confirmation of Regular Employment or a Request for Probation Extension. "
                        "Extensions may not exceed an additional 30 calendar days and require approval from the Head of HR. If no confirmation "
                        "or extension is filed by Day 90, employment automatically triggers an urgent HR governance review."
                    ),
                },
            ]
        elif code == "POL-BEN-01":
            return [
                {
                    "page": 1,
                    "heading": "1. Health, Dental and Vision Coverage",
                    "text": (
                        "Health insurance benefits become effective on the first calendar day of the month following the hire date. "
                        "The company subsidizes 90% of employee healthcare premiums and 75% of dependent premiums across standard PPO and HMO plans."
                    ),
                },
                {
                    "page": 2,
                    "heading": "2. Professional Learning and Development Allowance",
                    "text": (
                        "Regular full-time employees are eligible for an annual professional development allowance of up to $2,500 USD per calendar year. "
                        "Eligible expenses include technical certifications, accredited coursework, industry conferences, and approved books. "
                        "Coursework requires prior written approval from the Direct Manager."
                    ),
                },
            ]
        else:
            return [
                {
                    "page": 1,
                    "heading": "1. Policy Purpose and Application",
                    "text": f"This document specifies the governing requirements and standards for {title}. Applies to all personnel.",
                },
                {
                    "page": 1,
                    "heading": "2. Compliance and Responsibilities",
                    "text": "All employees and managers must comply with documented standards. Violations must be reported to HR Governance.",
                },
            ]

    # ====================================================================
    # Document Upload & Extraction
    # ====================================================================

    def process_policy_upload(
        self,
        organization_id: str,
        title: str,
        policy_code: str,
        category: str,
        version_number: str,
        effective_date: str,
        file_name: str,
        file_bytes: bytes,
        access_classification: str = "all_employees",
        uploaded_by_id: str = "system-user",
    ) -> PolicyUploadResponse:
        """Processes policy upload, performs deterministic text extraction, chunks and indexes content."""
        if not file_bytes:
            raise ValidationError("Uploaded policy document cannot be empty (0 bytes)")

        if len(file_bytes) > 25 * 1024 * 1024:
            raise ValidationError("Uploaded file exceeds 25MB maximum allowable size")

        sha256 = hashlib.sha256(file_bytes).hexdigest()
        is_pdf = file_name.lower().endswith(".pdf")

        # 1. Deterministic Text Extraction
        extracted_pages: List[Tuple[int, str]] = []
        ocr_required = False

        if is_pdf:
            try:
                reader = PdfReader(io.BytesIO(file_bytes))
                for page_idx, page in enumerate(reader.pages):
                    page_text = page.extract_text() or ""
                    extracted_pages.append((page_idx + 1, page_text.strip()))

                total_chars = sum(len(txt) for _, txt in extracted_pages)
                if total_chars < 50:
                    # Scanned PDF without text layer
                    ocr_required = True
                    logger.warning("Scanned PDF detected with insufficient extractable text: %s. Flagging OCR required.", file_name)
            except Exception as e:
                logger.error("Failed to parse PDF file %s: %s", file_name, e)
                raise ValidationError(f"Corrupt or invalid PDF file: {str(e)}")
        else:
            # Plain text / Markdown
            try:
                text_content = file_bytes.decode("utf-8", errors="replace")
                extracted_pages.append((1, text_content))
            except Exception as e:
                raise ValidationError(f"Failed to decode text document: {str(e)}")

        # 2. Register Policy and Version in Stage 3 Workforce Service
        # Check if policy document already exists
        existing_doc = next(
            (p for p in workforce_service._policy_documents.values() if p.get("organization_id") == organization_id and p.get("policy_code") == policy_code),
            None,
        )

        if not existing_doc:
            doc_id = str(uuid4())
            new_doc = {
                "id": doc_id,
                "organization_id": organization_id,
                "title": title,
                "policy_code": policy_code,
                "category": category,
                "description": f"Authoritative enterprise policy for {title}",
                "access_classification": access_classification,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            workforce_service._policy_documents[doc_id] = new_doc
        else:
            doc_id = existing_doc["id"]

        # Register Version
        ver_id = str(uuid4())
        version_record = {
            "id": ver_id,
            "policy_document_id": doc_id,
            "version_number": version_number,
            "status": "active",
            "effective_date": effective_date,
            "file_name": file_name,
            "file_size_bytes": len(file_bytes),
            "mime_type": "application/pdf" if is_pdf else "text/plain",
            "storage_path": f"policies/{organization_id}/{policy_code}/{file_name}",
            "sha256_hash": sha256,
            "uploaded_by_id": uploaded_by_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        workforce_service._policy_versions[ver_id] = version_record

        # 3. Section-Aware Chunking
        chunk_count = 0
        total_tokens = 0

        if not ocr_required:
            for page_num, page_text in extracted_pages:
                sections = self._chunk_page_text(page_text)
                for sec_idx, (heading, sec_text) in enumerate(sections):
                    if not sec_text.strip():
                        continue
                    chunk_id = str(uuid4())
                    tokens = len(sec_text.split())
                    self._chunks[chunk_id] = {
                        "id": chunk_id,
                        "policy_document_id": doc_id,
                        "policy_version_id": ver_id,
                        "policy_title": title,
                        "policy_code": policy_code,
                        "version_number": version_number,
                        "effective_date": effective_date,
                        "organization_id": organization_id,
                        "page_number": page_num,
                        "section_heading": heading,
                        "chunk_text": sec_text,
                        "chunk_index": chunk_count,
                        "token_count": tokens,
                        "access_classification": access_classification,
                        "status": "active",
                        "created_at": datetime.now(timezone.utc),
                    }
                    chunk_count += 1
                    total_tokens += tokens
        else:
            # Scanned fallback placeholder
            chunk_id = str(uuid4())
            self._chunks[chunk_id] = {
                "id": chunk_id,
                "policy_document_id": doc_id,
                "policy_version_id": ver_id,
                "policy_title": title,
                "policy_code": policy_code,
                "version_number": version_number,
                "effective_date": effective_date,
                "organization_id": organization_id,
                "page_number": 1,
                "section_heading": "Document Notice",
                "chunk_text": "[SCANNED DOCUMENT NOTICE] This document is an image/scanned PDF without a text layer. OCR processing required.",
                "chunk_index": 0,
                "token_count": 16,
                "access_classification": access_classification,
                "status": "active",
                "created_at": datetime.now(timezone.utc),
            }
            chunk_count = 1
            total_tokens = 16

        return PolicyUploadResponse(
            policy_document_id=doc_id,
            policy_version_id=ver_id,
            title=title,
            version_number=version_number,
            file_name=file_name,
            file_size_bytes=len(file_bytes),
            extracted_chunks_count=chunk_count,
            total_tokens_estimated=total_tokens,
            ocr_required=ocr_required,
            sha256_hash=sha256,
            processing_status="indexed" if not ocr_required else "ocr_required",
        )

    def _chunk_page_text(self, text: str) -> List[Tuple[str, str]]:
        """Splits page text into sections based on headings or paragraphs."""
        lines = text.split("\n")
        sections: List[Tuple[str, str]] = []
        current_heading = "General Policy Provisions"
        current_paragraphs: List[str] = []

        heading_pattern = re.compile(r"^(?:Section\s+\d+|#+\s*.*|[0-9]+(?:\.[0-9]*)*\s+[A-Za-z]|[A-Z\s]{4,}:)")

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            if heading_pattern.match(line_str) and len(line_str) < 80:
                if current_paragraphs:
                    sections.append((current_heading, "\n".join(current_paragraphs)))
                    current_paragraphs = []
                current_heading = line_str.lstrip("#").strip()
            else:
                current_paragraphs.append(line_str)

        if current_paragraphs:
            sections.append((current_heading, "\n".join(current_paragraphs)))

        # Fallback if no sections detected
        if not sections and text.strip():
            sections.append(("General Policy Provisions", text.strip()))

        return sections

    # ====================================================================
    # Hybrid Retrieval (Tenant Isolation & RBAC Guarded)
    # ====================================================================

    def retrieve_policy_chunks(
        self,
        organization_id: str,
        query: str,
        user_roles: List[str],
        category_filter: Optional[str] = None,
        target_version_status: str = "active",
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Executes tenant-isolated, role-aware lexical-semantic retrieval."""
        # 1. Filter candidates by organization and role permissions
        candidates = []
        is_hr_or_admin = any(r in ["hr", "administrator"] for r in user_roles)
        is_manager = any(r in ["manager", "leadership"] for r in user_roles)

        for chunk in self._chunks.values():
            # Organization isolation
            if chunk["organization_id"] != organization_id:
                continue

            # Version filter
            if target_version_status != "all" and chunk.get("status") != target_version_status:
                continue

            # RBAC access classification filter
            classification = chunk.get("access_classification", "all_employees")
            if classification == "hr_restricted" and not is_hr_or_admin:
                continue
            if classification == "managers_and_hr" and not (is_hr_or_admin or is_manager):
                continue

            candidates.append(chunk)

        if not candidates:
            return []

        # 2. Hybrid Lexical-Semantic Scoring using TF-IDF and keyword matching
        corpus = [f"{c['policy_title']} {c['section_heading']} {c['chunk_text']}" for c in candidates]

        try:
            vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform(corpus)
            query_vec = vectorizer.transform([query])
            sims = cosine_similarity(query_vec, tfidf_matrix).flatten()
        except Exception as e:
            logger.warning("TF-IDF scoring failed; fallback to lexical term counting: %s", e)
            q_terms = set(re.findall(r"\w+", query.lower()))
            sims = np.array([
                len(q_terms.intersection(set(re.findall(r"\w+", doc.lower())))) / max(len(q_terms), 1)
                for doc in corpus
            ])

        # 3. Boost active policies & exact phrase hits
        generic_stopwords = {
            "what", "is", "are", "the", "for", "and", "a", "an", "in", "of", "to", "on", "at", "by", "with",
            "corporate", "company", "policy", "policies", "guideline", "guidelines", "reimbursement",
            "employee", "employees", "employer", "work", "workplace", "rules", "rule", "does", "have"
        }
        scored_candidates = []
        for idx, score in enumerate(sims):
            chunk = candidates[idx]
            boost = 0.0
            chunk_str = corpus[idx].lower()
            if query.lower() in chunk_str:
                boost += 0.35
            for word in query.lower().split():
                clean_w = re.sub(r"\W+", "", word)
                if len(clean_w) > 3 and clean_w not in generic_stopwords and clean_w in chunk_str:
                    boost += 0.08

            final_score = float(score + boost)
            # Require base similarity or distinctive boost to count as relevant
            if final_score >= 0.15 and (score > 0.04 or boost > 0.15):
                scored_chunk = dict(chunk)
                scored_chunk["relevance_score"] = min(1.0, round(final_score, 4))
                scored_candidates.append(scored_chunk)

        scored_candidates.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_candidates[:top_k]

    # ====================================================================
    # Bounded Qwen Policy Reasoning Agent
    # ====================================================================

    async def answer_policy_query(
        self,
        organization_id: str,
        user_id: str,
        user_roles: List[str],
        query_text: str,
        category_filter: Optional[str] = None,
    ) -> PolicyQueryResponse:
        """Grounds Qwen language reasoning strictly to retrieved authoritative policy excerpts."""
        # 1. Retrieve authorized evidence
        retrieved_chunks = self.retrieve_policy_chunks(
            organization_id=organization_id,
            query=query_text,
            user_roles=user_roles,
            category_filter=category_filter,
            target_version_status="active",
            top_k=4,
        )

        query_id = str(uuid4())
        now = datetime.now(timezone.utc)

        # 2. Strict Insufficient Evidence Check: Avoid hallucination
        if not retrieved_chunks or retrieved_chunks[0]["relevance_score"] < 0.20:
            no_evidence_response = PolicyQueryResponse(
                query_id=query_id,
                query_text=query_text,
                answer_text=(
                    "Insufficient authoritative policy evidence found in the organization's policy library to answer this query. "
                    "WorkSense strictly refrains from generating ungrounded policy facts. Please consult your HR Business Partner "
                    "or review the published Policy Documents catalog."
                ),
                confidence_state="insufficient_evidence",
                applicable_conditions=[],
                exceptions=[],
                required_next_step="Consult HRBP or submit an official HR policy inquiry ticket.",
                citations=[],
                proposed_action=None,
                policy_count_evaluated=len(retrieved_chunks),
                created_at=now,
            )
            self._queries[query_id] = no_evidence_response.model_dump()
            return no_evidence_response

        # 3. Format grounded prompt with untrusted boundaries
        citations: List[PolicyCitation] = []
        context_blocks = []

        for idx, chunk in enumerate(retrieved_chunks):
            citation = PolicyCitation(
                policy_id=chunk["policy_document_id"],
                policy_title=chunk["policy_title"],
                policy_code=chunk["policy_code"],
                version_number=chunk["version_number"],
                effective_date=chunk["effective_date"],
                page_number=chunk["page_number"],
                section_heading=chunk["section_heading"],
                excerpt=chunk["chunk_text"][:240] + ("..." if len(chunk["chunk_text"]) > 240 else ""),
                relevance_score=chunk["relevance_score"],
            )
            citations.append(citation)

            context_blocks.append(
                f"[DOCUMENT: {chunk['policy_title']} ({chunk['policy_code']} v{chunk['version_number']}) | Page {chunk['page_number']} | Section: {chunk['section_heading']}]\n"
                f"{chunk['chunk_text']}"
            )

        context_str = "\n\n".join(context_blocks)

        prompt = f"""You are the WorkSense HR Policy Reasoning Agent. Answer the employee's policy query using ONLY the provided authoritative policy excerpts.

STRICT INVARIANTS:
1. Ground your answer 100% in the provided excerpts. Do NOT extrapolate or assume rules not mentioned.
2. If the excerpt does not address the question fully, explicitly declare: "Based on available policy documents, additional specifics are not specified."
3. Cite the exact document title, section, and page for every rule stated.
4. Highlight any mandatory conditions (e.g. probationary period, tenure, manager sign-off) and exceptions.
5. Propose a sensible next step or workflow action if applicable.

<authoritative_policy_excerpts>
{context_str}
</authoritative_policy_excerpts>

Employee Query: "{query_text}"

Respond with a strictly formatted JSON object adhering to this schema:
{{
  "answer_text": "Direct, professional, clear explanation answering the query directly citing policy rules...",
  "confidence_state": "supported",
  "applicable_conditions": ["Condition 1", "Condition 2"],
  "exceptions": ["Exception 1 if applicable"],
  "required_next_step": "Exact operational next step...",
  "proposed_action": {{
    "action_type": "submit_remote_request",
    "title": "Submit Remote Work Request",
    "description": "Formal 14-day advance application to manager and HRBP",
    "required_role": "employee",
    "approval_role": "manager"
  }}
}}
"""

        # 4. Invoke local Qwen through Ollama with Semaphore(1) lock
        is_degraded = False
        parsed_result = None

        if qwen_gateway.is_available:
            try:
                resp = await qwen_gateway.generate(
                    prompt=prompt,
                    system_prompt="You are a trusted enterprise HR policy expert. Output strictly valid JSON.",
                    temperature=0.1,
                    max_tokens=800,
                )
                parsed_result = self._extract_json_from_llm(resp.text)
            except Exception as e:
                logger.warning("Local Qwen policy generation failed: %s. Transitioning to degraded synthesis.", e)
                is_degraded = True
        else:
            is_degraded = True

        # 5. Degraded Fallback Synthesis if Qwen unavailable
        if not parsed_result:
            parsed_result = self._degraded_policy_synthesis(query_text, retrieved_chunks)

        # 6. Construct Proposed Action
        proposed_action_obj = None
        if parsed_result.get("proposed_action"):
            pa = parsed_result["proposed_action"]
            proposed_action_obj = ProposedPolicyAction(
                action_type=pa.get("action_type", "submit_policy_request"),
                title=pa.get("title", "Initiate Policy Workflow"),
                description=pa.get("description", "Submit formal request for review"),
                required_role=pa.get("required_role", "employee"),
                requires_approval=True,
                approval_role=pa.get("approval_role", "manager"),
                payload={"query_id": query_id, "query_text": query_text},
            )

        response = PolicyQueryResponse(
            query_id=query_id,
            query_text=query_text,
            answer_text=parsed_result.get("answer_text", "Policy excerpt provides relevant guidelines."),
            confidence_state=parsed_result.get("confidence_state", "supported"),
            applicable_conditions=parsed_result.get("applicable_conditions", []),
            exceptions=parsed_result.get("exceptions", []),
            required_next_step=parsed_result.get("required_next_step"),
            citations=citations,
            proposed_action=proposed_action_obj,
            policy_count_evaluated=len(retrieved_chunks),
            is_degraded=is_degraded,
            created_at=now,
        )

        self._queries[query_id] = response.model_dump()
        return response

    def _extract_json_from_llm(self, text: str) -> Optional[Dict[str, Any]]:
        """Safely parses JSON block from model response."""
        try:
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return json.loads(text)
        except Exception:
            return None

    def _degraded_policy_synthesis(self, query: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Deterministic policy synthesis when local Qwen is in degraded/unavailable mode."""
        primary_chunk = chunks[0]
        title = primary_chunk["policy_title"]
        code = primary_chunk["policy_code"]
        ver = primary_chunk["version_number"]
        page = primary_chunk["page_number"]
        sec = primary_chunk["section_heading"]
        excerpt = primary_chunk["chunk_text"]

        action_type = "submit_policy_request"
        action_title = "Submit Policy Inquiries"
        if "remote" in query.lower() or "POL-REM" in code:
            action_type = "submit_remote_request"
            action_title = "Submit Remote Work Request"

        return {
            "answer_text": (
                f"According to {title} ({code} v{ver}, Section '{sec}', Page {page}):\n\n"
                f"{excerpt}\n\n"
                f"Please review the citations below for full statutory conditions and approval requirements."
            ),
            "confidence_state": "supported",
            "applicable_conditions": [
                f"Governed by {code} v{ver}",
                "Requires direct manager written approval",
            ],
            "exceptions": [
                "Exceptions require formal department HRBP sign-off",
            ],
            "required_next_step": f"Submit request through the {title} workflow at least 14 days in advance.",
            "proposed_action": {
                "action_type": action_type,
                "title": action_title,
                "description": f"Formal submission under {code}",
                "required_role": "employee",
                "approval_role": "manager",
            },
        }

    # ====================================================================
    # Action Request Management
    # ====================================================================

    def submit_policy_action_request(
        self,
        organization_id: str,
        requester_id: str,
        action_type: str,
        action_payload: Dict[str, Any],
        policy_query_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Submits a human-in-the-loop policy workflow request."""
        action_id = str(uuid4())
        record = {
            "id": action_id,
            "organization_id": organization_id,
            "policy_query_id": policy_query_id,
            "requester_id": requester_id,
            "action_type": action_type,
            "action_payload": action_payload,
            "status": "pending",
            "approver_id": None,
            "approver_notes": None,
            "created_at": datetime.now(timezone.utc),
        }
        self._action_requests[action_id] = record
        return record

    def list_policy_action_requests(self, organization_id: str) -> List[Dict[str, Any]]:
        """Lists pending and executed policy action requests."""
        return [a for a in self._action_requests.values() if a["organization_id"] == organization_id]

    def review_policy_action_request(
        self,
        action_id: str,
        approver_id: str,
        decision: str,
        approver_notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Approves or rejects a policy workflow action request."""
        action = self._action_requests.get(action_id)
        if not action:
            raise NotFoundError(f"Policy action request {action_id} not found")

        if decision not in ["approved", "rejected"]:
            raise ValidationError("Decision must be either 'approved' or 'rejected'")

        action["status"] = decision
        action["approver_id"] = approver_id
        action["approver_notes"] = approver_notes
        return action


# Singleton Instance
policy_rag_service = PolicyRAGService()
