# Security

- Enable RLS on every exposed application table.
- Browser gets only the Supabase publishable/anon key.
- Never expose service-role/secret keys.
- Public certificate verification returns only public fields.
- Certificate issuance/revocation is server-side.
- Add RLS allow/deny tests before production.
