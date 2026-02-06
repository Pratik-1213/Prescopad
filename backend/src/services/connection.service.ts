import { query, queryOne } from '../config/database';

interface ConnectionRequestRow {
  id: string;
  clinic_id: string;
  doctor_id: string;
  assistant_id: string;
  initiated_by: string;
  status: string;
  created_at: string;
  updated_at: string;
  doctor_name?: string;
  doctor_phone?: string;
  doctor_code?: string;
  assistant_name?: string;
  assistant_phone?: string;
  clinic_name?: string;
}

interface TeamMemberRow {
  id: string;
  name: string;
  phone: string;
  role: string;
  last_active_at: string | null;
}

export async function inviteAssistant(
  doctorId: string,
  clinicId: string,
  assistantPhone: string
): Promise<ConnectionRequestRow> {
  const assistant = await queryOne<{ id: string; clinic_id: string | null }>(
    `SELECT id, clinic_id FROM users WHERE phone = $1 AND role = 'assistant'`,
    [assistantPhone]
  );
  if (!assistant) throw new Error('No assistant found with this phone number');

  if (assistant.clinic_id === clinicId) {
    throw new Error('This assistant is already connected to your clinic');
  }

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM connection_requests
     WHERE doctor_id = $1 AND assistant_id = $2 AND status = 'pending'`,
    [doctorId, assistant.id]
  );
  if (existing) throw new Error('A pending invite already exists for this assistant');

  const rows = await query<ConnectionRequestRow>(
    `INSERT INTO connection_requests (clinic_id, doctor_id, assistant_id, initiated_by, status)
     VALUES ($1, $2, $3, 'doctor', 'pending')
     RETURNING *`,
    [clinicId, doctorId, assistant.id]
  );
  return rows[0];
}

export async function requestToJoin(
  assistantId: string,
  doctorCode: string
): Promise<ConnectionRequestRow> {
  const doctor = await queryOne<{ id: string; clinic_id: string | null; name: string }>(
    `SELECT id, clinic_id, name FROM users WHERE doctor_code = $1 AND role = 'doctor'`,
    [doctorCode.toUpperCase()]
  );
  if (!doctor) throw new Error('No doctor found with this code');
  if (!doctor.clinic_id) throw new Error('Doctor has not set up their clinic yet');

  const assistant = await queryOne<{ clinic_id: string | null }>(
    `SELECT clinic_id FROM users WHERE id = $1`,
    [assistantId]
  );
  if (assistant?.clinic_id === doctor.clinic_id) {
    throw new Error('You are already connected to this doctor\'s clinic');
  }

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM connection_requests
     WHERE doctor_id = $1 AND assistant_id = $2 AND status = 'pending'`,
    [doctor.id, assistantId]
  );
  if (existing) throw new Error('A pending request already exists');

  const rows = await query<ConnectionRequestRow>(
    `INSERT INTO connection_requests (clinic_id, doctor_id, assistant_id, initiated_by, status)
     VALUES ($1, $2, $3, 'assistant', 'pending')
     RETURNING *`,
    [doctor.clinic_id, doctor.id, assistantId]
  );
  return rows[0];
}

export async function acceptRequest(requestId: string, acceptingUserId: string): Promise<void> {
  const request = await queryOne<ConnectionRequestRow>(
    `SELECT * FROM connection_requests WHERE id = $1 AND status = 'pending'`,
    [requestId]
  );
  if (!request) throw new Error('Connection request not found or already processed');

  if (request.initiated_by === 'doctor' && acceptingUserId !== request.assistant_id) {
    throw new Error('Only the invited assistant can accept this request');
  }
  if (request.initiated_by === 'assistant' && acceptingUserId !== request.doctor_id) {
    throw new Error('Only the doctor can accept this request');
  }

  await query(
    `UPDATE connection_requests SET status = 'accepted' WHERE id = $1`,
    [requestId]
  );

  // Link assistant to clinic
  await query(
    `UPDATE users SET clinic_id = $1 WHERE id = $2`,
    [request.clinic_id, request.assistant_id]
  );

  // Auto-reject other pending requests for this assistant
  await query(
    `UPDATE connection_requests SET status = 'rejected'
     WHERE assistant_id = $1 AND status = 'pending' AND id != $2`,
    [request.assistant_id, requestId]
  );
}

export async function rejectRequest(requestId: string, rejectingUserId: string): Promise<void> {
  const request = await queryOne<ConnectionRequestRow>(
    `SELECT * FROM connection_requests WHERE id = $1 AND status = 'pending'`,
    [requestId]
  );
  if (!request) throw new Error('Connection request not found or already processed');

  if (rejectingUserId !== request.doctor_id && rejectingUserId !== request.assistant_id) {
    throw new Error('You are not part of this connection request');
  }

  await query(
    `UPDATE connection_requests SET status = 'rejected' WHERE id = $1`,
    [requestId]
  );
}

export async function getPendingRequests(
  userId: string,
  role: string
): Promise<ConnectionRequestRow[]> {
  if (role === 'doctor') {
    return query<ConnectionRequestRow>(
      `SELECT cr.*,
              u.name AS assistant_name,
              u.phone AS assistant_phone
       FROM connection_requests cr
       JOIN users u ON cr.assistant_id = u.id
       WHERE cr.doctor_id = $1 AND cr.status = 'pending'
       ORDER BY cr.created_at DESC`,
      [userId]
    );
  }
  return query<ConnectionRequestRow>(
    `SELECT cr.*,
            u.name AS doctor_name,
            u.phone AS doctor_phone,
            u.doctor_code,
            c.name AS clinic_name
     FROM connection_requests cr
     JOIN users u ON cr.doctor_id = u.id
     JOIN clinics c ON cr.clinic_id = c.id
     WHERE cr.assistant_id = $1 AND cr.status = 'pending'
     ORDER BY cr.created_at DESC`,
    [userId]
  );
}

export async function getTeamMembers(clinicId: string): Promise<TeamMemberRow[]> {
  return query<TeamMemberRow>(
    `SELECT id, name, phone, role, last_active_at
     FROM users WHERE clinic_id = $1 AND is_active = true
     ORDER BY role DESC, name ASC`,
    [clinicId]
  );
}

export async function disconnectAssistant(clinicId: string, assistantId: string): Promise<void> {
  await query(
    `UPDATE users SET clinic_id = NULL WHERE id = $1 AND clinic_id = $2 AND role = 'assistant'`,
    [assistantId, clinicId]
  );
}
