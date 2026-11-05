const { test } = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/db");
const Patient = require("../src/models/Patient");
const Appointment = require("../src/models/Appointment");
const { getMyAppointments } = require("../src/controllers/appointmentController");

test("patient history resolves ownership from the signed-in account, including clinical recommendations", async t => {
  const records = new Map([[42, [{ appointment_id: 7, diagnosis: "Recorded result", recommendations: ["Recorded recommendation"] }]], [99, [{ appointment_id: 99, diagnosis: "Another patient's result" }]]]);
  t.mock.method(Patient, "findByUserId", async id => { assert.equal(id, 11); return { patient_id: 42 }; });
  t.mock.method(Appointment, "findByPatientId", async id => records.get(id));
  let body;
  const response = { json(value) { body = value; return this; }, status() { return this; } };
  await getMyAppointments({ user: { user_id: 11 }, query: { patient_id: 99 }, body: { patient_id: 99 } }, response);
  assert.deepEqual(body.appointments, records.get(42));
  assert.equal(body.appointments.some(visit => visit.appointment_id === 99), false);
});

test("an account without a patient profile cannot read appointment recommendations", async t => {
  t.mock.method(Patient, "findByUserId", async () => null);
  t.mock.method(Appointment, "findByPatientId", async () => { assert.fail("History should not be queried"); });
  let status;
  const response = { status(value) { status = value; return this; }, json() { return this; } };
  await getMyAppointments({ user: { user_id: 11 } }, response);
  assert.equal(status, 404);
});

test("patient history groups prescription rows without duplicating appointments", async t => {
  const completed = { appointment_id: 7, diagnosis: "Recorded result" };
  const pending = { appointment_id: 6, diagnosis: null };
  t.mock.method(pool, "query", async (sql, params) => {
    assert.doesNotMatch(sql, /JSON_ARRAYAGG/i);
    assert.deepEqual(params, [42]);
    return [[
      { ...completed, recommendation: 'Use "as directed", then return', prescription_consultation_id: 5 },
      { ...completed, recommendation: "Follow up", prescription_consultation_id: 5 },
      { ...pending, recommendation: null, prescription_consultation_id: null },
    ]];
  });
  assert.deepEqual(await Appointment.findByPatientId(42), [
    { ...completed, recommendations: ['Use "as directed", then return', "Follow up"] },
    { ...pending, recommendations: null },
  ]);
});
