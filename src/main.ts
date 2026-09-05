import './styles/global.css';
import { supabase } from './lib/supabase';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App container not found.');
}

type Student = {
  id: string;
  academy_id: string;
  student_code: string;
  first_name: string;
  last_name: string | null;
  date_of_birth: string | null;
  parent_name: string | null;
  parent_contact: string | null;
  joining_date: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'LEFT' | 'GRADUATED';
  current_year: number;
};

type Lesson = {
  id: string;
  curriculum_year_id: string;
  week_number: number;
  title: string;
  description: string | null;
  objective: string | null;
  key_terms: string[] | null;
  teaching_example: string | null;
  guided_exercises: string | null;
  practical_task: string | null;
  homework: string | null;
  expected_outcome: string | null;
  year_number?: number;
};

type LessonProgress = {
  id?: string; student_id: string; lesson_id: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REQUIRES_REVIEW';
  mastery_level: 'DEVELOPING' | 'SECURE' | 'INDEPENDENT' | null;
  completed_at: string | null; coach_note: string | null;
};

let students: Student[] = [];
let academyId = '';
let currentView = 'dashboard';
let selectedStudentId = '';
let progressYear = 1;
let lessons: Lesson[] = [];
let lessonProgress: Record<string, LessonProgress> = {};


type AcademicYear = {
  id: string;
  academy_id: string;
  year_label: string;
  starts_on: string | null;
  ends_on: string | null;
  status: 'PLANNED' | 'OPEN' | 'CLOSED';
};

type AssessmentType = {
  id: string;
  code: string;
  name: string;
  max_marks: number;
  timing: string | null;
};

type AssessmentRecord = {
  id?: string;
  student_id: string;
  academic_year_id: string;
  assessment_type_id: string;
  marks: number;
  exam_date: string | null;
  entered_by: string | null;
  verified_by: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED';
};

type PracticalAssessment = {
  id?: string;
  student_id: string;
  academic_year_id: string;
  marks: number;
  max_marks: number;
  examiner_id: string | null;
  exam_date: string | null;
  notes: string | null;
};

let academicYears: AcademicYear[] = [];
let assessmentTypes: AssessmentType[] = [];
let assessmentRecords: AssessmentRecord[] = [];
let practicalAssessment: PracticalAssessment | null = null;
let selectedAssessmentStudentId = '';
let selectedAssessmentYear = 0;

const assessmentOrder = ['CP1', 'MID', 'CP2', 'FINAL', 'HOMEWORK'];

async function loadAcademicYears() {
  const { data, error } = await supabase
    .from('academic_years')
    .select('id, academy_id, year_label, starts_on, ends_on, status')
    .eq('academy_id', academyId)
    .order('year_label', { ascending: false });

  if (error) throw new Error(error.message);

  academicYears = (data ?? []) as AcademicYear[];

  if (!academicYears.length) {
    const { data: created, error: createError } = await supabase
      .from('academic_years')
      .insert({
        academy_id: academyId,
        year_label: '2026-2027',
        status: 'OPEN',
      })
      .select('id, academy_id, year_label, starts_on, ends_on, status')
      .single();

    if (createError) throw new Error(createError.message);
    academicYears = [created as AcademicYear];
  }
}

async function loadAssessmentTypes() {
  const { data, error } = await supabase
    .from('assessment_types')
    .select('id, code, name, max_marks, timing');

  if (error) throw new Error(error.message);

  assessmentTypes = ((data ?? []) as AssessmentType[]).sort(
    (a, b) => assessmentOrder.indexOf(a.code) - assessmentOrder.indexOf(b.code)
  );
}

async function loadStudentAssessments(studentId: string, yearNumber: number) {
  if (!academicYears.length) await loadAcademicYears();

  const selectedYearRecord =
    academicYears.find((year) => year.year_label === `${yearNumber === 6 ? '2026-2027' : year.year_label}`) ??
    academicYears[0];

  // Assessment years are academy academic years. For now the UI uses the
  // selected academy academic year and the student's curriculum year separately.
  const academicYearId = selectedYearRecord.id;

  const { data, error } = await supabase
    .from('assessments')
    .select('id, student_id, academic_year_id, assessment_type_id, marks, exam_date, entered_by, verified_by, status, assessment_types(code, name, max_marks, timing)')
    .eq('student_id', studentId)
    .eq('academic_year_id', academicYearId);

  if (error) throw new Error(error.message);

  assessmentRecords = (data ?? []).map((row: any) => ({
    id: row.id,
    student_id: row.student_id,
    academic_year_id: row.academic_year_id,
    assessment_type_id: row.assessment_type_id,
    marks: Number(row.marks),
    exam_date: row.exam_date,
    entered_by: row.entered_by,
    verified_by: row.verified_by,
    status: row.status,
  })) as AssessmentRecord[];

  const { data: practical, error: practicalError } = await supabase
    .from('practical_assessments')
    .select('id, student_id, academic_year_id, marks, max_marks, examiner_id, exam_date, notes')
    .eq('student_id', studentId)
    .eq('academic_year_id', academicYearId)
    .maybeSingle();

  if (practicalError) throw new Error(practicalError.message);

  practicalAssessment = practical ? practical as PracticalAssessment : null;
  selectedAssessmentYear = yearNumber;
}

function currentAcademicYear(): AcademicYear | undefined {
  return academicYears[0];
}

function assessmentRecordFor(type: AssessmentType): AssessmentRecord | undefined {
  return assessmentRecords.find((record) => record.assessment_type_id === type.id);
}

function assessmentTotal(): number {
  return assessmentRecords.reduce((sum, record) => sum + Number(record.marks || 0), 0);
}

