import {
  test,
  expect,
  setupRoutes,
  makeStrengthProgram,
  makeSingleSetProgram,
  makeSupersetProgram,
} from './fixtures.js';

const SESSION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

test.describe('Workout runner — set ↔ rest transitions', () => {
  test('R-1 regression: after Skip repos, exercise card visible AND rest overlay closed', async ({ page }) => {
    await setupRoutes(page, makeStrengthProgram());

    await page.goto(`/#/workout?session=${SESSION_ID}`);

    // Set 1 visible.
    await expect(page.getByTestId('set-current')).toBeVisible();
    await expect(page.getByTestId('set-current-number')).toHaveText('1/3');
    await expect(page.getByTestId('rest-timer')).toBeHidden();

    // Validate set 1.
    await page.getByTestId('validate-set').click();

    // Rest overlay opens with set 2 in "à suivre".
    await expect(page.getByTestId('rest-timer')).toBeVisible();
    await expect(page.getByTestId('rest-next-up-set')).toContainText('Set 2');

    // Tap Skip repos.
    await page.getByTestId('rest-skip').click();

    // CRITICAL: rest overlay must be closed AND exercise card must be visible
    // showing set 2 — not the "next-up" preview from the rest screen.
    await expect(page.getByTestId('rest-timer')).toBeHidden();
    await expect(page.getByTestId('set-current')).toBeVisible();
    await expect(page.getByTestId('set-current-number')).toHaveText('2/3');
    await expect(page.getByTestId('exercise-name')).toHaveText('Bench Press');
  });

  test('R-2: "Prêt — set suivant" advances cursor and closes overlay', async ({ page }) => {
    await setupRoutes(page, makeStrengthProgram());
    await page.goto(`/#/workout?session=${SESSION_ID}`);

    await page.getByTestId('validate-set').click();
    await expect(page.getByTestId('rest-timer')).toBeVisible();

    await page.getByTestId('rest-done').click();
    await expect(page.getByTestId('rest-timer')).toBeHidden();
    await expect(page.getByTestId('set-current-number')).toHaveText('2/3');
  });

  test('happy path: 3 sets → PostSession with no flash', async ({ page }) => {
    await setupRoutes(page, makeStrengthProgram());
    await page.goto(`/#/workout?session=${SESSION_ID}`);

    // Set 1
    await expect(page.getByTestId('set-current-number')).toHaveText('1/3');
    await page.getByTestId('validate-set').click();
    await page.getByTestId('rest-skip').click();

    // Set 2
    await expect(page.getByTestId('set-current-number')).toHaveText('2/3');
    await page.getByTestId('validate-set').click();
    await page.getByTestId('rest-skip').click();

    // Set 3 — last. Validate must skip rest and go straight to done.
    await expect(page.getByTestId('set-current-number')).toHaveText('3/3');
    await page.getByTestId('validate-set').click();

    // PostSession should appear, RestTimer never opens.
    await expect(page.getByTestId('post-session')).toBeVisible();
    await expect(page.getByTestId('rest-timer')).toBeHidden();
  });

  test('R-3 final-set: validating last set goes directly to PostSession', async ({ page }) => {
    await setupRoutes(page, makeSingleSetProgram());
    await page.goto(`/#/workout?session=${SESSION_ID}`);

    await expect(page.getByTestId('set-current-number')).toHaveText('1/1');
    await page.getByTestId('validate-set').click();

    await expect(page.getByTestId('post-session')).toBeVisible();
    await expect(page.getByTestId('rest-timer')).toBeHidden();
  });

  test('R-7 superset: cursor interleaves A→B→A→B across sets', async ({ page }) => {
    await setupRoutes(page, makeSupersetProgram());
    await page.goto(`/#/workout?session=${SESSION_ID}`);

    // A1
    await expect(page.getByTestId('exercise-name')).toHaveText('Bench Press');
    await expect(page.getByTestId('set-current-number')).toHaveText('1/2');
    await page.getByTestId('validate-set').click();
    await page.getByTestId('rest-skip').click();

    // B1
    await expect(page.getByTestId('exercise-name')).toHaveText('Bent-Over Row');
    await expect(page.getByTestId('set-current-number')).toHaveText('1/2');
    await page.getByTestId('validate-set').click();
    await page.getByTestId('rest-skip').click();

    // A2
    await expect(page.getByTestId('exercise-name')).toHaveText('Bench Press');
    await expect(page.getByTestId('set-current-number')).toHaveText('2/2');
    await page.getByTestId('validate-set').click();
    await page.getByTestId('rest-skip').click();

    // B2 — last set, no rest expected after validate.
    await expect(page.getByTestId('exercise-name')).toHaveText('Bent-Over Row');
    await expect(page.getByTestId('set-current-number')).toHaveText('2/2');
    await page.getByTestId('validate-set').click();
    await expect(page.getByTestId('post-session')).toBeVisible();
  });

  test('rest overlay shows correct next-up set number, not the just-validated one', async ({ page }) => {
    await setupRoutes(page, makeStrengthProgram());
    await page.goto(`/#/workout?session=${SESSION_ID}`);

    await page.getByTestId('validate-set').click();
    await expect(page.getByTestId('rest-next-up-set')).toContainText('Set 2');

    await page.getByTestId('rest-skip').click();
    await page.getByTestId('validate-set').click();
    await expect(page.getByTestId('rest-next-up-set')).toContainText('Set 3');
  });
});
