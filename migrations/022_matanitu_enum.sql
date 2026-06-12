-- 022: new top government level 'matanitu' (enum value only; used in 023).
alter type scope_level add value if not exists 'matanitu' before 'provincial_council';
