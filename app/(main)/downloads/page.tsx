import Downloads from "@/components/downloads/downloads";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Offline Downloads - CA StudyHub",
  description: "Access your downloaded Chartered Accountancy study planners, MCQ tests, and flashcards offline.",
};

export default function DownloadsPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_OFFLINE !== "true") {
    redirect("/study");
  }

  return <Downloads />;
}

