import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";

export default function StaffPatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [mergeSearch, setMergeSearch] = useState("");
  const [targets, setTargets] = useState([]);
  const [targetId, setTargetId] = useState("");

  useEffect(() => {
    let active = true;
    api.get(`/patients/${id}`).then((res) => { if (active) setPatient(res.data); }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (mergeSearch.trim().length < 2) return;
    let active = true;
    const timer = setTimeout(() => {
      const term = mergeSearch.trim();
      const phone = term.replace(/\D/g, "");
      const params = /^\+?[\d\s-]+$/.test(term) ? `phone=${encodeURIComponent(phone.length === 10 && phone.startsWith("9") ? `0${phone}` : phone)}` : `name=${encodeURIComponent(term)}`;
      api.get(`/patients/search?${params}`).then((res) => { if (active) setTargets((res.data || []).filter((p) => String(p.patient_id) !== id)); }).catch(() => { if (active) setTargets([]); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [mergeSearch, id]);

  const merge = async () => {
    if (!targetId || !window.confirm("Move every queue visit to the selected patient and archive this record?")) return;
    try {
      await api.post(`/patients/${id}/merge`, { target_patient_id: Number(targetId), confirm: true });
      navigate(`/staff/patients/${targetId}`);
    } catch (err) { setError(err.message); }
  };

  return <main style={{ maxWidth: "800px", margin: "32px auto", padding: "0 18px", fontFamily: "system-ui", color: "#1e2d6b" }}>
    <Link to="/staff">← Staff dashboard</Link>
    <h1>Patient profile</h1>
    {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
    {!patient && !error && <p>Loading…</p>}
    {patient && <>
      <section style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
        <h2>{patient.first_name} {patient.last_name} <small>#{patient.patient_id}</small></h2>
        {patient.archived_into_patient_id && <p>This record was merged into <Link to={`/staff/patients/${patient.archived_into_patient_id}`}>patient #{patient.archived_into_patient_id}</Link>.</p>}
        <p>Date of birth: {String(patient.date_of_birth || "").slice(0, 10) || "Unknown"}</p>
        <p>Gender: {patient.gender} · Mobile: {patient.contact_number || "Not recorded"}</p>
        <p>Address: {patient.barangay}, {patient.city}</p>
      </section>
      <h2>Queue history ({patient.visits?.length || 0})</h2>
      {!patient.visits?.length && <p>No queue visits yet.</p>}
      {patient.visits?.map((visit) => <article key={visit.id} style={{ padding: "12px 16px", marginBottom: "8px", background: "white", border: "1px solid #e5e7eb", borderRadius: "9px" }}>
        <strong>{visit.queue_number}</strong> · {new Date(visit.created_at).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })} · {visit.category} · {visit.status}
        {visit.status_reason && <div>Reason: {visit.status_reason}</div>}
      </article>)}
      {!patient.user_id && !patient.archived_into_patient_id && <section style={{ marginTop: "30px", padding: "16px", background: "#fff7ed", borderRadius: "10px" }}>
        <h2>Merge duplicate record</h2>
        <p>All queue visits will move to the selected patient. This record will be archived.</p>
        <label htmlFor="merge-search">Find the correct patient</label>
        <input id="merge-search" value={mergeSearch} onChange={(e) => { setMergeSearch(e.target.value); setTargetId(""); setTargets([]); }} placeholder="Name or mobile number" style={{ display: "block", width: "100%", maxWidth: "380px", padding: "9px", margin: "7px 0" }} />
        {targets.map((p) => <label key={p.patient_id} style={{ display: "block", padding: "5px" }}><input type="radio" name="merge-target" value={p.patient_id} checked={targetId === String(p.patient_id)} onChange={() => setTargetId(String(p.patient_id))} /> {p.first_name} {p.last_name} · {String(p.date_of_birth || "").slice(0, 10)} · {p.masked_contact}</label>)}
        <button type="button" onClick={merge} disabled={!targetId} style={{ marginTop: "10px", padding: "9px 15px" }}>Merge into selected patient</button>
      </section>}
    </>}
  </main>;
}
