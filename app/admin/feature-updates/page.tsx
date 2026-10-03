import { FeatureUpdatesManager } from "@/components/admin/feature-updates/FeatureUpdatesManager";

export const metadata = {
  title: "Feature Popups & Announcements | CA StudyHub Admin",
  description: "Configure What's New and Feature Announcements popups for students.",
};

export default function AdminFeatureUpdatesPage() {
  return <FeatureUpdatesManager />;
}
