"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { StudentLevel, SubjectCategory } from "@/utils/supabase/types";
import { syncUserActivity } from "@/utils/supabase/profile";
import { SUBJECT_MAPPING } from "@/utils/subjects";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Briefcase, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentContextType {
  studentLevel: StudentLevel | null;
  subjects: SubjectCategory[];
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType>({
  studentLevel: null,
  subjects: SUBJECT_MAPPING.foundation,
  loading: true,
  refreshProfile: async () => {},
});

export const useStudent = () => useContext(StudentContext);

export const StudentTypeProvider = ({ children }: { children: React.ReactNode }) => {
  const [studentLevel, setStudentLevel] = useState<StudentLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      await syncUserActivity(supabase);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("student_type")
          .eq("id", user.id)
          .single();
        
        if (!error && data) {
          setStudentLevel(data.student_type as StudentLevel | null);
          if (!data.student_type) {
            setShowPopup(true);
          } else {
            setShowPopup(false);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch profile (likely offline):", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSelectLevel = async (level: StudentLevel) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ student_type: level })
        .eq("id", user.id);
      
      if (!error) {
        setStudentLevel(level);
        setShowPopup(false);
      }
    }
    setSaving(false);
  };

  const subjects = studentLevel 
    ? SUBJECT_MAPPING[studentLevel] 
    : SUBJECT_MAPPING.foundation;

  return (
    <StudentContext.Provider value={{ studentLevel, subjects, loading, refreshProfile: fetchProfile }}>
      {children}
      
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg overflow-hidden border border-border bg-card shadow-xl rounded-2xl"
            >
              <div className="p-6 md:p-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                
                <h2 className="text-2xl font-bold text-center text-foreground mb-2">
                  Welcome to CAStudyHub
                </h2>
                <p className="text-center text-muted-foreground mb-8">
                  To personalize your experience, please select your current student level.
                </p>

                <div className="space-y-4">
                  {[
                    { id: 'foundation', title: 'Foundation', icon: GraduationCap, desc: 'Starting your CA journey' },
                    { id: 'intermediate', title: 'Intermediate', icon: Briefcase, desc: 'The core professional level' },
                    { id: 'final', title: 'Final', icon: Award, desc: 'The last step to become a CA' }
                  ].map((level) => (
                    <button
                      key={level.id}
                      onClick={() => handleSelectLevel(level.id as StudentLevel)}
                      disabled={saving}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-accent transition-all text-left"
                    >
                      <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                        <level.icon className="h-6 w-6 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{level.title}</h4>
                        <p className="text-xs text-muted-foreground">{level.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {saving && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/80 backdrop-blur-[2px] rounded-2xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground">Updating profile...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </StudentContext.Provider>
  );
};
