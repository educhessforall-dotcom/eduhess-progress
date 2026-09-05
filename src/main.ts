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

let students: Student[] = [];
let academyId = '';
let currentView = 'dashboard';

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

  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">ACADEMY MANAGEMENT</p>
        <h2>Dashboard</h2>
      </div>

      <div class="admin-area">
        <div class="admin-avatar">EA</div>
        <div>
          <strong>Academy Admin</strong>
          <span>Administrator</span>
        </div>
      </div>
    </header>

    <section class="welcome">
      <div>
        <p class="eyebrow">EDUCHESS ACADEMY</p>
        <h3>Welcome back</h3>
        <p>
          Monitor student learning, curriculum progress,
          assessments and promotion readiness from one place.
        </p>
      </div>

      <div class="current-year">
        <span>ACADEMIC YEAR</span>
        <strong>2026–2027</strong>
      </div>
    </section>

    <section class="stats-grid">

      <article class="stat-card">
        <div class="stat-icon">♙</div>
        <div>
          <span>ACTIVE STUDENTS</span>
          <strong>${activeStudents}</strong>
          <small>Currently enrolled</small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon">▤</div>
        <div>
          <span>LESSONS COMPLETED</span>
          <strong>0 / 240</strong>
          <small>Across the academy</small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon">✓</div>
        <div>
          <span>FULLY ASSESSED</span>
          <strong>0</strong>
          <small>Students with complete records</small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon">★</div>
        <div>
          <span>READY FOR PROMOTION</span>
          <strong>0</strong>
          <small>Awaiting final review</small>
        </div>
      </article>

    </section>

    <section class="content-grid">

      <article class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">CURRICULUM</p>
            <h3>Six-Year Academy Programme</h3>
          </div>
          <span class="badge">240 Lessons</span>
        </div>

        <div class="year-list">
          ${curriculumYears.map((year, index) => `
            <div class="year-row">
              <div class="year-number">${String(index + 1).padStart(2, '0')}</div>
              <div class="year-info">
                <strong>${year[0]}</strong>
                <span>${year[1]}</span>
              </div>
              <div class="progress">
                <div class="progress-track">
                  <div class="progress-bar" style="width:0%"></div>
                </div>
                <span>0 / 40</span>
              </div>
            </div>
          `).join('')}
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">ACADEMY STATUS</p>
            <h3>Management Overview</h3>
          </div>
        </div>

        <div class="status-list">

          <div class="status-item">
            <div class="status-symbol">♙</div>
            <div>
              <strong>Student Records</strong>
              <span>${students.length} student record${students.length === 1 ? '' : 's'}</span>
            </div>
            <span class="status-dot ${students.length ? 'complete' : 'pending'}"></span>
          </div>

          <div class="status-item">
            <div class="status-symbol">✓</div>
            <div>
              <strong>Assessments</strong>
              <span>CP1, Mid-Year, CP2 and Final</span>
            </div>
            <span class="status-dot pending"></span>
          </div>

          <div class="status-item">
            <div class="status-symbol">◷</div>
            <div>
              <strong>Attendance</strong>
              <span>Class attendance tracking</span>
            </div>
            <span class="status-dot pending"></span>
          </div>

          <div class="status-item">
            <div class="status-symbol">★</div>
            <div>
              <strong>Promotion</strong>
              <span>Annual promotion readiness</span>
            </div>
            <span class="status-dot pending"></span>
          </div>

        </div>
      </article>

    </section>

    <section class="bottom-grid">

      <article class="panel quick-panel">
        <p class="eyebrow">QUICK ACTIONS</p>
        <h3>Academy Operations</h3>

        <div class="quick-actions">
          <button data-action="add-student">＋ Add Student</button>
          <button data-action="students">♙ View Students</button>
          <button>✓ Record Assessment</button>
          <button>◷ Mark Attendance</button>
        </div>
      </article>

      <article class="panel standards-panel">
        <p class="eyebrow">PROMOTION STANDARD</p>
        <h3>Annual Promotion</h3>
        <div class="standard-score">
          <strong>110</strong>
          <span>/ 275 minimum overall</span>
        </div>
        <p>
          Promotion also requires the year-specific
          practical board minimum.
        </p>
      </article>

    </section>

    <footer class="footer">
      <span>EduChess Academy OS</span>
      <span>Six-Year Professional Chess Development System</span>
    </footer>
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

          <button class="nav-item" data-view="curriculum">
            ▤ <span>Curriculum</span>
          </button>

          <button class="nav-item" data-view="assessments">
            ✓ <span>Assessments</span>
          </button>

          <button class="nav-item" data-view="attendance">
            ◷ <span>Attendance</span>
          </button>

          <button class="nav-item" data-view="promotion">
            ★ <span>Promotion</span>
          </button>

          <button class="nav-item" data-view="certificates">
            🎓 <span>Certificates</span>
          </button>

          <button class="nav-item" data-view="reports">
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
