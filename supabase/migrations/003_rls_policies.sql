-- 003_rls_policies.sql

create or replace function public.is_academy_member(target_academy uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_members m
    where m.academy_id = target_academy
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
  );
$$;

create or replace function public.has_academy_role(target_academy uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_members m
    where m.academy_id = target_academy
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and m.role = any(allowed_roles)
  );
$$;

alter table public.academies enable row level security;
alter table public.profiles enable row level security;
alter table public.academy_members enable row level security;
alter table public.coaches enable row level security;
alter table public.batches enable row level security;
alter table public.students enable row level security;
alter table public.academic_years enable row level security;
alter table public.enrollments enable row level security;
alter table public.classes enable row level security;
alter table public.attendance enable row level security;
alter table public.curriculum_years enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.assessment_types enable row level security;
alter table public.assessments enable row level security;
alter table public.practical_assessments enable row level security;
alter table public.promotion_rules enable row level security;
alter table public.promotion_reviews enable row level security;
alter table public.certificates enable row level security;
alter table public.certificate_events enable row level security;

-- Profiles: users can read/update their own profile; academy staff can read profiles they need.
create policy profiles_self_select on public.profiles for select
using (id = auth.uid());

create policy profiles_self_update on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Academy membership: members can see their own memberships.
create policy academy_members_self_select on public.academy_members for select
using (user_id = auth.uid());

-- Academy
create policy academies_member_select on public.academies for select
using (public.is_academy_member(id));

create policy academies_admin_update on public.academies for update
using (public.has_academy_role(id, array['OWNER','ADMIN']))
with check (public.has_academy_role(id, array['OWNER','ADMIN']));

-- Staff-owned academy tables
create policy coaches_member_select on public.coaches for select
using (public.is_academy_member(academy_id));
create policy coaches_admin_write on public.coaches for all
using (public.has_academy_role(academy_id, array['OWNER','ADMIN']))
with check (public.has_academy_role(academy_id, array['OWNER','ADMIN']));

create policy batches_member_select on public.batches for select
using (public.is_academy_member(academy_id));
create policy batches_admin_write on public.batches for all
using (public.has_academy_role(academy_id, array['OWNER','ADMIN']))
with check (public.has_academy_role(academy_id, array['OWNER','ADMIN']));

create policy students_member_select on public.students for select
using (public.is_academy_member(academy_id));
create policy students_staff_write on public.students for all
using (public.has_academy_role(academy_id, array['OWNER','ADMIN','COACH','STAFF']))
with check (public.has_academy_role(academy_id, array['OWNER','ADMIN','COACH','STAFF']));

create policy academic_years_member_select on public.academic_years for select
using (public.is_academy_member(academy_id));
create policy academic_years_admin_write on public.academic_years for all
using (public.has_academy_role(academy_id, array['OWNER','ADMIN']))
with check (public.has_academy_role(academy_id, array['OWNER','ADMIN']));

