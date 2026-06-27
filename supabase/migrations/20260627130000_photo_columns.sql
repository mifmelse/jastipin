-- Photo/proof columns for the revamp (FASE A3). All nullable, stored in the
-- existing 'media' Storage bucket. customers.image_url & products.image_url
-- already exist.

alter table brands       add column if not exists image_url text;   -- brand logo
alter table order_items  add column if not exists image_url text;   -- drop-in item photo (shopper reference)
alter table profiles     add column if not exists avatar_url text;  -- user avatar
alter table payments     add column if not exists proof_url text;   -- payment proof
