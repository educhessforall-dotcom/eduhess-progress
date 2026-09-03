-- 002_curriculum_and_rules.sql

create table public.curriculum_years (
  id uuid primary key default gen_random_uuid(),
  year_number smallint unique not null check (year_number between 1 and 6),
  stage_name text not null,
  identity text,
  goals text,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  curriculum_year_id uuid not null references public.curriculum_years(id) on delete cascade,
  week_number smallint not null check (week_number between 1 and 40),
  title text not null,
  description text,
  objective text,
  key_terms text[],
  teaching_example text,
  guided_exercises text,
  practical_task text,
  homework text,
  expected_outcome text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (curriculum_year_id, week_number)
);

alter table public.classes
  add constraint classes_lesson_fk
  foreign key (lesson_id) references public.lessons(id) on delete set null;

create table public.promotion_rules (
  id uuid primary key default gen_random_uuid(),
  year_number smallint unique not null check (year_number between 1 and 6),
  overall_pass_marks numeric(7,2) not null default 110,
  practical_minimum numeric(6,2) not null,
  major_exam_pass_marks numeric(6,2) not null,
  checkpoint_pass_marks numeric(6,2) not null default 10,
  created_at timestamptz not null default now()
);

insert into public.assessment_types (code, name, max_marks, timing)
values
  ('CP1', 'Checkpoint 1', 25, 'Week 10'),
  ('MID', 'Mid-Year Examination', 100, 'Week 20'),
  ('CP2', 'Checkpoint 2', 25, 'Week 30'),
  ('FINAL', 'Final Examination', 100, 'Weeks 37-40'),
  ('HOMEWORK', 'Homework & Class Performance', 25, 'Continuous')
on conflict (code) do update set name = excluded.name, max_marks = excluded.max_marks, timing = excluded.timing;

insert into public.promotion_rules (year_number, overall_pass_marks, practical_minimum, major_exam_pass_marks, checkpoint_pass_marks)
values
  (1,110,15,40,10),
  (2,110,15,40,10),
  (3,110,15,45,10),
  (4,110,16,50,10),
  (5,110,18,50,10),
  (6,110,18,55,10)
on conflict (year_number) do update set
  overall_pass_marks = excluded.overall_pass_marks,
  practical_minimum = excluded.practical_minimum,
  major_exam_pass_marks = excluded.major_exam_pass_marks,
  checkpoint_pass_marks = excluded.checkpoint_pass_marks;
