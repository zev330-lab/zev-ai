---
name: No useMemo in client components
description: Zev explicitly forbids importing useMemo in this project's client components
type: feedback
---

Do NOT import `useMemo` from React in any `'use client'` component in this project. Only `useState`, `useEffect`, and `useCallback` are permitted.

**Why:** Zev stated this as a hard rule — "CRITICAL: Do NOT import useMemo." Likely related to a build or runtime issue encountered previously.

**How to apply:** When writing or editing any `'use client'` page or component, check the import line. If `useMemo` is present, remove it and compute derived values inline or via `useCallback`-wrapped functions instead.
