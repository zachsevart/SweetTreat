# Commit Guide - Supabase Files Only

## Quick Summary

**Keep & Commit:**
- ✅ All files in `src/services/` (Supabase services)
- ✅ All files in `src/types/` (TypeScript types)
- ✅ `src/utils/env.ts` (Environment config)
- ✅ `SUPABASE_INTEGRATION.md` (Integration guide)
- ✅ `README.md` (Database schema SQL)

**Optional (Project Config):**
- `package.json` (if partner needs to see dependencies)
- `tsconfig.json` (if partner needs TypeScript config)
- `app.json` (if partner needs Expo config)

**Don't Commit (Partner Has Their Own):**
- ❌ `src/screens/` (all screen files)
- ❌ `App.tsx`
- ❌ `SETUP.md` (project-specific)

## Recommended Commit

```bash
# Add only Supabase-related files
git add src/services/
git add src/types/
git add src/utils/env.ts
git add SUPABASE_INTEGRATION.md
git add README.md  # (has the SQL schema)

# Optional: Add config files if helpful
git add package.json
git add tsconfig.json
git add app.json

# Commit
git commit -m "Add Supabase services and types for backend integration"
```

## What Your Partner Needs

1. **Copy these directories:**
   - `src/services/` → Their `src/services/`
   - `src/types/` → Their `src/types/`
   - `src/utils/env.ts` → Their `src/utils/env.ts`

2. **Install dependencies:**
   ```bash
   npm install @supabase/supabase-js expo-constants
   ```

3. **Configure Supabase credentials** in their `app.json` or `.env`

4. **Import and use services** in their components (see `SUPABASE_INTEGRATION.md`)

## File Structure After Integration

Your partner's project should have:
```
their-project/
├── src/
│   ├── services/          ← Copy from here
│   │   ├── supabase.ts
│   │   ├── authService.ts
│   │   ├── restaurantService.ts
│   │   └── videoService.ts
│   ├── types/              ← Copy from here
│   │   ├── database.types.ts
│   │   └── index.ts
│   ├── utils/              ← Copy env.ts
│   │   └── env.ts
│   └── screens/            ← Their own screens
│       └── ...
└── App.tsx                 ← Their own App.tsx
```

