import useLiveData from "@/hooks/useLiveData";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Pencil } from "lucide-react";
import ProfileCard from "@/components/common/ProfileCard";
import UserManual from "@/components/common/UserManual";
import StaffNavbar from "@/components/dashboards/staff/StaffNavbar";
import { ACCOUNT_ROUTES, ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { normalizeDashboardIdentity } from "@/hooks/useDashboardIdentity";
import * as authService from "@/services/authService";
import * as patientService from "@/services/patientService";
import {
  formatPatientDate,
  hasActivePatientPriority,
} from "@/utils/queueDisplay";

const NAME_FIELDS = [
  {
    key: "first_name",
    label: "First name",
    maxLength: 100,
    required: true,
    autoComplete: "given-name",
  },
  {
    key: "middle_name",
    label: "Middle name",
    maxLength: 100,
    autoComplete: "additional-name",
  },
  {
    key: "last_name",
    label: "Last name",
    maxLength: 100,
    required: true,
    autoComplete: "family-name",
  },
  {
    key: "suffix",
    label: "Suffix",
    maxLength: 20,
    autoComplete: "honorific-suffix",
  },
  {
    key: "contact_number",
    label: "Contact number",
    type: "tel",
    maxLength: 24,
    required: true,
    autoComplete: "tel",
  },
];
const PATIENT_FIELDS = [
  { key: "barangay", label: "Barangay", maxLength: 100, required: true },
  {
    key: "city",
    label: "City",
    maxLength: 100,
    required: true,
    autoComplete: "address-level2",
  },
];

function ProfileDetails({ fields }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] sm:gap-x-5">
      {fields.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium text-slate-500">{label}</dt>
          <dd className="mt-1 text-sm font-semibold wrap-anywhere">
            {value || "Not recorded"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function MyProfile() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user, logout } = useAuth();
  const { role, phone } = user;
  const isPatient = role === "patient";
  const loadProfile = isPatient
    ? patientService.getMyProfile
    : authService.getProfile;
  const saveProfile = isPatient
    ? patientService.updateMyProfile
    : authService.updateProfile;
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [retry, setRetry] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const editButtonRef = useRef(null);

  useLiveData(useCallback(async (signal) => {
    try {
      const { data } = await loadProfile({ signal });
      if (!signal.aborted) { setProfile(data); setLoadError(''); }
    } catch (error) { if (!signal.aborted) setLoadError(error.message); }
  }, [loadProfile]), draft === null && !saving, user.user_id + ":" + retry);

  useEffect(() => {
    if (saved) editButtonRef.current?.focus();
  }, [saved]);

  const identity = normalizeDashboardIdentity(
    profile ? { ...profile, role } : user,
  );
  const initials =
    [profile?.first_name?.[0], profile?.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || identity.displayName[0];
  const fields = isPatient ? [...NAME_FIELDS, ...PATIENT_FIELDS] : NAME_FIELDS;
  const values = {
    ...profile,
    contact_number: profile?.contact_number ?? phone,
  };
  const isEditing = draft !== null;
  const changes = Object.fromEntries(
    Object.entries(draft ?? {}).filter(
      ([key, value]) => value !== String(values[key] ?? ""),
    ),
  );
  const hasChanges = Object.keys(changes).length > 0;
  const priorityEligible = isPatient && hasActivePatientPriority(profile);
  const accountDetails = [
    ...(isPatient
      ? [
          [
            "Date of birth",
            profile?.date_of_birth && formatPatientDate(profile.date_of_birth),
          ],
          ["Sex", profile?.gender],
        ]
      : [
          ["Email", profile?.email],
          ...(role === "doctor"
            ? [
                ["Specialization", profile?.specialization_name],
                ["License number", profile?.license_number],
              ]
            : [["Position", profile?.position]]),
        ]),
  ];

  const handleSave = async (event) => {
    event.preventDefault();
    if (saving || !hasChanges) return;
    setSaving(true);
    setSaveError("");
    try {
      const { data } = await saveProfile(changes);
      setProfile(data);
      setDraft(null);
      setSaved(true);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-[Poppins,sans-serif] text-slate-800">
      <StaffNavbar
        identity={identity}
        onHelp={() => setShowManual(true)}
        onLogout={() => {
          logout();
          navigate(ROUTES.LOGIN);
        }}
      />
      <UserManual
        role={role}
        isOpen={showManual}
        onClose={() => setShowManual(false)}
      />
      <main className="w-full space-y-4 px-3 py-4 sm:px-5 sm:py-6 lg:space-y-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1a3a8f] sm:text-3xl">
              My Profile
            </h1>
          </div>
          <Link
            to={ACCOUNT_ROUTES[role].dashboard}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft size={17} aria-hidden="true" /> Back to dashboard
          </Link>
        </div>

        {state?.passwordChanged && (
          <p
            role="status"
            className="rounded-xl bg-green-50 p-4 text-sm text-green-800"
          >
            Password changed successfully.
          </p>
        )}
        <ProfileCard
          name={identity.displayName}
          initials={initials}
          badge={identity.roleLabel}
          secondaryBadge={
            isPatient &&
            profile && (
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityEligible ? "bg-orange-100 text-orange-900" : "bg-blue-100 text-blue-800"}`}
              >
                {priorityEligible ? "Priority" : "Regular"}
              </span>
            )
          }
          headerAction={
            <Link
              to={ROUTES.CHANGE_PASSWORD}
              className="inline-flex min-h-11 max-w-28 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 sm:max-w-none sm:gap-2 sm:px-4 sm:text-sm"
            >
              <LockKeyhole size={16} className="shrink-0" aria-hidden="true" />{" "}
              Change password
            </Link>
          }
        >
          {loadError && (
            <div
              role="alert"
              className="border-t border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <p>{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoadError("");
                  setRetry((value) => value + 1);
                }}
                className="mt-2 min-h-11 rounded-xl border border-red-200 bg-white px-4 font-semibold hover:bg-red-100"
              >
                Retry profile
              </button>
            </div>
          )}
          {!profile && !loadError && (
            <p
              role="status"
              className="border-t border-slate-100 p-5 text-sm text-slate-600"
            >
              Loading personal information…
            </p>
          )}
          {profile && (
            <div className="divide-y divide-slate-100 border-t border-slate-100 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
              <section
                aria-labelledby="profile-personal-heading"
                className="min-w-0 p-3 sm:p-5 lg:p-6"
              >
                <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
                  <h3
                    id="profile-personal-heading"
                    className="text-sm font-semibold text-[#1a3a8f]"
                  >
                    Personal information
                  </h3>
                  <button
                    ref={editButtonRef}
                    type="button"
                    aria-label={isEditing ? "Cancel" : "Edit"}
                    title={isEditing ? "Cancel" : "Edit"}
                    aria-expanded={isEditing}
                    aria-controls="profile-personal-information"
                    disabled={saving}
                    onClick={() => {
                      setDraft(isEditing ? null : Object.fromEntries(fields.map(({ key }) => [key, String(values[key] ?? "")])));
                      setSaveError("");
                      setSaved(false);
                    }}
                    className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                  >
                    {isEditing ? (
                      "Cancel"
                    ) : (
                      <Pencil size={16} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div id="profile-personal-information">
                  {isEditing ? (
                    <form onSubmit={handleSave}>
                      <fieldset
                        disabled={saving}
                        className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-4"
                      >
                        <legend className="sr-only">
                          Editable personal information
                        </legend>
                        {fields.map(
                          ({ key, label, type = "text", ...attributes }) => (
                            <label
                              key={key}
                              className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700"
                            >
                              {label}
                              <input
                                {...attributes}
                                name={key}
                                type={type}
                                autoFocus={key === "first_name"}
                                value={draft[key] ?? values[key] ?? ""}
                                onInput={(event) => {
                                  const value = event.currentTarget.value;
                                  setDraft((previous) => ({
                                    ...previous,
                                    [key]: value,
                                  }));
                                  setSaveError("");
                                }}
                                className="min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
                              />
                            </label>
                          ),
                        )}
                      </fieldset>
                      {saveError && (
                        <p role="alert" className="mt-4 text-sm text-red-700">
                          {saveError}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={saving || !hasChanges}
                        className="mt-4 min-h-11 rounded-xl bg-[#1e4db7] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                      >
                        {saving ? "Saving…" : "Save changes"}
                      </button>
                    </form>
                  ) : (
                    <ProfileDetails
                      fields={fields.map(({ key, label }) => [
                        label,
                        values[key],
                      ])}
                    />
                  )}
                  {saved && (
                    <p role="status" className="mt-3 text-sm text-green-800">
                      Profile saved.
                    </p>
                  )}
                </div>
              </section>
              <section
                aria-labelledby="profile-account-heading"
                className="min-w-0 p-3 sm:p-5 lg:p-6"
              >
                <h3
                  id="profile-account-heading"
                  className="mb-3 flex items-center text-sm font-semibold text-[#1a3a8f] lg:min-h-11"
                >
                  Account details
                </h3>
                <ProfileDetails fields={accountDetails} />
              </section>
            </div>
          )}
        </ProfileCard>
      </main>
    </div>
  );
}
