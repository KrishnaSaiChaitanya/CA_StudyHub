# Architecture & Refactoring Strategy

To maintain a clean, scalable codebase as CA StudyHub grows, we should adopt a Feature-Sliced Design (FSD) approach and separate our data access logic.

## Current Pain Points
1. **Component Clutter:** The `components/` directory is becoming a dumping ground for both generic UI elements and highly specific feature components (e.g., `SOPM.tsx`, `StudyPlannerView.tsx`).
2. **Type Scattering:** Types are defined locally in folders like `components/discussion/types.ts` and `app/bookmarks/types.ts`.
3. **Action/Query Coupling:** Database queries are heavily mixed inside UI components.

## Proposed Refactoring Steps (Branch: `refactor/architecture-cleanup`)

### Step 1: Implement Feature-Sliced Design (FSD)
Move domain-specific logic out of the root `components/` folder and into a `features/` directory.

**New Structure:**
```text
/features
  /flashcards
    /components (FlashCard.tsx, CreateSetDialog.tsx)
    /actions.ts
    /types.ts
  /community
    /components (ForumList.tsx, PostDetail.tsx)
    /actions.ts
    /types.ts
  /mock-exams
    ...

```

*Action Item:* Move files from `components/discussion/`, `components/flash-cards/`, and `components/sopm/` into their respective feature folders.

### Step 2: Centralize Data Access (The Repository Pattern)

Instead of calling Supabase directly inside Server Components, create a `services/` or `data/` layer.

**Example (`services/flashcards.ts`):**

```typescript
import { createClient } from '@/utils/supabase/server';

export async function getFlashcardSets(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('flashcard_sets')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

```

*Why?* This makes queries reusable, testable, and easier to update if the database schema changes.

### Step 3: Centralize Types

Move all database and domain types to a central `types/` directory at the root.

* `types/database.types.ts` (Generated Supabase types)
* `types/features.types.ts` (Custom mapped types like `ForumPostWithAuthor`)

### Step 4: Clean up `app/` Directory

The `app/(main)` directory has a lot of deep nesting. Ensure that only routing files (`page.tsx`, `layout.tsx`, `loading.tsx`) remain in the `app/` directory. All complex UI logic should be abstracted into the `features/` or `components/` directories. For example, `MockExamClientWrapper.tsx` should be moved to `/features/mock-exams/components/`.
