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

type PromotionRule = {
  id: string;
  year_number: number;
  overall_pass_marks: number;
  practical_minimum: number;
  major_exam_pass_marks: number;
  checkpoint_pass_marks: number;
};

type PromotionReview = {
  id?: string;
  student_id: string;
  academic_year_id: string;
  annual_total: number | null;
  practical_score: number | null;
  academic_requirement_met: boolean;
  practical_requirement_met: boolean;
  attendance_percentage: number | null;
  homework_quality: string | null;
  discipline_rating: string | null;
  game_quality_rating: string | null;
  coach_recommendation: string | null;
  decision: 'PROMOTE' | 'PROMOTE_WITH_SUPPORT' | 'REPEAT_SELECTED_MODULES' | 'REPEAT_YEAR' | null;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

let academicYears: AcademicYear[] = [];
let assessmentTypes: AssessmentType[] = [];
let assessmentRecords: AssessmentRecord[] = [];
let practicalAssessment: PracticalAssessment | null = null;
let selectedAssessmentStudentId = '';
let selectedAssessmentYear = 0;
let promotionRules: PromotionRule[] = [];
let promotionReview: PromotionReview | null = null;
let selectedPromotionStudentId = '';

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


async function loadPromotionRules() {
  const { data, error } = await supabase
    .from('promotion_rules')
    .select('id, year_number, overall_pass_marks, practical_minimum, major_exam_pass_marks, checkpoint_pass_marks')
    .order('year_number', { ascending: true });

  if (error) throw new Error(error.message);
  promotionRules = (data ?? []).map((row: any) => ({
    id: row.id,
    year_number: Number(row.year_number),
    overall_pass_marks: Number(row.overall_pass_marks),
    practical_minimum: Number(row.practical_minimum),
    major_exam_pass_marks: Number(row.major_exam_pass_marks),
    checkpoint_pass_marks: Number(row.checkpoint_pass_marks),
  }));
}

function promotionRuleFor(yearNumber: number): PromotionRule | undefined {
  return promotionRules.find((rule) => rule.year_number === yearNumber);
}

async function loadPromotionReview(studentId: string) {
  const year = currentAcademicYear();
  if (!year) throw new Error('No academic year is available.');

  const { data, error } = await supabase
    .from('promotion_reviews')
    .select('id, student_id, academic_year_id, annual_total, practical_score, academic_requirement_met, practical_requirement_met, attendance_percentage, homework_quality, discipline_rating, game_quality_rating, coach_recommendation, decision, review_notes, reviewed_by, reviewed_at')
    .eq('student_id', studentId)
    .eq('academic_year_id', year.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  promotionReview = data as PromotionReview | null;
}

function promotionAssessmentState(student: Student) {
  const rule = promotionRuleFor(student.current_year);
  const recordsByCode = new Map<string, AssessmentRecord>();

  for (const type of assessmentTypes) {
    const record = assessmentRecordFor(type);
    if (record) recordsByCode.set(type.code, record);
  }

  const cp1 = recordsByCode.get('CP1');
  const mid = recordsByCode.get('MID');
  const cp2 = recordsByCode.get('CP2');
  const final = recordsByCode.get('FINAL');
  const homework = recordsByCode.get('HOMEWORK');
  const total = assessmentTotal();
  const practical = Number(practicalAssessment?.marks ?? 0);

  const allEntered = Boolean(cp1 && mid && cp2 && final && homework && practicalAssessment);
  const checkpointPass = Boolean(
    rule && cp1 && cp2 && cp1.marks >= rule.checkpoint_pass_marks && cp2.marks >= rule.checkpoint_pass_marks
  );
  const majorExamPass = Boolean(
    rule && mid && final && mid.marks >= rule.major_exam_pass_marks && final.marks >= rule.major_exam_pass_marks
  );
  const academicRequirementMet = Boolean(rule && allEntered && total >= rule.overall_pass_marks && checkpointPass && majorExamPass);
  const practicalRequirementMet = Boolean(rule && practical >= rule.practical_minimum);
  const ready = Boolean(allEntered && academicRequirementMet && practicalRequirementMet);

  return {
    rule,
    total,
    practical,
    allEntered,
    checkpointPass,
    majorExamPass,
    academicRequirementMet,
    practicalRequirementMet,
    ready,
  };
}

async function openPromotion(studentId?: string) {
  currentView = 'promotion';
  selectedPromotionStudentId = studentId || selectedPromotionStudentId || students[0]?.id || '';
  app.innerHTML = '<div class="loading-panel">Loading promotion readiness…</div>';

  try {
    await loadAcademicYears();
    await loadAssessmentTypes();
    await loadPromotionRules();

    const student = students.find((item) => item.id === selectedPromotionStudentId);
    if (student) {
      await loadStudentAssessments(student.id, student.current_year);
      await loadPromotionReview(student.id);
    }
    render();
  } catch (error) {
    app.innerHTML = `
      <div class="academy-shell">
        <main class="main-content">
          <section class="panel error-panel">
            <p class="eyebrow">PROMOTION</p>
            <h2>Unable to load promotion readiness</h2>
            <p>${escapeHtml(error instanceof Error ? error.message : 'Unable to load promotion readiness.')}</p>
            <button class="primary-button" id="retry-promotion">Try Again</button>
          </section>
        </main>
      </div>
    `;
    document.querySelector('#retry-promotion')?.addEventListener('click', () => openPromotion(selectedPromotionStudentId));
  }
}

async function savePromotionReview(student: Student) {
  const year = currentAcademicYear();
  if (!year) throw new Error('No academic year is available.');

  const state = promotionAssessmentState(student);
  const attendance = document.querySelector<HTMLInputElement>('#promotion-attendance')?.value.trim() ?? '';
  const homeworkQuality = document.querySelector<HTMLSelectElement>('#promotion-homework')?.value || null;
  const disciplineRating = document.querySelector<HTMLSelectElement>('#promotion-discipline')?.value || null;
  const gameQualityRating = document.querySelector<HTMLSelectElement>('#promotion-game-quality')?.value || null;
  const recommendation = document.querySelector<HTMLSelectElement>('#promotion-recommendation')?.value || null;
  const decision = document.querySelector<HTMLSelectElement>('#promotion-decision')?.value || null;
  const notes = document.querySelector<HTMLTextAreaElement>('#promotion-notes')?.value.trim() || null;
  const button = document.querySelector<HTMLButtonElement>('#save-promotion-review');

  const attendanceValue = attendance === '' ? null : Number(attendance);
  if (attendanceValue !== null && (!Number.isFinite(attendanceValue) || attendanceValue < 0 || attendanceValue > 100)) {
    window.alert('Attendance percentage must be between 0 and 100.');
    return;
  }

  if (button) { button.disabled = true; button.textContent = 'Saving…'; }
  const { data: userData } = await supabase.auth.getUser();

  const payload = {
    student_id: student.id,
    academic_year_id: year.id,
    annual_total: state.total,
    practical_score: state.practical,
    academic_requirement_met: state.academicRequirementMet,
    practical_requirement_met: state.practicalRequirementMet,
    attendance_percentage: attendanceValue,
    homework_quality: homeworkQuality,
    discipline_rating: disciplineRating,
    game_quality_rating: gameQualityRating,
    coach_recommendation: recommendation,
    decision: decision || null,
    review_notes: notes,
    reviewed_by: userData.user?.id ?? null,
    reviewed_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('promotion_reviews')
    .upsert(payload, { onConflict: 'student_id,academic_year_id' })
    .select('id, student_id, academic_year_id, annual_total, practical_score, academic_requirement_met, practical_requirement_met, attendance_percentage, homework_quality, discipline_rating, game_quality_rating, coach_recommendation, decision, review_notes, reviewed_by, reviewed_at')
    .single();

  if (error) {
    if (button) { button.disabled = false; button.textContent = 'Save Promotion Review'; }
    window.alert(`Unable to save promotion review.\n\n${error.message}`);
    return;
  }

  promotionReview = data as PromotionReview;
  render();
}

function promotionView(): string {
  const student = students.find((item) => item.id === selectedPromotionStudentId);
  const year = currentAcademicYear();

  if (!student) {
    return `
      <header class="topbar"><div><p class="eyebrow">ACADEMY MANAGEMENT</p><h2>Promotion</h2></div></header>
      <section class="panel empty-state">
        <div class="empty-icon">★</div>
        <h3>No students available</h3>
        <p>Add a student and complete their assessment records before reviewing promotion.</p>
        <button class="primary-button" data-action="students">View Students</button>
      </section>
    `;
  }

  const state = promotionAssessmentState(student);
  const rule = state.rule;
  const decision = promotionReview?.decision ?? '';
  const readinessClass = state.ready ? 'ready' : state.allEntered ? 'review' : 'pending';
  const readinessTitle = state.ready ? 'Ready for Promotion' : state.allEntered ? 'Review Required' : 'Awaiting Assessment Records';
  const readinessText = state.ready
    ? `All required academic and practical thresholds are met for Year ${student.current_year}.`
    : state.allEntered
      ? 'Assessment records are present, but one or more promotion requirements are not yet met.'
      : 'Complete all five annual assessment components and the practical board assessment first.';

  const checks = [
    ['Annual academic score', `${state.total} / 275`, Boolean(rule && state.total >= rule.overall_pass_marks), rule ? `Minimum ${rule.overall_pass_marks}` : 'Rule unavailable'],
    ['Practical board', `${state.practical} / 30`, state.practicalRequirementMet, rule ? `Minimum ${rule.practical_minimum}` : 'Rule unavailable'],
    ['Checkpoint standards', state.checkpointPass ? 'Passed' : 'Pending / Not met', state.checkpointPass, rule ? `${rule.checkpoint_pass_marks}+ each` : 'Rule unavailable'],
    ['Major exam standards', state.majorExamPass ? 'Passed' : 'Pending / Not met', state.majorExamPass, rule ? `${rule.major_exam_pass_marks}+ each` : 'Rule unavailable'],
  ];

  return `
    <header class="topbar">
      <div><p class="eyebrow">ACADEMY MANAGEMENT</p><h2>Promotion</h2></div>
      <div class="admin-area"><div class="admin-avatar">EA</div><div><strong>Academy Admin</strong><span>Promotion Review</span></div></div>
    </header>

    <section class="page-heading promotion-page-heading">
      <div>
        <p class="eyebrow">ANNUAL PROMOTION REVIEW</p>
        <h3>${escapeHtml(studentName(student))}</h3>
        <p>${escapeHtml(student.student_code)} · Curriculum Year ${student.current_year} · ${escapeHtml(year?.year_label ?? 'Academic year not set')}</p>
      </div>
      <button class="secondary-button" data-action="students">← Back to Students</button>
    </section>

    <section class="promotion-toolbar panel">
      <label class="assessment-select-label"><span>Student</span><select id="promotion-student">
        ${students.map((item) => `<option value="${item.id}" ${item.id === student.id ? 'selected' : ''}>${escapeHtml(studentName(item))} — Year ${item.current_year}</option>`).join('')}
      </select></label>
      <div class="promotion-year-summary"><span>Current Stage</span><strong>Year ${student.current_year}</strong><small>${escapeHtml(curriculumYears[student.current_year - 1]?.[0] ?? 'Academy Programme')}</small></div>
    </section>

    <section class="promotion-readiness ${readinessClass}">
      <div class="promotion-status-icon">${state.ready ? '✓' : state.allEntered ? '!' : '○'}</div>
      <div><p class="eyebrow">PROMOTION STATUS</p><h3>${readinessTitle}</h3><p>${readinessText}</p></div>
      <div class="promotion-status-score"><span>Academic</span><strong>${state.total} / 275</strong><small>Practical ${state.practical} / 30</small></div>
    </section>

    <section class="stats-grid promotion-stats">
      <article class="stat-card"><div class="stat-icon">Σ</div><div><span>ACADEMIC SCORE</span><strong>${state.total} / 275</strong><small>${rule ? `Pass mark ${rule.overall_pass_marks}` : 'Rule unavailable'}</small></div></article>
      <article class="stat-card"><div class="stat-icon">♙</div><div><span>PRACTICAL BOARD</span><strong>${state.practical} / 30</strong><small>${rule ? `Minimum ${rule.practical_minimum}` : 'Rule unavailable'}</small></div></article>
      <article class="stat-card"><div class="stat-icon">✓</div><div><span>ACADEMIC REQUIREMENT</span><strong>${state.academicRequirementMet ? 'Met' : 'Not met'}</strong><small>All assessment standards</small></div></article>
      <article class="stat-card"><div class="stat-icon">★</div><div><span>FINAL READINESS</span><strong>${state.ready ? 'READY' : 'PENDING'}</strong><small>${state.allEntered ? 'Review decision below' : 'Complete records first'}</small></div></article>
    </section>

    <section class="promotion-grid">
      <div class="panel promotion-checks-panel">
        <div class="panel-header"><div><p class="eyebrow">PROMOTION RULES</p><h3>Academic & Practical Checks</h3><p>Year-specific standards are evaluated from the recorded assessment data.</p></div><span class="badge">Year ${student.current_year}</span></div>
        <div class="promotion-check-list">
          ${checks.map(([label, value, passed, detail]) => `
            <div class="promotion-check ${passed ? 'passed' : 'not-passed'}">
              <div class="check-icon">${passed ? '✓' : '!'}</div>
              <div><strong>${label}</strong><span>${value}</span></div>
              <small>${detail}</small>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel progression-panel">
        <div class="panel-header"><div><p class="eyebrow">NEXT STAGE</p><h3>Progression Path</h3></div></div>
        <div class="stage-path">
          <div class="stage-node current"><span>${String(student.current_year).padStart(2, '0')}</span><div><strong>${escapeHtml(curriculumYears[student.current_year - 1]?.[0] ?? 'Current Year')}</strong><small>Current curriculum year</small></div></div>
          ${student.current_year < 6 ? `<div class="stage-arrow">↓</div><div class="stage-node next"><span>${String(student.current_year + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(curriculumYears[student.current_year]?.[0] ?? 'Next Year')}</strong><small>Next programme stage</small></div></div>` : `<div class="stage-arrow">↓</div><div class="stage-node graduation"><span>★</span><div><strong>Academy Graduation</strong><small>Year 6 completion and graduation review</small></div></div>`}
        </div>
      </div>
    </section>

    <section class="panel promotion-review-panel">
      <div class="panel-header"><div><p class="eyebrow">COACH REVIEW</p><h3>Promotion Decision</h3><p>Record the professional review after checking the academic and practical requirements.</p></div></div>
      <div class="promotion-review-form">
        <label><span>Attendance %</span><input id="promotion-attendance" type="number" min="0" max="100" step="0.1" value="${promotionReview?.attendance_percentage ?? ''}" placeholder="e.g. 92"></label>
        <label><span>Homework Quality</span><select id="promotion-homework"><option value="">Select</option>${['EXCELLENT','GOOD','SATISFACTORY','NEEDS_SUPPORT'].map(v => `<option value="${v}" ${promotionReview?.homework_quality === v ? 'selected' : ''}>${v.replaceAll('_',' ')}</option>`).join('')}</select></label>
        <label><span>Discipline Rating</span><select id="promotion-discipline"><option value="">Select</option>${['EXCELLENT','GOOD','SATISFACTORY','NEEDS_SUPPORT'].map(v => `<option value="${v}" ${promotionReview?.discipline_rating === v ? 'selected' : ''}>${v.replaceAll('_',' ')}</option>`).join('')}</select></label>
        <label><span>Game Quality</span><select id="promotion-game-quality"><option value="">Select</option>${['EXCELLENT','GOOD','SATISFACTORY','NEEDS_SUPPORT'].map(v => `<option value="${v}" ${promotionReview?.game_quality_rating === v ? 'selected' : ''}>${v.replaceAll('_',' ')}</option>`).join('')}</select></label>
        <label><span>Coach Recommendation</span><select id="promotion-recommendation"><option value="">Select</option>${['PROMOTE','PROMOTE_WITH_SUPPORT','REPEAT_SELECTED_MODULES','REPEAT_YEAR'].map(v => `<option value="${v}" ${promotionReview?.coach_recommendation === v ? 'selected' : ''}>${v.replaceAll('_',' ')}</option>`).join('')}</select></label>
        <label><span>Final Decision</span><select id="promotion-decision"><option value="">Select decision</option>${['PROMOTE','PROMOTE_WITH_SUPPORT','REPEAT_SELECTED_MODULES','REPEAT_YEAR'].map(v => `<option value="${v}" ${decision === v ? 'selected' : ''}>${v.replaceAll('_',' ')}</option>`).join('')}</select></label>
        <label class="promotion-notes"><span>Review Notes</span><textarea id="promotion-notes" rows="4" placeholder="Record strengths, concerns, support plan or progression notes…">${escapeHtml(promotionReview?.review_notes)}</textarea></label>
        <div class="promotion-review-actions"><div><strong>System readiness: ${state.ready ? 'READY FOR PROMOTION' : 'NOT YET READY'}</strong><span>The final decision is recorded by the academy reviewer.</span></div><button class="primary-button" id="save-promotion-review">Save Promotion Review</button></div>
      </div>
    </section>
  `;
}



type CurriculumYear = {
  id: string;
  year_number: number;
  stage_name: string;
  identity: string | null;
  goals: string | null;
};

type Batch = {
  id: string;
  name: string;
  coach_id: string | null;
  active: boolean;
  location: string | null;
};

type AcademyClass = {
  id: string;
  batch_id: string;
  class_date: string;
  start_time: string | null;
  end_time: string | null;
  lesson_id: string | null;
  notes: string | null;
  batches?: { name: string } | null;
};

type AttendanceRecord = {
  id?: string;
  class_id: string;
  student_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks: string | null;
};

type CertificateRecord = {
  id: string;
  certificate_number: string;
  verification_token: string;
  student_id: string;
  promotion_review_id: string;
  academic_year: number;
  stage_name: string;
  annual_score: number;
  practical_score: number;
  issued_at: string;
  status: 'ACTIVE' | 'REVOKED' | 'SUPERSEDED';
  pdf_path: string | null;
};

let curriculumYearRecords: CurriculumYear[] = [];
let curriculumFilterYear = 1;
let curriculumSearch = '';
let batches: Batch[] = [];
let academyClasses: AcademyClass[] = [];
let selectedClassId = '';
let attendanceRecords: AttendanceRecord[] = [];
let attendanceDate = new Date().toISOString().slice(0, 10);
let certificates: CertificateRecord[] = [];
let reportsLoaded = false;
let reportProgressRows: Array<{student: Student; completed: number; total: number}> = [];
let reportAssessmentRows: Array<{student: Student; total: number; practical: number}> = [];
let reportAttendanceRows: Array<{student: Student; present: number; total: number; percentage: number}> = [];

const curriculumYears = [
  ['Foundation', 'Rules, board vision, simple tactics and basic mates'],
  ['Early Development', 'Pattern growth, opening logic and attack basics'],
  ['Core Competitive', 'Thinking process, candidate moves and rook endings'],
  ['Competitive Intermediate', 'Planning, positional play and practical skill'],
  ['Advanced Club', 'Prophylaxis, imbalances and advanced practical play'],
  ['Academy Mastery', 'Independent training, preparation and capstone analysis'],
];



async function loadCurriculumCatalogue() {
  const { data: years, error: yearError } = await supabase
    .from('curriculum_years')
    .select('id, year_number, stage_name, identity, goals')
    .order('year_number', { ascending: true });
  if (yearError) throw new Error(yearError.message);
  curriculumYearRecords = (years ?? []) as CurriculumYear[];
  if (!lessons.length) await loadCurriculumLessons();
}

async function openCurriculum() {
  currentView = 'curriculum';
  app.innerHTML = '<div class="loading-panel">Loading curriculum…</div>';
  try {
    await loadCurriculumCatalogue();
    render();
  } catch (error) {
    app.innerHTML = `<section class="panel error-panel"><p class="eyebrow">CURRICULUM</p><h2>Unable to load curriculum</h2><p>${escapeHtml(error instanceof Error ? error.message : 'Unable to load curriculum.')}</p><button class="primary-button" id="retry-curriculum">Try Again</button></section>`;
    document.querySelector('#retry-curriculum')?.addEventListener('click', () => void openCurriculum());
  }
}

function curriculumView(): string {
  const activeYear = curriculumYearRecords.find((y) => y.year_number === curriculumFilterYear);
  const yearLessons = lessonsForYear(curriculumFilterYear);
  const filtered = yearLessons.filter((lesson) => {
    const q = curriculumSearch.trim().toLowerCase();
    if (!q) return true;
    return [lesson.title, lesson.description, lesson.objective, ...(lesson.key_terms ?? [])].some((v) => String(v ?? '').toLowerCase().includes(q));
  });
  const allLessons = lessons.length || 240;
  return `
    <header class="topbar"><div class="topbar-heading"><span class="topbar-kicker">Learning Programme</span><h2>Curriculum</h2></div><div class="topbar-actions"><div class="admin-area"><div class="admin-avatar">EA</div><div class="admin-copy"><strong>Academy Admin</strong><span>Curriculum Management</span></div></div></div></header>
    <div class="module-page">
      <section class="page-heading module-heading"><div><span class="section-label">Six-Year Programme</span><h1>EduChess Curriculum</h1><p>${allLessons} lessons across six academy years. Select a year to review the weekly programme.</p></div><span class="module-badge">240 Lessons</span></section>
      <section class="curriculum-year-grid">
        ${Array.from({length:6}, (_,i) => i+1).map((year) => { const meta=curriculumYearRecords.find(y=>y.year_number===year); const count=lessonsForYear(year).length; return `<button class="curriculum-year-card ${curriculumFilterYear===year?'selected':''}" data-curriculum-year="${year}"><span class="year-number">${String(year).padStart(2,'0')}</span><span><strong>${escapeHtml(meta?.stage_name ?? curriculumYears[year-1][0])}</strong><small>${count || 40} lessons</small></span><span class="year-chevron">›</span></button>`; }).join('')}
      </section>
      <section class="panel curriculum-detail-panel">
        <div class="card-heading"><div><span class="section-label">Year ${curriculumFilterYear}</span><h2>${escapeHtml(activeYear?.stage_name ?? curriculumYears[curriculumFilterYear-1][0])}</h2><p>${escapeHtml(activeYear?.identity ?? curriculumYears[curriculumFilterYear-1][1])}</p></div><label class="module-search"><span>Search lessons</span><input id="curriculum-search" value="${escapeHtml(curriculumSearch)}" placeholder="Search title, objective or key term…" /></label></div>
        ${activeYear?.goals ? `<div class="curriculum-goals"><strong>Year goals</strong><p>${escapeHtml(activeYear.goals)}</p></div>` : ''}
        <div class="lesson-catalogue">
          ${filtered.map((lesson) => `<article class="catalogue-row"><div class="catalogue-week">W${String(lesson.week_number).padStart(2,'0')}</div><div class="catalogue-main"><strong>${escapeHtml(lesson.title)}</strong><p>${escapeHtml(lesson.description ?? '')}</p><small>${escapeHtml(lesson.objective ?? '')}</small>${lesson.key_terms?.length ? `<div class="term-list">${lesson.key_terms.map((t)=>`<span>${escapeHtml(t)}</span>`).join('')}</div>`:''}</div><button class="secondary-button small-button" data-curriculum-progress="${curriculumFilterYear}">Student Progress →</button></article>`).join('') || `<div class="empty-state compact-empty"><div class="empty-icon">▤</div><h3>No lessons found</h3><p>Try a different search.</p></div>`}
        </div>
      </section>
    </div>`;
}

async function loadAttendanceData() {
  const { data: batchData, error: batchError } = await supabase.from('batches').select('id,name,coach_id,active,location').eq('academy_id', academyId).order('name');
  if (batchError) throw new Error(batchError.message);
  batches = (batchData ?? []) as Batch[];

  const { data: classData, error: classError } = await supabase.from('classes').select('id,batch_id,class_date,start_time,end_time,lesson_id,notes,batches(name)').order('class_date', { ascending: false }).limit(50);
  if (classError) throw new Error(classError.message);
  academyClasses = (classData ?? []) as AcademyClass[];
  if (!selectedClassId && academyClasses.length) selectedClassId = academyClasses[0].id;
  await loadSelectedAttendance();
}

async function loadSelectedAttendance() {
  attendanceRecords = [];
  if (!selectedClassId) return;
  const { data, error } = await supabase.from('attendance').select('id,class_id,student_id,status,remarks').eq('class_id', selectedClassId);
  if (error) throw new Error(error.message);
  attendanceRecords = (data ?? []) as AttendanceRecord[];
}

async function openAttendance() {
  currentView = 'attendance';
  app.innerHTML = '<div class="loading-panel">Loading attendance…</div>';
  try { await loadAttendanceData(); render(); }
  catch (error) {
    app.innerHTML = `<section class="panel error-panel"><p class="eyebrow">ATTENDANCE</p><h2>Unable to load attendance</h2><p>${escapeHtml(error instanceof Error ? error.message : 'Unable to load attendance.')}</p><button class="primary-button" id="retry-attendance">Try Again</button></section>`;
    document.querySelector('#retry-attendance')?.addEventListener('click', () => void openAttendance());
  }
}

function attendanceSummary() {
  const selected = academyClasses.find(c => c.id === selectedClassId);
  const rows = attendanceRecords;
  return { selected, present: rows.filter(r=>r.status==='PRESENT').length, absent: rows.filter(r=>r.status==='ABSENT').length, late: rows.filter(r=>r.status==='LATE').length, excused: rows.filter(r=>r.status==='EXCUSED').length };
}

function attendanceView(): string {
  const summary = attendanceSummary();
  const selected = summary.selected;
  const classDate = selected?.class_date ?? attendanceDate;
  const statusFor = (studentId:string) => attendanceRecords.find(r=>r.student_id===studentId)?.status ?? 'PRESENT';
  return `
    <header class="topbar"><div class="topbar-heading"><span class="topbar-kicker">Academy Operations</span><h2>Attendance</h2></div><div class="topbar-actions"><div class="admin-area"><div class="admin-avatar">EA</div><div class="admin-copy"><strong>Academy Admin</strong><span>Attendance Register</span></div></div></div></header>
    <div class="module-page">
      <section class="page-heading module-heading"><div><span class="section-label">Class Register</span><h1>Attendance</h1><p>Record presence, lateness, absence and approved leave for each class.</p></div><button class="primary-button" data-action="new-class">＋ New Class</button></section>
      <section class="stats-grid module-stats"><article class="stat-card"><div class="stat-icon">✓</div><div><span>PRESENT</span><strong>${summary.present}</strong><small>Selected class</small></div></article><article class="stat-card"><div class="stat-icon">◷</div><div><span>LATE</span><strong>${summary.late}</strong><small>Needs monitoring</small></div></article><article class="stat-card"><div class="stat-icon">!</div><div><span>ABSENT</span><strong>${summary.absent}</strong><small>Selected class</small></div></article><article class="stat-card"><div class="stat-icon">✓</div><div><span>EXCUSED</span><strong>${summary.excused}</strong><small>Approved absence</small></div></article></section>
      ${academyClasses.length ? `<section class="panel attendance-panel"><div class="card-heading"><div><span class="section-label">Recent Classes</span><h2>Attendance Register</h2></div><select id="attendance-class" class="module-select">${academyClasses.map(c=>`<option value="${c.id}" ${c.id===selectedClassId?'selected':''}>${escapeHtml(c.class_date)} · ${escapeHtml(c.batches?.name ?? 'Class')}</option>`).join('')}</select></div><div class="attendance-table"><div class="attendance-head"><span>Student</span><span>Status</span><span>Remarks</span></div>${students.filter(s=>s.status!=='LEFT').map(student=>{const rec=attendanceRecords.find(r=>r.student_id===student.id); return `<div class="attendance-row"><div><strong>${escapeHtml(studentName(student))}</strong><small>${escapeHtml(student.student_code)} · Year ${student.current_year}</small></div><select data-attendance-status="${student.id}"><option value="PRESENT" ${statusFor(student.id)==='PRESENT'?'selected':''}>Present</option><option value="LATE" ${statusFor(student.id)==='LATE'?'selected':''}>Late</option><option value="ABSENT" ${statusFor(student.id)==='ABSENT'?'selected':''}>Absent</option><option value="EXCUSED" ${statusFor(student.id)==='EXCUSED'?'selected':''}>Excused</option></select><input data-attendance-remarks="${student.id}" value="${escapeHtml(rec?.remarks)}" placeholder="Optional note" /></div>`;}).join('')}</div><div class="panel-actions"><span>${selected ? `Class date ${escapeHtml(classDate)}` : 'Select a class'}</span><button class="primary-button" id="save-attendance" ${selected?'':'disabled'}>Save Attendance</button></div></section>` : `<section class="panel empty-state"><div class="empty-icon">◷</div><h3>No classes have been created</h3><p>Create your first class to start recording attendance.</p><button class="primary-button" data-action="new-class">Create First Class</button></section>`}
      ${batches.length ? `<section class="panel attendance-setup-panel"><div class="card-heading"><div><span class="section-label">Batches</span><h2>Active Teaching Groups</h2><p>Attendance classes are linked to academy batches.</p></div></div><div class="batch-grid">${batches.map(b=>`<div class="batch-card"><strong>${escapeHtml(b.name)}</strong><span>${escapeHtml(b.location ?? 'Academy')}</span><small>${b.active?'Active':'Inactive'}</small></div>`).join('')}</div></section>` : ''}
    </div>`;
}

async function createClass() {
  if (!batches.length) { window.alert('Please create a batch first. Attendance classes must belong to a batch.'); return; }
  const batch = window.prompt(`Enter batch name exactly as shown:\n\n${batches.map(b=>b.name).join('\n')}`, batches[0].name);
  if (!batch) return;
  const selected = batches.find(b=>b.name.toLowerCase()===batch.trim().toLowerCase()) ?? batches[0];
  const date = window.prompt('Class date (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
  if (!date) return;
  const { data, error } = await supabase.from('classes').insert({ batch_id:selected.id, class_date:date }).select('id,batch_id,class_date,start_time,end_time,lesson_id,notes,batches(name)').single();
  if (error) { window.alert(`Unable to create class.\n\n${error.message}`); return; }
  selectedClassId = (data as AcademyClass).id;
  await loadAttendanceData();
  render();
}

async function saveAttendance() {
  if (!selectedClassId) return;
  const rows = students.filter(s=>s.status!=='LEFT').map(s=>({ class_id:selectedClassId, student_id:s.id, status:(document.querySelector<HTMLSelectElement>(`[data-attendance-status="${s.id}"]`)?.value ?? 'PRESENT') as AttendanceRecord['status'], remarks:document.querySelector<HTMLInputElement>(`[data-attendance-remarks="${s.id}"]`)?.value.trim() || null }));
  const { error } = await supabase.from('attendance').upsert(rows, { onConflict:'class_id,student_id' });
  if (error) { window.alert(`Unable to save attendance.\n\n${error.message}`); return; }
  await loadSelectedAttendance();
  render();
}

async function loadCertificates() {
  const { data, error } = await supabase.from('certificates').select('id,certificate_number,verification_token,student_id,promotion_review_id,academic_year,stage_name,annual_score,practical_score,issued_at,status,pdf_path').order('issued_at', { ascending:false });
  if (error) throw new Error(error.message);
  certificates = (data ?? []) as CertificateRecord[];
}

async function openCertificates() {
  currentView = 'certificates'; app.innerHTML='<div class="loading-panel">Loading certificates…</div>';
  try { await loadCertificates(); render(); }
  catch(error) { app.innerHTML=`<section class="panel error-panel"><p class="eyebrow">CERTIFICATES</p><h2>Unable to load certificates</h2><p>${escapeHtml(error instanceof Error ? error.message : 'Unable to load certificates.')}</p><button class="primary-button" id="retry-certificates">Try Again</button></section>`; document.querySelector('#retry-certificates')?.addEventListener('click',()=>void openCertificates()); }
}

function certificateView(): string {
  const studentNameById=(id:string)=>studentName(students.find(s=>s.id===id) ?? ({first_name:'Unknown',last_name:null} as Student));
  return `<header class="topbar"><div class="topbar-heading"><span class="topbar-kicker">Academy Records</span><h2>Certificates</h2></div><div class="topbar-actions"><div class="admin-area"><div class="admin-avatar">EA</div><div class="admin-copy"><strong>Academy Admin</strong><span>Certificate Records</span></div></div></div></header><div class="module-page"><section class="page-heading module-heading"><div><span class="section-label">Achievement Records</span><h1>Certificates</h1><p>View issued academy certificates and their verification status.</p></div><span class="module-badge">${certificates.length} Issued</span></section><section class="certificate-info panel"><div><strong>Certificate issuance</strong><p>Certificates are created through the controlled server-side issuance process after an approved promotion decision. This dashboard is ready to display and verify issued records.</p></div><span class="security-pill">Secure verification</span></section><section class="panel"><div class="card-heading"><div><span class="section-label">Certificate Register</span><h2>Issued Certificates</h2></div></div>${certificates.length ? `<div class="certificate-table"><div class="certificate-head"><span>Certificate</span><span>Student</span><span>Stage</span><span>Score</span><span>Status</span><span>Issued</span></div>${certificates.map(c=>`<div class="certificate-row"><div><strong>${escapeHtml(c.certificate_number)}</strong><small>${escapeHtml(c.verification_token.slice(0,12))}…</small></div><div><strong>${escapeHtml(studentNameById(c.student_id))}</strong></div><div>Year ${c.academic_year}<small>${escapeHtml(c.stage_name)}</small></div><div><strong>${c.annual_score}/275</strong><small>Practical ${c.practical_score}/30</small></div><span class="status-pill ${c.status.toLowerCase()}">${escapeHtml(c.status)}</span><span>${escapeHtml(new Date(c.issued_at).toLocaleDateString())}</span></div>`).join('')}</div>` : `<div class="empty-state compact-empty"><div class="empty-icon">🎓</div><h3>No certificates issued yet</h3><p>Approved promotion reviews can become certificates once the issuance service is enabled.</p></div>`}</section></div>`;
}

async function loadReports() {
  reportProgressRows=[]; reportAssessmentRows=[]; reportAttendanceRows=[];
  if (!lessons.length) await loadCurriculumLessons();
  const { data: progressData, error: progressError } = await supabase.from('lesson_progress').select('student_id,lesson_id,status');
  if (progressError) throw new Error(progressError.message);
  for (const student of students) { const completed=(progressData??[]).filter((r:any)=>r.student_id===student.id && r.status==='COMPLETED').length; reportProgressRows.push({student,completed,total:lessons.length}); }
  const { data: assessmentData, error: assessmentError } = await supabase.from('assessments').select('student_id,marks');
  if (assessmentError) throw new Error(assessmentError.message);
  const { data: practicalData, error: practicalError } = await supabase.from('practical_assessments').select('student_id,marks');
  if (practicalError) throw new Error(practicalError.message);
  for (const student of students) reportAssessmentRows.push({student,total:(assessmentData??[]).filter((r:any)=>r.student_id===student.id).reduce((a:number,r:any)=>a+Number(r.marks||0),0),practical:Number((practicalData??[]).find((r:any)=>r.student_id===student.id)?.marks||0)});
  const { data: attendanceData, error: attendanceError } = await supabase.from('attendance').select('student_id,status');
  if (attendanceError) throw new Error(attendanceError.message);
  for (const student of students) { const rows=(attendanceData??[]).filter((r:any)=>r.student_id===student.id); const present=rows.filter((r:any)=>r.status==='PRESENT'||r.status==='LATE').length; reportAttendanceRows.push({student,present,total:rows.length,percentage:rows.length?Math.round((present/rows.length)*100):0}); }
  reportsLoaded=true;
}

async function openReports() {
  currentView='reports'; reportsLoaded=false; app.innerHTML='<div class="loading-panel">Building academy reports…</div>';
  try { await loadReports(); render(); }
  catch(error) { app.innerHTML=`<section class="panel error-panel"><p class="eyebrow">REPORTS</p><h2>Unable to build reports</h2><p>${escapeHtml(error instanceof Error ? error.message : 'Unable to build reports.')}</p><button class="primary-button" id="retry-reports">Try Again</button></section>`; document.querySelector('#retry-reports')?.addEventListener('click',()=>void openReports()); }
}

function reportsView(): string {
  const avgProgress=reportProgressRows.length?Math.round(reportProgressRows.reduce((a,r)=>a+(r.total?r.completed/r.total*100:0),0)/reportProgressRows.length):0;
  const avgAssessment=reportAssessmentRows.length?Math.round(reportAssessmentRows.reduce((a,r)=>a+r.total,0)/reportAssessmentRows.length):0;
  const avgAttendance=reportAttendanceRows.length?Math.round(reportAttendanceRows.reduce((a,r)=>a+r.percentage,0)/reportAttendanceRows.length):0;
  return `<header class="topbar"><div class="topbar-heading"><span class="topbar-kicker">Academy Intelligence</span><h2>Reports</h2></div><div class="topbar-actions"><div class="admin-area"><div class="admin-avatar">EA</div><div class="admin-copy"><strong>Academy Admin</strong><span>Academy Reports</span></div></div></div></header><div class="module-page"><section class="page-heading module-heading"><div><span class="section-label">Management Reports</span><h1>Academy Reports</h1><p>Live summaries of curriculum progress, assessments and attendance from your records.</p></div><button class="secondary-button" data-action="refresh-reports">↻ Refresh</button></section><section class="stats-grid module-stats"><article class="stat-card"><div class="stat-icon">▤</div><div><span>AVG CURRICULUM</span><strong>${avgProgress}%</strong><small>Across student records</small></div></article><article class="stat-card"><div class="stat-icon">✓</div><div><span>AVG ASSESSMENT</span><strong>${avgAssessment}</strong><small>Academic marks recorded</small></div></article><article class="stat-card"><div class="stat-icon">◷</div><div><span>AVG ATTENDANCE</span><strong>${avgAttendance}%</strong><small>Present or late</small></div></article><article class="stat-card"><div class="stat-icon">★</div><div><span>STUDENTS</span><strong>${students.length}</strong><small>${students.filter(s=>s.status==='ACTIVE').length} active</small></div></article></section><section class="reports-grid"><article class="panel report-panel"><div class="card-heading"><div><span class="section-label">Learning</span><h2>Student Progress</h2></div></div><div class="report-list">${reportProgressRows.map(r=>`<div class="report-row"><div><strong>${escapeHtml(studentName(r.student))}</strong><small>Year ${r.student.current_year}</small></div><div class="report-bar"><span style="width:${r.total?Math.round(r.completed/r.total*100):0}%"></span></div><strong>${r.total?Math.round(r.completed/r.total*100):0}%</strong></div>`).join('')||'<div class="empty-state compact-empty"><p>No students available.</p></div>'}</div></article><article class="panel report-panel"><div class="card-heading"><div><span class="section-label">Performance</span><h2>Assessment Snapshot</h2></div></div><div class="report-list">${reportAssessmentRows.map(r=>`<div class="report-row"><div><strong>${escapeHtml(studentName(r.student))}</strong><small>Practical ${r.practical}/30</small></div><div class="score-chip">${r.total}/275</div><span class="muted-value">Year ${r.student.current_year}</span></div>`).join('')||'<div class="empty-state compact-empty"><p>No assessment data yet.</p></div>'}</div></article></section><section class="panel report-panel"><div class="card-heading"><div><span class="section-label">Attendance</span><h2>Attendance Overview</h2></div></div><div class="report-table"><div class="report-table-head"><span>Student</span><span>Present/Late</span><span>Classes</span><span>Attendance</span></div>${reportAttendanceRows.map(r=>`<div class="report-table-row"><strong>${escapeHtml(studentName(r.student))}</strong><span>${r.present}</span><span>${r.total}</span><strong>${r.percentage}%</strong></div>`).join('')||'<div class="empty-state compact-empty"><p>No attendance data yet.</p></div>'}</div></section></div>`;
}

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
  const currentYear = academicYears[0]?.year_label ?? '2026–2027';
  const activeYearStudents = students.filter((s) => s.status === 'ACTIVE');
  const yearCounts = [1, 2, 3, 4, 5, 6].map((year) => ({
    year,
    name: curriculumYears[year - 1][0],
    description: curriculumYears[year - 1][1],
    students: activeYearStudents.filter((s) => s.current_year === year).length,
  }));

  return `
    <header class="topbar dashboard-topbar">
      <div class="topbar-heading">
        <span class="topbar-kicker">Academy Management</span>
        <h2>Dashboard</h2>
      </div>
      <div class="topbar-actions">
        <div class="academic-pill">
          <span>Academic Year</span>
          <strong>${escapeHtml(currentYear)}</strong>
        </div>
        <div class="admin-area">
          <div class="admin-avatar">EA</div>
          <div class="admin-copy">
            <strong>Academy Admin</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </header>

    <div class="dashboard-page">
      <section class="hero-banner">
        <div class="hero-copy">
          <span class="hero-overline">EDUCHESS ACADEMY</span>
          <h1>Good morning, Academy Admin.</h1>
          <p>Manage your academy, monitor student development and keep every stage of the six-year programme on track.</p>
          <div class="hero-actions">
            <button class="primary-button hero-primary" data-action="add-student">＋ Add Student</button>
            <button class="secondary-button hero-secondary" data-action="students">View Students <span>→</span></button>
          </div>
        </div>
        <div class="hero-mark" aria-hidden="true">
          <div class="hero-board">
            <span>♞</span><span></span><span>♟</span><span></span>
            <span></span><span>♙</span><span></span><span>♘</span>
            <span>♙</span><span></span><span>♙</span><span></span>
            <span></span><span>♙</span><span></span><span>♙</span>
          </div>
        </div>
      </section>

      <section class="metric-grid" aria-label="Academy metrics">
        <article class="metric-card">
          <div class="metric-icon metric-icon-blue">♙</div>
          <div class="metric-content">
            <span class="metric-label">Active Students</span>
            <strong>${activeStudents}</strong>
            <small>${students.length} total student record${students.length === 1 ? '' : 's'}</small>
          </div>
          <span class="metric-arrow">→</span>
        </article>
        <article class="metric-card">
          <div class="metric-icon metric-icon-slate">▤</div>
          <div class="metric-content">
            <span class="metric-label">Curriculum</span>
            <strong>240</strong>
            <small>Lessons across 6 programme years</small>
          </div>
          <span class="metric-arrow">→</span>
        </article>
        <article class="metric-card">
          <div class="metric-icon metric-icon-gold">✓</div>
          <div class="metric-content">
            <span class="metric-label">Assessment Cycle</span>
            <strong>5</strong>
            <small>Annual assessment components</small>
          </div>
          <span class="metric-arrow">→</span>
        </article>
        <article class="metric-card">
          <div class="metric-icon metric-icon-green">★</div>
          <div class="metric-content">
            <span class="metric-label">Promotion Standard</span>
            <strong>110<span class="metric-denom"> / 275</span></strong>
            <small>Plus year-specific practical minimum</small>
          </div>
          <span class="metric-arrow">→</span>
        </article>
      </section>

      <section class="dashboard-columns">
        <article class="dashboard-card programme-card">
          <div class="card-heading">
            <div>
              <span class="section-label">Programme</span>
              <h2>Six-Year Academy Pathway</h2>
              <p>Track the complete learning journey from Foundation to Academy Mastery.</p>
            </div>
            <span class="programme-total">240 lessons</span>
          </div>

          <div class="programme-list">
            ${yearCounts.map((item) => `
              <div class="programme-row">
                <div class="programme-number">${String(item.year).padStart(2, '0')}</div>
                <div class="programme-main">
                  <div class="programme-title-line">
                    <strong>${escapeHtml(item.name)}</strong>
                    <span>${item.students} active student${item.students === 1 ? '' : 's'}</span>
                  </div>
                  <p>${escapeHtml(item.description)}</p>
                  <div class="programme-track"><span style="width:0%"></span></div>
                </div>
                <div class="programme-meta">
                  <strong>0 / 40</strong>
                  <span>lessons</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="card-footer-action">
            <button class="text-button" data-action="curriculum">Open Curriculum <span>→</span></button>
          </div>
        </article>

        <article class="dashboard-card operations-card">
          <div class="card-heading compact-heading">
            <div>
              <span class="section-label">Academy Status</span>
              <h2>Operations</h2>
            </div>
            <span class="live-indicator"><i></i> Live</span>
          </div>

          <div class="operations-list">
            <button class="operation-item" data-action="students">
              <span class="operation-icon">♙</span>
              <span class="operation-copy"><strong>Student records</strong><small>${students.length} record${students.length === 1 ? '' : 's'} · ${activeStudents} active</small></span>
              <span class="operation-status status-ready">Ready</span>
              <span class="operation-chevron">›</span>
            </button>
            <button class="operation-item" data-action="record-assessment">
              <span class="operation-icon">✓</span>
              <span class="operation-copy"><strong>Assessments</strong><small>CP1 · Mid-Year · CP2 · Final · Homework</small></span>
              <span class="operation-status status-next">Open</span>
              <span class="operation-chevron">›</span>
            </button>
            <button class="operation-item" data-action="attendance">
              <span class="operation-icon">◷</span>
              <span class="operation-copy"><strong>Attendance</strong><small>Class attendance tracking</small></span>
              <span class="operation-status status-next">Open</span>
              <span class="operation-chevron">›</span>
            </button>
            <button class="operation-item" data-action="promotion">
              <span class="operation-icon">★</span>
              <span class="operation-copy"><strong>Promotion</strong><small>Annual readiness and review</small></span>
              <span class="operation-status status-next">Open</span>
              <span class="operation-chevron">›</span>
            </button>
          </div>
        </article>
      </section>

      <section class="dashboard-bottom-grid">
        <article class="dashboard-card activity-card">
          <div class="card-heading compact-heading">
            <div>
              <span class="section-label">Student Overview</span>
              <h2>Academy at a glance</h2>
            </div>
            <button class="text-button" data-action="students">Manage students <span>→</span></button>
          </div>
          <div class="student-overview-grid">
            <div class="overview-stat"><span>Active</span><strong>${activeStudents}</strong><small>Currently enrolled</small></div>
            <div class="overview-stat"><span>Paused</span><strong>${pausedStudents}</strong><small>Temporarily paused</small></div>
            <div class="overview-stat"><span>Graduated</span><strong>${graduatedStudents}</strong><small>Completed academy</small></div>
          </div>
        </article>

        <article class="dashboard-card standard-card">
          <span class="section-label">Promotion Standard</span>
          <h2>Annual promotion</h2>
          <div class="standard-number"><strong>110</strong><span>/ 275</span></div>
          <p>Students must reach the overall annual threshold and the practical-board minimum for their current academy year.</p>
          <button class="secondary-button full-button" data-action="promotion">Review promotion readiness <span>→</span></button>
        </article>
      </section>

      <footer class="dashboard-footer">
        <span><strong>EduChess Academy OS</strong> · Professional Chess Management System</span>
        <span>Academic Year ${escapeHtml(currentYear)}</span>
      </footer>
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
    <header class="topbar">
      <div>
        <p class="eyebrow">STUDENT LEARNING</p>
        <h2>Curriculum Progress</h2>
      </div>
      <div class="admin-area">
        <div class="admin-avatar">EA</div>
        <div><strong>Academy Admin</strong><span>Administrator</span></div>
      </div>
    </header>

    <section class="page-heading curriculum-progress-heading">
      <div>
        <p class="eyebrow">STUDENT LESSON RECORD</p>
        <h3>${escapeHtml(studentName(student))}</h3>
        <p>${escapeHtml(student.student_code)} · ${escapeHtml(yearName)} · Current Year ${student.current_year}</p>
      </div>
      <div class="page-heading-actions">
        <label class="student-switcher">
          <span>Student</span>
          <select id="curriculum-student" aria-label="Select student">
            ${students.map((item) => `
              <option value="${item.id}" ${item.id === student.id ? 'selected' : ''}>
                ${escapeHtml(studentName(item))} — ${escapeHtml(item.student_code)}
              </option>
            `).join('')}
          </select>
        </label>
        <button class="secondary-button" data-action="back-students">← Back to Students</button>
      </div>
    </section>

    <section class="stats-grid student-stats">
      <article class="stat-card"><div class="stat-icon">▤</div><div><span>YEAR ${progressYear} LESSONS</span><strong>${counts.completed} / ${counts.total}</strong><small>Completed</small></div></article>
      <article class="stat-card"><div class="stat-icon">%</div><div><span>YEAR PROGRESS</span><strong>${percent}%</strong><small>${escapeHtml(yearName)}</small></div></article>
      <article class="stat-card"><div class="stat-icon">→</div><div><span>IN PROGRESS</span><strong>${counts.inProgress}</strong><small>Lessons developing</small></div></article>
      <article class="stat-card"><div class="stat-icon">!</div><div><span>REQUIRES REVIEW</span><strong>${counts.review}</strong><small>Needs coach attention</small></div></article>
    </section>

    <section class="panel curriculum-progress-panel">
      <div class="panel-header">
        <div><p class="eyebrow">SIX-YEAR CURRICULUM</p><h3>Student Lesson Record</h3><p>Record lesson status, mastery and coach notes.</p></div>
        <span class="badge">240 Lessons</span>
      </div>

      <div class="curriculum-year-tabs">
        ${[1,2,3,4,5,6].map((year) => `
          <button class="curriculum-year-tab ${progressYear === year ? 'active' : ''}" data-progress-year="${year}">
            <strong>Year ${year}</strong><span>${escapeHtml(curriculumYears[year - 1][0])}</span>
          </button>
        `).join('')}
      </div>

      <div class="progress-list">
        ${yearLessons.map((lesson) => {
          const progress = lessonProgress[lesson.id];
          const status = progress?.status ?? 'NOT_STARTED';
          const mastery = progress?.mastery_level ?? '';
          return `<article class="lesson-progress-row" data-lesson-row="${lesson.id}">
            <div class="lesson-number">${String(lesson.week_number).padStart(2,'0')}</div>
            <div class="lesson-main">
              <div class="lesson-title-line">
                <div><span class="lesson-week">WEEK ${lesson.week_number}</span><h4>${escapeHtml(lesson.title)}</h4></div>
                <span class="status-pill ${status.toLowerCase().replaceAll('_','-')}">${status.replaceAll('_',' ')}</span>
              </div>
              <p class="lesson-description">${escapeHtml(lesson.description)}</p>
              ${lesson.objective ? `<div class="lesson-detail"><strong>Objective</strong><span>${escapeHtml(lesson.objective)}</span></div>` : ''}
              ${lesson.key_terms?.length ? `<div class="lesson-terms"><strong>Key terms</strong><span>${lesson.key_terms.map((term) => escapeHtml(term)).join(' · ')}</span></div>` : ''}

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
    <div class="academy-shell">

      <aside class="sidebar">

        <div class="brand">
          <div class="brand-mark">♞</div>
          <div>
            <h1>EduChess</h1>
            <span>Academy OS</span>
          </div>
        </div>

        <nav class="nav">

          <button
            class="nav-item ${currentView === 'dashboard' ? 'active' : ''}"
            data-view="dashboard"
          >
            ⌂ <span>Dashboard</span>
          </button>

          <button
            class="nav-item ${currentView === 'students' ? 'active' : ''}"
            data-view="students"
          >
            ♙ <span>Students</span>
          </button>

          <button class="nav-item ${currentView === 'curriculum' ? 'active' : ''}" data-view="curriculum">
            ▤ <span>Curriculum</span>
          </button>

          <button class="nav-item ${currentView === 'assessments' ? 'active' : ''}" data-view="assessments">
            ✓ <span>Assessments</span>
          </button>

          <button class="nav-item ${currentView === 'attendance' ? 'active' : ''}" data-view="attendance">
            ◷ <span>Attendance</span>
          </button>

          <button class="nav-item ${currentView === 'promotion' ? 'active' : ''}" data-view="promotion">
            ★ <span>Promotion</span>
          </button>

          <button class="nav-item ${currentView === 'certificates' ? 'active' : ''}" data-view="certificates">
            🎓 <span>Certificates</span>
          </button>

          <button class="nav-item ${currentView === 'reports' ? 'active' : ''}" data-view="reports">
            ▥ <span>Reports</span>
          </button>

        </nav>

        <div class="sidebar-footer">
          <strong>EduChess Academy</strong>
          <span>Professional Management System</span>
        </div>

      </aside>

      <main class="main-content">

        ${
          currentView === 'students'
            ? studentsView()
            : currentView === 'student-progress' && selectedStudent()
              ? studentProgressView(selectedStudent()!)
              : currentView === 'curriculum'
                ? curriculumView()
                : currentView === 'assessments'
                  ? assessmentsView()
                  : currentView === 'attendance'
                    ? attendanceView()
                    : currentView === 'promotion'
                      ? promotionView()
                      : currentView === 'certificates'
                        ? certificateView()
                        : currentView === 'reports'
                          ? reportsView()
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
      } else if (view === 'curriculum') {
        void openCurriculum();
      } else if (view === 'assessments') {
        void openAssessments();
      } else if (view === 'attendance') {
        void openAttendance();
      } else if (view === 'promotion') {
        void openPromotion();
      } else if (view === 'certificates') {
        void openCertificates();
      } else if (view === 'reports') {
        void openReports();
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-curriculum-year]').forEach((button) => {
    button.addEventListener('click', () => { curriculumFilterYear = Number(button.dataset.curriculumYear ?? 1); render(); });
  });
  document.querySelector('#curriculum-search')?.addEventListener('input', (event) => {
    curriculumSearch = (event.target as HTMLInputElement).value; render();
    const input = document.querySelector<HTMLInputElement>('#curriculum-search');
    input?.focus(); input?.setSelectionRange(input.value.length, input.value.length);
  });
  document.querySelectorAll<HTMLElement>('[data-curriculum-progress]').forEach((button) => {
    button.addEventListener('click', () => { const student = students.find(s => s.current_year === Number(button.dataset.curriculumProgress)) ?? students[0]; if (student) void openStudentProgress(student); else { currentView='students'; render(); } });
  });
  document.querySelector('#attendance-class')?.addEventListener('change', async (event) => {
    selectedClassId = (event.target as HTMLSelectElement).value; await loadSelectedAttendance(); render();
  });
  document.querySelector('[data-action="new-class"]')?.addEventListener('click', () => void createClass());
  document.querySelector('#save-attendance')?.addEventListener('click', () => void saveAttendance());
  document.querySelector('[data-action="refresh-reports"]')?.addEventListener('click', () => void openReports());

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

  document.querySelector('#promotion-student')?.addEventListener('change', async (event) => {
    const id = (event.target as HTMLSelectElement).value;
    if (!id || !students.some((item) => item.id === id)) return;
    selectedPromotionStudentId = id;
    await openPromotion(id);
  });

  document.querySelector('#save-promotion-review')?.addEventListener('click', async () => {
    const student = students.find((item) => item.id === selectedPromotionStudentId);
    if (student) await savePromotionReview(student);
  });

  document.querySelector('#curriculum-student')?.addEventListener('change', async (event) => {
    const id = (event.target as HTMLSelectElement).value;
    const student = students.find((item) => item.id === id);
    if (!student) return;
    selectedStudentId = student.id;
    progressYear = student.current_year;
    await openStudentProgress(student);
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

  document.querySelectorAll<HTMLElement>('[data-action="promotion"]').forEach((button) => {
    button.addEventListener('click', () => void openPromotion());
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
