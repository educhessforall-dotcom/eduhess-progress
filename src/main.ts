import './styles/global.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App container not found.');
}

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
        <button class="nav-item active">⌂ <span>Dashboard</span></button>
        <button class="nav-item">♙ <span>Students</span></button>
        <button class="nav-item">▤ <span>Curriculum</span></button>
        <button class="nav-item">✓ <span>Assessments</span></button>
        <button class="nav-item">◷ <span>Attendance</span></button>
        <button class="nav-item">★ <span>Promotion</span></button>
        <button class="nav-item">🎓 <span>Certificates</span></button>
        <button class="nav-item">▥ <span>Reports</span></button>
      </nav>

      <div class="sidebar-footer">
        <strong>EduChess Academy</strong>
        <span>Professional Management System</span>
      </div>
    </aside>

    <main class="main-content">

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
            <strong>0</strong>
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

            <div class="year-row">
              <div class="year-number">01</div>
              <div class="year-info">
                <strong>Foundation</strong>
                <span>Rules, board vision, simple tactics and basic mates</span>
              </div>
              <div class="progress">
                <div class="progress-track">
                  <div class="progress-bar" style="width:0%"></div>
                </div>
                <span>0 / 40</span>
              </div>
            </div>

            <div class="year-row">
              <div class="year-number">02</div>
              <div class="year-info">
                <strong>Early Development</strong>
                <span>Pattern growth, opening logic and attack basics</span>
              </div>
              <div class="progress">
                <div class="progress-track">
                  <div class="progress-bar" style="width:0%"></div>
                </div>
                <span>0 / 40</span>
              </div>
            </div>

            <div class="year-row">
              <div class="year-number">03</div>
              <div class="year-info">
                <strong>Core Competitive</strong>
                <span>Thinking process, candidate moves and rook endings</span>
              </div>
              <div class="progress">
                <div class="progress-track">
                  <div class="progress-bar" style="width:0%"></div>
                </div>
                <span>0 / 40</span>
              </div>
            </div>

            <div class="year-row">
              <div class="year-number">04</div>
              <div class="year-info">
                <strong>Competitive Intermediate</strong>
                <span>Planning, positional play and practical skill</span>
              </div>
              <div class="progress">
                <div class="progress-track">
                  <div class="progress-bar" style="width:0%"></div>
                </div>
                <span>0 / 40</span>
              </div>
            </div>

            <div class="year-row">
              <div class="year-number">05</div>
              <div class="year-info">
                <strong>Advanced Club</strong>
                <span>Prophylaxis, imbalances and advanced practical play</span>
              </div>
              <div class="progress">
                <div class="progress-track">
                  <div class="progress-bar" style="width:0%"></div>
                </div>
                <span>0 / 40</span>
              </div>
            </div>

            <div class="year-row">
              <div class="year-number">06</div>
              <div class="year-info">
                <strong>Academy Mastery</strong>
                <span>Independent training, preparation and capstone analysis</span>
              </div>
              <div class="progress">
                <div class="progress-track">
                  <div class="progress-bar" style="width:0%"></div>
                </div>
                <span>0 / 40</span>
              </div>
            </div>

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
                <span>Manage profiles and enrollments</span>
              </div>
              <span class="status-dot pending"></span>
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
            <button>＋ Add Student</button>
            <button>▤ View Curriculum</button>
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

    </main>
  </div>
`;
