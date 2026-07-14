---
trigger: always_on
---

Here's a refined and more structured version of your project instructions that is clearer, removes ambiguity, and follows modern Next.js and Supabase best practices.

---

# CA StudyHub – AI Development Guidelines

## Project Overview

CA StudyHub is a comprehensive learning platform for Chartered Accountancy (CA) aspirants. The platform includes:

* Study planners
* Practice papers
* Flashcards
* Community forum
* Mock examinations
* Resource sharing
* AI-powered learning features

---

# Tech Stack

| Category         | Technology                     |
| ---------------- | ------------------------------ |
| Framework        | Next.js (App Router)           |
| Language         | TypeScript                     |
| Styling          | Tailwind CSS                   |
| UI Library       | Shadcn UI                      |
| Database         | PostgreSQL (Supabase)          |
| Authentication   | Supabase Auth                  |
| State Management | React Query (where applicable) |
| Mutations        | Next.js Server Actions         |
| Rich Text Editor | Tiptap                         |

---

# Database

The application uses PostgreSQL through Supabase.

For any schema-related information, always refer to:

```
utils/supabase/complete_schema.sql
```

Do not make assumptions about table structures or relationships if they can be verified from the schema.

Always use the generated database types located in:

```
utils/supabase/types.ts
```

---

# Development Standards

## 1. Next.js App Router

* Use **React Server Components** by default.

* Only use `"use client"` when absolutely necessary, such as when using:

  * React hooks (`useState`, `useEffect`, etc.)
  * Browser APIs
  * Event handlers
  * Client-side interactivity

* Prefer Server Components whenever possible.

* Keep business logic on the server.

---

## 2. Server Actions

Use **Server Actions** for every database mutation, including but not limited to:

* Create
* Update
* Delete
* File uploads
* Status changes

Examples:

```
app/actions.ts
```

or feature-specific actions:

```
app/admin/flashcards/actions.ts
app/forum/actions.ts
```

Never perform database mutations directly from Client Components.

---

## 3. Supabase

Always use the utilities provided inside:

```
utils/supabase/
```

Specifically:

* `server.ts`
* `client.ts`
* `middleware.ts`

Use the `@supabase/ssr` package for all authenticated server-side operations.

Never:

* Create custom Supabase clients unnecessarily
* Access the database directly from Client Components
* Bypass Server Actions or API routes for mutations

---

## 4. TypeScript

* Use strict typing everywhere.
* Never use `any` unless there is absolutely no alternative.
* Always use generated Supabase database types from:

```
utils/supabase/types.ts
```

* Use generic types where appropriate.
* Keep components and utility functions fully typed.

---

## 5. Styling

Use:

* Tailwind CSS
* Shadcn UI components from:

```
components/ui/
```

Maintain the existing design language:

* Modern
* Minimal
* Bento-style layouts
* Responsive
* Accessible
* Consistent spacing and typography

---

## 6. Color System

Always use the project's design tokens instead of hardcoded colors.

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 5%;

  --card: 0 0% 100%;
  --card-foreground: 0 0% 5%;

  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 5%;

  --primary: 0 0% 5%;
  --primary-foreground: 0 0% 100%;

  --secondary: 0 0% 96%;
  --secondary-foreground: 0 0% 5%;

  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;

  --accent: 197 100% 50%;
  --accent-foreground: 0 0% 100%;

  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  --border: 0 0% 92%;
  --input: 0 0% 92%;
  --ring: 197 100% 50%;

  --radius: 0.75rem;

  --sidebar-background: 0 0% 2%;
  --sidebar-foreground: 0 0% 90%;
  --sidebar-primary: 197 100% 50%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 0 0% 10%;
  --sidebar-accent-foreground: 0 0% 90%;
  --sidebar-border: 0 0% 15%;
  --sidebar-ring: 197 100% 50%;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.03);
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.04),
                 0 1px 2px -1px rgb(0 0 0 / 0.04);
  --shadow-card-hover: 0 4px 12px -2px rgb(0 0 0 / 0.08);
}
```

### Hover States

When creating interactive elements:

* Always define meaningful hover states.
* Never make buttons appear washed out or lighter unless intentionally designed.
* Hover colors should be a darker or richer variation of the base color while maintaining sufficient contrast.
* Ensure hover, active, and focus states are visually consistent across the application.

---

# Component Architecture

For every new feature:

Create a dedicated folder inside:

```
components/
```

Example:

```
components/
    flashcards/
        flashcards.tsx
        flashcard-list.tsx
        flashcard-item.tsx
        flashcard-dialog.tsx
```

Each feature folder should contain:

* A main entry component
* Reusable child components
* Shared utilities specific to that feature (if needed)

Pages inside the `app/` directory should remain lightweight and primarily compose feature components.

For example:

```
app/dashboard/page.tsx
```

should simply render:

```tsx
<Dashboard />
```

where `Dashboard` is exported from:

```
components/dashboard/dashboard.tsx
```

Avoid placing large amounts of UI or business logic directly inside the `app/` directory.

---

# Reusability

Whenever implementing new functionality:

* Prefer reusable components over duplicated code.
* Extract repeated UI into shared components.
* Create reusable hooks where appropriate.
* Reuse utility functions instead of duplicating logic.
* Keep components focused on a single responsibility.

---

# Code Quality

Always:

* Follow clean architecture principles.
* Keep functions small and focused.
* Use descriptive naming conventions.
* Remove unused imports and dead code.
* Keep components easy to read and maintain.
* Avoid unnecessary client-side rendering.
* Prefer composition over deeply nested components.
* Preserve existing functionality when refactoring.

---

# General Rules

* Do not change existing functionality unless explicitly requested.
* Preserve all business logic during refactoring.
* Ensure imports, exports, renamed files, and references are updated consistently whenever files or symbols are renamed.
* Follow the existing project structure and coding patterns unless instructed otherwise.
* Prioritize performance, readability, maintainability, and accessibility in every implementation.
