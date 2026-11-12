import { test, expect } from "@playwright/test";

// Explicit UI fixtures, isolated from the real API journeys in marketplace.spec.js.
// These records are never shipped in the application or written to a database.
const member = {
  id: "ui-member",
  firstName: "QA",
  lastName: "Member",
  email: "ui-fixture@example.test",
  phoneNumber: "+27821234567",
  accountType: "BUSINESS",
  role: "USER",
};
const business = {
  id: "ui-business",
  ownerId: member.id,
  name: "QA Neighbourhood Shop",
  description: "Browser UI fixture for a community business.",
  category: "Retail",
  city: "Soweto",
  province: "Gauteng",
  address: "QA fixture address",
  email: "shop@example.test",
  phoneNumber: "+27821234567",
  averageRating: 4,
  reviewCount: 1,
  coverImageUrl: "/ui-fixture-photo.svg",
};
const worker = {
  id: "ui-worker",
  ownerId: member.id,
  displayName: "QA Local Worker",
  headline: "Community repairs",
  bio: "Browser UI fixture for public skills and service areas.",
  skills: ["Repairs", "Maintenance"],
  serviceCategories: ["Local services"],
  city: "Soweto",
  province: "Gauteng",
};
const job = {
  id: "ui-job",
  employerId: "ui-employer",
  employerName: "QA Employer",
  title: "QA local repair opportunity",
  description: "Browser UI fixture for a local job opportunity.",
  category: "Repairs",
  employmentType: "CONTRACT",
  status: "OPEN",
  city: "Soweto",
  province: "Gauteng",
};
const conversation = {
  id: "ui-conversation",
  participantId: "ui-neighbour",
  participantName: "QA Neighbour",
};
const notice = {
  id: "ui-notice",
  title: "QA application update",
  message: "Browser UI notification fixture.",
  resourceType: "JOB",
  resourceId: job.id,
  createdAt: "2026-11-12T10:00:00Z",
  readAt: null,
};
const report = {
  id: "ui-report",
  targetType: "JOB",
  targetId: job.id,
  targetSummary: "QA reported opportunity",
  details: "Browser UI moderation fixture.",
  reason: "SPAM",
  createdAt: "2026-11-12T10:00:00Z",
};
const pageOf = (content) => ({
  content,
  totalElements: content.length,
  totalPages: 1,
});
const guestPaths = ["/", "/onboarding", "/welcome", "/login", "/register"];

function currentMember(page) {
  const path = new URL(page.url()).pathname;
  return {
    ...member,
    accountType: path === "/worker-profile" ? "WORKER" : "BUSINESS",
    role: path === "/admin/reports" ? "ADMIN" : "USER",
  };
}

async function fixtures(page) {
  const requests = [];
  await page.addInitScript(
    ({ member, guestPaths }) => {
      if (guestPaths.includes(location.pathname)) {
        localStorage.removeItem("kasicircle_token");
        localStorage.removeItem("kasicircle_user");
      } else {
        const user = {
          ...member,
          accountType:
            location.pathname === "/worker-profile" ? "WORKER" : "BUSINESS",
          role: location.pathname === "/admin/reports" ? "ADMIN" : "USER",
        };
        localStorage.setItem("kasicircle_token", "browser-ui-fixture-token");
        localStorage.setItem("kasicircle_user", JSON.stringify(user));
      }
    },
    { member, guestPaths },
  );
  await page.route("**/ui-fixture-photo.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#d8e8bf"/><circle cx="320" cy="50" r="30" fill="#f3edc7"/><rect x="110" y="100" width="180" height="120" fill="#fff8e7"/><path d="M90 100L130 45H270L310 100Z" fill="#235c42"/><path d="M90 100H310V120H90Z" fill="#eab565"/><rect x="135" y="140" width="55" height="40" fill="#a6b7a2"/><rect x="220" y="140" width="40" height="80" fill="#235c42"/></svg>',
    }),
  );
  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    requests.push(url);
    let response;
    if (path === "/api/users/me") response = currentMember(page);
    else if (path === "/api/businesses" || path === "/api/users/me/businesses")
      response = pageOf([business]);
    else if (path === `/api/businesses/${business.id}`) response = business;
    else if (path.endsWith("/reviews/summary"))
      response = {
        totalReviews: 1,
        averageRating: 4,
        fiveStarCount: 0,
        fourStarCount: 1,
        threeStarCount: 0,
        twoStarCount: 0,
        oneStarCount: 0,
      };
    else if (path.endsWith("/reviews/me"))
      return route.fulfill({ status: 204 });
    else if (path.endsWith("/reviews"))
      response = pageOf([
        {
          id: "ui-review",
          authorName: "QA Customer",
          rating: 4,
          comment: "Browser UI feedback fixture.",
          createdAt: "2026-11-12T10:00:00Z",
        },
      ]);
    else if (path.endsWith("/images"))
      response = [1, 2].map((index) => ({
        id: `ui-photo-${index}`,
        imageUrl: "/ui-fixture-photo.svg",
        fileName: `UI illustration fixture ${index}`,
        isCover: index === 1,
      }));
    else if (path === "/api/workers") response = pageOf([worker]);
    else if (path === `/api/workers/${worker.id}` || path === "/api/workers/me")
      response = worker;
    else if (path === "/api/jobs") response = pageOf([job]);
    else if (path === "/api/jobs/me/applications")
      response = pageOf([
        {
          id: "ui-application",
          jobId: job.id,
          jobTitle: job.title,
          employerName: job.employerName,
          status: "PENDING",
          message: "Browser UI application fixture.",
        },
      ]);
    else if (path === `/api/jobs/${job.id}`)
      response = {
        ...job,
        employerId: page.url().includes("/edit") ? member.id : job.employerId,
      };
    else if (path.endsWith("/applications")) response = [];
    else if (path === "/api/conversations") response = [conversation];
    else if (path.endsWith("/messages"))
      response = pageOf([
        {
          id: "ui-message-2",
          senderId: member.id,
          senderName: "QA Member",
          content: "QA outgoing message",
          createdAt: "2026-11-12T10:01:00Z",
        },
        {
          id: "ui-message-1",
          senderId: "ui-neighbour",
          senderName: "QA Neighbour",
          content: "QA incoming message",
          createdAt: "2026-11-12T10:00:00Z",
        },
      ]);
    else if (path.endsWith("/unread-count")) response = { count: 1 };
    else if (path === "/api/notifications") response = pageOf([notice]);
    else if (path === "/api/reports") response = pageOf([report]);
    else
      return route.fulfill({
        status: 500,
        json: { message: `Unconfigured UI fixture: ${path}` },
      });
    return route.fulfill({ json: response });
  });
  return requests;
}

