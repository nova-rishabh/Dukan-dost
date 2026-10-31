-- Fictional demo shop. No real names, phone numbers or UPI ids.
insert into shops (id, name, upi_vpa, is_demo)
values ('00000000-0000-4000-8000-000000000001', 'Shree Ganesh Kirana', 'demo.shop@invalid', true)
on conflict (id) do nothing;

insert into customers (id, shop_id, display_name, area, name_roman, name_devanagari, aliases) values
 ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Amit Sharma',    'Block A',     'amit sharma',    'अमित शर्मा',   '{"amit ji"}'),
 ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'R K Sharma',     'Block B',     'r k sharma',     'आर के शर्मा',  '{"rk sharma"}'),
 ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'Gupta ji',       'Market road', 'gupta ji',       'गुप्ता जी',    '{}'),
 ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001', 'Pinky didi',     'Gali 3',      'pinky didi',     'पिंकी दीदी',   '{}'),
 ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000001', 'Suresh Verma',   'Gali 5',      'suresh verma',   'सुरेश वर्मा',  '{"verma ji"}'),
 ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000001', 'Tapan Banerjee', 'Park side',   'tapan banerjee', 'तपन बनर्जी',   '{"banerjee babu","mrs banerjee"}'),
 ('00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000001', 'Ramesh Yadav',   'Chowk',       'ramesh yadav',   'रमेश यादव',    '{}'),
 ('00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000001', 'Meena Devi',     'Gali 2',      'meena devi',     'मीना देवी',    '{"meena aunty"}')
on conflict (id) do nothing;

insert into entries (shop_id, customer_id, type, amount_paise, source_text, source, idempotency_key, confirmed_at) values
 ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'credit_given',     180000, 'Amit Sharma ko 1800 ka saman udhaar', 'text', 'seed-1',  now() - interval '6 days'),
 ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'payment_received',  60000, 'Amit Sharma ne 600 diye',             'text', 'seed-2',  now() - interval '3 days'),
 ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'credit_given',      45000, 'R K Sharma ne 450 udhaar liye',       'text', 'seed-3',  now() - interval '4 days'),
 ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'credit_given',     220000, 'Gupta ji ne 2200 udhaar liye',        'text', 'seed-4',  now() - interval '9 days'),
 ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'payment_received', 100000, 'Gupta ji ne 1000 wapas kar diye',    'text', 'seed-5',  now() - interval '2 days'),
 ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 'credit_given',      32000, 'Pinky didi ko 320 udhaar',            'text', 'seed-6',  now() - interval '5 days'),
 ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105', 'credit_given',      70000, 'Verma ji ke naam 700 likh do',        'text', 'seed-7',  now() - interval '8 days'),
 ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000106', 'credit_given',     125000, 'Banerjee babu ne 1250 udhaar liye',   'text', 'seed-8',  now() - interval '7 days'),
 ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000107', 'credit_given',       9000, 'Ramesh ko 90 udhaar',                 'text', 'seed-9',  now() - interval '1 day'),
 ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000108', 'credit_given',      54000, 'Meena aunty ne 540 udhaar liye',      'text', 'seed-10', now() - interval '10 days'),
 ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000108', 'payment_received',  54000, 'Meena aunty ne 540 diye',             'text', 'seed-11', now() - interval '1 day')
on conflict (shop_id, idempotency_key) do nothing;
