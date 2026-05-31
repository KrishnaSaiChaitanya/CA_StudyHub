"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Trash2, Loader2, RefreshCw, ChevronLeft, ListChecks, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { SUBJECT_MAPPING, formatSubjectName } from "@/utils/subjects";
import { TableFilters } from "@/components/admin/TableFilters";

export default function TestsDashboard() {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTest, setShowAddTest] = useState(false);
  const [savingTest, setSavingTest] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testFilters, setTestFilters] = useState({ column: "name", value: "" });

  // Selected test for managing questions
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionFilters, setQuestionFilters] = useState({ column: "question_text", value: "" });

  // Form State - Test
  const [testName, setTestName] = useState("");
  const [testCategory, setTestCategory] = useState("");
  const [testDuration, setTestDuration] = useState<string>("");
  const [testLevel, setTestLevel] = useState<string>("standard");
  const [testDescription, setTestDescription] = useState("");
  const [testNo, setTestNo] = useState("");

  // Form State - Question
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
const [questionNotes, setQuestionNotes] = useState(
  `Page reference 📄 -
Exam tip 💡 -
Exam twist 🤔 -`
);

  const allSubjects = [
    ...SUBJECT_MAPPING.foundation,
    ...SUBJECT_MAPPING.intermediate,
    ...SUBJECT_MAPPING.final
  ];

  const fetchTests = async () => {
    setLoading(true);
    const { data } = await supabase.from('tests').select('*').order('created_at', { ascending: false });
    if (data) setTests(data);
    setLoading(false);
  };

  const fetchQuestions = async (testId: string) => {
    setLoadingQuestions(true);
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('test_id', testId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (data) setQuestions(data);
    setLoadingQuestions(false);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleEditTest = (test: any) => {
    setTestName(test.name);
    setTestCategory(test.category);
    setTestDuration(test.duration?.toString() || "");
    setTestLevel(test.level || "standard");
    setTestDescription(test.description || "");
    setTestNo(test.test_no || "");
    setEditingTestId(test.id);
    setShowAddTest(true);
  };

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTest(true);

    const payload = {
      name: testName,
      category: testCategory,
      duration: testDuration ? parseInt(testDuration) : null,
      level: testLevel,
      description: testDescription,
      test_no: testNo || null,
    };

    let error;
    if (editingTestId) {
      const { error: updateError } = await supabase.from('tests').update(payload).eq('id', editingTestId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('tests').insert(payload);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingTestId ? 'updating' : 'adding'} test`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Test ${editingTestId ? 'updated' : 'added'}!` });
      setTestName(""); setTestCategory(""); setTestDuration(""); setTestLevel("standard"); setTestDescription(""); setTestNo("");
      setEditingTestId(null);
      setShowAddTest(false);
      fetchTests();
    }
    setSavingTest(false);
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Are you sure? This will delete all questions in this test as well.")) return;
    const { error } = await supabase.from('tests').delete().eq('id', id);
    if (!error) fetchTests();
  };

  const handleEditQuestion = (question: any) => {
    setQuestionText(question.question_text);
    setOptionA(question.option_a);
    setOptionB(question.option_b);
    setOptionC(question.option_c);
    setOptionD(question.option_d);
    setCorrectAnswer(question.correct_answer);
    setQuestionNotes(question.notes || "");
    setEditingQuestionId(question.id);
    setShowAddQuestion(true);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuestion(true);

    const payload = {
      test_id: selectedTest.id,
      question_text: questionText,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_answer: correctAnswer,
      notes: questionNotes,
      is_active: true,
    };

    let error;
    if (editingQuestionId) {
      // Versioning: Mark old one as inactive and insert new one
      const { error: deactivateError } = await supabase
        .from('questions')
        .update({ is_active: false })
        .eq('id', editingQuestionId);
      
      if (deactivateError) {
        error = deactivateError;
      } else {
        const { error: insertError } = await supabase.from('questions').insert(payload);
        error = insertError;
      }
    } else {
      const { error: insertError } = await supabase.from('questions').insert(payload);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingQuestionId ? 'updating' : 'adding'} question`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Question ${editingQuestionId ? 'updated' : 'added'}!` });
      setQuestionText(""); setOptionA(""); setOptionB(""); setOptionC(""); setOptionD(""); setCorrectAnswer(""); setQuestionNotes("");
      setEditingQuestionId(null);
      setShowAddQuestion(false);
      fetchQuestions(selectedTest.id);
      fetchTests(); // Refresh question count on test list
    }
    setSavingQuestion(false);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    // Soft delete / mark inactive for versioning
    const { error } = await supabase.from('questions').update({ is_active: false }).eq('id', id);
    if (!error) {
        fetchQuestions(selectedTest.id);
        fetchTests();
    }
  };

  if (selectedTest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedTest(null)}><ChevronLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Questions</h1>
            <p className="text-muted-foreground mt-1">Test: {selectedTest.name} ({formatSubjectName(selectedTest.category as any)})</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="icon" onClick={() => fetchQuestions(selectedTest.id)}><RefreshCw className="h-4 w-4" /></Button>
            <Button onClick={() => setShowAddQuestion(!showAddQuestion)} className="gap-2">
              <Plus className="h-4 w-4" /> {showAddQuestion ? "Cancel" : "Add MCQ"}
            </Button>
          </div>
        </div>

        <TableFilters 
          columns={[
            { key: "question_text", label: "Question" },
            { key: "option_a", label: "Option A" },
            { key: "option_b", label: "Option B" },
            { key: "option_c", label: "Option C" },
            { key: "option_d", label: "Option D" },
            { key: "correct_answer", label: "Answer" },
            { key: "notes", label: "Notes" }
          ]} 
          onFilterChange={setQuestionFilters}
          placeholder="Filter questions..."
        />

        {showAddQuestion && (
          <Card className="border-border">
            <CardHeader><CardTitle>{editingQuestionId ? "Edit Question" : "Add New Question"}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Question Text</label>
                  <Textarea required value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Type question here..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Option A</label>
                    <Input required value={optionA} onChange={e => setOptionA(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Option B</label>
                    <Input value={optionB} onChange={e => setOptionB(e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Option C</label>
                    <Input value={optionC} onChange={e => setOptionC(e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Option D</label>
                    <Input value={optionD} onChange={e => setOptionD(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Correct Answer</label>
                    <Select required value={correctAnswer} onValueChange={setCorrectAnswer}>
                      <SelectTrigger><SelectValue placeholder="Select correct option" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Option A {optionA && `(${optionA.slice(0, 20)}${optionA.length > 20 ? '...' : ''})`}</SelectItem>
                        {optionB && <SelectItem value="B">Option B ({optionB.slice(0, 20)}{optionB.length > 20 ? '...' : ''})</SelectItem>}
                        {optionC && <SelectItem value="C">Option C ({optionC.slice(0, 20)}{optionC.length > 20 ? '...' : ''})</SelectItem>}
                        {optionD && <SelectItem value="D">Option D ({optionD.slice(0, 20)}{optionD.length > 20 ? '...' : ''})</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes / Explanations (Viewable by student in performance summary)</label>
                  <Textarea value={questionNotes} onChange={e => setQuestionNotes(e.target.value)} placeholder="Explain the correct answer or add study notes..." />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={savingQuestion}>
                    {savingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingQuestionId ? "Update Question" : "Save Question")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          {loadingQuestions ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.filter(q => {
                  if (!questionFilters.value) return true;
                  const field = q[questionFilters.column];
                  return field?.toString().toLowerCase().includes(questionFilters.value.toLowerCase());
                }).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No questions found matching your filter.</TableCell>
                  </TableRow>
                )}
                {questions.filter(q => {
                  if (!questionFilters.value) return true;
                  const field = q[questionFilters.column];
                  return field?.toString().toLowerCase().includes(questionFilters.value.toLowerCase());
                }).map((q, i) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium max-w-sm">
                        <span className="text-muted-foreground mr-2">{i+1}.</span>
                        {q.question_text}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-sm">
                      <div className="grid grid-cols-2 gap-1">
                        <div className={q.correct_answer === 'A' ? "text-primary font-semibold" : ""}>A) {q.option_a}</div>
                        <div className={q.correct_answer === 'B' ? "text-primary font-semibold" : ""}>B) {q.option_b}</div>
                        <div className={q.correct_answer === 'C' ? "text-primary font-semibold" : ""}>C) {q.option_c}</div>
                        <div className={q.correct_answer === 'D' ? "text-primary font-semibold" : ""}>D) {q.option_d}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-primary">{q.correct_answer}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                      <div className="line-clamp-3 whitespace-pre-wrap">{q.notes || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(q)} className="text-muted-foreground hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)} className="text-destructive hover:bg-destructive/10">
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mock Tests & MCQs</h1>
          <p className="text-muted-foreground mt-1">Manage practice tests and questions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchTests}><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={() => { setEditingTestId(null); setTestName(""); setTestCategory(""); setTestDuration(""); setTestLevel("standard"); setTestDescription(""); setTestNo(""); setShowAddTest(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> {showAddTest ? "Cancel" : "Add Test"}
          </Button>
        </div>
      </div>

      <TableFilters 
        columns={[
          { key: "name", label: "Test Name" },
          { key: "category", label: "Subject" },
          { key: "level", label: "Level" },
          { key: "duration", label: "Duration" },
          { key: "test_no", label: "Test No" }
        ]} 
        onFilterChange={setTestFilters}
        placeholder="Filter tests..."
      />

      {showAddTest && (
        <Card className="border-border">
          <CardHeader><CardTitle>{editingTestId ? "Edit Mock Test" : "Add New Mock Test"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddTest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Test Name</label>
                <Input required value={testName} onChange={e => setTestName(e.target.value)} placeholder="E.g. Accounting Chapter 1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject Category</label>
                <Select required value={testCategory} onValueChange={setTestCategory}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {allSubjects.map(sub => (
                      <SelectItem key={sub} value={sub}>{formatSubjectName(sub as any)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (mins)</label>
                <Input type="number" value={testDuration} onChange={e => setTestDuration(e.target.value)} placeholder="E.g. 60" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Level</label>
                <Select required value={testLevel} onValueChange={setTestLevel}>
                  <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="intermediate">Moderate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Test No (Optional)</label>
                <Input value={testNo} onChange={e => setTestNo(e.target.value)} placeholder="e.g., 1" />
              </div>
              
              <div className="col-span-full space-y-2">
                <label className="text-sm font-medium">Description (Short summary for students)</label>
                <Textarea 
                  value={testDescription} 
                  onChange={e => setTestDescription(e.target.value)} 
                  placeholder="Tell students what this test covers..." 
                  rows={3}
                />
              </div>

              <div className="col-span-full pt-2">
                <Button type="submit" disabled={savingTest}>
                  {savingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingTestId ? "Update Test" : "Save Test")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Test No</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
            </TableHeader>
            <TableBody>
              {tests.filter(t => {
                if (!testFilters.value) return true;
                const field = t[testFilters.column];
                //Special handling for subject category name
                if (testFilters.column === "category") {
                   const subjectName = formatSubjectName(t.category as any);
                   return subjectName.toLowerCase().includes(testFilters.value.toLowerCase());
                }
                return field?.toString().toLowerCase().includes(testFilters.value.toLowerCase());
              }).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No tests found matching your filter.</TableCell>
                </TableRow>
              )}
              {tests.filter(t => {
                if (!testFilters.value) return true;
                const field = t[testFilters.column];
                if (testFilters.column === "category") {
                   const subjectName = formatSubjectName(t.category as any);
                   return subjectName.toLowerCase().includes(testFilters.value.toLowerCase());
                }
                return field?.toString().toLowerCase().includes(testFilters.value.toLowerCase());
              }).map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{formatSubjectName(t.category as any)}</TableCell>
                  <TableCell className="capitalize">{t.level || 'standard'}</TableCell>
                  <TableCell>{t.duration ? `${t.duration}m` : '-'}</TableCell>
                  <TableCell>{t.test_no || '-'}</TableCell>
                  <TableCell>{t.questions_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedTest(t); fetchQuestions(t.id); }} className="gap-2">
                            <ListChecks className="h-4 w-4" /> Manage
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditTest(t)} className="text-muted-foreground hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTest(t.id)} className="text-destructive hover:bg-destructive/10">
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
    </div>
  );
}
