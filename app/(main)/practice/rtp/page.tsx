import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaperBrowser from "@/components/PracticePapers";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";



const RTP = () => (
  <div className="min-h-screen">
    {/* <Navbar /> */}
    <section className="bg-primary py-12">
      <div className="container">
       <Link href="/practice"
                                   className="mb-4 flex items-center gap-1.5  w-[150px] text-xs text-primary-foreground/50  mx-auto hover:text-primary-foreground transition-colors"
                                 >
                                   <ArrowLeft className="h-3.5 w-3.5" /> Back to Practice
                                 </Link>
        <h1 className="text-center text-3xl font-bold text-primary-foreground">Revision Test Papers <span className="text-accent">(RTP)</span></h1>
        <p className="mt-2 text-center text-sm text-primary-foreground/50">Official revision test papers with detailed solutions</p>
      </div>
    </section>
     <PaperBrowser 
          title="Revision Test Papers" 
          subtitle="Browse, bookmark, and download Revision Test Papers" 
          paperType="rtp" 
        />
    
  </div>
);

export default RTP;
