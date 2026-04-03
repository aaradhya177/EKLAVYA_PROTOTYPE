| Method | Path | Required Role | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | `public` | Returns database, Redis, Celery, and version health status. |
| `POST` | `/api/v1/auth/register` | `public` | Register a new user account. |
| `POST` | `/api/v1/auth/login` | `public` | Exchange email and password for access and refresh tokens. |
| `POST` | `/api/v1/auth/refresh` | `public` | Exchange a refresh token for a new access token. |
| `POST` | `/api/v1/auth/logout` | `authenticated` | Invalidate a refresh token. |
| `POST` | `/api/v1/uadp/athletes/` | `authenticated` | Register a new athlete profile. |
| `GET` | `/api/v1/uadp/athletes/{athlete_id}` | `own athlete / assigned coach / admin` | Fetch an athlete profile. |
| `POST` | `/api/v1/uadp/athletes/{athlete_id}/events` | `own athlete / assigned coach / admin` | Ingest a raw event for an athlete. |
| `GET` | `/api/v1/uadp/athletes/{athlete_id}/events` | `own athlete / assigned coach / admin` | List paginated athlete events with filters. |
| `GET` | `/api/v1/uadp/athletes/{athlete_id}/features` | `own athlete / assigned coach / admin` | Fetch latest feature snapshots for an athlete. |
| `POST` | `/api/v1/uadp/consent/{athlete_id}` | `own athlete / assigned coach / admin` | Upsert athlete consent by data category. |
| `GET` | `/api/v1/uadp/consent/{athlete_id}` | `own athlete / assigned coach / admin` | List athlete consent records. |
| `POST` | `/api/v1/performance/sessions/` | `own athlete / assigned coach / admin` | Log a training, competition, or recovery session. |
| `GET` | `/api/v1/performance/sessions/{athlete_id}` | `own athlete / assigned coach / admin` | List sessions for an athlete. |
| `GET` | `/api/v1/performance/sessions/{session_id}` | `own athlete / assigned coach / admin` | Fetch a single session detail record. |
| `POST` | `/api/v1/performance/sessions/{session_id}/metrics` | `own athlete / assigned coach / admin` | Append wearable metrics to a session. |
| `GET` | `/api/v1/performance/summary/{athlete_id}` | `own athlete / assigned coach / admin` | Fetch latest performance indices and percentiles. |
| `GET` | `/api/v1/performance/trend/{athlete_id}` | `own athlete / assigned coach / admin` | Fetch time series data for one performance index. |
| `GET` | `/api/v1/performance/alerts/{athlete_id}` | `own athlete / assigned coach / admin` | Return threshold-based workload alerts. |
| `POST` | `/api/v1/injury/records/` | `own athlete / assigned coach / admin` | Log an injury record. |
| `GET` | `/api/v1/injury/records/{athlete_id}` | `own athlete / assigned coach / admin` | Fetch injury history for an athlete. |
| `GET` | `/api/v1/injury/risk/{athlete_id}` | `own athlete / assigned coach / admin` | Get the latest injury risk score and factors. |
| `POST` | `/api/v1/injury/risk/{athlete_id}/compute` | `own athlete / assigned coach / admin` | Queue a recomputation of injury risk. |
| `GET` | `/api/v1/injury/alerts/` | `federation_admin` | List athletes with high or critical injury risk. |
| `POST` | `/api/v1/career/goals/` | `own athlete / assigned coach / admin` | Create a career goal. |
| `GET` | `/api/v1/career/goals/{athlete_id}` | `own athlete / assigned coach / admin` | List career goals for an athlete. |
| `POST` | `/api/v1/career/milestones/` | `own athlete / assigned coach / admin` | Log a career milestone. |
| `GET` | `/api/v1/career/milestones/{athlete_id}` | `own athlete / assigned coach / admin` | Fetch milestone history. |
| `POST` | `/api/v1/career/plans/` | `own athlete / assigned coach / admin` | Create a development plan with periodization blocks. |
| `GET` | `/api/v1/career/plans/{athlete_id}` | `own athlete / assigned coach / admin` | Fetch the current active development plan. |
| `GET` | `/api/v1/career/signals/{athlete_id}` | `own athlete / assigned coach / admin` | Fetch the latest talent signal for an athlete. |
| `GET` | `/api/v1/career/signals/federation/all` | `federation_admin` | List all talent signals for federation review. |
| `POST` | `/api/v1/financial/income/` | `own athlete / assigned coach / admin` | Log an income record. |
| `POST` | `/api/v1/financial/expenses/` | `own athlete / assigned coach / admin` | Log an expense record. |
| `GET` | `/api/v1/financial/summary/{athlete_id}/{fiscal_year}` | `own athlete / assigned coach / admin` | Fetch or compute an annual financial summary. |
| `GET` | `/api/v1/financial/forecast/{athlete_id}` | `own athlete / assigned coach / admin` | Fetch a 12-month cashflow forecast. |
| `GET` | `/api/v1/financial/grants/{athlete_id}` | `own athlete / assigned coach / admin` | List grant records for an athlete. |
| `GET` | `/api/v1/financial/grants/eligible/{athlete_id}` | `own athlete / assigned coach / admin` | Return eligible grant schemes from YAML rules. |
| `POST` | `/api/v1/ml/train/injury` | `sys_admin` | Queue retraining of the injury risk model. |
| `POST` | `/api/v1/ml/train/performance` | `sys_admin` | Queue retraining of per-sport performance forecasting models. |
| `GET` | `/api/v1/ml/models/` | `authenticated` | List registered ML models and their metrics. |
| `GET` | `/api/v1/ml/injury/explain/{athlete_id}` | `own athlete / assigned coach / admin` | Return SHAP-based or rule-based injury risk explanations. |
| `POST` | `/api/v1/integrations/sai-sync` | `authenticated` | Accept an SAI athlete export payload and log it to the event stream. |
| `POST` | `/api/v1/integrations/competition-feed` | `authenticated` | Accept a competition result webhook payload and log it to the event stream. |
