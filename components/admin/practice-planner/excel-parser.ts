import * as XLSX from "xlsx";
import { StudentLevel, SubjectCategory } from "@/utils/supabase/types";

export interface ParsedSubtopic {
  name: string;
  sort_order: number;
  subtopic_no?: string;
}

export interface ParsedChapter {
  topic: string;
  hours: number;
  sort_order: number;
  section?: string;
  subtopics: ParsedSubtopic[];
}

export interface ParsedSubject {
  slug: SubjectCategory;
  name: string;
  short_name: string;
  level: StudentLevel;
  paper_code?: string;
  base_weight: number;
  sort_order?: number;
  chapters: ParsedChapter[];
}

export interface ParsingIssue {
  row?: number;
  type: "error" | "warning";
  field?: string;
  message: string;
}

export interface ParseResult {
  success: boolean;
  errors: ParsingIssue[];
  warnings: ParsingIssue[];
  subjects: ParsedSubject[];
  summary: {
    totalSubjects: number;
    totalChapters: number;
    totalSubtopics: number;
    levelCounts: Record<StudentLevel, { subjects: number; chapters: number; subtopics: number }>;
  };
}

interface TempChapter {
  topic: string;
  hours: number;
  sort_order: number;
  section?: string;
  subtopics: ParsedSubtopic[];
}

interface TempSubject {
  slug: SubjectCategory;
  name: string;
  short_name: string;
  level: StudentLevel;
  paper_code?: string;
  base_weight: number;
  chapters: Map<string, TempChapter>;
}

const KNOWN_SUBJECTS: Record<
  string,
  {
    slug: SubjectCategory;
    name: string;
    short_name: string;
    level: StudentLevel;
    base_weight: number;
  }
> = {
  // Foundation
  accounting: {
    slug: "principles_and_practice_of_accounting",
    name: "Principles and Practice of Accounting",
    short_name: "Accounting",
    level: "foundation",
    base_weight: 6.0,
  },
  "principles and practice of accounting": {
    slug: "principles_and_practice_of_accounting",
    name: "Principles and Practice of Accounting",
    short_name: "Accounting",
    level: "foundation",
    base_weight: 6.0,
  },
  "principles & practice of accounting": {
    slug: "principles_and_practice_of_accounting",
    name: "Principles and Practice of Accounting",
    short_name: "Accounting",
    level: "foundation",
    base_weight: 6.0,
  },
  "business laws": {
    slug: "business_laws",
    name: "Business Laws",
    short_name: "Business Laws",
    level: "foundation",
    base_weight: 6.0,
  },
  "quantitative aptitude": {
    slug: "business_math_logical_reasoning_and_statistics",
    name: "Business Mathematics, Logical Reasoning and Statistics",
    short_name: "Quant. Aptitude",
    level: "foundation",
    base_weight: 5.0,
  },
  "business mathematics, logical reasoning and statistics": {
    slug: "business_math_logical_reasoning_and_statistics",
    name: "Business Mathematics, Logical Reasoning and Statistics",
    short_name: "Quant. Aptitude",
    level: "foundation",
    base_weight: 5.0,
  },
  "business economics": {
    slug: "business_economics",
    name: "Business Economics",
    short_name: "Business Economics",
    level: "foundation",
    base_weight: 4.0,
  },

  // Intermediate
  "advanced accounting": {
    slug: "advanced_accounting",
    name: "Advanced Accounting",
    short_name: "Adv Accounting",
    level: "intermediate",
    base_weight: 8.0,
  },
  "corporate and other laws": {
    slug: "corporate_and_other_laws",
    name: "Corporate and Other Laws",
    short_name: "Law",
    level: "intermediate",
    base_weight: 6.0,
  },
  "corporate & other laws": {
    slug: "corporate_and_other_laws",
    name: "Corporate and Other Laws",
    short_name: "Law",
    level: "intermediate",
    base_weight: 6.0,
  },
  taxation: {
    slug: "taxation",
    name: "Taxation",
    short_name: "Taxation",
    level: "intermediate",
    base_weight: 9.0,
  },
  "cost and management accounting": {
    slug: "cost_and_management_accounting",
    name: "Cost and Management Accounting",
    short_name: "Costing",
    level: "intermediate",
    base_weight: 7.0,
  },
  "cost & management accounting": {
    slug: "cost_and_management_accounting",
    name: "Cost and Management Accounting",
    short_name: "Costing",
    level: "intermediate",
    base_weight: 7.0,
  },
  "auditing and ethics": {
    slug: "auditing_and_ethics",
    name: "Auditing and Ethics",
    short_name: "Audit",
    level: "intermediate",
    base_weight: 6.0,
  },
  "auditing & ethics": {
    slug: "auditing_and_ethics",
    name: "Auditing and Ethics",
    short_name: "Audit",
    level: "intermediate",
    base_weight: 6.0,
  },
  "financial management and strategic management": {
    slug: "financial_management_and_strategic_management",
    name: "Financial Management and Strategic Management",
    short_name: "FM & SM",
    level: "intermediate",
    base_weight: 7.0,
  },
  "financial management & strategic management": {
    slug: "financial_management_and_strategic_management",
    name: "Financial Management and Strategic Management",
    short_name: "FM & SM",
    level: "intermediate",
    base_weight: 7.0,
  },

  // Final
  "financial reporting": {
    slug: "financial_reporting",
    name: "Financial Reporting",
    short_name: "FR",
    level: "final",
    base_weight: 10.0,
  },
  "advanced financial management": {
    slug: "advanced_financial_management",
    name: "Advanced Financial Management",
    short_name: "AFM",
    level: "final",
    base_weight: 9.0,
  },
  "advanced auditing, assurance and professional ethics": {
    slug: "advanced_auditing_assurance_and_professional_ethics",
    name: "Advanced Auditing, Assurance and Professional Ethics",
    short_name: "Adv Audit",
    level: "final",
    base_weight: 8.0,
  },
  "advanced auditing and professional ethics": {
    slug: "advanced_auditing_assurance_and_professional_ethics",
    name: "Advanced Auditing, Assurance and Professional Ethics",
    short_name: "Adv Audit",
    level: "final",
    base_weight: 8.0,
  },
  "direct tax laws and international taxation": {
    slug: "direct_tax_laws",
    name: "Direct Tax Laws and International Taxation",
    short_name: "DT",
    level: "final",
    base_weight: 10.0,
  },
  "direct tax laws & international taxation": {
    slug: "direct_tax_laws",
    name: "Direct Tax Laws and International Taxation",
    short_name: "DT",
    level: "final",
    base_weight: 10.0,
  },
  "direct tax laws": {
    slug: "direct_tax_laws",
    name: "Direct Tax Laws and International Taxation",
    short_name: "DT",
    level: "final",
    base_weight: 10.0,
  },
  "indirect tax laws": {
    slug: "indirect_tax_laws",
    name: "Indirect Tax Laws",
    short_name: "IDT",
    level: "final",
    base_weight: 9.0,
  },
  "integrated business solutions": {
    slug: "integrated_business_solutions",
    name: "Integrated Business Solutions",
    short_name: "IBS",
    level: "final",
    base_weight: 8.0,
  },
};

