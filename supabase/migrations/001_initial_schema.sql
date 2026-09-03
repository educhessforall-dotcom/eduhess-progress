-- EduChess Academy OS
-- 001_initial_schema.sql
create extension if not exists pgcrypto;

create table public.academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  logo_url text,
  email text,
  phone text,
  website text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.academy_members (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('OWNER','ADMIN','COACH','STAFF','PARENT','STUDENT')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INVITED','SUSPENDED')),
  created_at timestamptz not null default now(),
  unique (academy_id, user_id)
);

create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  coach_code text not null,
  specialization text,
  joined_at date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (academy_id, coach_code),
  unique (academy_id, profile_id)
);

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  name text not null,
  coach_id uuid references public.coaches(id) on delete set null,
  day_of_week smallint check (day_of_week between 0 and 6),
  start_time time,
  end_time time,
  location text,
  capacity integer check (capacity is null or capacity > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_code text not null,
  first_name text not null,
  last_name text,
  date_of_birth date,
  parent_name text,
  parent_contact text,
  joining_date date,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','LEFT','GRADUATED')),
  current_year smallint not null default 1 check (current_year between 1 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academy_id, student_code)
);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  year_label text not null,
  starts_on date,
  ends_on date,
  status text not null default 'OPEN' check (status in ('PLANNED','OPEN','CLOSED')),
  created_at timestamptz not null default now(),
  unique (academy_id, year_label)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  batch_id uuid references public.batches(id) on delete set null,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  year_level smallint not null check (year_level between 1 and 6),
  start_date date not null,
  end_date date,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','COMPLETED','TRANSFERRED','WITHDRAWN')),
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  lesson_id uuid,
  class_date date not null,
  start_time time,
  end_time time,
  coach_id uuid references public.coaches(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null check (status in ('PRESENT','ABSENT','LATE','EXCUSED')),
  remarks text,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  lesson_id uuid not null,
  status text not null default 'NOT_STARTED' check (status in ('NOT_STARTED','IN_PROGRESS','COMPLETED','REQUIRES_REVIEW')),
  mastery_level text check (mastery_level is null or mastery_level in ('DEVELOPING','SECURE','INDEPENDENT')),
  completed_at timestamptz,
  coach_id uuid references public.coaches(id) on delete set null,
  coach_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create table public.assessment_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  max_marks numeric(6,2) not null check (max_marks > 0),
  timing text
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  assessment_type_id uuid not null references public.assessment_types(id) on delete restrict,
  marks numeric(6,2) not null check (marks >= 0),
  exam_date date,
  entered_by uuid references public.profiles(id) on delete set null,
  verified_by uuid references public.profiles(id) on delete set null,
  status text not null default 'DRAFT' check (status in ('DRAFT','SUBMITTED','VERIFIED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, academic_year_id, assessment_type_id)
);

create table public.practical_assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  marks numeric(6,2) not null check (marks >= 0 and marks <= 30),
  max_marks numeric(6,2) not null default 30 check (max_marks = 30),
  examiner_id uuid references public.profiles(id) on delete set null,
  exam_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, academic_year_id)
);

create table public.promotion_reviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  annual_total numeric(7,2),
  practical_score numeric(6,2),
  academic_requirement_met boolean not null default false,
  practical_requirement_met boolean not null default false,
  attendance_percentage numeric(5,2),
  homework_quality text,
  discipline_rating text,
  game_quality_rating text,
  coach_recommendation text,
  decision text check (decision is null or decision in ('PROMOTE','PROMOTE_WITH_SUPPORT','REPEAT_SELECTED_MODULES','REPEAT_YEAR')),
  review_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, academic_year_id)
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text unique not null,
  verification_token text unique not null,
  student_id uuid not null references public.students(id) on delete restrict,
  promotion_review_id uuid not null references public.promotion_reviews(id) on delete restrict,
  academic_year smallint not null check (academic_year between 1 and 6),
  stage_name text not null,
  annual_score numeric(7,2) not null,
  practical_score numeric(6,2) not null,
  issued_at timestamptz not null default now(),
  issued_by uuid references public.profiles(id) on delete set null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','REVOKED','SUPERSEDED')),
  pdf_path text,
  created_at timestamptz not null default now()
);

create table public.certificate_events (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.certificates(id) on delete cascade,
  event_type text not null check (event_type in ('ISSUED','VIEWED','VERIFIED','REVOKED','REISSUED')),
  performed_by uuid references public.profiles(id) on delete set null,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_students_academy on public.students(academy_id);
create index idx_batches_academy on public.batches(academy_id);
create index idx_enrollments_student on public.enrollments(student_id);
create index idx_attendance_student on public.attendance(student_id);
create index idx_progress_student on public.lesson_progress(student_id);
create index idx_assessments_student_year on public.assessments(student_id, academic_year_id);
create index idx_certificates_student on public.certificates(student_id);
create index idx_certificates_token on public.certificates(verification_token);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger students_touch_updated_at before update on public.students
for each row execute function public.touch_updated_at();
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger assessments_touch_updated_at before update on public.assessments
for each row execute function public.touch_updated_at();
create trigger practical_touch_updated_at before update on public.practical_assessments
for each row execute function public.touch_updated_at();
create trigger promotion_touch_updated_at before update on public.promotion_reviews
for each row execute function public.touch_updated_at();
create trigger progress_touch_updated_at before update on public.lesson_progress
for each row execute function public.touch_updated_at();
create trigger academies_touch_updated_at before update on public.academies
for each row execute function public.touch_updated_at();
