-- 016: restate resolution summaries without the status verb (the pill shows it),
-- and seed extra resolutions covering the full status range.
update resolutions set summary = 'Quarterly report and budget.'
where summary = 'Adopted quarterly report and budget.';
update resolutions set summary = 'Land allocation and lease matters.'
where summary = 'Approved land allocation and lease matters.';

insert into resolutions (minutes_id, ref_label, summary, status)
select m.id, x.ref, x.summary, x.status
from (values
  ('VR-2026/3', 'Purchase of a 20kVA generator for the village hall.',            'Deferred',  'Village Meeting — Q2 2026'),
  ('VR-2026/4', 'Hosting of the inter-village rugby tournament in August.',       'Approved',  'Village Meeting — Q2 2026'),
  ('VR-2026/5', 'Increase of the weekly soli contribution to FJD 5.',             'Rejected',  'Village Meeting — Q2 2026'),
  ('VR-2026/6', 'Concerns about stray pigs damaging gardens near the seawall.',   'Noted',     'Village Meeting — Q2 2026'),
  ('VR-2026/7', 'Subdivision of Parcel B for a new homestead.',                   'Withdrawn', 'Village Meeting — Q2 2026'),
  ('MR-A1-2026/2', 'Maintenance schedule for the farm access road boundary.',     'Deferred',  'Mataqali A1 Meeting — 2026 Q1'),
  ('MR-B1-2026/2', 'Lease renewal terms for the aquaculture ponds.',              'Approved',  'Mataqali B1 Meeting — 2026 Q1')
) as x(ref, summary, status, mtitle)
join minutes m on m.title = x.mtitle
where not exists (select 1 from resolutions r where r.ref_label = x.ref);
