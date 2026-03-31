-- KegelTN demo data seeding
--
-- Paste this into the Supabase SQL editor, then edit only the config section
-- inside the DO block before running it.
--
-- What this seeds:
-- - workouts
-- - exercise_completions
--
-- What this does not touch:
-- - auth.users
-- - quiz_results
--
-- Available profiles:
-- - new_user
-- - warming_up
-- - consistent_user
-- - elite_user
--
-- Notes:
-- - workouts.program stores the exercise ID in this app
-- - completed_at values are backdated from "now()" so streaks and weekly charts light up
-- - rerunning with clear_existing_data = true replaces the user's demo stats cleanly

do $$
declare
  target_email text := 'demo-elite@kegeltn.app';
  target_profile text := 'elite_user';
  clear_existing_data boolean := true;

  v_user_id uuid;
  v_pelvic_tilt uuid;
  v_heel_glute_bridge uuid;
  v_rear_decline_bridge uuid;
  v_child_pose uuid;
  v_lying_butterfly uuid;
  v_90_to_90_advanced uuid;
  v_kneeling_ab_draw_in uuid;
  v_glute_march uuid;
  v_squat_side_bends uuid;
begin
  select id
  into v_user_id
  from auth.users
  where email = target_email
  limit 1;

  if v_user_id is null then
    raise exception 'No auth.users row found for %', target_email;
  end if;

  select id into v_pelvic_tilt from exercises where name = 'Pelvic Tilt' limit 1;
  select id into v_heel_glute_bridge from exercises where name = 'Heel Glute Bridge' limit 1;
  select id into v_rear_decline_bridge from exercises where name = 'Rear Decline Bridge' limit 1;
  select id into v_child_pose from exercises where name = 'Child Pose' limit 1;
  select id into v_lying_butterfly from exercises where name = 'Lying Butterfly' limit 1;
  select id into v_90_to_90_advanced from exercises where name = '90 to 90 Advanced' limit 1;
  select id into v_kneeling_ab_draw_in from exercises where name = 'Kneeling Ab Draw In' limit 1;
  select id into v_glute_march from exercises where name = 'Glute March' limit 1;
  select id into v_squat_side_bends from exercises where name = 'Squat Side Bends' limit 1;

  if v_pelvic_tilt is null
    or v_heel_glute_bridge is null
    or v_rear_decline_bridge is null
    or v_child_pose is null
    or v_lying_butterfly is null
    or v_90_to_90_advanced is null
    or v_kneeling_ab_draw_in is null
    or v_glute_march is null
    or v_squat_side_bends is null then
    raise exception 'One or more active exercises were not found in the exercises table.';
  end if;

  if clear_existing_data then
    delete from exercise_completions where user_id = v_user_id;
    delete from workouts where user_id = v_user_id;
  end if;

  if target_profile = 'new_user' then
    raise notice 'Seeded % as new_user: no workouts or completions inserted.', target_email;
    return;
  elsif target_profile = 'warming_up' then
    insert into workouts (user_id, program, duration_seconds, completed_at)
    values
      (v_user_id, v_pelvic_tilt, 300, now() - interval '6 days' + interval '07 hours'),
      (v_user_id, v_child_pose, 360, now() - interval '4 days' + interval '08 hours'),
      (v_user_id, v_kneeling_ab_draw_in, 420, now() - interval '2 days' + interval '06 hours'),
      (v_user_id, v_pelvic_tilt, 360, now() - interval '1 day' + interval '07 hours');

    insert into exercise_completions (user_id, exercise_id, completed_at)
    values
      (v_user_id, v_pelvic_tilt, now() - interval '6 days' + interval '07 hours'),
      (v_user_id, v_child_pose, now() - interval '4 days' + interval '08 hours'),
      (v_user_id, v_kneeling_ab_draw_in, now() - interval '2 days' + interval '06 hours')
    on conflict (user_id, exercise_id) do update
    set completed_at = excluded.completed_at;

    raise notice 'Seeded % as warming_up: 4 workouts, 3 exercise completions.', target_email;
    return;
  elsif target_profile = 'consistent_user' then
    insert into workouts (user_id, program, duration_seconds, completed_at)
    values
      (v_user_id, v_pelvic_tilt, 360, now() - interval '11 days' + interval '07 hours'),
      (v_user_id, v_child_pose, 420, now() - interval '10 days' + interval '08 hours'),
      (v_user_id, v_kneeling_ab_draw_in, 480, now() - interval '9 days' + interval '06 hours'),
      (v_user_id, v_heel_glute_bridge, 420, now() - interval '7 days' + interval '07 hours'),
      (v_user_id, v_lying_butterfly, 480, now() - interval '6 days' + interval '08 hours'),
      (v_user_id, v_glute_march, 540, now() - interval '5 days' + interval '06 hours'),
      (v_user_id, v_pelvic_tilt, 360, now() - interval '4 days' + interval '07 hours'),
      (v_user_id, v_child_pose, 420, now() - interval '3 days' + interval '08 hours'),
      (v_user_id, v_kneeling_ab_draw_in, 480, now() - interval '2 days' + interval '06 hours'),
      (v_user_id, v_heel_glute_bridge, 420, now() - interval '1 day' + interval '07 hours'),
      (v_user_id, v_lying_butterfly, 540, now() - interval '12 hours'),
      (v_user_id, v_glute_march, 300, now() - interval '2 hours');

    insert into exercise_completions (user_id, exercise_id, completed_at)
    values
      (v_user_id, v_pelvic_tilt, now() - interval '11 days' + interval '07 hours'),
      (v_user_id, v_child_pose, now() - interval '10 days' + interval '08 hours'),
      (v_user_id, v_kneeling_ab_draw_in, now() - interval '9 days' + interval '06 hours'),
      (v_user_id, v_heel_glute_bridge, now() - interval '7 days' + interval '07 hours'),
      (v_user_id, v_lying_butterfly, now() - interval '6 days' + interval '08 hours'),
      (v_user_id, v_glute_march, now() - interval '5 days' + interval '06 hours')
    on conflict (user_id, exercise_id) do update
    set completed_at = excluded.completed_at;

    raise notice 'Seeded % as consistent_user: 12 workouts, 6 exercise completions, active streak.', target_email;
    return;
  elsif target_profile = 'elite_user' then
    insert into workouts (user_id, program, duration_seconds, completed_at)
    values
      (v_user_id, v_pelvic_tilt, 360, now() - interval '20 days' + interval '07 hours'),
      (v_user_id, v_child_pose, 420, now() - interval '19 days' + interval '08 hours'),
      (v_user_id, v_kneeling_ab_draw_in, 480, now() - interval '18 days' + interval '06 hours'),
      (v_user_id, v_heel_glute_bridge, 420, now() - interval '17 days' + interval '07 hours'),
      (v_user_id, v_lying_butterfly, 480, now() - interval '17 days' + interval '18 hours'),
      (v_user_id, v_glute_march, 540, now() - interval '16 days' + interval '06 hours'),
      (v_user_id, v_rear_decline_bridge, 600, now() - interval '15 days' + interval '07 hours'),
      (v_user_id, v_90_to_90_advanced, 600, now() - interval '15 days' + interval '18 hours'),
      (v_user_id, v_squat_side_bends, 660, now() - interval '14 days' + interval '06 hours'),
      (v_user_id, v_pelvic_tilt, 360, now() - interval '13 days' + interval '07 hours'),
      (v_user_id, v_child_pose, 420, now() - interval '12 days' + interval '08 hours'),
      (v_user_id, v_kneeling_ab_draw_in, 480, now() - interval '11 days' + interval '06 hours'),
      (v_user_id, v_heel_glute_bridge, 420, now() - interval '10 days' + interval '07 hours'),
      (v_user_id, v_lying_butterfly, 480, now() - interval '9 days' + interval '08 hours'),
      (v_user_id, v_glute_march, 540, now() - interval '8 days' + interval '06 hours'),
      (v_user_id, v_rear_decline_bridge, 600, now() - interval '7 days' + interval '07 hours'),
      (v_user_id, v_90_to_90_advanced, 600, now() - interval '6 days' + interval '08 hours'),
      (v_user_id, v_squat_side_bends, 660, now() - interval '5 days' + interval '06 hours'),
      (v_user_id, v_pelvic_tilt, 360, now() - interval '4 days' + interval '07 hours'),
      (v_user_id, v_child_pose, 420, now() - interval '4 days' + interval '18 hours'),
      (v_user_id, v_kneeling_ab_draw_in, 480, now() - interval '3 days' + interval '06 hours'),
      (v_user_id, v_heel_glute_bridge, 420, now() - interval '3 days' + interval '19 hours'),
      (v_user_id, v_lying_butterfly, 480, now() - interval '2 days' + interval '08 hours'),
      (v_user_id, v_glute_march, 540, now() - interval '2 days' + interval '18 hours'),
      (v_user_id, v_rear_decline_bridge, 600, now() - interval '1 day' + interval '07 hours'),
      (v_user_id, v_90_to_90_advanced, 600, now() - interval '1 day' + interval '18 hours'),
      (v_user_id, v_squat_side_bends, 660, now() - interval '6 hours'),
      (v_user_id, v_pelvic_tilt, 300, now() - interval '90 minutes');

    insert into exercise_completions (user_id, exercise_id, completed_at)
    values
      (v_user_id, v_pelvic_tilt, now() - interval '20 days' + interval '07 hours'),
      (v_user_id, v_heel_glute_bridge, now() - interval '17 days' + interval '07 hours'),
      (v_user_id, v_rear_decline_bridge, now() - interval '15 days' + interval '07 hours'),
      (v_user_id, v_child_pose, now() - interval '19 days' + interval '08 hours'),
      (v_user_id, v_lying_butterfly, now() - interval '17 days' + interval '18 hours'),
      (v_user_id, v_90_to_90_advanced, now() - interval '15 days' + interval '18 hours'),
      (v_user_id, v_kneeling_ab_draw_in, now() - interval '18 days' + interval '06 hours'),
      (v_user_id, v_glute_march, now() - interval '16 days' + interval '06 hours'),
      (v_user_id, v_squat_side_bends, now() - interval '14 days' + interval '06 hours')
    on conflict (user_id, exercise_id) do update
    set completed_at = excluded.completed_at;

    raise notice 'Seeded % as elite_user: 28 workouts, all 9 active exercises completed, strong current streak.', target_email;
    return;
  else
    raise exception 'Unknown target_profile: %. Use new_user, warming_up, consistent_user, or elite_user.', target_profile;
  end if;
end $$;
