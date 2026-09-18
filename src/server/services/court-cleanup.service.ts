import { expireOldMatches, purgeOldUncompletedBookings } from '../db/courts.repo.js';

export function startCourtCleanupScheduler() {
  console.log('[CourtCleanup] Starting automated court cleanup scheduler (interval: 6h)...');

  // Run initial cleanup 15 seconds after startup
  setTimeout(runCourtCleanup, 15000);

  // Run periodically every 6 hours
  setInterval(runCourtCleanup, 6 * 60 * 60 * 1000);
}

async function runCourtCleanup() {
  try {
    const expiredCount = await expireOldMatches();
    const purgedCount = await purgeOldUncompletedBookings();

    if (expiredCount > 0 || purgedCount > 0) {
      console.log(`[CourtCleanup] Cleanup run complete: ${expiredCount} partidos/retos pasaron a no concretados, ${purgedCount} reservas no concretadas (>15 días) fueron eliminadas.`);
    }
  } catch (err: any) {
    console.error('[CourtCleanup] Error running court cleanup task:', err?.message || err);
  }
}
