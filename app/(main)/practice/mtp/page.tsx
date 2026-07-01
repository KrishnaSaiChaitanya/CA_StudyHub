import Footer from "@/components/Footer";
import PaperBrowser from "@/components/PracticePapers"; // Adjust path if needed
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const MTP = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <section className="bg-primary py-12">
        <div className="container">
          <Link href="/practice"
                                   className="mb-4 flex items-center gap-1.5  w-[150px] text-xs text-primary-foreground/50  mx-auto hover:text-primary-foreground transition-colors"
                                 >
                                   <ArrowLeft className="h-3.5 w-3.5" /> Back to Practice
                                 </Link>
          <h1 className="text-center text-3xl font-bold text-primary-foreground">
            Mock Test Papers <span className="text-accent">(MTP)</span>
          </h1>
          <p className="mt-2 text-center text-sm text-primary-foreground/50">
            ICAI-aligned mock test papers for all levels
          </p>
        </div>
      </section>
      
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