import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import PaperBrowser from "@/components/study/PracticePapers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";



const PYQ = () => (
  <div className="min-h-screen">
    {/* <Navbar /> */}
    <PageHeader
      title="Online Mock Tests"
      gradientTitle="(MCQ)"
      description="Browse and download ICAI mock test papers."
      size="lg"
    />
    <PaperBrowser
      title="Mock Test Papers"
      subtitle="Browse, bookmark, and download ICAI mock test papers."
      paperType="online"
    />

  </div>
);

export default PYQ;