async function saveAssessment(type: AssessmentType, student: Student) {
  const year = currentAcademicYear();
  if (!year) throw new Error('No academic year is available.');

  const row = document.querySelector<HTMLElement>(`[data-assessment-row="${type.id}"]`);
  const marksInput = row?.querySelector<HTMLInputElement>('[data-assessment-marks]');
  const dateInput = row?.querySelector<HTMLInputElement>('[data-assessment-date]');
  const statusInput = row?.querySelector<HTMLSelectElement>('[data-assessment-status]');
  const button = row?.querySelector<HTMLButtonElement>('[data-save-assessment]');

  const rawMarks = marksInput?.value.trim() ?? '';
  const marks = Number(rawMarks);

  if (rawMarks === '' || !Number.isFinite(marks)) {
    window.alert(`Please enter marks for ${type.name}.`);
    return;
  }

  if (marks < 0 || marks > Number(type.max_marks)) {
    window.alert(`${type.name} must be between 0 and ${type.max_marks}.`);
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = 'Saving…';
  }

  const { data: userData } = await supabase.auth.getUser();

  const payload = {
    student_id: student.id,
    academic_year_id: year.id,
    assessment_type_id: type.id,
    marks,
    exam_date: dateInput?.value || null,
    entered_by: userData.user?.id ?? null,
    status: (statusInput?.value || 'DRAFT') as AssessmentRecord['status'],
  };

  const { data, error } = await supabase
    .from('assessments')
    .upsert(payload, { onConflict: 'student_id,academic_year_id,assessment_type_id' })
    .select('id, student_id, academic_year_id, assessment_type_id, marks, exam_date, entered_by, verified_by, status')
    .single();

  if (error) {
    if (button) {
      button.disabled = false;
      button.textContent = 'Save';
    }
    window.alert(`Unable to save assessment.\n\n${error.message}`);
    return;
  }

  const existing = assessmentRecords.findIndex(
    (record) => record.assessment_type_id === type.id
  );

  if (existing >= 0) assessmentRecords[existing] = data as AssessmentRecord;
  else assessmentRecords.push(data as AssessmentRecord);

  render();
}

async function savePracticalAssessment(student: Student) {
  const year = currentAcademicYear();
  if (!year) throw new Error('No academic year is available.');

  const marksInput = document.querySelector<HTMLInputElement>('#practical-marks');
  const dateInput = document.querySelector<HTMLInputElement>('#practical-date');
  const notesInput = document.querySelector<HTMLTextAreaElement>('#practical-notes');
  const button = document.querySelector<HTMLButtonElement>('#save-practical');

  const rawMarks = marksInput?.value.trim() ?? '';
  const marks = Number(rawMarks);

  if (rawMarks === '' || !Number.isFinite(marks) || marks < 0 || marks > 30) {
    window.alert('Practical board marks must be between 0 and 30.');
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = 'Saving…';
  }

  const { data: userData } = await supabase.auth.getUser();

  const payload = {
    student_id: student.id,
    academic_year_id: year.id,
    marks,
    max_marks: 30,
    examiner_id: userData.user?.id ?? null,
    exam_date: dateInput?.value || null,
    notes: notesInput?.value.trim() || null,
  };

  const { data, error } = await supabase
    .from('practical_assessments')
    .upsert(payload, { onConflict: 'student_id,academic_year_id' })
    .select('id, student_id, academic_year_id, marks, max_marks, examiner_id, exam_date, notes')
    .single();

  if (error) {
    if (button) {
      button.disabled = false;
      button.textContent = 'Save Practical Score';
    }
    window.alert(`Unable to save practical assessment.\n\n${error.message}`);
    return;
  }

  practicalAssessment = data as PracticalAssessment;
  render();
}

async function openAssessments(studentId?: string) {
  currentView = 'assessments';
  selectedAssessmentStudentId = studentId || selectedAssessmentStudentId || students[0]?.id || '';

  app.innerHTML = '<div class="loading-panel">Loading assessments…</div>';

  try {
    await loadAcademicYears();
    await loadAssessmentTypes();

    const student = students.find((item) => item.id === selectedAssessmentStudentId);
    if (student) {
      await loadStudentAssessments(student.id, student.current_year);
    }

    render();
  } catch (error) {
    app.innerHTML = `
      <div class="academy-shell">
        <main class="main-content">
          <section class="panel error-panel">
            <p class="eyebrow">ASSESSMENTS</p>
            <h2>Unable to load assessments</h2>
            <p>${escapeHtml(error instanceof Error ? error.message : 'Unable to load assessments.')}</p>
            <button class="primary-button" id="retry-assessments">Try Again</button>
          </section>
        </main>
      </div>
    `;
    document.querySelector('#retry-assessments')?.addEventListener('click', () => openAssessments(selectedAssessmentStudentId));
  }
}

