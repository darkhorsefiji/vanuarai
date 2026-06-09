-- 006: store the Google profile photo URL so the header avatar can show it.
alter table users add column if not exists photo_url text;