const screens = [
  ["/", (page) => page.getByRole("button", { name: "Continue", exact: true })],
  [
    "/onboarding",
    (page) => page.getByRole("button", { name: "Continue", exact: true }),
  ],
  [
    "/welcome",
    (page) => page.getByRole("button", { name: "Continue as Guest" }),
  ],
  ["/login", (page) => page.getByLabel("Email address", { exact: true })],
  ["/register", (page) => page.getByLabel("Full Name")],
  ["/home", (page) => page.getByTestId(`business-card-${business.id}`)],
  ["/explore", (page) => page.getByTestId("business-cards-list")],
  ["/businesses", (page) => page.getByTestId("business-cards-list")],
  [
    `/businesses/${business.id}`,
    (page) => page.getByTestId("business-detail-content"),
  ],
  ["/business-profile", (page) => page.getByTestId("existing-business-view")],
  ["/business-reviews", (page) => page.getByTestId("business-name-heading")],
  [
    "/workers",
    (page) =>
      page.getByRole("heading", { name: worker.displayName, exact: true }),
  ],
  [
    `/workers/${worker.id}`,
    (page) => page.getByRole("heading", { level: 1, name: worker.displayName }),
  ],
  ["/worker-profile", (page) => page.getByLabel("Professional headline")],
  [
    "/jobs",
    (page) => page.getByRole("button", { name: job.title, exact: true }),
  ],
  [
    `/jobs/${job.id}`,
    (page) => page.getByRole("heading", { level: 1, name: job.title }),
  ],
  ["/jobs/new", (page) => page.getByLabel("Job title", { exact: true })],
  [
    `/jobs/${job.id}/edit`,
    (page) => page.getByLabel("Job title", { exact: true }),
  ],
  [
    "/my-applications",
    (page) => page.getByRole("heading", { name: job.title, exact: true }),
  ],
  [
    "/profile",
    (page) => page.getByRole("heading", { name: "Personal Information" }),
  ],
  [
    "/messages",
    (page) => page.getByText("QA incoming message", { exact: true }),
  ],
  [
    "/notifications",
    (page) =>
      page.getByRole("button", {
        name: `Unread notification: ${notice.title}`,
      }),
  ],
  ["/admin/reports", (page) => page.getByText(report.details, { exact: true })],
  [
    "/missing-page",
    (page) => page.getByRole("heading", { level: 1, name: "Page not found" }),
  ],
];

