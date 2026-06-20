"use client";
import { useState, useEffect } from "react";
import FacultyProfile from "@/components/FacultyProfile";
import { motion, AnimatePresence } from "framer-motion";
import { Star, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Footer from "@/components/Footer";
import { useStudent } from "@/components/StudentTypeProvider";

export interface FacultyDisplayData {
  id: string;
  name: string;
  subject: string;
  rating: number;
  students: string;
  level: string;
  profile_picture?: string | null;
  telegram_link?: string;
}

const formatNameToSubject = (subject: string | null) => {
  if (!subject) return "Various";
  return subject
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatLevel = (level: string | null) => {
  if (!level) return "All Levels";
  return level.charAt(0).toUpperCase() + level.slice(1);
};

const Faculty = () => {
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyDisplayData | null>(null);
  const { studentLevel, subjects, loading: studentLoading } = useStudent();
  const [facultyList, setFacultyList] = useState<FacultyDisplayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaculty = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .in("level", studentLevel ? [studentLevel] : ["foundation", "intermediate", "final"])

      if (data && !error) {
        const formattedData: FacultyDisplayData[] = data.map((f) => ({
          id: f.id,
          name: f.name,
          subject: formatNameToSubject(f.subject),
          rating: Number(f.rating) || 4.5,
          students: f.students,
          level: formatLevel(f.level),
          profile_picture: f.profile_picture || null,
          email: f.email,
          phone: f.phone,
          website: f.website,
          telegram_link: f.telegram_link,
          experience: f.experience,
          location: f.location,
        }));
        setFacultyList(formattedData);
      }
      setLoading(false);
    };

    if (!studentLoading) {
      fetchFaculty();
    }
  }, [studentLevel, studentLoading]);

  return (
    <>
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      {selectedFaculty ? (
        <FacultyProfile faculty={selectedFaculty} onBack={() => setSelectedFaculty(null)} />
      ) : (
        <>
          <section className="bg-primary py-20">
            <div className="container">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl text-center">
                <h1 className="text-4xl font-bold text-primary-foreground">Expert <span className="text-gradient-blue">Faculty</span></h1>
                <p className="mt-4 text-sm text-primary-foreground/50">Connect with India's top CA educators.</p>
              </motion.div>
            </div>
          </section>
          <section className="container py-16">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : facultyList.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {facultyList.map((f, i) => (
                  <motion.div
                    key={f.id || f.name}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover hover:border-accent/30"
                  >
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-primary-foreground" style={{backgroundImage: `url(${f.profile_picture})`, backgroundSize: "cover", backgroundPosition: "center"}}>
                      {f.profile_picture ? (
                        <img src={f.profile_picture} alt={f.name} className="h-full w-full object-cover" />
                      ) : (
                        f.name.split(" ").slice(-1)[0][0]
                      )}
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-card-foreground">{f.name}</h3>
                    <p className="text-xs text-accent">{f.subject} · {f.level}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {/* <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-accent text-accent" />{f.rating}</span>
                      <span>{f.students} students</span> */}
                    </div>
                    <Button size="sm" variant="outline" className="mt-4 w-full text-[11px]" onClick={() => setSelectedFaculty(f)}>
                      <User className="mr-1 h-3 w-3" />Profile
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <p>No faculty members found.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
    <Footer/>
    </>
  );
};

export default Faculty;