function assessmentsView(): string {
  const student = students.find((item) => item.id === selectedAssessmentStudentId);
  const year = currentAcademicYear();
  const total = assessmentTotal();
  const practical = Number(practicalAssessment?.marks ?? 0);
  const allFiveEntered = assessmentTypes
    .filter((type) => assessmentOrder.includes(type.code))
    .every((type) => assessmentRecordFor(type));

  if (!student) {
    return `
      <header class="topbar"><div><p class="eyebrow">ACADEMY MANAGEMENT</p><h2>Assessments</h2></div></header>
      <section class="panel empty-state">
        <div class="empty-icon">✓</div>
        <h3>No students available</h3>
        <p>Add a student first, then assessment records can be entered.</p>
        <button class="primary-button" data-action="students">View Students</button>
      </section>
    `;
  }

  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">ACADEMY MANAGEMENT</p>
        <h2>Assessments</h2>
      </div>
      <div class="admin-area">
        <div class="admin-avatar">EA</div>
        <div><strong>Academy Admin</strong><span>Assessment Entry</span></div>
      </div>
    </header>

    <section class="page-heading">
      <div>
        <p class="eyebrow">ANNUAL ASSESSMENT RECORD</p>
        <h3>${escapeHtml(studentName(student))}</h3>
        <p>${escapeHtml(student.student_code)} · Curriculum Year ${student.current_year}</p>
      </div>
      <button class="secondary-button" data-action="back-students">← Back to Students</button>
    </section>

    <section class="assessment-toolbar panel">
      <div>
        <label class="assessment-select-label">
          <span>Student</span>
          <select id="assessment-student">
            ${students.map((item) => `<option value="${item.id}" ${item.id === student.id ? 'selected' : ''}>${escapeHtml(studentName(item))} — ${escapeHtml(item.student_code)}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="assessment-year-box">
        <span>Academic Year</span>
        <strong>${escapeHtml(year?.year_label ?? 'Not set')}</strong>
      </div>
    </section>

    <section class="stats-grid student-stats">
      <article class="stat-card"><div class="stat-icon">Σ</div><div><span>ANNUAL ACADEMIC SCORE</span><strong>${total} / 275</strong><small>Five assessment components</small></div></article>
      <article class="stat-card"><div class="stat-icon">♙</div><div><span>PRACTICAL BOARD</span><strong>${practical} / 30</strong><small>Required for promotion</small></div></article>
      <article class="stat-card"><div class="stat-icon">✓</div><div><span>MARKS COMPLETE</span><strong>${allFiveEntered ? 'Yes' : 'No'}</strong><small>All five annual components</small></div></article>
      <article class="stat-card"><div class="stat-icon">★</div><div><span>PROMOTION THRESHOLD</span><strong>110 / 275</strong><small>Plus practical minimum</small></div></article>
    </section>

    <section class="panel assessments-panel">
      <div class="panel-header">
        <div><p class="eyebrow">275-MARK ANNUAL STRUCTURE</p><h3>Assessment Components</h3><p>Enter marks according to the EduChess academy assessment policy.</p></div>
        <span class="badge">275 Marks</span>
      </div>

      <div class="assessment-list">
        ${assessmentTypes.filter((type) => assessmentOrder.includes(type.code)).map((type) => {
          const record = assessmentRecordFor(type);
          return `
            <article class="assessment-row" data-assessment-row="${type.id}">
              <div class="assessment-main">
                <div class="assessment-title">
                  <div>
                    <span class="assessment-code">${escapeHtml(type.code)}</span>
                    <h4>${escapeHtml(type.name)}</h4>
                  </div>
                  <span class="badge">${type.max_marks} marks</span>
                </div>
                <p>${escapeHtml(type.timing ?? '')}</p>
              </div>

              <div class="assessment-fields">
                <label><span>Marks</span><input type="number" min="0" max="${type.max_marks}" step="0.5" data-assessment-marks value="${record ? record.marks : ''}" placeholder="0–${type.max_marks}"></label>
                <label><span>Date</span><input type="date" data-assessment-date value="${escapeHtml(record?.exam_date)}"></label>
                <label><span>Status</span><select data-assessment-status><option value="DRAFT" ${record?.status === 'DRAFT' || !record ? 'selected' : ''}>Draft</option><option value="SUBMITTED" ${record?.status === 'SUBMITTED' ? 'selected' : ''}>Submitted</option><option value="VERIFIED" ${record?.status === 'VERIFIED' ? 'selected' : ''}>Verified</option></select></label>
                <button class="primary-button assessment-save" data-save-assessment type="button">Save</button>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </section>

    <section class="panel practical-assessment-panel">
      <div class="panel-header">
        <div><p class="eyebrow">PRACTICAL BOARD</p><h3>Practical Assessment</h3><p>Maximum 30 marks. Year-specific minimums are applied later by Promotion.</p></div>
        <span class="badge">30 Marks</span>
      </div>

      <div class="practical-form">
        <label><span>Practical Board Marks</span><input id="practical-marks" type="number" min="0" max="30" step="0.5" value="${practicalAssessment ? practicalAssessment.marks : ''}" placeholder="0–30"></label>
        <label><span>Exam Date</span><input id="practical-date" type="date" value="${escapeHtml(practicalAssessment?.exam_date)}"></label>
        <label class="practical-notes"><span>Examiner Notes</span><textarea id="practical-notes" rows="3" placeholder="Record practical observations…">${escapeHtml(practicalAssessment?.notes)}</textarea></label>
        <button class="primary-button" id="save-practical" type="button">Save Practical Score</button>
      </div>
    </section>

    <section class="panel assessment-policy-panel">
      <div class="panel-header"><div><p class="eyebrow">ACADEMY POLICY</p><h3>Assessment Structure</h3></div></div>
      <div class="policy-grid">
        <div><strong>Checkpoint 1</strong><span>Week 10 · 25 marks</span></div>
        <div><strong>Mid-Year Examination</strong><span>Week 20 · 100 marks</span></div>
        <div><strong>Checkpoint 2</strong><span>Week 30 · 25 marks</span></div>
        <div><strong>Final Examination</strong><span>Weeks 37–40 · 100 marks</span></div>
        <div><strong>Homework & Class Performance</strong><span>Continuous · 25 marks</span></div>
      </div>
    </section>
  `;
}

const curriculumYears = [
  ['Foundation', 'Rules, board vision, simple tactics and basic mates'],
  ['Early Development', 'Pattern growth, opening logic and attack basics'],
  ['Core Competitive', 'Thinking process, candidate moves and rook endings'],
  ['Competitive Intermediate', 'Planning, positional play and practical skill'],
  ['Advanced Club', 'Prophylaxis, imbalances and advanced practical play'],
  ['Academy Mastery', 'Independent training, preparation and capstone analysis'],
];

async function getAcademyId(): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You are not signed in.');
  }

  const { data, error } = await supabase
    .from('academy_members')
    .select('academy_id')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.academy_id) {
    throw new Error('No active academy membership was found for this account.');
  }

  return data.academy_id;
}

async function loadStudents() {
  academyId = await getAcademyId();

  const { data, error } = await supabase
    .from('students')
    .select(`
      id,
      academy_id,
      student_code,
      first_name,
      last_name,
      date_of_birth,
      parent_name,
      parent_contact,
      joining_date,
      status,
      current_year
    `)
    .eq('academy_id', academyId)
    .order('first_name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  students = (data ?? []) as Student[];
}

async function loadCurriculumLessons() {
  const { data, error } = await supabase.from('lessons').select(`
    id, curriculum_year_id, week_number, title, description, objective,
    key_terms, teaching_example, guided_exercises, practical_task,
    homework, expected_outcome, curriculum_years!inner(year_number)
  `).eq('active', true).order('week_number', { ascending: true });
  if (error) throw new Error(error.message);
  lessons = (data ?? []).map((row: any) => ({
    ...row,
    year_number: row.curriculum_years?.year_number ?? 1,
  })) as Lesson[];
}

async function loadStudentProgress(studentId: string) {
  const { data, error } = await supabase.from('lesson_progress')
    .select('id, student_id, lesson_id, status, mastery_level, completed_at, coach_note')
    .eq('student_id', studentId);
  if (error) throw new Error(error.message);
  lessonProgress = {};
  for (const row of (data ?? []) as LessonProgress[]) lessonProgress[row.lesson_id] = row;
}

function selectedStudent(): Student | undefined {
  return students.find((student) => student.id === selectedStudentId);
}

function lessonsForYear(year: number): Lesson[] {
  return lessons.filter((lesson) => lesson.year_number === year);
}

function progressCounts(year: number) {
  const yearLessons = lessonsForYear(year);
  return {
    total: yearLessons.length,
    completed: yearLessons.filter((l) => lessonProgress[l.id]?.status === 'COMPLETED').length,
    inProgress: yearLessons.filter((l) => lessonProgress[l.id]?.status === 'IN_PROGRESS').length,
    review: yearLessons.filter((l) => lessonProgress[l.id]?.status === 'REQUIRES_REVIEW').length,
  };
}

async function openStudentProgress(student: Student) {
  selectedStudentId = student.id;
  progressYear = progressYear || student.current_year;
  currentView = 'student-progress';
  app.innerHTML = '<div class="loading-panel">Loading curriculum progress…</div>';
  try {
    if (!lessons.length) await loadCurriculumLessons();
    await loadStudentProgress(student.id);
    render();
  } catch (error) {
    app.innerHTML = `<div class="error-panel"><h2>Unable to load curriculum</h2><p>${escapeHtml(error instanceof Error ? error.message : 'Unable to load curriculum progress.')}</p><button class="primary-button" id="retry-progress">Try Again</button></div>`;
    document.querySelector('#retry-progress')?.addEventListener('click', () => openStudentProgress(student));
  }
}

async function saveLessonProgress(lesson: Lesson, student: Student) {
  const row = document.querySelector<HTMLElement>(`[data-lesson-row="${lesson.id}"]`);
  const status = row?.querySelector<HTMLSelectElement>('[data-progress-status]')?.value as LessonProgress['status'] | undefined;
  const mastery = row?.querySelector<HTMLSelectElement>('[data-progress-mastery]')?.value ?? '';
  const note = row?.querySelector<HTMLTextAreaElement>('[data-progress-note]')?.value.trim() ?? '';
  const button = row?.querySelector<HTMLButtonElement>('[data-save-progress]');
  if (!status) return;
  if (button) { button.disabled = true; button.textContent = 'Saving…'; }
  const values = {
    student_id: student.id, lesson_id: lesson.id, status,
    mastery_level: mastery || null,
    completed_at: status === 'COMPLETED' ? new Date().toISOString() : null,
    coach_note: note || null,
  };
  const { data, error } = await supabase.from('lesson_progress')
    .upsert(values, { onConflict: 'student_id,lesson_id' })
    .select('id, student_id, lesson_id, status, mastery_level, completed_at, coach_note')
    .single();
  if (error) {
    if (button) { button.disabled = false; button.textContent = 'Save'; }
    window.alert(`Unable to save lesson progress.\n\n${error.message}`);
    return;
  }
  lessonProgress[lesson.id] = data as LessonProgress;
  render();
}

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function studentName(student: Student): string {
  return `${student.first_name} ${student.last_name ?? ''}`.trim();
}

function statusClass(status: Student['status']): string {
  return status.toLowerCase();
}

function dashboardView(): string {
  const activeStudents = students.filter((s) => s.status === 'ACTIVE').length;
  const pausedStudents = students.filter((s) => s.status === 'PAUSED').length;
  const graduatedStudents = students.filter((s) => s.status === 'GRADUATED').length;
  const currentYear = academicYears[0]?.year_label ?? '2026-2027';

  const yearCounts = [1, 2, 3, 4, 5, 6].map((year) => ({
    year,
    name: curriculumYears[year - 1][0],
    description: curriculumYears[year - 1][1],
    students: students.filter((s) => s.status === 'ACTIVE' && s.current_year === year).length,
  }));

  return `
    <header class="topbar reference-topbar">
      <div class="topbar-heading">
        <h2>Dashboard</h2>
        <span>Academy Management</span>
      </div>

      <div class="topbar-brand">
        <div class="topbar-brand-mark">♞</div>
        <div><strong>EduChess</strong><span>ACADEMY</span></div>
      </div>

      <div class="topbar-actions">
        <div class="admin-profile">
          <div class="admin-avatar">EA</div>
          <div class="admin-copy">
            <strong>Academy Admin</strong>
            <span>Administrator</span>
          </div>
          <span class="admin-chevron">⌄</span>
        </div>
        <button class="notification-button" type="button" aria-label="Notifications">
          ♟<span class="notification-count">3</span>
        </button>
      </div>
    </header>

    <div class="reference-dashboard">
      <section class="reference-hero">
        <div>
          <p class="reference-eyebrow">WELCOME BACK</p>
          <h1>Welcome back, Academy Admin</h1>
          <p>Monitor student learning, curriculum progress, assessments and promotion readiness from one place.</p>
          <div class="academic-year-badge">▣ <strong>ACADEMIC YEAR ${escapeHtml(currentYear)}</strong></div>
        </div>
        <div class="hero-chess-watermark" aria-hidden="true">♟ ♞ ♜</div>
      </section>

      <section class="reference-metrics">
        <article class="reference-metric-card">
          <div class="metric-card-title">OVERALL STUDENT<br>PROGRESS</div>
          <div class="donut-wrap">
            <div class="donut"><span>${students.length ? '0%' : '0%'}</span></div>
          </div>
          <strong class="metric-big">${activeStudents} / ${students.length}</strong>
          <span class="metric-sub">Students on Track</span>
        </article>

        <article class="reference-metric-card topic-card">
          <div class="metric-card-title">TOP LESSON TOPICS</div>
          <div class="topic-icons">
            <span>♜<small>Rooks</small></span>
            <span>♞<small>Pawns</small></span>
            <span>◕<small>Endings</small></span>
            <span>✣<small>Tactics</small></span>
          </div>
          <div class="topic-line"><span></span></div>
          <p>Rook Endings <b>Academy focus</b></p>
          <div class="topic-line soft"><span></span></div>
          <p>Pins &amp; Skewers <b>Core tactics</b></p>
        </article>

        <article class="reference-metric-card assessment-mini-card">
          <div class="metric-card-title">ASSESSMENT SCORES</div>
          <div class="empty-chart">
            <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
            <div class="chart-bars">
              <i style="height:18%"></i><i style="height:28%"></i><i style="height:12%"></i><i style="height:22%"></i><i style="height:15%"></i>
            </div>
          </div>
          <div class="chart-labels"><span>CP1</span><span>CP2</span><span>Mid-Year</span><span>Final</span></div>
          <small>Assessment records will appear here</small>
        </article>

        <article class="reference-metric-card completion-card">
          <div class="metric-card-title">CURRICULUM COMPLETION</div>
          <div class="completion-row"><strong>Year 1</strong><span>0%</span></div>
          <div class="completion-track"><span style="width:0%"></span></div>
          <div class="completion-row"><strong>Year 2</strong><span>0%</span></div>
          <div class="completion-track"><span style="width:0%"></span></div>
          <div class="completion-row"><strong>Year 3</strong><span>0%</span></div>
          <div class="completion-track"><span style="width:0%"></span></div>
          <button class="reference-link" data-action="curriculum">View Curriculum <span>→</span></button>
        </article>
      </section>

      <section class="reference-main-grid">
        <article class="reference-panel progress-tracker-panel">
          <div class="reference-panel-header">
            <div>
              <p class="reference-eyebrow">STUDENT PROGRESS TRACKER</p>
              <h2>Student Progress Tracker</h2>
            </div>
            <button class="reference-link" data-action="students">View all students <span>→</span></button>
          </div>

          ${
            students.length
              ? `<div class="progress-table">
                  <div class="progress-table-head">
                    <span>Student</span><span>Year</span><span>Current Lesson</span><span>Progress</span><span>Latest Score</span>
                  </div>
                  ${students.slice(0, 5).map((student) => `
                    <div class="progress-table-row">
                      <div class="progress-student">
                        <div class="student-avatar">${escapeHtml(student.first_name.charAt(0))}</div>
                        <div><strong>${escapeHtml(studentName(student))}</strong><small>Curriculum Year</small></div>
                      </div>
                      <span>Year ${student.current_year}</span>
                      <span>Not started</span>
                      <div class="mini-progress"><span style="width:0%"></span><small>0 / 40</small></div>
                      <strong class="score-placeholder">—</strong>
                    </div>
                  `).join('')}
                </div>`
              : `<div class="reference-empty">
                  <div class="empty-chess">♞</div>
                  <h3>No students yet</h3>
                  <p>Add your first student to begin tracking academy progress.</p>
                  <button class="reference-gold-button" data-action="add-student">+ Add Student</button>
                </div>`
          }
        </article>

        <div class="reference-side-stack">
          <article class="reference-panel achievements-panel">
            <div class="reference-panel-header">
              <div>
                <p class="reference-eyebrow">ACADEMY</p>
                <h2>Recent Achievements</h2>
              </div>
            </div>
            <div class="achievement-grid">
              <div><span class="achievement-icon gold">♜</span><span>Completed<br>Foundation</span></div>
              <div><span class="achievement-icon gold">✦</span><span>Perfect<br>Attendance</span></div>
              <div><span class="achievement-icon green">✓</span><span>Assessment<br>Verified</span></div>
              <div><span class="achievement-icon blue">★</span><span>Independent<br>Mastery</span></div>
            </div>
            <button class="reference-link" data-action="reports">View all achievements <span>→</span></button>
          </article>

          <article class="reference-panel reminders-panel">
            <div class="reference-panel-header">
              <div>
                <p class="reference-eyebrow">ACADEMY CALENDAR</p>
                <h2>Upcoming Reminders</h2>
              </div>
            </div>
            <div class="reminder-row"><span>▣</span><strong>Checkpoint 1 Assessments</strong><small>Week 10</small></div>
            <div class="reminder-row"><span>▣</span><strong>Mid-Year Examinations</strong><small>Week 20</small></div>
            <button class="reference-link" data-action="record-assessment">Open Assessments <span>→</span></button>
          </article>
        </div>
      </section>

      <section class="reference-footer-strip">
        <div>
          <span class="reference-eyebrow">PROGRAMME OVERVIEW</span>
          <strong>Six-Year Academy Programme</strong>
          <small>240 structured weekly lessons</small>
        </div>
        <div class="year-pills">
          ${yearCounts.map((item) => `
            <button class="year-pill ${item.year === 1 ? 'current' : ''}" data-action="curriculum">
              <span>${String(item.year).padStart(2, '0')}</span>${escapeHtml(item.name)}
            </button>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

function studentsView(): string {
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">ACADEMY MANAGEMENT</p>
        <h2>Students</h2>
      </div>

      <div class="admin-area">
        <div class="admin-avatar">EA</div>
        <div>
          <strong>Academy Admin</strong>
          <span>Administrator</span>
        </div>
      </div>
    </header>

    <section class="page-heading">
      <div>
        <p class="eyebrow">STUDENT MANAGEMENT</p>
        <h3>Student Records</h3>
        <p>
          Manage enrollment, student profiles and academic progression.
        </p>
      </div>

      <button class="primary-button" data-action="add-student">
        ＋ Add Student
      </button>
    </section>

    <section class="stats-grid student-stats">

      <article class="stat-card">
        <div class="stat-icon">♙</div>
        <div>
          <span>TOTAL STUDENTS</span>
          <strong>${students.length}</strong>
          <small>All records</small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon">●</div>
        <div>
          <span>ACTIVE</span>
          <strong>${students.filter((s) => s.status === 'ACTIVE').length}</strong>
          <small>Currently enrolled</small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon">◷</div>
        <div>
          <span>PAUSED</span>
          <strong>${students.filter((s) => s.status === 'PAUSED').length}</strong>
          <small>Temporarily paused</small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon">🎓</div>
        <div>
          <span>GRADUATED</span>
          <strong>${students.filter((s) => s.status === 'GRADUATED').length}</strong>
          <small>Completed academy</small>
        </div>
      </article>

    </section>

    <section class="panel students-panel">

      <div class="panel-header">
        <div>
          <p class="eyebrow">ENROLLMENT REGISTER</p>
          <h3>All Students</h3>
        </div>

        <div class="student-tools">
          <input
            id="student-search"
            type="search"
            placeholder="Search students..."
          />

          <select id="student-status">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="LEFT">Left</option>
            <option value="GRADUATED">Graduated</option>
          </select>
        </div>
      </div>

      <div id="student-table-container">
        ${renderStudentTable()}
      </div>

    </section>

    <footer class="footer">
      <span>EduChess Academy OS</span>
      <span>Student Management</span>
    </footer>
  `;
}

function renderStudentTable(): string {
  if (!students.length) {
    return `
      <div class="empty-state">
        <div class="empty-icon">♙</div>
        <h3>No students yet</h3>
        <p>
          Your academy has no student records yet.
          Add your first student to begin.
        </p>
        <button class="primary-button" data-action="add-student">
          ＋ Add First Student
        </button>
      </div>
    `;
  }

  return `
    <div class="table-wrapper">
      <table class="student-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Student ID</th>
            <th>Parent / Guardian</th>
            <th>Year</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody id="student-table-body">
          ${students.map((student) => `
            <tr
              data-student-name="${escapeHtml(
                `${student.first_name} ${student.last_name ?? ''}`
              ).toLowerCase()}"
              data-student-status="${student.status}"
            >
              <td>
                <div class="student-name-cell">
                  <div class="student-avatar">
                    ${escapeHtml(student.first_name.charAt(0).toUpperCase())}
                  </div>
                  <div>
                    <strong>${escapeHtml(studentName(student))}</strong>
                    <span>${student.joining_date ? `Joined ${student.joining_date}` : 'Joining date not set'}</span>
                  </div>
                </div>
              </td>

              <td>
                <span class="student-code">${escapeHtml(student.student_code)}</span>
              </td>

              <td>
                ${escapeHtml(student.parent_name) || '<span class="muted">Not provided</span>'}
              </td>

              <td>
                <span class="year-pill">Year ${student.current_year}</span>
              </td>

              <td>
                <span class="status-pill ${statusClass(student.status)}">
                  ${student.status}
                </span>
              </td>

              <td>
                <div class="row-actions">
                  <button
                    class="row-button"
                    data-student-id="${student.id}"
                    data-action="progress-student"
                  >
                    Progress
                  </button>

                  <button
                    class="row-button"
                    data-student-id="${student.id}"
                    data-action="edit-student"
                  >
                    Edit
                  </button>

                  <button
                    class="row-button danger-button"
                    data-student-id="${student.id}"
                    data-action="delete-student"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function studentProgressView(student: Student): string {
  const counts = progressCounts(progressYear);
  const percent = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;
  const yearLessons = lessonsForYear(progressYear);
  const yearName = curriculumYears[progressYear - 1]?.[0] ?? `Year ${progressYear}`;
  return `
    <header class="topbar"><div><p class="eyebrow">STUDENT LEARNING</p><h2>Curriculum Progress</h2></div><div class="admin-area"><div class="admin-avatar">EA</div><div><strong>Academy Admin</strong><span>Administrator</span></div></div></header>
    <section class="page-heading"><div><p class="eyebrow">${escapeHtml(student.student_code)}</p><h3>${escapeHtml(studentName(student))}</h3><p>${escapeHtml(yearName)} · Current Year ${student.current_year}</p></div><button class="secondary-button" data-action="back-students">← Back to Students</button></section>
    <section class="stats-grid student-stats">
      <article class="stat-card"><div class="stat-icon">▤</div><div><span>YEAR ${progressYear} LESSONS</span><strong>${counts.completed} / ${counts.total}</strong><small>Completed</small></div></article>
      <article class="stat-card"><div class="stat-icon">%</div><div><span>YEAR PROGRESS</span><strong>${percent}%</strong><small>${escapeHtml(yearName)}</small></div></article>
      <article class="stat-card"><div class="stat-icon">→</div><div><span>IN PROGRESS</span><strong>${counts.inProgress}</strong><small>Lessons developing</small></div></article>
      <article class="stat-card"><div class="stat-icon">!</div><div><span>REQUIRES REVIEW</span><strong>${counts.review}</strong><small>Needs coach attention</small></div></article>
    </section>
    <section class="panel curriculum-progress-panel">
      <div class="panel-header"><div><p class="eyebrow">SIX-YEAR CURRICULUM</p><h3>Student Lesson Record</h3><p>Record lesson status, mastery and coach notes.</p></div><span class="badge">240 Lessons</span></div>
      <div class="curriculum-year-tabs">
        ${[1,2,3,4,5,6].map((year) => `<button class="curriculum-year-tab ${progressYear === year ? 'active' : ''}" data-progress-year="${year}"><strong>Year ${year}</strong><span>${escapeHtml(curriculumYears[year - 1][0])}</span></button>`).join('')}
      </div>
      <div class="progress-list">
        ${yearLessons.map((lesson) => {
          const progress = lessonProgress[lesson.id];
          const status = progress?.status ?? 'NOT_STARTED';
          const mastery = progress?.mastery_level ?? '';
          return `<article class="lesson-progress-row" data-lesson-row="${lesson.id}">
            <div class="lesson-number">${String(lesson.week_number).padStart(2,'0')}</div>
            <div class="lesson-main">
              <div class="lesson-title-line"><h4>Week ${lesson.week_number}: ${escapeHtml(lesson.title)}</h4><span class="status-pill ${status.toLowerCase().replaceAll('_','-')}">${status.replaceAll('_',' ')}</span></div>
              <p>${escapeHtml(lesson.description)}</p>
              ${lesson.objective ? `<div class="lesson-detail"><strong>Objective:</strong> ${escapeHtml(lesson.objective)}</div>` : ''}
              ${lesson.key_terms?.length ? `<div class="lesson-terms"><strong>Key terms:</strong> ${lesson.key_terms.map((term) => escapeHtml(term)).join(', ')}</div>` : ''}
              <div class="lesson-progress-controls">
                <label><span>Status</span><select data-progress-status>${['NOT_STARTED','IN_PROGRESS','COMPLETED','REQUIRES_REVIEW'].map((v) => `<option value="${v}" ${status === v ? 'selected' : ''}>${v.replaceAll('_',' ')}</option>`).join('')}</select></label>
                <label><span>Mastery</span><select data-progress-mastery><option value="">Not rated</option>${['DEVELOPING','SECURE','INDEPENDENT'].map((v) => `<option value="${v}" ${mastery === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
                <label class="lesson-note"><span>Coach note</span><textarea data-progress-note rows="2" placeholder="Add a short coaching note…">${escapeHtml(progress?.coach_note)}</textarea></label>
                <button class="primary-button save-progress-button" data-save-progress type="button">Save</button>
              </div>
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>
  `;
}

function studentFormModal(student?: Student): string {
  const editing = Boolean(student);
  const title = editing ? 'Edit Student' : 'Add New Student';
  const submitText = editing ? 'Save Changes' : 'Save Student';

  return `
    <div class="modal-overlay" id="student-modal" role="dialog" aria-modal="true">
      <div class="modal-card">

        <div class="modal-header">
          <div>
            <p class="eyebrow">STUDENT MANAGEMENT</p>
            <h3>${title}</h3>
          </div>

          <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">
            ×
          </button>
        </div>

        <form id="student-form">

          <div class="form-section">
            <h4>Student Information</h4>

            <div class="form-grid">

              <label>
                <span>First Name *</span>
                <input name="first_name" value="${escapeHtml(student?.first_name)}" required />
              </label>

              <label>
                <span>Last Name</span>
                <input name="last_name" value="${escapeHtml(student?.last_name)}" />
              </label>

              <label>
                <span>Date of Birth</span>
                <input name="date_of_birth" type="date" value="${escapeHtml(student?.date_of_birth)}" />
              </label>

              <label>
                <span>Joining Date</span>
                <input name="joining_date" type="date" value="${escapeHtml(student?.joining_date)}" />
              </label>

              <label>
                <span>Current Year *</span>
                <select name="current_year" required>
                  ${[1,2,3,4,5,6].map((year) => `
                    <option value="${year}" ${student?.current_year === year ? 'selected' : ''}>
                      Year ${year} — ${curriculumYears[year - 1][0]}
                    </option>
                  `).join('')}
                </select>
              </label>

              <label>
                <span>Status</span>
                <select name="status">
                  ${(['ACTIVE','PAUSED','LEFT','GRADUATED'] as Student['status'][]).map((status) => `
                    <option value="${status}" ${student?.status === status ? 'selected' : ''}>
                      ${status.charAt(0) + status.slice(1).toLowerCase()}
                    </option>
                  `).join('')}
                </select>
              </label>

            </div>
          </div>

          <div class="form-section">
            <h4>Parent / Guardian</h4>

            <div class="form-grid">

              <label>
                <span>Parent / Guardian Name</span>
                <input name="parent_name" value="${escapeHtml(student?.parent_name)}" />
              </label>

              <label>
                <span>Contact Number</span>
                <input name="parent_contact" type="tel" value="${escapeHtml(student?.parent_contact)}" />
              </label>

            </div>
          </div>

          <div id="form-error" class="form-error"></div>

          <div class="modal-actions">
            <button type="button" class="secondary-button" data-action="close-modal">
              Cancel
            </button>

            <button type="submit" class="primary-button">
              ${submitText}
            </button>
          </div>

        </form>
      </div>
    </div>
  `;
}

function nextStudentCode(): string {
  const year = new Date().getFullYear();
  const prefix = `ECA-${year}-`;
  const numbers = students
    .map((student) => student.student_code)
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number(code.slice(prefix.length)))
    .filter((number) => Number.isFinite(number) && number > 0);

  const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

async function saveStudent(form: HTMLFormElement, student?: Student) {
  const formData = new FormData(form);
  const firstName = String(formData.get('first_name') ?? '').trim();
  const lastName = String(formData.get('last_name') ?? '').trim();

  if (!firstName) {
    throw new Error('First name is required.');
  }

  const year = Number(formData.get('current_year') ?? 1);
  const status = String(formData.get('status') ?? 'ACTIVE') as Student['status'];

  const values = {
    first_name: firstName,
    last_name: lastName || null,
    date_of_birth: formData.get('date_of_birth') || null,
    parent_name: String(formData.get('parent_name') ?? '').trim() || null,
    parent_contact: String(formData.get('parent_contact') ?? '').trim() || null,
    joining_date: formData.get('joining_date') || null,
    status,
    current_year: year,
  };

  if (student) {
    const { data, error } = await supabase
      .from('students')
      .update(values)
      .eq('id', student.id)
      .eq('academy_id', academyId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const index = students.findIndex((item) => item.id === student.id);
    if (index >= 0) students[index] = data as Student;
  } else {
    const { data, error } = await supabase
      .from('students')
      .insert({
        academy_id: academyId,
        student_code: nextStudentCode(),
        ...values,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    students.push(data as Student);
  }

  students.sort((a, b) => a.first_name.localeCompare(b.first_name));
}

function showModal(student?: Student) {
  document.querySelector('#student-modal')?.remove();
  document.body.insertAdjacentHTML('beforeend', studentFormModal(student));

  const modal = document.querySelector<HTMLDivElement>('#student-modal');
  const card = modal?.querySelector<HTMLElement>('.modal-card');
  const form = document.querySelector<HTMLFormElement>('#student-form');

  // Close with X/Cancel, clicking the dark overlay, or Escape.
  modal?.querySelectorAll<HTMLElement>('[data-action="close-modal"]').forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  const escapeHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', escapeHandler, { once: true });

  form?.querySelector<HTMLInputElement>('[name="first_name"]')?.focus();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const errorBox = document.querySelector<HTMLDivElement>('#form-error');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = student ? 'Saving...' : 'Saving...';
    }

    if (errorBox) errorBox.textContent = '';

    try {
      await saveStudent(form, student);
      closeModal();
      render();
    } catch (error) {
      if (errorBox) {
        errorBox.textContent = error instanceof Error ? error.message : 'Unable to save student.';
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = student ? 'Save Changes' : 'Save Student';
      }
    }
  });

  // Keep the card reference intentionally used so focus/overlay behavior is reliable.
  void card;
}

async function deleteStudent(student: Student) {
  const name = studentName(student);
  const confirmed = window.confirm(
    `Delete ${name}?\n\nThis permanently removes the student record from the academy. This action cannot be undone.`
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', student.id)
    .eq('academy_id', academyId);

  if (error) {
    window.alert(`Unable to delete ${name}.\n\n${error.message}`);
    return;
  }

  students = students.filter((item) => item.id !== student.id);
  render();
}

function closeModal() {
  document.querySelector('#student-modal')?.remove();
}


function applyStudentFilters() {
  const search =
    document
      .querySelector<HTMLInputElement>('#student-search')
      ?.value.toLowerCase()
      .trim() ?? '';

  const status =
    document.querySelector<HTMLSelectElement>('#student-status')?.value ??
    'ALL';

  document
    .querySelectorAll<HTMLTableRowElement>('#student-table-body tr')
    .forEach((row) => {
      const name = row.dataset.studentName ?? '';
      const rowStatus = row.dataset.studentStatus ?? '';

      const matchesSearch = !search || name.includes(search);
      const matchesStatus = status === 'ALL' || rowStatus === status;

      row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

function render() {
  app.innerHTML = `
    <div class="academy-shell reference-shell">
      <aside class="sidebar reference-sidebar">
        <div class="reference-brand">
          <div class="reference-brand-mark">♞</div>
          <div><strong>EduChess</strong><span>ACADEMY OS</span></div>
        </div>

        <nav class="nav reference-nav">
          <button class="nav-item ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard"><span>⌂</span><span>Dashboard</span></button>
          <button class="nav-item ${currentView === 'students' ? 'active' : ''}" data-view="students"><span>♟</span><span>Students</span></button>
          <button class="nav-item ${currentView === 'student-progress' ? 'active' : ''}" data-view="curriculum"><span>▤</span><span>Curriculum</span></button>
          <button class="nav-item ${currentView === 'assessments' ? 'active' : ''}" data-view="assessments"><span>✓</span><span>Assessments</span></button>
          <button class="nav-item" data-view="attendance"><span>◷</span><span>Attendance</span></button>
          <button class="nav-item" data-view="promotion"><span>★</span><span>Promotion</span></button>
          <button class="nav-item" data-view="certificates"><span>⚑</span><span>Certificates</span></button>
          <button class="nav-item" data-view="reports"><span>▥</span><span>Reports</span></button>
        </nav>

        <div class="reference-sidebar-academy">
          <span class="crown">♛</span>
          <div><strong>EduChess Academy</strong><small>Professional Management System</small></div>
        </div>

        <div class="reference-sidebar-user">
          <div class="admin-avatar">EA</div>
          <div><strong>Academy Admin</strong><small>Administrator</small></div>
          <span>⌄</span>
        </div>
      </aside>

      <main class="main-content reference-main">
        ${
          currentView === 'students'
            ? studentsView()
            : currentView === 'student-progress' && selectedStudent()
              ? studentProgressView(selectedStudent()!)
              : currentView === 'assessments'
                ? assessmentsView()
                : dashboardView()
        }
      </main>
    </div>
  `;

  attachEvents();
}

function attachEvents() {
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;

      if (view === 'dashboard' || view === 'students') {
        currentView = view;
        render();
      } else if (view === 'assessments') {
        void openAssessments();
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-action="add-student"]').forEach(
    (button) => {
      button.addEventListener('click', () => showModal());
    }
  );

  document.querySelectorAll<HTMLElement>('[data-action="close-modal"]').forEach(
    (button) => {
      button.addEventListener('click', closeModal);
    }
  );

  const search = document.querySelector<HTMLInputElement>('#student-search');
  const status = document.querySelector<HTMLSelectElement>('#student-status');

  search?.addEventListener('input', applyStudentFilters);
  status?.addEventListener('change', applyStudentFilters);

  document.querySelectorAll<HTMLElement>('[data-action="edit-student"]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.studentId;
      const student = students.find((item) => item.id === id);
      if (student) showModal(student);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-action="delete-student"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.studentId;
      const student = students.find((item) => item.id === id);
      if (student) await deleteStudent(student);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-action="progress-student"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.studentId;
      const student = students.find((item) => item.id === id);
      if (student) { progressYear = student.current_year; await openStudentProgress(student); }
    });
  });


  document.querySelector('[data-action="record-assessment"]')?.addEventListener('click', () => {
    void openAssessments();
  });

  const assessmentStudentSelect =
    document.querySelector<HTMLSelectElement>('#assessment-student');

  assessmentStudentSelect?.addEventListener('change', async () => {
    selectedAssessmentStudentId = assessmentStudentSelect.value;
    const student = students.find((item) => item.id === selectedAssessmentStudentId);
    if (student) await openAssessments(student.id);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-save-assessment]').forEach((button) => {
    button.addEventListener('click', async () => {
      const row = button.closest<HTMLElement>('[data-assessment-row]');
      const type = assessmentTypes.find((item) => item.id === row?.dataset.assessmentRow);
      const student = students.find((item) => item.id === selectedAssessmentStudentId);
      if (type && student) await saveAssessment(type, student);
    });
  });

  document.querySelector('#save-practical')?.addEventListener('click', async () => {
    const student = students.find((item) => item.id === selectedAssessmentStudentId);
    if (student) await savePracticalAssessment(student);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-progress-year]').forEach((button) => {
    button.addEventListener('click', () => {
      progressYear = Number(button.dataset.progressYear ?? 1);
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-save-progress]').forEach((button) => {
    button.addEventListener('click', async () => {
      const row = button.closest<HTMLElement>('[data-lesson-row]');
      const lesson = lessons.find((item) => item.id === row?.dataset.lessonRow);
      const student = selectedStudent();
      if (lesson && student) await saveLessonProgress(lesson, student);
    });
  });

  document.querySelector('[data-action="back-students"]')?.addEventListener('click', () => {
    currentView = 'students'; selectedStudentId = ''; render();
  });

  document.querySelector('[data-action="students"]')?.addEventListener('click', () => {
    currentView = 'students';
    render();
  });
}

function renderLogin() {
  app.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <div class="login-mark">♞</div>
          <div><h1>EduChess</h1><span>Academy OS</span></div>
        </div>
        <div class="login-heading">
          <p class="eyebrow">EDUCHESS ACADEMY</p>
          <h2>Welcome back</h2>
          <p>Sign in to manage students, curriculum, assessments and academy operations.</p>
        </div>
        <form id="login-form">
          <label class="login-field"><span>Email Address</span><input type="email" name="email" autocomplete="email" placeholder="Enter your email" required /></label>
          <label class="login-field"><span>Password</span><input type="password" name="password" autocomplete="current-password" placeholder="Enter your password" required /></label>
          <div id="login-error" class="form-error"></div>
          <button type="submit" class="primary-button login-button">Sign In</button>
        </form>
        <div class="login-footer"><span>EduChess Academy OS</span><span>Professional Chess Management System</span></div>
      </div>
    </div>
  `;

  const form = document.querySelector<HTMLFormElement>('#login-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const errorBox = document.querySelector<HTMLDivElement>('#login-error');
    if (button) { button.disabled = true; button.textContent = 'Signing in...'; }
    if (errorBox) errorBox.textContent = '';

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (errorBox) errorBox.textContent = error.message;
      if (button) { button.disabled = false; button.textContent = 'Sign In'; }
      return;
    }

    try {
      await loadStudents();
      render();
    } catch (error) {
      if (errorBox) errorBox.textContent = error instanceof Error ? error.message : 'Unable to load academy.';
      if (button) { button.disabled = false; button.textContent = 'Sign In'; }
    }
  });
}

async function startApp() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      renderLogin();
      return;
    }

    await loadStudents();
    render();
  } catch (error) {
    app.innerHTML = `
      <div class="academy-shell">
        <main class="main-content">
          <section class="panel error-panel">
            <p class="eyebrow">EDUCHESS ACADEMY</p>
            <h2>Unable to load academy</h2>
            <p>
              ${
                error instanceof Error
                  ? escapeHtml(error.message)
                  : 'An unexpected error occurred.'
              }
            </p>
            <button class="primary-button" onclick="location.reload()">
              Try Again
            </button>
          </section>
        </main>
      </div>
    `;
  }
}

startApp();
