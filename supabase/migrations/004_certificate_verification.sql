-- 004_certificate_verification.sql

-- Public verification exposes only intentionally public fields.
create or replace function public.verify_certificate(p_token text)
returns table (
  certificate_number text,
  student_name text,
  stage_name text,
  academic_year smallint,
  annual_score numeric,
  practical_score numeric,
  issued_at timestamptz,
  status text,
  academy_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.certificate_number,
    concat_ws(' ', s.first_name, s.last_name),
    c.stage_name,
    c.academic_year,
    c.annual_score,
    c.practical_score,
    c.issued_at,
    c.status,
    a.name
  from public.certificates c
  join public.students s on s.id = c.student_id
  join public.academies a on a.id = s.academy_id
  where c.verification_token = p_token;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
