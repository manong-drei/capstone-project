const Patient = require("../models/Patient");
const { normalizePhilippineMobilePhone } = require("../utils/phone");

/** GET /api/patients/me */
const getMyProfile = async (req, res) => {
  try {
    const profile = await Patient.findByUserId(req.user.user_id);
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error("getMyProfile error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PUT /api/patients/me */
const updateProfile = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.contact_number !== undefined) {
      const normalizedPhone = normalizePhilippineMobilePhone(payload.contact_number);
      if (!normalizedPhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be a valid Philippine mobile number in the format 09xxxxxxxxx.",
        });
      }
      payload.contact_number = normalizedPhone;
    }

    if (payload.emg_contact_no !== undefined && String(payload.emg_contact_no).trim()) {
      const normalizedEmergency = normalizePhilippineMobilePhone(payload.emg_contact_no);
      if (!normalizedEmergency) {
        return res.status(400).json({
          success: false,
          message: "Emergency contact number must be a valid Philippine mobile number in the format 09xxxxxxxxx.",
        });
      }
      payload.emg_contact_no = normalizedEmergency;
    }

    const updated = await Patient.updateByUserId(req.user.user_id, payload);
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Profile updated successfully.",
        data: updated,
      });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/patients/:id  (admin/staff/doctor only) */
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found." });
    }
    res.status(200).json({ success: true, data: patient });
  } catch (err) {
    console.error("getPatientById error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { getMyProfile, updateProfile, getPatientById };
