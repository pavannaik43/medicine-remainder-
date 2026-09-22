const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'reminders.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Allow CORS from local dev as well as any Vercel domain or custom frontend URL
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins or requests with no origin (e.g. mobile apps, curl)
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Root welcome route for Render health checks
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Medicine Reminder API is running smoothly on Render',
    health: '/api/health',
    endpoints: ['/api/reminders', '/api/history', '/api/auth/users', '/api/caregiver/patients'],
  });
});

// ---- User Helpers -----------------------------------------------------

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      const defaultUsers = [
        {
          id: 'patient-1',
          name: 'Ramesh Kumar (Patient)',
          email: 'patient@demo.com',
          password: 'password123',
          role: 'patient',
          pairingCode: 'MED-7842',
          connectedCaregivers: [
            {
              id: 'caregiver-1',
              name: 'Priya Sharma (Caregiver)',
              email: 'caregiver@demo.com',
              relationship: 'Family Member / Daughter',
              connectedAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'caregiver-1',
          name: 'Priya Sharma (Caregiver)',
          email: 'caregiver@demo.com',
          password: 'password123',
          role: 'caregiver',
          connectedPatients: [
            {
              id: 'patient-1',
              name: 'Ramesh Kumar (Patient)',
              email: 'patient@demo.com',
              pairingCode: 'MED-7842',
              relationship: 'Father',
              connectedAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
      return defaultUsers;
    }
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function generatePairingCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `MED-${num}`;
}

// ---- Reminders & History Helpers --------------------------------------

function readReminders() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const reminders = JSON.parse(raw);
    return reminders.map((r) => {
      let times = Array.isArray(r.times) && r.times.length > 0 ? r.times : (r.time ? [r.time] : ['08:00']);
      return {
        ...r,
        patientId: r.patientId || 'patient-1',
        times,
        time: times[0] || '08:00',
        frequency: r.frequency || 'Every day',
        takenDoses: r.takenDoses || {},
        daysOfWeek: Array.isArray(r.daysOfWeek) ? r.daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
      };
    });
  } catch (err) {
    return [];
  }
}

function writeReminders(reminders) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(reminders, null, 2), 'utf-8');
}

function readHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const history = JSON.parse(raw);
    return history.map((h) => ({
      ...h,
      patientId: h.patientId || 'patient-1',
      status: h.status || 'taken', // 'taken' | 'taken_late' | 'missed'
    }));
  } catch (err) {
    return [];
  }
}

function writeHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
}

function isValidTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

