CREATE TABLE IF NOT EXISTS spom_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap JSONB DEFAULT '[]'::jsonb,
    papers JSONB DEFAULT '[]'::jsonb,
    materials JSONB DEFAULT '[]'::jsonb,
    faqs JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default row if table is empty
INSERT INTO spom_content (roadmap, papers, materials, faqs)
SELECT 
  '[
    {"step": "01", "title": "Eligibility Check", "body": "Open only to students who have cleared CA Intermediate (both groups) and registered for CA Final."},
    {"step": "02", "title": "Self-Paced Online Registration", "body": "Register through the ICAI SSP Portal (eservices.icai.org). Choose any combination of Set A–D. No fixed cohort dates."},
    {"step": "03", "title": "Access Study Material", "body": "Once enrolled, modules unlock in your ICAI dashboard. Download PDFs, access recorded lectures and self-assessment tests."},
    {"step": "04", "title": "Online Assessment", "body": "Each set has an online proctored MCQ-based exam. You can attempt whenever you feel prepared — multiple windows available each year."},
    {"step": "05", "title": "Qualify Before Final Exam", "body": "All four SPOM sets must be cleared before you appear for the CA Final group exams."}
  ]'::jsonb,
  '[
    {"code": "Set A", "title": "Set A — Integrated Business Solutions", "summary": "A multi-disciplinary, case-study-based paper that integrates concepts across Financial Reporting, Audit, Tax and Strategic Management. Tests your ability to apply core CA knowledge to real business problems.", "color": "from-accent/20 to-accent/5"},
    {"code": "Set B", "title": "Set B — Strategic Cost & Performance Management", "summary": "Focused on advanced costing, performance evaluation, and strategic decision-making. Builds on Inter-level cost concepts with deeper analytical frameworks.", "color": "from-emerald-500/20 to-emerald-500/5"},
    {"code": "Set C", "title": "Set C — Risk Management & Governance", "summary": "Covers enterprise risk frameworks, corporate governance, internal controls, and the role of the CA in safeguarding stakeholder value.", "color": "from-amber-500/20 to-amber-500/5"},
    {"code": "Set D", "title": "Set D — Sustainable Finance & ESG Reporting", "summary": "Newest addition reflecting global trends — green finance, ESG metrics, BRSR reporting, and sustainability assurance for Indian companies.", "color": "from-violet-500/20 to-violet-500/5"}
  ]'::jsonb,
  '[
    {"id": "spom-a-1", "title": "Set A — Module 1: Integrated Case Studies", "paper": "Set A", "type": "Module", "pages": 412, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-a-2", "title": "Set A — Practice Manual", "paper": "Set A", "type": "Practice Manual", "pages": 268, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-b-1", "title": "Set B — Strategic Cost Management Module", "paper": "Set B", "type": "Module", "pages": 356, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-b-2", "title": "Set B — Question Bank", "paper": "Set B", "type": "Question Bank", "pages": 184, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-c-1", "title": "Set C — Risk Management Framework Module", "paper": "Set C", "type": "Module", "pages": 298, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-c-2", "title": "Set C — Governance Case Studies", "paper": "Set C", "type": "Notes", "pages": 142, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-d-1", "title": "Set D — ESG Reporting & BRSR Module", "paper": "Set D", "type": "Module", "pages": 324, "url": "https://resource.cdn.icai.org/"},
    {"id": "spom-d-2", "title": "Set D — Sustainable Finance Practice Manual", "paper": "Set D", "type": "Practice Manual", "pages": 196, "url": "https://resource.cdn.icai.org/"}
  ]'::jsonb,
  '[
    {"q": "What does SPOM stand for?", "a": "SPOM is the Self-Paced Online Module — a new ICAI initiative for CA Final students that lets you learn and qualify selected papers online, at your own pace, before the main Final exams."},
    {"q": "Is SPOM mandatory for CA Final students?", "a": "Yes. Under the new scheme, qualifying all four SPOM sets (A, B, C, D) is a prerequisite to appearing for the CA Final examinations."},
    {"q": "Can I attempt all four sets together?", "a": "Yes, you can attempt them in any order and any combination — together or one at a time. There is no fixed sequence."},
    {"q": "How are SPOM papers assessed?", "a": "Each set is assessed via an online proctored MCQ test of 100 marks. The passing benchmark is 50%. Negative marking is currently not applied."},
    {"q": "How many attempts do I get?", "a": "Unlimited attempts. If you don't clear a set, you can re-register and re-attempt in the next available window — usually multiple windows are released each year."},
    {"q": "Is there a fee for SPOM?", "a": "Yes, ICAI charges a nominal registration fee per set. Refer to the latest ICAI announcement for exact figures, as fees are revised periodically."},
    {"q": "Will SPOM marks reflect on my CA Final marksheet?", "a": "SPOM results are issued separately as a qualifying certificate. They do not get added to your CA Final aggregate but are mandatory to clear."},
    {"q": "Where can I get the official syllabus?", "a": "Visit icai.org → Students → Self-Paced Online Modules. The detailed syllabus and study material for each set are published there."}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM spom_content);
