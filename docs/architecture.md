# Architecture

GitHub Pages hosts the static frontend. Supabase is the source of truth.

Domains:
- app.educhessacademy.com — authenticated academy application
- verify.educhessacademy.com — public certificate verification

Core domains:
Academy → Students → Curriculum → Progress → Attendance → Assessments → Promotion → Certificates.

Promotion and certificate issuance are server-authoritative. The browser displays results but cannot manufacture a promotion/certificate.
