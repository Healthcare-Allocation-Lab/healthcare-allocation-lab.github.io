# Team Editing Guide

Quick reference for updating team member profiles on the Parker HCA Lab website.

## File Structure

```
_data/team.yml           # Master member list (names, roles, categories)
_team_members/           # One file per member (bios + profile page data)
  haley-beck.md
  peter-graffy.md
  ...
images/team/             # Headshot photos (named by slug)
  haley-beck.jpg
  peter-graffy.jpg
  ...
```

## Common Tasks

### Edit a member's bio

1. Open `_team_members/{firstname-lastname}.md`
2. Edit the text **below** the second `---` line
3. The text supports Markdown (bold, links, lists, etc.)

Example file structure:
```
---
member_name: "Haley Beck, MA"
role: "Lab Manager"
slug: "haley-beck"
photo: "images/team/haley-beck.jpg"
title: "Haley Beck | Parker Healthcare Allocation Lab"
description: "Profile of Haley Beck at the Parker HCA Lab."
---

This is the bio text. Edit anything below the second --- line.
You can use **bold**, *italic*, and [links](https://example.com).
```

### Update a member's photo

1. Add the new photo to `images/team/` (name it `{slug}.jpg`, e.g., `haley-beck.jpg`)
2. Open `_team_members/{slug}.md` and make sure the `photo:` line matches:
   ```
   photo: "images/team/haley-beck.jpg"
   ```

### Update a member's role/title

Two places to update:
1. `_data/team.yml` — change the `role:` field (this controls the team listing page)
2. `_team_members/{slug}.md` — change the `role:` field (this controls the profile page)

### Add a new team member

1. **Add to `_data/team.yml`** under the correct category (staff, postdocs, trainees, alumni):
   ```yaml
     - name: "New Person, MS"
       role: "Data Scientist"
       description: "Brief one-liner for the team page card."
       slug: "new-person"
   ```

2. **Create `_team_members/new-person.md`**:
   ```
   ---
   member_name: "New Person, MS"
   role: "Data Scientist"
   slug: "new-person"
   photo: "images/team/new-person.jpg"
   title: "New Person | Parker Healthcare Allocation Lab"
   description: "Profile of New Person at the Parker HCA Lab."
   ---

   Bio paragraph goes here. Write as much or as little as needed.
   ```

3. **Add their photo** to `images/team/new-person.jpg`

### Move a member to Alumni

1. In `_data/team.yml`, move their entry from their current category to the `alumni:` section
2. Update their `role:` to reflect their current position (e.g., "Internal Medicine Resident, Columbia University")
3. In `_team_members/{slug}.md`, update the `role:` field to match

### Remove a member entirely

1. Delete their entry from `_data/team.yml`
2. Delete `_team_members/{slug}.md`
3. Optionally delete their photo from `images/team/`

## Optional Profile Fields

These fields in `_team_members/{slug}.md` front matter are all optional:

| Field | Purpose | Example |
|-------|---------|---------|
| `photo` | Path to headshot image | `"images/team/haley-beck.jpg"` |
| `pubmed_name` | PubMed author name for auto-fetching lab publications | `"Parker WF"` |
| `google_scholar` | Link to Google Scholar profile | `"https://scholar.google.com/citations?user=..."` |
| `spotlights` | Research spotlight IDs | `["heart-allocation-2024"]` |

If a field is omitted, that section simply won't appear on the profile page.

### Add publications to a profile

Add the member's PubMed author name to their front matter:
```yaml
pubmed_name: "Parker WF"
```
The name should be in PubMed format: `LastName FirstInitial(MiddleInitial)` (e.g., "Peek ME", "Narang NK"). Publications are searched and fetched automatically from PubMed when the page loads. For common names, include the middle initial to reduce false matches.

### Add a research spotlight

1. Add the spotlight to `_data/spotlights.yml`:
   ```yaml
   - id: "my-spotlight-id"
     title: "Paper Title"
     image: "images/spotlights/my-image.png"
     abstract: "Brief description of the finding."
     doi: "10.1001/example"
   ```
2. Reference it in the member's front matter:
   ```yaml
   spotlights: ["my-spotlight-id"]
   ```

## Building the Site

After making changes, the site rebuilds automatically on GitHub Pages when you push.

To preview locally:
```bash
bundle exec jekyll serve
```
Then visit http://localhost:4000
