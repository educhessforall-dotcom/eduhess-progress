# EduChess Academy OS — Foundation

Production foundation for the EduChess Academy Management System.

The current HTML application is retained as `EduChess_Professional_Academy_App.prototype.html` for UI/reference comparison. The production application will use Vite + TypeScript on GitHub Pages and Supabase for Postgres, Auth, Storage and server-side functions.

## Build order

1. Create/link Supabase project.
2. Apply `supabase/migrations/*.sql` in order.
3. Load `supabase/seed/curriculum.sql`.
4. Create the academy owner/admin and coach roles.
5. Migrate the existing localStorage data with an explicit import tool.
6. Rebuild the dashboard against Supabase.
7. Move promotion calculation to the server.
8. Add certificate issuance, QR generation and public verification.
9. Add parent/student portals.

## Security rule

Never commit `.env` or Supabase secret/service-role keys. The browser uses only the publishable/anon key. Privileged certificate operations belong in server-side functions.
