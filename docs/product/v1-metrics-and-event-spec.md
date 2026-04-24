# V1 Metrics and Event Spec

## 1) North Star Metric

`deliveredCareerCards`

Definition:
Number of unique users who both:
1) publish a complete career card, and
2) share/open the published link for application/interview delivery.

Why:
This captures the full product promise: create + deliver, not only edit.

## 2) Funnel Metrics

### Funnel A: Create to Publish
1. `resume_upload_started`
2. `resume_parse_succeeded`
3. `confirm_step_completed`
4. `first_publish_completed`

Primary KPI:
`first_publish_conversion = first_publish_completed / resume_upload_started`

### Funnel B: Publish to Share
1. `first_publish_completed`
2. `share_link_copied` or `share_qr_downloaded`
3. `public_card_opened`

Primary KPI:
`first_share_conversion = (share_link_copied + share_qr_downloaded unique users) / first_publish_completed`

### Funnel C: Interview Presentation
1. `presentation_mode_started`
2. `presentation_section_viewed` (per section)
3. `presentation_completed`

Primary KPI:
`presentation_completion_rate = presentation_completed / presentation_mode_started`

### Funnel D: Interviewer Engagement
1. `public_card_opened`
2. `public_card_active_30s`
3. `public_card_scroll_depth_60`

Primary KPI:
`viewer_effective_engagement_rate = public_card_active_30s / public_card_opened`

## 3) Event Definition (V1)

All events should include:
- `user_id` (or anonymous id)
- `session_id`
- `card_id`
- `timestamp`
- `source` (`edit`, `public`, `presentation`, `share`)

### Core events

- `resume_upload_started`
  - props: `file_size`, `file_type`
- `resume_parse_succeeded`
  - props: `parse_duration_ms`, `timeline_count`, `skill_count`, `education_count`
- `resume_parse_failed`
  - props: `error_code`, `error_message`
- `confirm_step_completed`
  - props: `manual_edits_count`
- `first_publish_completed`
  - props: `slug_length`, `has_role_understanding_module`
- `share_link_copied`
  - props: `link_type` (`portable`, `short`)
- `share_qr_downloaded`
  - props: `qr_type` (`portable`, `short_fallback`)
- `public_card_opened`
  - props: `channel` (`link`, `qr`)
- `public_card_active_30s`
  - props: `active_seconds`
- `public_card_scroll_depth_60`
  - props: `max_scroll_depth`
- `presentation_mode_started`
  - props: `section_count`
- `presentation_section_viewed`
  - props: `section_id`, `view_duration_ms`
- `presentation_completed`
  - props: `total_duration_ms`

## 4) Data Rules and Attribution

- Unique user for funnel conversion uses `user_id` when available, otherwise anonymous id.
- `first_publish_completed` only counted once per user.
- `presentation_completed` requires viewing all required sections at least once.
- Engagement events are de-duplicated by (`card_id`, `session_id`).

## 5) V1 Reporting Cadence

- Daily dashboard:
  - first publish conversion
  - first share conversion
  - presentation completion rate
  - viewer effective engagement rate
- Weekly review:
  - drop-off diagnosis by funnel step
  - top parse failure reasons
  - role understanding module completion trend
