# Schema map

academies
 ├─ academy_members ─ profiles
 ├─ coaches ─ batches
 └─ students ─ enrollments ─ academic_years
       ├─ attendance ← classes ← lessons
       ├─ lesson_progress ← lessons
       ├─ assessments ← assessment_types
       ├─ practical_assessments
       ├─ promotion_reviews ← promotion_rules
       └─ certificates ─ certificate_events

curriculum_years ─ lessons (6 × 40 = 240)
