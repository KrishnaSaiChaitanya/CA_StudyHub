import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Globe, MapPin, Star, Users, BookOpen, Play, Clock, Calendar, ExternalLink, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.198-.054-.31-.346-.116l-6.4 4.024-2.77-.867c-.602-.188-.616-.602.126-.893l10.826-4.17c.504-.188.943.116.828.91z"/>
  </svg>
);

interface FacultyData {
  id?: string;
  name: string;
  subject: string;
  rating: number;
  students: string;
  website?: string;
  telegram_link?: string;
  experience?: string;
  level: string;
  profile_picture?: string | null;
  phone?: string;
  email?: string;
}

interface FacultyProfileProps {
  faculty: FacultyData;
  onBack: () => void;
}

const FacultyProfile = ({ faculty, onBack }: FacultyProfileProps) => {
  console.log(faculty);
  const [planners, setPlanners] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacultyData = async () => {
      if (!faculty.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = createClient();

      // Parallel fetching
      const [
        { data: plannersData },
        { data: videosData },
        { data: coursesData }
      ] = await Promise.all([
        supabase.from("study_planners").select("*").eq("faculty_id", faculty.id),
        supabase.from("faculty_videos").select("*").eq("faculty_id", faculty.id),
        supabase.from("faculty_courses").select("*").eq("faculty_id", faculty.id)
      ]);

      if (plannersData) setPlanners(plannersData);
      if (videosData) setVideos(videosData);
      if (coursesData) setCourses(coursesData);

      setLoading(false);
    };

    fetchFacultyData();
  }, [faculty.id]);

  const initials = faculty.name.split(" ").slice(-1)[0][0] || "F";

  const getThumbnailText = (title: string) => {
    return title.split(" ")
      .slice(0, 2)
      .map(word => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="container max-w-4xl py-8">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-6 gap-1 text-xs text-muted-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Faculty
      </Button>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border bg-card p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl font-bold  !bg-none" style={{backgroundColor:"white"}}>
              {faculty.profile_picture ? (
                <img src={faculty.profile_picture} alt={faculty.name} className="h-full w-full object-cover" style={{backgroundColor:"white"}} />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-card-foreground">{faculty.name}</h1>
              <p className="mt-1 text-sm text-accent">{faculty.subject} · {faculty.level}</p>
              {(faculty.students || faculty.experience) && (
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {/* <span className="flex items-center gap-1"> */}
                    {/* <Star className="h-3.5 w-3.5 fill-accent text-accent" />{faculty.rating} Rating</span> */}
                  {faculty.students && (
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{faculty.students}</span>
                  )}
                  {faculty.experience && (
                    <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{faculty.experience}</span>
                  )}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {faculty.email ? (
                  <a href={`mailto:${faculty.email}`} className="flex items-center gap-1.5 hover:text-accent transition-colors">
                    <Mail className="h-3.5 w-3.5 text-accent" />{faculty.email}
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-accent" />xxxxx@gmail.com</span>
                )}
                {faculty.phone ? (
                  <a href={`tel:${faculty.phone}`} className="flex items-center gap-1.5 hover:text-accent transition-colors">
                    <Phone className="h-3.5 w-3.5 text-accent" />( {faculty.phone} )
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-accent" />( +91 XXXXX XXXXX )</span>
                )}
                {faculty.website ? (
                  <a href={faculty.website.startsWith("http") ? faculty.website : `https://${faculty.website}`} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1.5 transition-colors hover:text-accent">
                    <Globe className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span className="underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-accent">
                      {faculty.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}
                    </span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-0 -ml-1 transition-all group-hover:opacity-100 group-hover:ml-0 shrink-0" />
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 opacity-60"><Globe className="h-3.5 w-3.5 text-accent" />Not provided</span>
                )}
                {faculty.telegram_link && (
                  <a href={faculty.telegram_link.startsWith("http") ? faculty.telegram_link : `https://${faculty.telegram_link}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#0088cc] transition-colors">
                    <TelegramIcon className="h-3.5 w-3.5 text-[#0088cc]" />Telegram <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
            {/* <Button className="bg-accent text-accent-foreground hover:bg-accent/90" size="sm">Follow</Button> */}
          </div>
        </Card>
      </motion.div>

      {loading ? (
        <div className="flex h-40 items-center justify-center mt-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Study Planners */}
          {planners.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-card-foreground">Study Planners</h2>
              <Carousel opts={{ align: "start" }} className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {planners.map((plan) => (
                    <CarouselItem key={plan.id} className="pl-2 md:pl-4 sm:basis-1/2 md:basis-1/3">
                      <Card className="h-full border-border bg-card p-4 transition-all hover:border-accent/30 flex flex-col justify-between">
                        <div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                            <Calendar className="h-4 w-4 text-accent" />
                          </div>
                          <h3 className="mt-3 text-sm font-semibold text-card-foreground">{plan.title}</h3>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                            <span className="rounded-full bg-secondary px-2 py-0.5">{plan.pages} Pages</span>
                            {/* <span className="rounded-full bg-secondary px-2 py-0.5 flex items-center gap-1">
                              <Star className="h-2.5 w-2.5 fill-muted-foreground" /> {plan.rating}
                            </span> */}
                            <span className="rounded-full bg-secondary px-2 py-0.5">{plan.downloads} DLs</span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4 w-full text-xs"
                          onClick={() => window.open(plan.pdf_url, '_blank')}
                        >
                          View Plan
                        </Button>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className={`hidden ${planners.length > 2 ? 'sm:block' : ''} ${planners.length <= 3 ? 'md:hidden' : ''}`}>
                  <CarouselPrevious className="-left-4 h-8 w-8" />
                  <CarouselNext className="-right-4 h-8 w-8" />
                </div>
              </Carousel>
            </motion.div>
          )}

          {/* YouTube Videos */}
          {videos.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-card-foreground">Popular Videos</h2>
              <Carousel opts={{ align: "start" }} className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {videos.map((video) => (
                    <CarouselItem key={video.id} className="pl-2 md:pl-4 sm:basis-1/2">
                      <Card 
                        className="group flex cursor-pointer items-center gap-4 border-border bg-card p-4 transition-all hover:border-accent/30 h-full"
                        onClick={() => window.open(video.url, '_blank')}
                      >
                        <div className="relative flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-primary overflow-hidden">
                          {video.thumbnail_url ? (
                            <img src={video.thumbnail_url} alt={video.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-primary-foreground/60">{getThumbnailText(video.name)}</span>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-all group-hover:opacity-100">
                            <Play className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-medium text-card-foreground">{video.name}</h3>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />
                               {video.duration_minutes || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className={`hidden ${videos.length > 2 ? 'sm:block' : ''}`}>
                  <CarouselPrevious className="-left-4 h-8 w-8" />
                  <CarouselNext className="-right-4 h-8 w-8" />
                </div>
              </Carousel>
            </motion.div>
          )}

          {/* Lectures to Enroll */}
      {courses.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="mt-8"
  >
    <h2 className="mb-4 text-lg font-semibold text-card-foreground">
      Lectures & Courses
    </h2>
    
    <div className="space-y-4">
      {courses.map((course) => (
        <div
          key={course.id}
          className="flex flex-col justify-between gap-4 rounded-[10px] border-[3px] border-border bg-card p-4 sm:flex-row sm:items-start lg:p-4"
        >
          {/* Left Section: Title & Badges */}
          <div className="flex flex-col gap-4">
            <h3 className=" text-base font-semibold text-card-foreground">
              {course.name}
            </h3>
            
            <div className="flex flex-wrap gap-3">
              <span className="flex h-6 min-w-[80px] items-center justify-center rounded-lg bg-secondary/50 px-3  text-[10px] font-bold text-muted-foreground">
                {course.hours_count} Hours
              </span>
              <span className="flex h-6 min-w-[80px] items-center justify-center rounded-lg bg-secondary/50 px-3  text-[10px] font-bold text-muted-foreground">
                {course.views}
              </span>
              <span className="flex h-6 min-w-[80px] items-center justify-center rounded-lg bg-secondary/50 px-3  text-[10px] font-bold text-muted-foreground">
                {course.batchtype}
              </span>
              <span className="flex h-6 min-w-[80px] items-center justify-center rounded-lg bg-secondary/50 px-3  text-[10px] font-bold text-muted-foreground">
                {course.period}
              </span>
            </div>
          </div>

          {/* Right Section: Button & Price */}
          <Link href={course.course_link || "#"} target="_blank" className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end sm:gap-4">
            <Button
              size="sm"
              className="h-7 w-24 rounded-md border border-transparent bg-accent  text-xs font-medium text-accent-foreground hover:bg-accent/90"
            >
              Enroll Now
            </Button>
            <span className="flex h-6 min-w-[80px] items-center justify-center rounded-lg bg-secondary/50 px-3  text-[10px] font-bold text-muted-foreground">
              ₹ {course.price}
            </span>
          </Link>
        </div>
      ))}
    </div>
  </motion.div>
)}
          {planners.length === 0 && videos.length === 0 && courses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground mt-8 border rounded-lg border-dashed">
              <BookOpen className="h-8 w-8 mb-3 opacity-20" />
              <p>No content available for this faculty member yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FacultyProfile;
