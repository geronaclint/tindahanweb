# TODO - Auth email login/register + settings profile email display

- [ ] Update DB schema.sql: add `email` column to `users`, unique, and (optionally) keep `username` as store name.
- [ ] Update `src/app/actions/auth.ts`:
  - [ ] `register`: accept `email`, `username` (store name), `password`, confirm_password; insert into `users(email, username, password_hash)`.
  - [ ] `login`: accept `email` + `password`; query `users` by `email`.
  - [ ] Create session with store name (`username`).
- [ ] Update `src/app/register/page.tsx`:
  - [ ] Add email field + store name field + password + confirm.
  - [ ] Ensure form field names match server actions (`email`, `username`, `password`, `confirm_password`).
- [ ] Update `src/app/login/page.tsx`:
  - [ ] Replace “Store Name” input with “Email”.
  - [ ] Ensure form field names: `email`, `password`.
- [ ] Update `src/app/(protected)/layout.tsx`:
  - [ ] Fetch and pass `email` to Navigation if needed (or keep current storeName/profilePhoto behavior).
- [ ] Update `src/app/api/settings/me/route.ts`:
  - [ ] Return `email` read-only along with username + profile_photo.
- [ ] Update `src/app/actions/settings.ts`:
  - [ ] Ensure email is not editable; only update storeName/password/profile_photo.
- [ ] Update `src/app/(protected)/settings/page.tsx`:
  - [ ] Display email read-only.
  - [ ] Keep store name editable.
- [ ] Verify mobile POS shows sidebar profile (Navigation is shared by layout already).
- [ ] Run `npm run lint` and `npm run build`.