const VALID_LEVELS: StudentLevel[] = ["foundation", "intermediate", "final"];

export function parseSyllabusWorkbook(workbook: XLSX.WorkBook): ParseResult {
  const errors: ParsingIssue[] = [];
  const warnings: ParsingIssue[] = [];

  const sheetName = workbook.SheetNames.includes("Syllabus")
    ? "Syllabus"
    : workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    return {
      success: false,
      errors: [
        {
          type: "error",
          message: "Could not find 'Syllabus' sheet or default sheet in workbook.",
        },
      ],
      warnings: [],
      subjects: [],
      summary: createEmptySummary(),
    };
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: "",
    raw: false,
  });

  if (!rawRows || rawRows.length === 0) {
    return {
      success: false,
      errors: [
        {
          type: "error",
          message: "The workbook sheet contains no data rows.",
        },
      ],
      warnings: [],
      subjects: [],
      summary: createEmptySummary(),
    };
  }

  const subjectsMap = new Map<string, TempSubject>();

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // +1 for 1-based, +1 for header row

    // Case-insensitive cell retrieval
    const getVal = (possibleKeys: string[]) => {
      for (const k of Object.keys(row)) {
        const cleanK = k.trim().toLowerCase();
        if (possibleKeys.includes(cleanK)) {
          return String(row[k] ?? "").trim();
        }
      }
      return "";
    };

    const rawLevel = getVal(["level", "student level", "course level"]);
    const rawSubject = getVal(["subject", "subject name", "paper name"]);
    const rawPaperCode = getVal(["paper code", "paper", "paper no", "paper no."]);
    const rawSection = getVal(["section", "module", "part"]);
    const rawChapterNo = getVal([
      "chapter no.",
      "chapter no",
      "chapter #",
      "chapter_no",
      "chapter number",
    ]);
    const rawChapterTitle = getVal([
      "chapter title",
      "chapter",
      "topic",
      "chapter name",
    ]);
    const rawSubtopicNo = getVal([
      "sub-topic no.",
      "sub-topic no",
      "subtopic no.",
      "subtopic no",
      "sub topic no",
    ]);
    const rawSubtopic = getVal([
      "sub-topic",
      "subtopic",
      "sub topic",
      "sub-topic title",
      "subtopic title",
      "sub topic title",
    ]);

    // Skip empty filler rows
    if (!rawLevel && !rawSubject && !rawChapterTitle && !rawSubtopic) {
      return;
    }

    // Validation
    const levelLower = rawLevel.toLowerCase() as StudentLevel;
    if (!rawLevel) {
      errors.push({
        row: rowNum,
        field: "Level",
        type: "error",
        message: `Row ${rowNum}: Missing student level (e.g. Foundation, Intermediate, Final).`,
      });
      return;
    }

    if (!VALID_LEVELS.includes(levelLower)) {
      errors.push({
        row: rowNum,
        field: "Level",
        type: "error",
        message: `Row ${rowNum}: Invalid Level '${rawLevel}'. Must be 'Foundation', 'Intermediate', or 'Final'.`,
      });
      return;
    }

    if (!rawSubject) {
      errors.push({
        row: rowNum,
        field: "Subject",
        type: "error",
        message: `Row ${rowNum}: Missing Subject name.`,
      });
      return;
    }

    if (!rawChapterTitle) {
      errors.push({
        row: rowNum,
        field: "Chapter Title",
        type: "error",
        message: `Row ${rowNum}: Missing Chapter Title.`,
      });
      return;
    }

    // Determine subject metadata
    const normSubject = rawSubject.toLowerCase();
    const known = KNOWN_SUBJECTS[normSubject];
    const slug: SubjectCategory =
      known?.slug ||
      (normSubject.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") as SubjectCategory);
    const name = known?.name || rawSubject;
    const short_name =
      known?.short_name ||
      (rawSubject.length > 24 ? rawSubject.slice(0, 24) : rawSubject);
    const base_weight = known?.base_weight || 5.0;
    const level: StudentLevel = known?.level || levelLower;

    if (!subjectsMap.has(slug)) {
      subjectsMap.set(slug, {
        slug,
        name,
        short_name,
        level,
        paper_code: rawPaperCode,
        base_weight,
        chapters: new Map<string, TempChapter>(),
      });
    }

    const subjectObj = subjectsMap.get(slug)!;
    const topic = rawChapterTitle;
    const parsedChNo = parseInt(rawChapterNo, 10);
    const chSortOrder = !isNaN(parsedChNo) ? parsedChNo : subjectObj.chapters.size + 1;

    if (!subjectObj.chapters.has(topic)) {
      subjectObj.chapters.set(topic, {
        topic,
        hours: 5.0,
        sort_order: chSortOrder,
        section: rawSection || undefined,
        subtopics: [],
      });
    }

    const chapterObj = subjectObj.chapters.get(topic)!;

    if (rawSubtopic) {
      const alreadyExists = chapterObj.subtopics.some(
        (s) => s.name.trim().toLowerCase() === rawSubtopic.trim().toLowerCase()
      );
      if (!alreadyExists) {
        chapterObj.subtopics.push({
          name: rawSubtopic.trim(),
          sort_order: chapterObj.subtopics.length + 1,
          subtopic_no: rawSubtopicNo || undefined,
        });
      }
    }
  });

  const subjects: ParsedSubject[] = [];
  let totalChapters = 0;
  let totalSubtopics = 0;

  const levelCounts: Record<
    StudentLevel,
    { subjects: number; chapters: number; subtopics: number }
  > = {
    foundation: { subjects: 0, chapters: 0, subtopics: 0 },
    intermediate: { subjects: 0, chapters: 0, subtopics: 0 },
    final: { subjects: 0, chapters: 0, subtopics: 0 },
  };

  subjectsMap.forEach((s) => {
    const chaptersList: ParsedChapter[] = [];
    s.chapters.forEach((ch) => {
      chaptersList.push(ch);
    });
    chaptersList.sort((a, b) => a.sort_order - b.sort_order);

    // Normalize sequential order (1..N)
    chaptersList.forEach((ch, idx) => {
      ch.sort_order = idx + 1;
      totalChapters++;
      totalSubtopics += ch.subtopics.length;
      if (levelCounts[s.level]) {
        levelCounts[s.level].chapters++;
        levelCounts[s.level].subtopics += ch.subtopics.length;
      }
    });

    if (levelCounts[s.level]) {
      levelCounts[s.level].subjects++;
    }

    subjects.push({
      slug: s.slug,
      name: s.name,
      short_name: s.short_name,
      level: s.level,
      paper_code: s.paper_code,
      base_weight: s.base_weight,
      chapters: chaptersList,
    });
  });

  // Sort subjects by level hierarchy then name
  const levelOrder: Record<StudentLevel, number> = {
    foundation: 1,
    intermediate: 2,
    final: 3,
  };
  subjects.sort((a, b) => {
    if (levelOrder[a.level] !== levelOrder[b.level]) {
      return levelOrder[a.level] - levelOrder[b.level];
    }
    return a.name.localeCompare(b.name);
  });

  // Assign sequential sort_order per student level
  const orderPerLevel: Record<StudentLevel, number> = {
    foundation: 1,
    intermediate: 1,
    final: 1,
  };
  subjects.forEach((sub) => {
    sub.sort_order = orderPerLevel[sub.level]++;
  });

  return {
    success: errors.length === 0,
    errors,
    warnings,
    subjects,
    summary: {
      totalSubjects: subjects.length,
      totalChapters,
      totalSubtopics,
      levelCounts,
    },
  };
}

function createEmptySummary() {
  return {
    totalSubjects: 0,
    totalChapters: 0,
    totalSubtopics: 0,
    levelCounts: {
      foundation: { subjects: 0, chapters: 0, subtopics: 0 },
      intermediate: { subjects: 0, chapters: 0, subtopics: 0 },
      final: { subjects: 0, chapters: 0, subtopics: 0 },
    },
  };
}
