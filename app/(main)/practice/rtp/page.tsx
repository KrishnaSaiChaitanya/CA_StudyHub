import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import PaperBrowser from "@/components/study/PracticePapers";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";



const RTP = () => (
  <div className="min-h-screen">
    <PageHeader
      title="Revision Test Papers"
      gradientTitle="(RTP)"
      showBack={true}
      backText="Back to Practice"
      description="Official revision test papers with detailed solutions"
      size="lg"
    />
    <PaperBrowser
      title="Revision Test Papers"
      subtitle="Browse, bookmark, and download Revision Test Papers"
      paperType="rtp"
    />

  </div>
);

export default RTP;
