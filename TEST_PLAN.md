# 🏆 CelebHub Competition System - Test Plan

## 1. Automated Tests
Run the following command to execute the automated test suite:
```bash
npm test src/actions/__tests__/competitions.test.ts
```
**Coverage:**
- `createCompetition`: Slug generation, DB insertion, Translation creation.
- `addContestant`: Duplicate prevention, Entry creation.
- `getCompetitionBySlug`: Cache usage (`unstable_cache`), DTO mapping.
- `updateRankings`: Transactional updates.
- `recordCompetitionView`: Redis pipeline usage.

## 2. Manual Verification Checklist

### 👤 Admin Interface (`/admin/competitions`)

#### Create Competition
- [ ] Navigate to `/admin/competitions/create`
- [ ] **Basic Info:** Fill required fields (Type, Year, Scope). Upload a Cover Image (>5MB should fail).
- [ ] **Translations:** Add English (EN) and Turkish (TR) names.
- [ ] **Submit:** Click "Create". Verify redirection to list page.

#### Edit & Rankings
- [ ] Click "Edit" on the newly created competition.
- [ ] **Add Contestant:** Use the search bar to find an existing celebrity. Click to add.
- [ ] **Verify Duplicate:** Try adding the same celebrity again. Should show error.
- [ ] **Drag & Drop:** Add 3 contestants. Drag #3 to #1. Click "Save Rankings".
- [ ] **Verify Persistence:** Refresh page. Order should remain #1.

### 🌐 Public Interface (`/competitions`)

#### List Page
- [ ] Go to `/en/competitions` (or `/tr/yarismalari`).
- [ ] **Visibility:** Verify the new competition appears (if status is NOT Draft).
- [ ] **Filters:** Filter by "Year" and "Type". URL should update.
- [ ] **Click:** Click the card. Should navigate to detail page.

#### Detail Page (`/competition/[slug]`)
- [ ] **Hero:** Verify Cover Image, Title, and Date are displayed.
- [ ] **Rankings:** Verify the Winner (Rank 1) has special styling (Gold/Large).
- [ ] **SEO:** View Page Source. Search for `application/ld+json`. Verify `Event` and `ItemList` schema.
- [ ] **Analytics:** Refresh the page 5 times. Check Admin list "Views" column (might have delay).

### 🧩 Widgets

#### Homepage
- [ ] Go to `/`.
- [ ] Verify "Popular Competitions" section exists.
- [ ] Verify cards are clickable.

#### Celebrity Profile
- [ ] Go to `/celebrity/[slug]` for a celebrity added to the competition.
- [ ] Scroll to "Competition History".
- [ ] Verify the competition appears with correct Rank/Placement.

## 3. Data Integrity & Safety
- [ ] **Delete Protection:** Try to delete a Celebrity who is in a competition. Should fail (Restrict).
- [ ] **Cache:** Update competition name in Admin. Refresh Public Detail page. Should reflect change within 5 minutes (or immediately if `revalidateTag` worked).
