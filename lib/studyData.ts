import { StudentLevel, SubjectCategory } from "@/utils/supabase/types";

export interface DefaultChapter {
  topic: string;
  hours: number;
  subtopics: string[];
}

export interface DefaultSubject {
  slug: SubjectCategory;
  name: string;
  shortName: string;
  level: StudentLevel;
  baseWeight: number;
  chapters: DefaultChapter[];
}

export const EXAM_OPTIONS = [
  { label: "Jan 2026" },
  { label: "May 2026" },
  { label: "Sep 2026" },
  { label: "Nov 2026" },
  { label: "Jan 2027" },
  { label: "May 2027" },
  { label: "Sep 2027" },
  { label: "Nov 2027" },
];

export const DEFAULT_SUBJECTS: DefaultSubject[] = [
  // === FOUNDATION ===
  {
    slug: "principles_and_practice_of_accounting",
    name: "Principles and Practice of Accounting",
    shortName: "Accounting",
    level: "foundation",
    baseWeight: 6.0,
    chapters: [
      { topic: "Theoretical Framework", hours: 10, subtopics: ["Meaning & Scope of Accounting", "Accounting Concepts & Principles", "Accounting Standards Introduction"] },
      { topic: "Accounting Process", hours: 15, subtopics: ["Journal & Ledger Posting", "Trial Balance Preparation", "Rectification of Errors"] },
      { topic: "Bank Reconciliation Statement", hours: 8, subtopics: ["Reconciliation Causes", "Preparation of BRS", "Adjusted Cash Book"] },
      { topic: "Inventories Valuation", hours: 10, subtopics: ["Basis of Inventory Valuation", "FIFO and Weighted Average Methods", "Physical Verification of Stock"] },
      { topic: "Depreciation & Amortisation", hours: 8, subtopics: ["Straight Line & WDV Methods", "Change of Method", "Revaluation of Assets"] },
      { topic: "Sole Proprietors Final Accounts", hours: 15, subtopics: ["Trading Account", "Profit & Loss Account", "Balance Sheet Adjustments"] }
    ]
  },
  {
    slug: "business_laws",
    name: "Business Laws",
    shortName: "Business Laws",
    level: "foundation",
    baseWeight: 6.0,
    chapters: [
      { topic: "Indian Regulatory Framework", hours: 8, subtopics: ["Sources of Law in India", "Legislative Process", "Judiciary System Structure"] },
      { topic: "The Indian Contract Act, 1872", hours: 25, subtopics: ["Offer and Acceptance", "Consideration Essentials", "Performance and Breach of Contract"] },
      { topic: "The Sale of Goods Act, 1930", hours: 15, subtopics: ["Conditions and Warranties", "Transfer of Ownership", "Unpaid Seller Rights"] },
      { topic: "The Indian Partnership Act, 1932", hours: 12, subtopics: ["Relation of Partners", "Registration and Dissolution", "Types of Partners"] },
      { topic: "The Limited Liability Partnership Act, 2008", hours: 10, subtopics: ["LLP Concept & Characteristics", "LLP Incorporation Process", "Partners and their Relations"] }
    ]
  },
  {
    slug: "business_math_logical_reasoning_and_statistics",
    name: "Business Mathematics, Logical Reasoning and Statistics",
    shortName: "Quant. Aptitude",
    level: "foundation",
    baseWeight: 5.0,
    chapters: [
      { topic: "Ratio, Proportion, Indices, Logarithms", hours: 8, subtopics: ["Ratios & Proportions", "Laws of Indices", "Properties of Logarithms"] },
      { topic: "Equations and Matrices", hours: 12, subtopics: ["Linear & Quadratic Equations", "Matrix Algebra & Determinants", "Cramer's Rule"] },
      { topic: "Linear Inequalities", hours: 6, subtopics: ["Formulation of Inequalities", "Graphical Solution of Inequalities", "Feasible Region Calculation"] },
      { topic: "Time Value of Money", hours: 20, subtopics: ["Simple & Compound Interest", "Annuity Valuation & Perpetuity", "Sinking Fund & Net Present Value"] },
      { topic: "Logical Reasoning", hours: 15, subtopics: ["Number Series & Coding-Decoding", "Direction Sense Test", "Seating Arrangements"] }
    ]
  },
  {
    slug: "business_economics",
    name: "Business Economics",
    shortName: "Business Economics",
    level: "foundation",
    baseWeight: 4.0,
    chapters: [
      { topic: "Introduction to Business Economics", hours: 6, subtopics: ["Micro vs Macro Economics", "Central Economic Problems", "Decision Making Under Constraints"] },
      { topic: "Theory of Demand and Supply", hours: 15, subtopics: ["Law of Demand & Elasticity", "Consumer Equilibrium", "Law of Supply & Equilibrium Price"] },
      { topic: "Theory of Production and Cost", hours: 12, subtopics: ["Laws of Production", "Short-run & Long-run Costs", "Economies and Diseconomies of Scale"] },
      { topic: "Price Determination in Markets", hours: 12, subtopics: ["Perfect Competition Price", "Monopoly & Monopolistic Pricing", "Oligopoly Features & Kinked Demand"] }
    ]
  },

  // === INTERMEDIATE ===
  {
    slug: "advanced_accounting",
    name: "Advanced Accounting",
    shortName: "Adv Accounting",
    level: "intermediate",
    baseWeight: 8.0,
    chapters: [
      { topic: "AS Formulation & Framework", hours: 10, subtopics: ["Standard Setting Process", "Framework for Financial Statements", "Qualitative Characteristics"] },
      { topic: "Presentation of Financial Statements", hours: 12, subtopics: ["Schedule III Division I Requirements", "Statement of Cash Flows (AS 3)", "Prior Period & Extraordinary Items (AS 5)"] },
      { topic: "Buyback of Securities & Equity", hours: 10, subtopics: ["Buyback Conditions & Limits", "Accounting Entries for Buyback", "Equity Shares with Differential Rights"] },
      { topic: "Amalgamation and Reconstruction", hours: 20, subtopics: ["Purchase Consideration Methods", "Pooling of Interest vs Purchase Method", "Internal Reconstruction Capital Reduction"] }
    ]
  },
  {
    slug: "corporate_and_other_laws",
    name: "Corporate & Other Laws",
    shortName: "Law",
    level: "intermediate",
    baseWeight: 6.0,
    chapters: [
      { topic: "Preliminary & Incorporation", hours: 10, subtopics: ["Types of Companies", "Memorandum & Articles of Association", "Registered Office & Alterations"] },
      { topic: "Prospectus and Allotment", hours: 10, subtopics: ["Public & Private Offerings", "Shelf & Red Herring Prospectus", "Allotment Rules & Return"] },
      { topic: "Share Capital and Debentures", hours: 12, subtopics: ["Alteration of Share Capital", "Issue of Bonus & Rights Shares", "Debentures Creation and Redemption"] },
      { topic: "Acceptance of Deposits", hours: 8, subtopics: ["Deposits from Members", "Deposits from Public", "Repayment & Default Penalties"] }
    ]
  },
  {
    slug: "taxation",
    name: "Taxation",
    shortName: "Taxation",
    level: "intermediate",
    baseWeight: 9.0,
    chapters: [
      { topic: "Basic Concepts & Residential Status", hours: 10, subtopics: ["Income Tax Rates & Surcharges", "Determination of Residential Status", "Scope of Total Income"] },
      { topic: "Salaries Income", hours: 20, subtopics: ["Allowances & Perquisites Valuation", "Retirement Benefits", "Deductions under Section 16"] },
      { topic: "House Property Income", hours: 12, subtopics: ["Annual Value Determination", "Deductions on Interest (Section 24)", "Co-owned & Self-occupied Properties"] },
      { topic: "PGBP (Business & Profession)", hours: 25, subtopics: ["Admissible & Inadmissible Deductions", "Depreciation Rules (Section 32)", "Presumptive Taxation Schemes"] }
    ]
  },
  {
    slug: "cost_and_management_accounting",
    name: "Cost & Management Accounting",
    shortName: "Costing",
    level: "intermediate",
    baseWeight: 7.0,
    chapters: [
      { topic: "Introduction to Cost Accounting", hours: 8, subtopics: ["Cost Classification & Centers", "Cost Sheet Preparation", "Installation of Costing System"] },
      { topic: "Material Cost Control", hours: 12, subtopics: ["EOQ and Stock Levels", "Inventory Valuation LIFO/FIFO", "Material Losses and Waste"] },
      { topic: "Employee Cost & Direct Expenses", hours: 12, subtopics: ["Labor Turn-over Causes", "Incentive Schemes (Halsey/Rowan)", "Direct Expenses Treatment"] },
      { topic: "Overheads Allocation", hours: 15, subtopics: ["Primary & Secondary Distribution", "Machine Hour Rate Calculation", "Under/Over Absorption Treatment"] }
    ]
  },
  {
    slug: "auditing_and_ethics",
    name: "Auditing & Ethics",
    shortName: "Auditing & Ethics",
    level: "intermediate",
    baseWeight: 7.0,
    chapters: [
      { topic: "Nature, Objective & Scope of Audit", hours: 10, subtopics: ["Definition & Objectives of Audit", "Inherent Limitations of Auditing", "Types of Audits"] },
      { topic: "Audit Strategy & Planning", hours: 12, subtopics: ["Formulating Audit Strategy", "Audit Programme Design", "Continuous Planning Adjustments"] },
      { topic: "Audit Evidence", hours: 15, subtopics: ["Sufficient & Appropriate Evidence", "Audit Procedures & Techniques", "Written Representations"] },
      { topic: "Risk Assessment & Internal Control", hours: 15, subtopics: ["Identifying Risks of Material Misstatement", "Evaluating Internal Control System", "Internal Audit Function Scope"] }
    ]
  },
  {
    slug: "financial_management_and_strategic_management",
    name: "Financial Management & Strategic Management",
    shortName: "FM & SM",
    level: "intermediate",
    baseWeight: 6.0,
    chapters: [
      { topic: "Scope and Objectives of FM", hours: 8, subtopics: ["Profit vs Wealth Maximization", "Financial Decisions Overview", "Role of Chief Financial Officer"] },
      { topic: "Ratio Analysis & Financial Planning", hours: 15, subtopics: ["Liquidity & Leverage Ratios", "Profitability & Turnover Ratios", "DuPont Analysis Framework"] },
      { topic: "Cost of Capital", hours: 12, subtopics: ["Cost of Equity & Debt", "Weighted Average Cost of Capital (WACC)", "Marginal Cost of Capital"] },
      { topic: "Introduction to Strategic Management", hours: 10, subtopics: ["Business Policy & Strategy", "Levels of Strategy (Corporate/Business)", "Strategic Management Process"] }
    ]
  },

  // === FINAL ===
  {
    slug: "financial_reporting",
    name: "Financial Reporting",
    shortName: "Financial Reporting",
    level: "final",
    baseWeight: 9.0,
    chapters: [
      { topic: "Introduction to Ind AS & Framework", hours: 8, subtopics: ["Roadmap for Implementation", "Conceptual Framework Principles", "First-time Adoption rules (Ind AS 101)"] },
      { topic: "Ind AS 1: Presentation of Statements", hours: 12, subtopics: ["Balance Sheet Disclosures", "Other Comprehensive Income (OCI)", "Going Concern Assessments"] },
      { topic: "Ind AS 2: Inventories Valuation", hours: 10, subtopics: ["Cost formulas & NRV", "Net Realisable Value estimation", "Inventory Write-downs"] },
      { topic: "Ind AS 16: Property, Plant & Equipment", hours: 15, subtopics: ["Recognition and Component Accounting", "Revaluation vs Cost Model", "Depreciation Method & Review"] },
      { topic: "Ind AS 103: Business Combinations", hours: 25, subtopics: ["Acquisition Method Steps", "Goodwill & Bargain Purchase", "Non-controlling Interest (NCI) Options"] },
      { topic: "Ind AS 110: Consolidated Financial Statements", hours: 30, subtopics: ["Control Model Criteria", "Consolidation Adjustments & Eliminations", "Loss of Control accounting"] }
    ]
  },
  {
    slug: "advanced_financial_management",
    name: "Advanced Financial Management",
    shortName: "AFM",
    level: "final",
    baseWeight: 7.0,
    chapters: [
      { topic: "Financial Policy & Strategy", hours: 8, subtopics: ["Strategic Financial Planning", "Balancing Risk and Return", "Capital Structure Decisions"] },
      { topic: "Risk Management & Derivatives", hours: 15, subtopics: ["Types of Financial Risks", "Value at Risk (VaR) Concept", "Hedging Techniques Introduction"] },
      { topic: "Security Analysis & Portfolio Management", hours: 20, subtopics: ["Fundamental & Technical Analysis", "Markowitz Efficient Frontier", "Capital Asset Pricing Model (CAPM)"] },
      { topic: "Derivatives Valuation", hours: 25, subtopics: ["Futures & Options Pricing", "Black-Scholes Model", "Interest Rate Swaps and Options"] }
    ]
  },
  {
    slug: "advanced_auditing_assurance_and_professional_ethics",
    name: "Advanced Auditing, Assurance & Professional Ethics",
    shortName: "Auditing",
    level: "final",
    baseWeight: 9.0,
    chapters: [
      { topic: "Quality Control", hours: 10, subtopics: ["SQC 1 Requirements", "SA 220 Audit Quality", "Engagement Quality Control Review"] },
      { topic: "Audit Planning, Strategy and Execution", hours: 15, subtopics: ["SA 300 Planning Guidelines", "SA 320 Materiality in Planning", " SA 315 Risk Assessment"] },
      { topic: "Professional Ethics & Code of Conduct", hours: 25, subtopics: ["Chartered Accountants Act, 1949 Schedules", "Fundamental Ethical Principles", "NOCLAR and Conflict of Interest"] }
    ]
  },
  {
    slug: "direct_tax_laws",
    name: "Direct Tax Laws & International Taxation",
    shortName: "Direct Tax Laws",
    level: "final",
    baseWeight: 10.0,
    chapters: [
      { topic: "Computation of Income of Special Entities", hours: 15, subtopics: ["Trusts and Charitable Institutions", "Political Parties and Electoral Trusts", "AOPs and BOIs Assessment"] },
      { topic: "Assessment of Corporate Entities", hours: 20, subtopics: ["Minimum Alternate Tax (MAT)", "Dividend Distribution Tax concepts", "Tonnage Tax Scheme"] },
      { topic: "Transfer Pricing & Non-Resident Taxation", hours: 25, subtopics: ["Arm's Length Price determination", "Safe Harbour Rules & APA", "Equalisation Levy & Significant Economic Presence"] }
    ]
  },
  {
    slug: "indirect_tax_laws",
    name: "Indirect Tax Laws",
    shortName: "Indirect Tax Laws",
    level: "final",
    baseWeight: 8.0,
    chapters: [
      { topic: "GST in India - Overview & Supply", hours: 12, subtopics: ["Constitutional Provisions", "Definition of Supply under Section 7", "Composite & Mixed Supplies"] },
      { topic: "Charge and Place of Supply", hours: 15, subtopics: ["Forward & Reverse Charge Mechanism", "Inter-State vs Intra-State Supply", "Place of Supply for Goods & Services"] },
      { topic: "Input Tax Credit (ITC)", hours: 25, subtopics: ["Eligibility & Conditions for ITC", "Apportionment & Blocked Credits", "Recovery of Excess ITC Claims"] }
    ]
  },
  {
    slug: "integrated_business_solutions",
    name: "Integrated Business Solutions",
    shortName: "IBS",
    level: "final",
    baseWeight: 5.0,
    chapters: [
      { topic: "Integrated Case Studies - Set 1", hours: 20, subtopics: ["FR & Auditing Integrated Cases", "Corporate Laws & Taxation Cases", "Risk Management & Ethics Scenarios"] },
      { topic: "Integrated Case Studies - Set 2", hours: 20, subtopics: ["Cross-functional Business Analysis", "Foreign Exchange & FDI Regulations", "Insolvency & Bankruptcy Code Cases"] }
    ]
  }
];

export const getSubject = (slug: string): DefaultSubject | undefined => {
  return DEFAULT_SUBJECTS.find((s) => s.slug === slug);
};

export const getSubtopics = (topic: string, hours: number): string[] => {
  // If the subtopics are dynamically queried from DB, we will use that instead.
  // This helper functions as a fallback generator.
  const subject = DEFAULT_SUBJECTS.find(s => s.chapters.some(c => c.topic === topic));
  const chapter = subject?.chapters.find(c => c.topic === topic);
  if (chapter && chapter.subtopics.length > 0) {
    return chapter.subtopics;
  }
  
  // Generic fallback if not defined
  const count = Math.max(2, Math.min(6, Math.floor(hours / 4)));
  const list = [];
  for (let i = 1; i <= count; i++) {
    list.push(`${topic} — Sub-topic ${i}`);
  }
  return list;
};