for (const width of [375, 768, 1280, 1440]) {
  test(`all routes are responsive and labeled at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 950 });
    await fixtures(page);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [path, ready] of screens) {
      await test.step(path, async () => {
        await page.goto(path);
        await expect(ready(page)).toBeVisible();
        if (path === "/business-profile")
          await expect(page.getByTestId("owner-image-grid")).toBeVisible();
        if (path === "/business-reviews")
          await expect(page.getByTestId("reviews-list")).toBeVisible();
        if (path === `/businesses/${business.id}`)
          await expect(
            page.getByTestId("business-image-gallery"),
          ).toBeVisible();
        await expect(page.locator("main")).toHaveCount(1);
        await expect(page.locator("h1")).toHaveCount(1);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `Overflow on ${path} at ${width}px`,
        ).toBe(true);
        const unnamedFields = await page
          .locator("main")
          .evaluate((main) =>
            [
              ...main.querySelectorAll(
                'input:not([type="hidden"]), textarea, select',
              ),
            ]
              .filter(
                (field) =>
                  !field.labels?.length &&
                  !field.getAttribute("aria-label") &&
                  !field.getAttribute("aria-labelledby"),
              )
              .map((field) => field.name || field.id || field.tagName),
          );
        expect(unnamedFields, `Unlabeled fields on ${path}`).toEqual([]);
        const smallButtons = await page.locator("main").evaluate((main) =>
          [...main.querySelectorAll("button")]
            .filter((button) => {
              const box = button.getBoundingClientRect();
              return (
                box.width > 0 &&
                box.height > 0 &&
                (box.width < 43.5 || box.height < 43.5)
              );
            })
            .map(
              (button) =>
                button.getAttribute("aria-label") || button.textContent.trim(),
            ),
        );
        expect(smallButtons, `Small touch controls on ${path}`).toEqual([]);
        expect(errors, `Runtime errors on ${path}`).toEqual([]);
        if (
          path === "/home" ||
          ((width === 375 || width === 1440) && path !== "/")
        ) {
          await page.screenshot({
            path: testInfo.outputPath(
              `${path.replaceAll("/", "_") || "root"}-${width}.png`,
            ),
            fullPage: true,
          });
        }
      });
    }
  });
}

test("mobile navigation and scoped search call the intended directory", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 850 });
  const requests = await fixtures(page);
  await page.goto("/home");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile marketplace" })
    .getByRole("link", { name: "Workers", exact: true })
    .click();
  await expect(page).toHaveURL(/\/workers$/);
  await expect(
    page.getByRole("navigation", { name: "Mobile marketplace" }),
  ).toHaveCount(0);
  await page.goto("/home");
  await page
    .getByRole("group", { name: "Search marketplace by" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "Search local jobs..." })
    .fill("QA repairs");
  await page
    .getByRole("searchbox", { name: "Search local jobs..." })
    .press("Enter");
  await expect(page).toHaveURL(/\/jobs\?search=QA\+repairs$/);
  await expect
    .poll(() =>
      requests.some(
        (url) =>
          url.pathname === "/api/jobs" &&
          url.searchParams.get("search") === "QA repairs",
      ),
    )
    .toBe(true);
});

test("keyboard gallery, account menu and skip link retain usable focus", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto(`/businesses/${business.id}`);
  await expect(page.getByTestId("business-image-gallery")).toBeVisible();
  const cover = page.getByRole("button", { name: "View business cover photo" });
  await cover.focus();
  await cover.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Photo lightbox view" });
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close image preview" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Next photo" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(cover).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  const account = page.getByLabel("Account menu");
  await account.click();
  await expect(
    page.getByRole("link", { name: "Manage my business" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(account).toBeFocused();
  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  const outline = await account.evaluate((element) => {
    element.focus();
    return getComputedStyle(element).outlineWidth;
  });
  expect(parseFloat(outline)).toBeGreaterThanOrEqual(2);
});

test("loading, failure, retry and reduced motion stay usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fixtures(page);
  let release;
  let state = "error";
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/api/businesses?*", async (route) => {
    await gate;
    await route.fulfill(
      state === "error"
        ? { status: 503, json: { message: "Redesign QA request failure" } }
        : { json: pageOf([business]) },
    );
  });
  await page.goto("/home");
  await expect(
    page.getByRole("status", { name: "Loading local businesses" }),
  ).toBeVisible();
  const animation = await page
    .locator(".skeleton")
    .first()
    .evaluate((element) => getComputedStyle(element).animationDuration);
  expect(parseFloat(animation)).toBeLessThan(0.001);
  release();
  await expect(page.getByRole("alert")).toContainText(
    "Redesign QA request failure",
  );
  state = "success";
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByTestId(`business-card-${business.id}`)).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("mobile review controls and owner deletion dialog fit and retain keyboard access", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await fixtures(page);
  await page.route("**/api/users/me", (route) =>
    route.fulfill({
      json: { ...member, id: "ui-reviewer", accountType: "RESIDENT" },
    }),
  );
  await page.goto(`/businesses/${business.id}`);
  await page
    .getByRole("button", { name: "Write a Review", exact: true })
    .click();
  await page.getByRole("button", { name: "5 stars", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "5 stars", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByLabel("Review Comment", { exact: false })
    .fill("Browser UI review fixture.");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const star = await page
    .getByRole("button", { name: "5 stars", exact: true })
    .boundingBox();
  expect(star.width).toBeGreaterThanOrEqual(44);
  expect(star.height).toBeGreaterThanOrEqual(44);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.unroute("**/api/users/me");
  await page.goto("/business-profile");
  const trigger = page.getByRole("button", {
    name: "Delete UI illustration fixture 1",
    exact: true,
  });
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Confirm image deletion" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
