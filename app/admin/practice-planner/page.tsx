import { PracticePlannerAdmin } from "@/components/admin/practice-planner/practice-planner-admin";

export const metadata = {
  title: "Study Planning Master | CA StudyHub Admin",
  description: "Configure subjects, chapters, sub-topics, and syllabus master data for practice trackers.",
};

export default function AdminPracticePlannerPage() {
  return <PracticePlannerAdmin />;
}
