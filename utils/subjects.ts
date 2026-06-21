import { StudentLevel, SubjectCategory } from "@/types/database.types";

export const SUBJECT_MAPPING: Record<StudentLevel, SubjectCategory[]> = {
  foundation: [
    'principles_and_practice_of_accounting',
    'business_laws',
    'business_math_logical_reasoning_and_statistics',
    'business_economics',
  ],
  intermediate: [
    'advanced_accounting',
    'corporate_and_other_laws',
    'taxation',
    'cost_and_management_accounting',
    'auditing_and_ethics',
    'financial_management_and_strategic_management',
  ],
  final: [
    'financial_reporting',
    'advanced_financial_management',
    'advanced_auditing_assurance_and_professional_ethics',
    'direct_tax_laws',
    'indirect_tax_laws',
    'integrated_business_solutions',
  ],
};

export const SUBJECT_ABBREVIATIONS: Record<SubjectCategory, string> = {
  general: 'General',
  principles_and_practice_of_accounting: 'Accounting',
  business_laws: 'Business Laws',
  business_math_logical_reasoning_and_statistics: 'Math,LR',
  business_economics: 'Business Economics',
  advanced_accounting: 'Adv Accounting',
  corporate_and_other_laws: 'Law',
  taxation: 'Taxation',
  cost_and_management_accounting: 'Costing',
  auditing_and_ethics: 'Auditing & Ethics',
  financial_management_and_strategic_management: 'FM & SM',
  financial_reporting: 'Financial Reporting',
  advanced_financial_management: 'AFM',
  advanced_auditing_assurance_and_professional_ethics: 'Auditing',
  direct_tax_laws: 'Direct Tax Laws',
  indirect_tax_laws: 'Indirect Tax Laws',
  integrated_business_solutions: 'IBS',
};

export const getSubjectAbbreviation = (subject: SubjectCategory): string => {
  return SUBJECT_ABBREVIATIONS[subject] || formatSubjectName(subject);
};

export const formatSubjectName = (subject: SubjectCategory): string => {
  if (subject === 'general') return 'General';
  return subject
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const SUBJECT_COLOR_MAP: Record<SubjectCategory, string> = {
  general: "hsl(210 20% 50%)",
  // Foundation
  principles_and_practice_of_accounting: "hsl(197 100% 50%)", // Blue
  business_laws: "hsl(142 71% 45%)",                         // Green
  business_math_logical_reasoning_and_statistics: "hsl(38 92% 50%)", // Amber
  business_economics: "hsl(280 67% 55%)",                    // Purple
  
  // Intermediate
  advanced_accounting: "hsl(350 80% 55%)",                   // Pink/Red
  corporate_and_other_laws: "hsl(210 60% 50%)",              // Sky
  taxation: "hsl(160 50% 45%)",                              // Teal
  cost_and_management_accounting: "hsl(20 80% 60%)",         // Orange
  auditing_and_ethics: "hsl(262 83% 58%)",                   // Indigo
  financial_management_and_strategic_management: "hsl(316 70% 50%)", // Magenta
  
  // Final
  financial_reporting: "hsl(174 100% 33%)",                  // Dark Teal
  advanced_financial_management: "hsl(45 93% 47%)",          // Gold
  advanced_auditing_assurance_and_professional_ethics: "hsl(10 80% 50%)", // Vermilion
  direct_tax_laws: "hsl(200 70% 40%)",                       // Steel Blue
  indirect_tax_laws: " hsl(30, 100%, 48%)",                     // Yellow
  integrated_business_solutions: "hsl(291 64% 42%)",         // Deep Purple
};

export const SUBJECT_COLORS = Object.values(SUBJECT_COLOR_MAP);

export const getSubjectColor = (subject: SubjectCategory): string => {
  return SUBJECT_COLOR_MAP[subject] || SUBJECT_COLOR_MAP.general;
};