// =========================================================================
// AUTH & USER ROUTES
// =========================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role = 'patient', relationship } = req.body;
  if (!name || !name.trim() || !email || !email.trim()) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const users = readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const newUser = {
    id: role === 'caregiver' ? `caregiver-${Date.now()}` : `patient-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password || 'password123',
    role: role === 'caregiver' ? 'caregiver' : 'patient',
    pairingCode: role === 'patient' ? generatePairingCode() : undefined,
    connectedCaregivers: role === 'patient' ? [] : undefined,
    connectedPatients: role === 'caregiver' ? [] : undefined,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);
  res.status(201).json(newUser);
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const users = readUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found. Please register first.' });
  }

  if (password && user.password && user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  res.json(user);
});

// Get all users (demo / quick switcher helper)
app.get('/api/auth/users', (req, res) => {
  const users = readUsers();
  res.json(users);
});

// Get user profile by ID
app.get('/api/auth/users/:id', (req, res) => {
  const users = readUsers();
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// =========================================================================
// CAREGIVER & PATIENT LINKING ROUTES
// =========================================================================

// Caregiver connects to patient using pairing code
app.post('/api/caregiver/connect', (req, res) => {
  const { caregiverId, pairingCode, relationship } = req.body;
  if (!caregiverId || !pairingCode) {
    return res.status(400).json({ error: 'Caregiver ID and Patient Pairing Code are required.' });
  }

  const users = readUsers();
  const caregiverIndex = users.findIndex((u) => u.id === caregiverId);
  if (caregiverIndex === -1) {
    return res.status(404).json({ error: 'Caregiver account not found.' });
  }

  const patientIndex = users.findIndex(
    (u) => u.pairingCode && u.pairingCode.toUpperCase() === pairingCode.trim().toUpperCase()
  );
  if (patientIndex === -1) {
    return res.status(404).json({ error: 'Invalid Patient Pairing Code. Please check the code.' });
  }

  const patient = users[patientIndex];
  const caregiver = users[caregiverIndex];

  // Link in caregiver's connectedPatients
  caregiver.connectedPatients = caregiver.connectedPatients || [];
  if (!caregiver.connectedPatients.some((p) => p.id === patient.id)) {
    caregiver.connectedPatients.push({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      pairingCode: patient.pairingCode,
      relationship: relationship || 'Family Care',
      connectedAt: new Date().toISOString(),
    });
  }

  // Link in patient's connectedCaregivers
  patient.connectedCaregivers = patient.connectedCaregivers || [];
  if (!patient.connectedCaregivers.some((c) => c.id === caregiver.id)) {
    patient.connectedCaregivers.push({
      id: caregiver.id,
      name: caregiver.name,
      email: caregiver.email,
      relationship: relationship || 'Caregiver',
      connectedAt: new Date().toISOString(),
    });
  }

  writeUsers(users);
  res.json({ success: true, patient, caregiver });
});

// Patient revokes/removes caregiver access
app.delete('/api/patient/caregivers/:caregiverId', (req, res) => {
  const { caregiverId } = req.params;
  const patientId = req.query.patientId || req.body.patientId;

  if (!patientId) {
    return res.status(400).json({ error: 'patientId is required' });
  }

  const users = readUsers();
  const patientIndex = users.findIndex((u) => u.id === patientId);
  const caregiverIndex = users.findIndex((u) => u.id === caregiverId);

  if (patientIndex !== -1) {
    users[patientIndex].connectedCaregivers = (users[patientIndex].connectedCaregivers || []).filter(
      (c) => c.id !== caregiverId
    );
  }

  if (caregiverIndex !== -1) {
    users[caregiverIndex].connectedPatients = (users[caregiverIndex].connectedPatients || []).filter(
      (p) => p.id !== patientId
    );
  }

  writeUsers(users);
  res.json({ success: true, message: 'Caregiver access revoked successfully' });
});

// Caregiver gets connected patients with live medicine and adherence data
app.get('/api/caregiver/patients', (req, res) => {
  const caregiverId = req.query.caregiverId;
  const users = readUsers();
  const reminders = readReminders();
  const history = readHistory();

  const caregiver = users.find((u) => u.id === caregiverId);
  if (!caregiver) {
    return res.status(404).json({ error: 'Caregiver not found' });
  }

  const connectedPatientIds = (caregiver.connectedPatients || []).map((p) => p.id);
  const todayStr = new Date().toISOString().slice(0, 10);

  const result = (caregiver.connectedPatients || []).map((pRef) => {
    const patientUser = users.find((u) => u.id === pRef.id);
    const patientReminders = reminders.filter((r) => r.patientId === pRef.id);
    const patientHistory = history.filter((h) => h.patientId === pRef.id);

    // Compute patient status alerts (missed, late, taken today)
    const todayLogs = patientHistory.filter(
      (h) => h.takenAt && h.takenAt.slice(0, 10) === todayStr
    );

    const missedLogs = patientHistory.filter((h) => h.status === 'missed');
    const lateLogs = patientHistory.filter((h) => h.status === 'taken_late');

    return {
      ...pRef,
      name: patientUser ? patientUser.name : pRef.name,
      email: patientUser ? patientUser.email : pRef.email,
      reminders: patientReminders,
      history: patientHistory,
      stats: {
        totalReminders: patientReminders.length,
        todayTakenCount: todayLogs.length,
        missedCount: missedLogs.length,
        lateCount: lateLogs.length,
      },
    };
  });

  res.json(result);
});

// =========================================================================
// REMINDER ROUTES (SCOPED BY PATIENT)
// =========================================================================

// Get reminders
app.get('/api/reminders', (req, res) => {
  const patientId = req.query.patientId;
  let reminders = readReminders();
  if (patientId) {
    reminders = reminders.filter((r) => r.patientId === patientId);
  }
  res.json(reminders);
});

// Create reminder
app.post('/api/reminders', (req, res) => {
  const { name, dosage, frequency, times, time, daysOfWeek, notes, stock, patientId, image } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Medicine name is required.' });
  }

  let normalizedTimes = [];
  if (Array.isArray(times) && times.length > 0) {
    normalizedTimes = times.filter(isValidTime);
  } else if (isValidTime(time)) {
    normalizedTimes = [time];
  }

  if (frequency !== 'As needed' && normalizedTimes.length === 0) {
    normalizedTimes = ['08:00'];
  }

  const reminders = readReminders();
  const newReminder = {
    id: crypto.randomUUID(),
    patientId: patientId || 'patient-1',
    name: name.trim(),
    dosage: dosage ? dosage.trim() : '',
    frequency: frequency && frequency.trim() ? frequency.trim() : 'Every day',
    times: normalizedTimes,
    time: normalizedTimes[0] || '08:00',
    daysOfWeek: Array.isArray(daysOfWeek) && daysOfWeek.length > 0 ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
    notes: notes ? notes.trim() : '',
    stock: Number.isInteger(Number(stock)) && Number(stock) >= 0 ? Number(stock) : null,
    image: image || null,
    takenDoses: {},
    taken: false,
    createdAt: new Date().toISOString(),
  };

  reminders.push(newReminder);
  writeReminders(reminders);
  res.status(201).json(newReminder);
});

// Update reminder (or log taken / taken late / missed)
app.put('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  const reminders = readReminders();
  const index = reminders.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Reminder not found.' });
  }

  const prev = reminders[index];
  let normalizedTimes = prev.times;

  if (Array.isArray(req.body.times)) {
    normalizedTimes = req.body.times.filter(isValidTime);
  } else if (req.body.time !== undefined && isValidTime(req.body.time)) {
    normalizedTimes = [req.body.time];
  }

  const updated = {
    ...prev,
    ...req.body,
    times: normalizedTimes,
    time: normalizedTimes[0] || prev.time,
    image: req.body.image !== undefined ? req.body.image : prev.image,
    id,
  };

  // If logging a dose taken event
  if (req.body.logDose) {
    const history = readHistory();
    const status = req.body.logDose.status || 'taken'; // 'taken' | 'taken_late' | 'missed'
    history.unshift({
      id: crypto.randomUUID(),
      patientId: updated.patientId || 'patient-1',
      reminderId: id,
      name: updated.name,
      dosage: updated.dosage || '',
      time: req.body.logDose.time || updated.time,
      doseLabel: req.body.logDose.doseLabel || 'Scheduled Dose',
      image: updated.image || null,
      takenAt: req.body.logDose.takenAt || new Date().toISOString(),
      status,
      delayMinutes: req.body.logDose.delayMinutes || (status === 'taken_late' ? 45 : 0),
      notes: req.body.logDose.notes || updated.notes || '',
    });
    writeHistory(history);

    if (status !== 'missed' && typeof updated.stock === 'number' && updated.stock > 0) {
      updated.stock -= 1;
    }
  }

  reminders[index] = updated;
  writeReminders(reminders);
  res.json(reminders[index]);
});

// Delete a reminder
app.delete('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  const reminders = readReminders();
  const filtered = reminders.filter((r) => r.id !== id);

  if (filtered.length === reminders.length) {
    return res.status(404).json({ error: 'Reminder not found.' });
  }

  writeReminders(filtered);
  res.status(204).send();
});

// =========================================================================
// HISTORY & STATUS SIMULATION ROUTES
// =========================================================================

// Get history
app.get('/api/history', (req, res) => {
  const patientId = req.query.patientId;
  let history = readHistory();
  if (patientId) {
    history = history.filter((h) => h.patientId === patientId);
  }
  res.json(history);
});

// Create manual history entry (e.g. As Needed or Simulated status)
app.post('/api/history', (req, res) => {
  const { reminderId, patientId, name, dosage, time, doseLabel, status, delayMinutes, notes } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Medicine name is required.' });
  }
  const history = readHistory();
  const entry = {
    id: crypto.randomUUID(),
    patientId: patientId || 'patient-1',
    reminderId: reminderId || null,
    name: name.trim(),
    dosage: dosage ? dosage.trim() : '',
    time: time || '12:00',
    doseLabel: doseLabel || 'Dose',
    takenAt: req.body.takenAt || new Date().toISOString(),
    status: status || 'taken', // 'taken' | 'taken_late' | 'missed'
    delayMinutes: delayMinutes || (status === 'taken_late' ? 45 : 0),
    notes: notes ? notes.trim() : '',
  };
  history.unshift(entry);
  writeHistory(history);

  if (reminderId && status !== 'missed') {
    const reminders = readReminders();
    const rIndex = reminders.findIndex((r) => r.id === reminderId);
    if (rIndex !== -1 && typeof reminders[rIndex].stock === 'number' && reminders[rIndex].stock > 0) {
      reminders[rIndex].stock -= 1;
      writeReminders(reminders);
    }
  }

  res.status(201).json(entry);
});

// Delete single history log
app.delete('/api/history/:id', (req, res) => {
  const { id } = req.params;
  const history = readHistory();
  const filtered = history.filter((h) => h.id !== id);
  writeHistory(filtered);
  res.status(204).send();
});

// Clear all history for a patient
app.delete('/api/history', (req, res) => {
  const patientId = req.query.patientId;
  if (patientId) {
    const history = readHistory().filter((h) => h.patientId !== patientId);
    writeHistory(history);
  } else {
    writeHistory([]);
  }
  res.status(204).send();
});

// Start server
app.listen(PORT, () => {
  console.log(`Medicine Reminder API running on http://localhost:${PORT}`);
});
