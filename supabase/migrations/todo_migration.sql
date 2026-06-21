-- Migration to update todos to be day-wise and use optimized schema
DROP TABLE IF EXISTS public.todos CASCADE;

CREATE TABLE public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  subject public.subject_category NOT NULL,
  todo_date date NOT NULL,
  done boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage Own Todos" ON public.todos FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER tr_update_todos BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