create policy enrollments_member_select on public.enrollments for select
using (exists (
  select 1 from public.students s
  where s.id = student_id and public.is_academy_member(s.academy_id)
));
create policy enrollments_staff_write on public.enrollments for all
using (exists (
  select 1 from public.students s
  where s.id = student_id and public.has_academy_role(s.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
))
with check (exists (
  select 1 from public.students s
  where s.id = student_id and public.has_academy_role(s.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
));

create policy classes_member_select on public.classes for select
using (exists (
  select 1 from public.batches b
  where b.id = batch_id and public.is_academy_member(b.academy_id)
));
create policy classes_staff_write on public.classes for all
using (exists (
  select 1 from public.batches b
  where b.id = batch_id and public.has_academy_role(b.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
))
with check (exists (
  select 1 from public.batches b
  where b.id = batch_id and public.has_academy_role(b.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
));

create policy attendance_member_select on public.attendance for select
using (exists (
  select 1
  from public.classes c
  join public.batches b on b.id = c.batch_id
  where c.id = class_id and public.is_academy_member(b.academy_id)
));
create policy attendance_staff_write on public.attendance for all
using (exists (
  select 1
  from public.classes c
  join public.batches b on b.id = c.batch_id
  where c.id = class_id and public.has_academy_role(b.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
))
with check (exists (
  select 1
  from public.classes c
  join public.batches b on b.id = c.batch_id
  where c.id = class_id and public.has_academy_role(b.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
));

-- Curriculum is public academic content, but writes are restricted to admins.
create policy curriculum_years_authenticated_select on public.curriculum_years for select
using (auth.uid() is not null);
create policy lessons_authenticated_select on public.lessons for select
using (auth.uid() is not null);
create policy assessment_types_authenticated_select on public.assessment_types for select
using (auth.uid() is not null);
create policy promotion_rules_authenticated_select on public.promotion_rules for select
using (auth.uid() is not null);

create policy curriculum_years_admin_write on public.curriculum_years for all
using (exists (
  select 1 from public.academy_members m
  where m.user_id = auth.uid() and m.status='ACTIVE' and m.role in ('OWNER','ADMIN')
))
with check (exists (
  select 1 from public.academy_members m
  where m.user_id = auth.uid() and m.status='ACTIVE' and m.role in ('OWNER','ADMIN')
));

create policy lessons_admin_write on public.lessons for all
using (exists (
  select 1 from public.academy_members m
  where m.user_id = auth.uid() and m.status='ACTIVE' and m.role in ('OWNER','ADMIN')
))
with check (exists (
  select 1 from public.academy_members m
  where m.user_id = auth.uid() and m.status='ACTIVE' and m.role in ('OWNER','ADMIN')
));

create policy progress_member_select on public.lesson_progress for select
using (exists (
  select 1 from public.students s where s.id = student_id and public.is_academy_member(s.academy_id)
));
create policy progress_staff_write on public.lesson_progress for all
using (exists (
  select 1 from public.students s where s.id = student_id and public.has_academy_role(s.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
))
with check (exists (
  select 1 from public.students s where s.id = student_id and public.has_academy_role(s.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
));

create policy assessments_member_select on public.assessments for select
using (exists (
  select 1 from public.students s where s.id = student_id and public.is_academy_member(s.academy_id)
));
create policy assessments_staff_write on public.assessments for all
using (exists (
  select 1 from public.students s where s.id = student_id and public.has_academy_role(s.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
))
with check (exists (
  select 1 from public.students s where s.id = student_id and public.has_academy_role(s.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
));

create policy practical_member_select on public.practical_assessments for select
using (exists (
  select 1 from public.students s where s.id = student_id and public.is_academy_member(s.academy_id)
));
create policy practical_staff_write on public.practical_assessments for all
using (exists (
  select 1 from public.students s where s.id = student_id and public.has_academy_role(s.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
))
with check (exists (
  select 1 from public.students s where s.id = student_id and public.has_academy_role(s.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
));

create policy promotion_member_select on public.promotion_reviews for select
using (exists (
  select 1 from public.students s where s.id = student_id and public.is_academy_member(s.academy_id)
));
create policy promotion_staff_write on public.promotion_reviews for all
using (exists (
  select 1 from public.students s where s.id = student_id and public.has_academy_role(s.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
))
with check (exists (
  select 1 from public.students s where s.id = student_id and public.has_academy_role(s.academy_id, array['OWNER','ADMIN','COACH','STAFF'])
));

-- Certificates are private to academy members in the dashboard.
create policy certificates_member_select on public.certificates for select
using (exists (
  select 1 from public.students s where s.id = student_id and public.is_academy_member(s.academy_id)
));
create policy certificate_events_member_select on public.certificate_events for select
using (exists (
  select 1
  from public.certificates c
  join public.students s on s.id = c.student_id
  where c.id = certificate_id and public.is_academy_member(s.academy_id)
));

-- Certificate writes will be performed by a controlled server-side function.
-- Do not create client-side insert/update/delete policies here.

-- Restrict grants for public verification to a dedicated RPC/function added later.
revoke all on public.certificates from anon;
revoke all on public.certificate_events from anon;
