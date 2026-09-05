import assert from "node:assert/strict";
import test from "node:test";

const apiBaseUrl = process.env.MOBILE_E2E_API_URL;
const password = process.env.MOBILE_E2E_PASSWORD;
const schoolCode = process.env.MOBILE_E2E_SCHOOL_CODE;

const roles = [
  { role: "teacher", email: "teacher.a@phase1.example.com", path: "/portal/teacher/workspace" },
  { role: "student", email: "student.a@phase1.example.com", path: "/portal/student/workspace" },
  { role: "parent", email: "parent.a@phase1.example.com", path: "/portal/parent/workspace" },
] as const;

function requireEnvironment() {
  const missing = [
    ["MOBILE_E2E_API_URL", apiBaseUrl],
    ["MOBILE_E2E_PASSWORD", password],
    ["MOBILE_E2E_SCHOOL_CODE", schoolCode],
  ].filter(([, value]) => !value).map(([name]) => name);

  assert.equal(
    missing.length,
    0,
    `Mobile release E2E requires a dedicated test/staging environment. Missing: ${missing.join(", ")}`,
  );
}

test("mobile release gate: authentication, role routing and representative workflows", async () => {
  requireEnvironment();
  process.env.EXPO_PUBLIC_API_URL = apiBaseUrl;

  const { getCurrentUser, login, logout, refresh, requestWithAccessToken } = await import("../src/auth/api");
  const { getMobileRoleShell } = await import("../src/navigation/roleNavigation");

  for (const fixture of roles) {
    const auth = await login({ email: fixture.email, password: password!, schoolCode });
    assert.ok(auth.accessToken, `${fixture.role} login did not return an access token`);
    assert.ok(auth.refreshToken, `${fixture.role} login did not return a refresh token`);
    assert.equal(auth.user.role, fixture.role, `${fixture.role} login returned the wrong server role`);

    const currentUser = await getCurrentUser(auth.accessToken, auth.user.schoolId);
    assert.equal(currentUser.user.id, auth.user.id, `${fixture.role} /me identity mismatch`);
    assert.equal(currentUser.user.role, fixture.role, `${fixture.role} /me role mismatch`);

    const shell = getMobileRoleShell(currentUser.user.role);
    assert.ok(shell, `${fixture.role} did not resolve to a mobile role shell`);
    assert.equal(shell.path, fixture.role, `${fixture.role} resolved to the wrong mobile path`);

    const dashboard = await requestWithAccessToken<{ role: string }>(
      "/portal/dashboard",
      {},
      auth.accessToken,
      auth.user.schoolId,
    );
    assert.equal(dashboard.role, fixture.role, `${fixture.role} dashboard role mismatch`);

    const workspace = await requestWithAccessToken<Record<string, unknown>>(
      fixture.path,
      {},
      auth.accessToken,
      auth.user.schoolId,
    );
    assert.ok(workspace, `${fixture.role} workspace returned no response`);

    const rotated = await refresh(auth.refreshToken);
    assert.ok(rotated.accessToken, `${fixture.role} refresh did not return an access token`);
    assert.ok(rotated.refreshToken, `${fixture.role} refresh did not return a refresh token`);
    assert.notEqual(rotated.refreshToken, auth.refreshToken, `${fixture.role} refresh token was not rotated`);

    await logout(rotated.accessToken, auth.user.schoolId);
  }
});
