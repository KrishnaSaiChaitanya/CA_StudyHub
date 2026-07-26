
import PaperBrowser from "@/components/study/PracticePapers";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import Link from "next/link";

const MTP = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader
        title="Mock Test Papers"
        gradientTitle="(MTP)"
        description="Browse, bookmark, and download ICAI mock test papers."
        size="lg"
      />

      <main className="flex-1">
        <PaperBrowser
          title="Mock Test Papers"
          subtitle="Browse, bookmark, and download ICAI mock test papers."
          paperType="mtp"
        />
      </main>


    </div>
  );
};

export default MTP;