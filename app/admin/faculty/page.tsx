"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2, Loader2, RefreshCw, Pencil, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { SUBJECT_MAPPING, formatSubjectName } from "@/utils/subjects";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ConfirmModal";
import { TableFilters } from "@/components/admin/TableFilters";

export default function FacultyDashboard() {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState({ column: "name", value: "" });

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [phone, setPhone] = useState("");
  const [students, setStudents] = useState("");
  const [website, setWebsite] = useState("");
  const [experience, setExperience] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  const allSubjects = [
    ...SUBJECT_MAPPING.foundation,
    ...SUBJECT_MAPPING.intermediate,
    ...SUBJECT_MAPPING.final
  ];

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('faculty').select('*').order('created_at', { ascending: false });
    if (data) setFaculty(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (facultyData: any) => {
    setName(facultyData.name);
    setEmail(facultyData.email || "");
    setLevel(facultyData.level || "");
    setSubject(facultyData.subject || "");
    setPhone(facultyData.phone || "");
    setStudents(facultyData.students || "");
    setWebsite(facultyData.website || "");
    setTelegramLink(facultyData.telegram_link || "");
    setExperience(facultyData.experience || "");
    setProfilePictureUrl(facultyData.profile_picture || "");
    setProfilePictureFile(null);
    setEditingId(facultyData.id);
    setShowAdd(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload: any = {
      name,
      email: email || null,
      level: level || null,
      subject: subject || null,
      phone: phone || null,
      students: students || null,
      website: website || null,
      telegram_link: telegramLink || null,
      experience: experience || null,
    };

    if (profilePictureFile) {
      try {
        const formData = new FormData();
        formData.append("file", profilePictureFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload profile image");
        }

        const uploadData = await uploadRes.json();
        payload.profile_picture = uploadData.url;
      } catch (uploadError: any) {
        toast({ title: "Profile image upload failed", description: uploadError?.message || "Please try again.", variant: "destructive" });
        setSaving(false);
        return;
      }
    } else if (profilePictureUrl) {
      payload.profile_picture = profilePictureUrl;
    } else {
      payload.profile_picture = null;
    }

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('faculty').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('faculty').insert(payload);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingId ? 'updating' : 'adding'} faculty`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Faculty ${editingId ? 'updated' : 'added'}!` });
      setName(""); setEmail(""); setLevel(""); setSubject(""); setPhone("");
      setStudents(""); setWebsite(""); setExperience(""); setTelegramLink("");
      setEditingId(null);
      setShowAdd(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    setFacultyToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const executeDelete = async () => {
    if (!facultyToDelete) return;
    const { error } = await supabase.from('faculty').delete().eq('id', facultyToDelete);
    if (!error) fetchData();
    setFacultyToDelete(null);
    setIsConfirmModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faculty Management</h1>
          <p className="text-muted-foreground mt-1">Manage faculty profiles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={() => { setEditingId(null); setName(""); setEmail(""); setLevel(""); setSubject(""); setPhone(""); setStudents(""); setWebsite(""); setExperience(""); setTelegramLink(""); setProfilePictureFile(null); setProfilePictureUrl(""); setShowAdd(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Faculty
          </Button>
        </div>
      </div>

      <TableFilters 
        columns={[
          { key: "name", label: "Name" },
          { key: "subject", label: "Subject" },
          { key: "level", label: "Level" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" }
        ]} 
        onFilterChange={setFilters}
        placeholder="Search faculty..."
      />

      <Dialog open={showAdd} onOpenChange={(open) => { 
        setShowAdd(open); 
        if (!open) {
          setEditingId(null);
          setName(""); setEmail(""); setLevel(""); setSubject(""); setPhone("");
          setStudents(""); setWebsite(""); setExperience(""); setTelegramLink("");
          setProfilePictureFile(null);
          setProfilePictureUrl("");
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Faculty" : "Add New Faculty"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="E.g. CA Rajesh Kumar" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Profile Image</label>
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setProfilePictureFile(file);
                    if (file) {
                      setProfilePictureUrl(URL.createObjectURL(file));
                    }
                  }}
                />
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Profile preview" className="h-16 w-16 rounded-full object-cover" />
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>
                  {allSubjects.map(sub => (
                    <SelectItem key={sub} value={sub}>{formatSubjectName(sub as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Students</label>
              <Input value={students} onChange={e => setStudents(e.target.value)} placeholder="e.g. 5000+" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telegram Link</label>
              <Input value={telegramLink} onChange={e => setTelegramLink(e.target.value)} placeholder="https://t.me/..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Experience (Years)</label>
              <Input value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 10" />
            </div>
            <div className="col-span-full pt-4">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Update Faculty" : "Save Faculty")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faculty.filter(f => {
                if (!filters.value) return true;
                const field = f[filters.column];
                if (filters.column === "subject") {
                   const subjectName = formatSubjectName(f.subject as any);
                   return subjectName.toLowerCase().includes(filters.value.toLowerCase());
                }
                return field?.toString().toLowerCase().includes(filters.value.toLowerCase());
              }).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No faculty found matching your filter.</TableCell>
                </TableRow>
              )}
              {faculty.filter(f => {
                if (!filters.value) return true;
                const field = f[filters.column];
                if (filters.column === "subject") {
                   const subjectName = formatSubjectName(f.subject as any);
                   return subjectName.toLowerCase().includes(filters.value.toLowerCase());
                }
                return field?.toString().toLowerCase().includes(filters.value.toLowerCase());
              }).map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="capitalize">{f.level || '-'}</TableCell>
                  <TableCell>{f.subject ? formatSubjectName(f.subject) : '-'}</TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {f.email && <div>{f.email}</div>}
                      {f.phone && <div>{f.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(f)} className="text-muted-foreground hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => window.location.href = `/admin/faculty/${f.id}`} className="text-muted-foreground hover:text-primary">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeDelete}
        title="Delete Faculty?"
        description="Are you sure you want to delete this faculty profile? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
