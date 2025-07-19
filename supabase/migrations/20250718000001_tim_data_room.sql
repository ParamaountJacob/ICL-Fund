-- Create storage bucket for Tim's data room
insert into storage.buckets (id, name, public) values ('tim-data-room', 'tim-data-room', true);

-- Create RLS policies for the bucket
create policy "Anyone can upload files to tim-data-room" on storage.objects for insert with check (bucket_id = 'tim-data-room');
create policy "Anyone can view files in tim-data-room" on storage.objects for select using (bucket_id = 'tim-data-room');
create policy "Anyone can delete files from tim-data-room" on storage.objects for delete using (bucket_id = 'tim-data-room');

-- Create table for data room requests
create table if not exists data_room_requests (
  id uuid primary key default gen_random_uuid(),
  request text not null,
  created_at timestamp with time zone default now(),
  status text default 'pending'
);

-- Enable RLS on requests table
alter table data_room_requests enable row level security;

-- Create policy for inserting requests (anyone can request)
create policy "Anyone can submit data room requests" on data_room_requests for insert with check (true);

-- Create policy for reading requests (for admin only - you can modify this)
create policy "Anyone can view requests" on data_room_requests for select using (true);
