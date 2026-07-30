import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import PaperBrowser from "@/components/study/PracticePapers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";



const PYQ = () => (
  <div className="min-h-screen">
    {/* <Navbar /> */}
    <PageHeader title="Previous Year Questions" gradientTitle="PYQ" showBack={true} backText="Back to Practice" description="Comprehensive PYQ bank organized by subject and difficulty"
    />
    <PaperBrowser
      title="Previous Year Questions"
      subtitle="Comprehensive PYQ bank organized by subject and difficulty"
      paperType="pyq"
    />

  </div>
);

export default PYQ;
