import { query } from './pool.js';
import { Court, CourtBooking } from '../../shared/types.js';

function mapCourtRow(row: any): Court {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    sportType: row.sport_type,
    customSportType: row.custom_sport_type,
    description: row.description,
    surface: row.surface,
    isIndoor: row.is_indoor,
    hasLighting: row.has_lighting,
    basePrice: Number(row.base_price),
    priceDisplay: row.price_display,
    durationMinutes: row.duration_minutes,
    teamSize: row.team_size,
    maxExtraPlayers: row.max_extra_players,
    extraPlayerFee: Number(row.extra_player_fee),
    active: row.active,
    sortOrder: row.sort_order,
    createdAt: row.created_at
  };
}

function mapBookingRow(row: any): CourtBooking {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    courtId: row.court_id,
    courtName: row.court_name || row.name, // in case of join
    date: row.date,
    time: row.time,
    durationMinutes: row.duration_minutes,
    bookingMode: row.booking_mode,
    matchStatus: row.match_status,
    matchExpiryHours: Number(row.match_expiry_hours),
    teamAName: row.team_a_name,
    teamACaptain: row.team_a_captain,
    teamAPhone: row.team_a_phone,
    teamAPlayers: row.team_a_players,
    teamAExtraPlayers: row.team_a_extra_players,
    teamAPaid: row.team_a_paid,
    teamBName: row.team_b_name,
    teamBCaptain: row.team_b_captain,
    teamBPhone: row.team_b_phone,
    teamBPlayers: row.team_b_players,
    teamBExtraPlayers: row.team_b_extra_players,
    teamBPaid: row.team_b_paid,
    totalPrice: Number(row.total_price),
    pricePerTeam: row.price_per_team ? Number(row.price_per_team) : undefined,
    paymentMode: row.payment_mode,
    sportType: row.sport_type,
    skillLevel: row.skill_level,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ================= COURTS CRUD =================

export async function getCourtsByTenant(tenantId: string) {
  const res = await query(`SELECT * FROM courts WHERE tenant_id = $1 ORDER BY sort_order, name`, [tenantId]);
  return res.rows.map(mapCourtRow);
}

export async function getCourtById(id: string, tenantId: string) {
  const res = await query(`SELECT * FROM courts WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  return res.rows[0] ? mapCourtRow(res.rows[0]) : null;
}

export async function createCourt(tenantId: string, data: Partial<Court>) {
  const res = await query(`
    INSERT INTO courts (
      tenant_id, name, sport_type, custom_sport_type, description, surface, 
      is_indoor, has_lighting, base_price, price_display, duration_minutes, 
      team_size, max_extra_players, extra_player_fee, active, sort_order
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    ) RETURNING *
  `, [
    tenantId, data.name, data.sportType, data.customSportType, data.description,
    data.surface, data.isIndoor, data.hasLighting, data.basePrice, data.priceDisplay,
    data.durationMinutes, data.teamSize, data.maxExtraPlayers, data.extraPlayerFee,
    data.active !== false, data.sortOrder || 0
  ]);
  return mapCourtRow(res.rows[0]);
}

export async function updateCourt(id: string, tenantId: string, data: Partial<Court>) {
  const allowed = {
    name: 'name', sportType: 'sport_type', customSportType: 'custom_sport_type',
    description: 'description', surface: 'surface', isIndoor: 'is_indoor',
    hasLighting: 'has_lighting', basePrice: 'base_price', priceDisplay: 'price_display',
    durationMinutes: 'duration_minutes', teamSize: 'team_size', 
    maxExtraPlayers: 'max_extra_players', extraPlayerFee: 'extra_player_fee',
    active: 'active', sortOrder: 'sort_order'
  };

  const entries = Object.entries(data).filter(([k, v]) => (allowed as any)[k] !== undefined && v !== undefined);
  if (entries.length === 0) return getCourtById(id, tenantId);

  const setClause = entries.map(([k], i) => `${(allowed as any)[k]} = $${i + 3}`).join(', ');
  const values = entries.map(e => e[1]);

  const res = await query(`
    UPDATE courts SET ${setClause} WHERE id = $1 AND tenant_id = $2 RETURNING *
  `, [id, tenantId, ...values]);

  return res.rows[0] ? mapCourtRow(res.rows[0]) : null;
}

export async function deleteCourt(id: string, tenantId: string) {
  const res = await query(`DELETE FROM courts WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  return (res.rowCount || 0) > 0;
}

// ================= COURT BOOKINGS =================

export async function getBookingsByTenant(tenantId: string, date?: string) {
  let q = `
    SELECT cb.*, c.name as court_name 
    FROM court_bookings cb
    JOIN courts c ON c.id = cb.court_id
    WHERE cb.tenant_id = $1
  `;
  const params: any[] = [tenantId];
  if (date) {
    q += ` AND cb.date = $2`;
    params.push(date);
  }
  q += ` ORDER BY cb.date DESC, cb.time DESC`;
  const res = await query(q, params);
  return res.rows.map(mapBookingRow);
}

export async function getBookingById(id: string, tenantId: string) {
  const res = await query(`
    SELECT cb.*, c.name as court_name 
    FROM court_bookings cb
    JOIN courts c ON c.id = cb.court_id
    WHERE cb.id = $1 AND cb.tenant_id = $2
  `, [id, tenantId]);
  return res.rows[0] ? mapBookingRow(res.rows[0]) : null;
}

export async function createBooking(tenantId: string, data: Partial<CourtBooking>) {
  const res = await query(`
    INSERT INTO court_bookings (
      tenant_id, court_id, date, time, duration_minutes, booking_mode,
      match_status, match_expiry_hours, team_a_name, team_a_captain,
      team_a_phone, team_a_players, team_a_extra_players, team_a_paid,
      team_b_name, team_b_captain, team_b_phone, team_b_players,
      team_b_extra_players, team_b_paid, total_price, price_per_team,
      payment_mode, sport_type, skill_level, notes, status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
      $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
    ) RETURNING *
  `, [
    tenantId, data.courtId, data.date, data.time, data.durationMinutes || 60,
    data.bookingMode || 'full', data.matchStatus || 'confirmed', data.matchExpiryHours || 1,
    data.teamAName || 'Equipo A', data.teamACaptain, data.teamAPhone,
    data.teamAPlayers || 5, data.teamAExtraPlayers || 0, data.teamAPaid || false,
    data.teamBName, data.teamBCaptain, data.teamBPhone, data.teamBPlayers || 5,
    data.teamBExtraPlayers || 0, data.teamBPaid || false, data.totalPrice || 0,
    data.pricePerTeam, data.paymentMode || 'both', data.sportType, data.skillLevel,
    data.notes, data.status || 'confirmed'
  ]);
  return mapBookingRow(res.rows[0]);
}

export async function updateBooking(id: string, tenantId: string, data: Partial<CourtBooking>) {
  const allowed = {
    date: 'date', time: 'time', durationMinutes: 'duration_minutes',
    bookingMode: 'booking_mode', matchStatus: 'match_status', matchExpiryHours: 'match_expiry_hours',
    teamAName: 'team_a_name', teamACaptain: 'team_a_captain', teamAPhone: 'team_a_phone',
    teamAPlayers: 'team_a_players', teamAExtraPlayers: 'team_a_extra_players', teamAPaid: 'team_a_paid',
    teamBName: 'team_b_name', teamBCaptain: 'team_b_captain', teamBPhone: 'team_b_phone',
    teamBPlayers: 'team_b_players', teamBExtraPlayers: 'team_b_extra_players', teamBPaid: 'team_b_paid',
    totalPrice: 'total_price', pricePerTeam: 'price_per_team', paymentMode: 'payment_mode',
    sportType: 'sport_type', skillLevel: 'skill_level', notes: 'notes', status: 'status'
  };

  const entries = Object.entries(data).filter(([k, v]) => (allowed as any)[k] !== undefined && v !== undefined);
  if (entries.length === 0) return getBookingById(id, tenantId);

  const setClause = entries.map(([k], i) => `${(allowed as any)[k]} = $${i + 3}`).join(', ');
  const values = entries.map(e => e[1]);

  const res = await query(`
    UPDATE court_bookings SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $1 AND tenant_id = $2 RETURNING *
  `, [id, tenantId, ...values]);

  return res.rows[0] ? mapBookingRow(res.rows[0]) : null;
}

export async function cancelBooking(id: string, tenantId: string) {
  const res = await query(`
    UPDATE court_bookings SET status = 'cancelled', match_status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND tenant_id = $2 RETURNING *
  `, [id, tenantId]);
  return res.rows[0] ? mapBookingRow(res.rows[0]) : null;
}

export async function getOpenMatches(tenantId: string) {
  const res = await query(`
    SELECT cb.*, c.name as court_name 
    FROM court_bookings cb
    JOIN courts c ON c.id = cb.court_id
    WHERE cb.tenant_id = $1 AND cb.match_status = 'open' AND cb.date >= CURRENT_DATE
    ORDER BY cb.date, cb.time
  `, [tenantId]);
  return res.rows.map(mapBookingRow);
}

export async function joinMatch(id: string, teamBData: any) {
  const res = await query(`
    UPDATE court_bookings 
    SET team_b_name = $1, team_b_captain = $2, team_b_phone = $3,
        team_b_players = $4, team_b_extra_players = $5,
        match_status = 'matched', updated_at = CURRENT_TIMESTAMP
    WHERE id = $6 RETURNING *
  `, [
    teamBData.teamBName || 'Equipo B', teamBData.teamBCaptain, teamBData.teamBPhone,
    teamBData.teamBPlayers || 5, teamBData.teamBExtraPlayers || 0, id
  ]);
  return res.rows[0] ? mapBookingRow(res.rows[0]) : null;
}

export async function expireOldMatches() {
  await query(`
    UPDATE court_bookings 
    SET match_status = 'expired', updated_at = CURRENT_TIMESTAMP
    WHERE match_status = 'open' 
      AND (date + time - (match_expiry_hours || ' hours')::interval) <= NOW()
  `);
}

export async function getAvailableSlots(tenantId: string, courtId: string, date: string) {
  // 1. Get tenant settings
  const tRes = await query('SELECT settings_json FROM tenants WHERE id = $1', [tenantId]);
  const settingsJson = tRes.rows[0]?.settings_json || {};
  const scheduleSettings = settingsJson.scheduleSettings || { startHour: 8, endHour: 22, slotMinutes: 60 };

  const startHour = Number(scheduleSettings.startHour) || 8;
  const endHour = Number(scheduleSettings.endHour) || 22;
  const slotMinutes = Number(scheduleSettings.slotMinutes) || 60;

  // 2. Generate all slots for the day
  const slots: string[] = [];
  let currentMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  while (currentMinutes < endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
    slots.push(timeStr);
    currentMinutes += slotMinutes;
  }

  // 3. Get existing bookings for this court and date (not cancelled)
  const bookingsRes = await query(`
    SELECT time 
    FROM court_bookings 
    WHERE tenant_id = $1 AND court_id = $2 AND date = $3 AND status != 'cancelled'
  `, [tenantId, courtId, date]);

  const bookedTimes = bookingsRes.rows.map(r => {
    // some PG drivers return time as string like "14:00:00"
    return typeof r.time === 'string' ? r.time : (r.time as any).toString();
  });

  // 4. Filter available
  return slots.filter(slot => !bookedTimes.includes(slot));
}
