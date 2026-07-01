import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaperBrowser from "@/components/PracticePapers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";



const PYQ = () => (
  <div className="min-h-screen">
    {/* <Navbar /> */}
    <section className="bg-primary py-12">
      <div className="container">
       <Link href="/practice"
                                   className="mb-4 flex items-center gap-1.5  w-[150px] text-xs text-primary-foreground/50  mx-auto hover:text-primary-foreground transition-colors"
                                 >
                                   <ArrowLeft className="h-3.5 w-3.5" /> Back to Practice
                                 </Link>
        <h1 className="text-center text-3xl font-bold text-primary-foreground">Online Mock Tests <span className="text-accent"></span></h1>
        <p className="mt-2 text-center text-sm text-primary-foreground/50">Comprehensive PYQ bank organized by subject and difficulty</p>
      </div>
    </section>
    <PaperBrowser 
          title="Mock Test Papers" 
          subtitle="Browse, bookmark, and download ICAI mock test papers." 
          paperType="online" 
        />
    
  </div>
);

export default PYQ;
