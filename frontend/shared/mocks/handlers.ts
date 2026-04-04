import { HttpResponse, http } from "msw";

import {
  alertFixture,
  athleteFixture,
  authTokensFixture,
  authUserFixture,
  developmentPlanFixture,
  eligibleGrantFixtures,
  envelope,
  eventFixture,
  expenseFixture,
  featureFixtures,
  fileFixture,
  financialSummaryFixture,
  forecastFixtures,
  goalFixtures,
  grantFixtures,
  incomeFixture,
  injuryFixtures,
  milestoneFixtures,
  notificationsFixture,
  preferencesFixture,
  performanceSummaryFixture,
  registerPayloadFixture,
  riskAlertsFixture,
  riskScoreFixture,
  sessionFixture,
  shapFixtures,
  talentSignalFixture,
  trendFixture
} from "./fixtures";

const baseUrl = "http://localhost:8000";

export const handlers = [
  http.post(`${baseUrl}/auth/login`, async () => HttpResponse.json(envelope(authTokensFixture))),
  http.post(`${baseUrl}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as typeof registerPayloadFixture;
    return HttpResponse.json(envelope({ ...authUserFixture, email: body.email, name: body.name }));
  }),
  http.post(`${baseUrl}/auth/refresh`, async () => HttpResponse.json(envelope(authTokensFixture))),
  http.post(`${baseUrl}/auth/logout`, async () => HttpResponse.json(envelope(null))),

  http.get(`${baseUrl}/athletes/:id`, async () => HttpResponse.json(envelope(athleteFixture))),
  http.patch(`${baseUrl}/athletes/:id`, async ({ request }) => {
    const body = (await request.json()) as Partial<typeof athleteFixture>;
    return HttpResponse.json(envelope({ ...athleteFixture, ...body }));
  }),
  http.post(`${baseUrl}/athletes/:id/events`, async () => HttpResponse.json(envelope(eventFixture))),
  http.get(`${baseUrl}/athletes/:id/features`, async () => HttpResponse.json(envelope(featureFixtures))),

  http.post(`${baseUrl}/performance/sessions`, async () => HttpResponse.json(envelope(sessionFixture))),
  http.get(`${baseUrl}/performance/athletes/:id/sessions`, async () =>
    HttpResponse.json(envelope({ ...notificationsFixture, items: [sessionFixture] }))
  ),
  http.get(`${baseUrl}/performance/athletes/:id/summary`, async () =>
    HttpResponse.json(envelope(performanceSummaryFixture))
  ),
  http.get(`${baseUrl}/performance/athletes/:id/trend`, async () =>
    HttpResponse.json(envelope(trendFixture))
  ),
  http.get(`${baseUrl}/performance/athletes/:id/alerts`, async () =>
    HttpResponse.json(envelope(alertFixture))
  ),

  http.get(`${baseUrl}/injury/athletes/:id/risk`, async () =>
    HttpResponse.json(envelope(riskScoreFixture))
  ),
  http.get(`${baseUrl}/injury/athletes/:id/explanation`, async () =>
    HttpResponse.json(envelope(shapFixtures))
  ),
  http.get(`${baseUrl}/injury/athletes/:id/history`, async () =>
    HttpResponse.json(envelope(injuryFixtures))
  ),
  http.post(`${baseUrl}/injury/log`, async () => HttpResponse.json(envelope(injuryFixtures[0]))),
  http.get(`${baseUrl}/injury/alerts`, async () => HttpResponse.json(envelope(riskAlertsFixture))),

  http.get(`${baseUrl}/career/athletes/:id/goals`, async () =>
    HttpResponse.json(envelope(goalFixtures))
  ),
  http.post(`${baseUrl}/career/goals`, async () => HttpResponse.json(envelope(goalFixtures[0]))),
  http.get(`${baseUrl}/career/athletes/:id/plan`, async () =>
    HttpResponse.json(envelope(developmentPlanFixture))
  ),
  http.post(`${baseUrl}/career/plans`, async () =>
    HttpResponse.json(envelope(developmentPlanFixture))
  ),
  http.get(`${baseUrl}/career/athletes/:id/milestones`, async () =>
    HttpResponse.json(envelope(milestoneFixtures))
  ),
  http.get(`${baseUrl}/career/athletes/:id/talent-signal`, async () =>
    HttpResponse.json(envelope(talentSignalFixture))
  ),

  http.get(`${baseUrl}/financial/athletes/:id/summary`, async () =>
    HttpResponse.json(envelope(financialSummaryFixture))
  ),
  http.get(`${baseUrl}/financial/athletes/:id/forecast`, async () =>
    HttpResponse.json(envelope(forecastFixtures))
  ),
  http.get(`${baseUrl}/financial/athletes/:id/grants`, async () =>
    HttpResponse.json(envelope(grantFixtures))
  ),
  http.get(`${baseUrl}/financial/athletes/:id/eligible-grants`, async () =>
    HttpResponse.json(envelope(eligibleGrantFixtures))
  ),
  http.post(`${baseUrl}/financial/income`, async () => HttpResponse.json(envelope(incomeFixture))),
  http.post(`${baseUrl}/financial/expense`, async () =>
    HttpResponse.json(envelope(expenseFixture))
  ),

  http.get(`${baseUrl}/notifications`, async () => HttpResponse.json(envelope(notificationsFixture))),
  http.get(`${baseUrl}/notifications/unread-count`, async () => HttpResponse.json(envelope(1))),
  http.post(`${baseUrl}/notifications/:id/read`, async () => HttpResponse.json(envelope(null))),
  http.post(`${baseUrl}/notifications/read-all`, async () => HttpResponse.json(envelope(null))),
  http.get(`${baseUrl}/notifications/preferences`, async () =>
    HttpResponse.json(envelope(preferencesFixture))
  ),
  http.put(`${baseUrl}/notifications/preferences`, async ({ request }) => {
    const body = (await request.json()) as typeof preferencesFixture;
    return HttpResponse.json(envelope(body));
  }),
  http.post(`${baseUrl}/notifications/devices`, async () => HttpResponse.json(envelope(null))),

  http.post(`${baseUrl}/files/upload-url`, async () =>
    HttpResponse.json(envelope({ uploadUrl: "https://upload.example.com/file", fileId: "file-1" }))
  ),
  http.post(`${baseUrl}/files/:id/confirm`, async () => HttpResponse.json(envelope(fileFixture))),
  http.get(`${baseUrl}/files/athletes/:id`, async () => HttpResponse.json(envelope([fileFixture]))),
  http.get(`${baseUrl}/files/:id/download-url`, async () =>
    HttpResponse.json(envelope("https://download.example.com/file"))
  ),
  http.delete(`${baseUrl}/files/:id`, async () => HttpResponse.json(envelope(null)))
];
