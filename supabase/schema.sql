-- Create sales table
create table public.sales (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_first_name text not null,
  customer_last_name text not null,
  customer_phone text not null,
  sale_date date not null default current_date,
  price numeric not null,
  notes text,
  
  -- Distance Glasses
  distance_frame_model text,
  distance_lens_spec text,
  
  -- Near Glasses
  near_frame_model text,
  near_lens_spec text,
  
  -- Progressive Glasses
  progressive_frame_model text,
  progressive_lens_brand text,
  
  -- Contact Lenses
  contact_lens_brand text,
  contact_lens_quantity integer,
  contact_lens_number text
);

-- Enable Row Level Security (RLS)
alter table public.sales enable row level security;

-- Create policy to allow all operations for now (since it's an internal admin tool)
-- In a real production app with multiple tenants, you'd want stricter policies.
create policy "Allow all operations for authenticated users" on public.sales
  for all using (true) with check (true);
