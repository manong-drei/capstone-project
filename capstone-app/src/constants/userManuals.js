// Keep instructions aligned with the rendered dashboards, not unused service helpers.
export const USER_MANUALS = {
  patient: {
    label: "Patient",
    introduction: "E-KALUSUGAN helps you request a dental queue ticket, follow your turn, and review your appointment history at the City Health Office of Bago. This manual explains what to select and what to do when your ticket changes status.",
    workflow: ["Request a ticket", "Check your status", "Report when called", "Receive dental care"],
    before: [
      "Sign in with your registered phone number and password. Ask clinic reception for account assistance if you cannot sign in; public self-registration is unavailable.",
      "If you received a temporary password, follow the password-change screen after signing in. Never share your new password.",
      "Check dentist availability and any registration message on Home. Keep your phone connected and stay close enough to report when called.",
    ],
    tasks: [
      {
        id: "get-ticket", title: "Get a dental queue ticket", summary: "Request a ticket for today's dental visit from Home.",
        steps: [
          "Select “Get queue ticket”. The “Get Queue Ticket” window opens.",
          "Choose one or two dental services for your visit. To change a selection after choosing two, clear one first.",
          "Select “Get Queue Ticket” and wait for confirmation. Your assigned ticket appears on Home; keep this number to identify your visit to staff.",
          "Read the notice above your ticket. It tells you whether to stay nearby without an SMS or expect a possible text reminder as your turn approaches.",
        ],
        note: "You can have one active dental ticket and make at most two dental queue registrations per day. Cancelled tickets and no-shows still count. After the first dental call, new online same-day registration closes; an existing eligible appointment for today may still obtain its ticket. Follow the message shown or approach staff for walk-in registration.",
      },
      {
        id: "follow-ticket", title: "Follow your turn", summary: "Your ticket status tells you what to do next.",
        steps: [
          "On Home, compare your ticket with “Now serving” and “Next in queue”. The display updates about every 15 seconds while the page is open.",
          "While your ticket is “Waiting”, stay nearby and keep checking. Queue order can change when priority patients or confirmed returning patients are placed in order.",
          "When “It’s your turn!” or “Called — report to staff” appears, report to staff immediately. Staff must confirm that you are present before care begins.",
          "If you see “Missed call”, report to staff before the displayed deadline. Staff must record your return; reopening the page does not confirm your arrival.",
        ],
        note: "Use the current ticket status and staff instructions to judge your turn. The displayed estimated wait is a guide, not a guaranteed appointment time. Do not wait for an SMS before reporting when called.",
      },
      {
        id: "cancel-ticket", title: "Cancel a ticket", summary: "Cancel when you can no longer attend and your ticket is still eligible.",
        steps: [
          "Find your active ticket on Home. “Cancel Queue” is available while Waiting or Missed call.",
          "Select “Cancel Queue”, choose the reason that fits, then select “Continue”.",
          "Wait for the updated ticket display. If you are already called or receiving care, speak to staff about your change of plans.",
        ],
        note: "Cancelling does not restore a daily registration attempt. A new request must still meet today's availability, capacity, and registration rules.",
      },
      {
        id: "patient-history", title: "View history and clinic location", summary: "Use the Home shortcuts to find previous visits and the clinic map.",
        steps: [
          "Select “Appointment history” to see your recorded appointments and their statuses.",
          "Select “Back” to return to Home. History is a viewing screen; ask staff if a record needs attention.",
          "Select “Location” on Home to view the City Health Office of Bago map.",
        ],
      },
    ],
    screen: {
      src: "/assets/manual/patient-ticket.png",
      alt: "Sample patient ticket AQ07 with numbered markers for the ticket and SMS notice, Waiting status, and Cancel Queue button.",
      description: "Use this example to locate the important parts of your ticket. All labels are explained below so you do not have to read the small text in the image.",
      labels: ["Ticket and notice: read your assigned number and the instruction about staying nearby or receiving an SMS.", "Status: “Waiting” means you are still in line. A called or missed status requires prompt action.", "Cancel Queue: opens the reason selection for an eligible cancellation."],
    },
    troubleshooting: [
      ["I cannot request a ticket.", "Read the registration message. You may already have an active ticket, have reached two registrations today, or be outside the available capacity. When new online registration is closed, approach staff about walk-in registration."],
      ["I missed my call.", "Report to staff before your displayed 10-minute deadline. Staff can confirm a return within this window. A No-show ticket cannot be revived; ask staff about your next eligible option."],
      ["I did not receive a text message.", "Read the notice on your ticket. Some tickets receive no queue SMS because they started close to the front. Messages may also be delayed. Follow the on-screen queue and ask staff if your registered number needs checking."],
      ["The screen has stopped updating.", "Check your internet connection. Reload the page and check your existing ticket before attempting another registration. If the problem continues, ask reception to confirm your ticket."],
      ["I forgot my password or the temporary one expired.", "Select “Forgot password?” on the sign-in page and visit reception. Be ready to verify your name, registered phone, address, and birthday. An in-person recovery password lasts 30 minutes and works once; then finish setting your new password within 15 minutes."],
    ],
    support: "Visit clinic reception for ticket, account, or record assistance.",
    faqs: [
      ["Can I choose more than two services?", "Choose one or two services per ticket. Tell clinic staff or the dentist if your needs change."],
      ["How do I get priority status?", "Priority is applied automatically when your profile has a valid approved category. Ask clinic staff to review your eligibility; there is no patient priority selector."],
      ["Why did a higher ticket number go first?", "Appointment and walk-in tickets use separate counters. Priority and confirmed returns also affect serving order. Follow the displayed queue rather than comparing the number alone."],
      ["Does this ticket reserve a future date?", "The ticket request is for today's dental visit. It is not a future-date booking form."],
      ["Can I recover my account by text?", "The sign-in recovery instructions direct you to reception for identity verification. Staff issue an in-person recovery password. Keep this password private and use it promptly."],
    ],
    conclusion: "You are ready to request an eligible ticket, follow its status, and report to staff when called. Keep your ticket number handy and contact reception when a message or record needs clarification.",
  },
  doctor: {
    label: "Doctor",
    introduction: "Use E-KALUSUGAN to set today's dental availability and capacity, call patients, record consultations, and review reports. This guide follows the controls on your doctor dashboard.",
    workflow: ["Set availability", "Call and confirm", "Record the visit", "Review reports"],
    before: [
      "Confirm that you are signed in to your own doctor account. Check today's availability and capacity before accepting patients.",
      "Check the current called or serving ticket before calling another patient. Confirm physical presence before starting care.",
      "Use only authorized patient information in consultation notes and reports. Save report entries before changing dates or leaving the page.",
    ],
    tasks: [
      {
        id: "daily-capacity", title: "Set availability and daily capacity", summary: "Availability saves immediately; capacity changes need “Apply”.",
        steps: [
          "Under “Today's Availability”, select “Available” or “Unavailable” to change your status. Wait for saving to finish.",
          "Open “Daily Capacity” if collapsed. Adjust “Appointment Limit” from 0 to 10 and “Walk-In Capacity” from 0 to 30.",
          "Select “Apply” and look for “Saved ✓”. If “Lower Appointment Limit?” appears, review the existing booked count before selecting “Continue”. Existing bookings remain.",
        ],
        note: "Walk-In Capacity of 0 means “Not set”, so it does not set a zero-patient limit. Recheck the date and settings when starting a new day.",
      },
      {
        id: "consultation", title: "Call a patient and save a consultation", summary: "Use the current dental queue to move from a call to a completed visit.",
        steps: [
          "Select “Next” when there is no unresolved called or serving patient. The next waiting ticket becomes called.",
          "When the patient is physically present, select “Start consultation”. The “Consultation Notes” window opens.",
          "Enter the required “Consultation Notes”. Add “Diagnosis” and “Prescription / Recommendations” if needed.",
          "Select “Save Consultation”. A successful save stores the notes and completes the visit. If saving fails, keep the window open, read the error, and retry when the issue is resolved.",
          "Alternatively, use “Mark as Complete” to finish a serving visit without notes. Use “Add notes” in “Completed List” to record its consultation later.",
        ],
        note: "Only one consultation can be saved per visit. There is no consultation editing control here. Completing a ticket alone does not create consultation notes or clinical report counts.",
      },
      {
        id: "doctor-missed", title: "Handle absent and returning patients", summary: "Follow the timed call controls so every patient has the same opportunity to respond.",
        steps: [
          "If the called patient is absent, wait for the 30-second countdown to finish, then select “Call again”. Each call is announced twice.",
          "After the second call, wait another 30 seconds. If still absent, select “Skip and call next”.",
          "Check “Missed patients · 10-minute return window”. If the patient arrives before the listed deadline, select “Patient returned” only after confirming physical presence.",
          "The returned ticket waits for the next opening without interrupting the current patient. Expiry or a second missed turn after returning ends it as No-show.",
        ],
      },
      {
        id: "doctor-reports", title: "Review analytics and enter report counts", summary: "Completed visits appear automatically. Clinical results require your own saved entries.",
        steps: [
          "Open “Analytics”. Select “Today”, “This week”, or “This month” and the matching report date, week, or month.",
          "Review completed-visit totals and demographics for the selected period. Open “Daily barangay entries” to record clinical counts.",
          "Choose “Entry date” and “Barangay”, then enter whole-number counts of 0 or more in the appropriate fields. Leave a field blank when no entry is available; enter 0 only for a confirmed zero.",
          "Select “Save entries” before changing dates or report periods. If saving fails, keep the entered values and resolve the error before retrying.",
          "Review “Page 1” and “Page 2”. Select “Print report” or “Download Excel” after data has loaded and all changes are saved.",
        ],
        note: "A barangay is the local community used to group the report. BOHC means Basic Oral Health Care. Completed visits do not establish clinical outcomes; use the clinic's reporting definitions when entering these counts. Exports are blocked for loading errors, unsaved changes, or a period with no completed visits or saved counts.",
      },
      {
        id: "doctor-history", title: "Review appointment history", summary: "Find recorded visits without changing their details.",
        steps: [
          "Open “Appointment History” and choose “Today” or “All”.",
          "Review dates, patients, services, and statuses. On a desktop, select a table heading such as “Date” or “Patient Name” to sort.",
          "Use the back control to return to the dashboard. If report entries are unsaved, review the prompt before discarding them.",
        ],
      },
    ],
    screen: {
      src: "/assets/manual/doctor-capacity.png", alt: "Doctor Daily Capacity example with markers for the panel, Appointment Limit slider, Walk-In Capacity field, and Apply button.",
      description: "This annotated example shows where to set today's capacity. The numbers shown are examples, not required clinic limits.",
      labels: ["Daily Capacity: select the panel heading to expand or collapse it.", "Appointment Limit: use the slider to set the daily appointment limit, up to 10.", "Walk-In Capacity: enter the capacity; 0 is displayed as “Not set”.", "Apply: saves the selected capacity values. Wait for the saved confirmation."],
    },
    troubleshooting: [
      ["Next is unavailable or another patient is active.", "Resolve the called or serving ticket first. Confirm presence, complete care, or follow the recall/skip controls as appropriate. Check that waiting tickets remain and no update is still running."],
      ["Call again or Skip is disabled.", "Wait for the displayed countdown. Recall requires 30 seconds after the first call; skipping requires two calls and another 30 seconds after the second."],
      ["Consultation saving failed.", "Keep the notes window open and read the error. Check the connection and whether a consultation was already saved for this visit. Do not create a second ticket just to save notes."],
      ["A report will not print or download.", "Wait for loading to finish, use “Retry” for a load error, and save all manual entries. Check that the chosen period contains completed visits or saved clinical counts."],
      ["Queue or settings look out of date.", "The dashboard refreshes about every 30 seconds. Confirm the connection and current ticket before repeating an action. Save any unsaved notes or report entries before reloading the page."],
    ],
    support: "Contact the clinic administrator for account, queue, or report problems you cannot resolve.",
    faqs: [
      ["Does Mark as Complete save my notes?", "It completes the visit without a consultation. Use “Save Consultation” or “Add notes” to store consultation details."],
      ["Does lowering the appointment limit cancel bookings?", "No. The confirmation warns about existing bookings, which remain after the new limit is saved."],
      ["Why do clinical counts differ from completed visits?", "Completed visits are counted from queue activity. Clinical outcomes are entered separately; they are not inferred from a completed ticket."],
      ["What is the difference between blank and zero?", "Blank means no value has been entered. Zero records a confirmed count of none. Keep that distinction when filling reports."],
    ],
    conclusion: "Start with accurate availability and capacity, confirm each patient's presence, and save consultation notes deliberately. Review the selected report period and save clinical counts before exporting.",
  },
  staff: {
    label: "Staff",
    introduction: "The staff dashboard helps reception register dental walk-ins, keep the queue moving, find patient records, and assist with account recovery. Use this guide during intake and when a patient needs help with their turn.",
    workflow: ["Find the patient", "Register the visit", "Confirm presence", "Finish the check-up"],
    before: [
      "Check dentist availability and the latest queue before registration. Use your own staff account.",
      "Ask patients to confirm their identity and mobile number. Search existing records before creating a new patient.",
      "Read the registration success message aloud to the patient when it includes instructions about SMS or staying nearby.",
    ],
    tasks: [
      {
        id: "staff-walk-in", title: "Register a dental walk-in", summary: "Find an existing patient first to avoid duplicate records.",
        steps: [
          "In “Register dental walk-in”, use “Find an existing patient”. Enter at least two name characters or any four consecutive digits from the mobile number.",
          "Compare the name, birthday, and partly hidden phone number, then select the correct patient. Use “Open patient profile” to review the record or “Clear selection” to choose again.",
          "If the matches are different people, verify them before choosing “I checked these records; create a new patient.” Complete Full name, Date of birth, Gender, Barangay, and Confirmed mobile number. The form supplies +63; enter ten digits starting with 9.",
          "Choose one or two “Dental services”. Select “Regular” or “Priority”; Priority requires a category: Senior citizen (60+), PWD (Person with Disability), or Pregnant.",
          "Select “Register and assign dental queue”. Give the patient the assigned number and relay the exact SMS or stay-nearby instructions shown in the success message.",
        ],
        note: "Registration can be blocked by missing details, an existing active ticket, an unavailable dentist, or full walk-in capacity. Read the message and resolve the cause before trying again.",
      },
      {
        id: "staff-queue", title: "Call and finish a visit", summary: "Follow “Up next” and “Serving order” instead of sorting tickets yourself.",
        steps: [
          "When ready, select “Call next patient”. The selected ticket becomes Called.",
          "Select “Patient present” only after the patient is physically there. The ticket becomes Now serving.",
          "When the check-up is finished, select “Call next patient” to complete the current visit and call the next one. If nobody else is waiting, select “Finish check-up”.",
          "To cancel an eligible waiting ticket, select “Cancel” beside it. Choose a reason in “Reason for cancellation”, then select “Continue”.",
        ],
        note: "Finishing the check-up changes the queue status. The doctor saves consultation notes separately. Use “Refresh” to confirm the latest state if another staff member is working on the queue.",
      },
      {
        id: "staff-missed", title: "Handle missed calls and returns", summary: "Use the call timers and the patient's return deadline.",
        steps: [
          "After the first call, wait 30 seconds before selecting “Call again”. Each call is announced twice.",
          "After the second call, wait another 30 seconds before selecting “Skip and call next”.",
          "Look under “Missed patients · 10-minute return window”. If the patient arrives before the deadline, select “Patient returned” after confirming presence.",
          "Explain that the same ticket waits for the next opening. A return does not interrupt a patient already called or serving. An expired window or another missed turn after returning ends as No-show.",
        ],
      },
      {
        id: "staff-recovery", title: "Help a patient recover their account", summary: "Recover access only after verifying the patient in person.",
        steps: [
          "Select “Account recovery”, search for the patient, and open the matching profile. Select “Start account recovery” if available.",
          "Complete all six Identity verification checks: patient presence, first name, last name, registered phone, address, and birthday. Stop if any detail differs.",
          "Select “Issue temporary password” and review the confirmation. Issuing it invalidates the old password and existing sessions.",
          "Hand the displayed password directly to the verified patient. It lasts 30 minutes and permits one login. After login, the patient has 15 minutes to set a new password.",
          "Select “Hide temporary password” when finished. The password cannot be shown again from this display.",
        ],
        note: "The account must be active and have complete identity information. Ask an administrator to resolve missing details or inactive accounts. Do not bypass an identity mismatch.",
      },
      {
        id: "staff-records", title: "Review records and duplicate patients", summary: "Use patient profiles to check previous visits and carefully resolve confirmed duplicates.",
        steps: [
          "Select a patient name or “Open patient profile” to review the profile and Queue history.",
          "For a verified duplicate without a linked account, “Merge duplicate record” may be available. Use “Find the correct patient” to locate the record that should remain.",
          "Compare both records carefully. Select “Merge into selected patient” only when they belong to the same person, then review and confirm the consequence.",
        ],
        note: "Merging moves queue history to the selected patient and archives the duplicate, removing it from active patient records. This is a deliberate record correction, not a required registration step. Conflicting active tickets must be resolved first.",
      },
      {
        id: "staff-monitor", title: "Open the clinic queue display", summary: "Show the dental queue on a separate screen while keeping reception open.",
        steps: [
          "Select “Open dental monitor”. It opens the display in a separate browser tab.",
          "Use the announcement control on the monitor to enable voice announcements. Browser support and a suitable voice are required.",
          "If audio is unavailable, follow the recovery message and continue using the visible ticket display. The monitor refreshes about every 10 seconds; the staff dashboard refreshes about every 15 seconds.",
        ],
      },
    ],
    screen: {
      src: "/assets/manual/staff-registration.png", alt: "Staff walk-in registration example showing up to two dental services, Regular or Priority queue type, and Register and assign dental queue.",
      description: "This is the final part of the walk-in form. Confirm patient details above it before assigning a ticket.",
      labels: ["Dental services: choose one or two requested services.", "Queue type: select Regular or Priority; a priority selection also needs the patient's category.", "Register and assign dental queue: submits the visit. Read the confirmation before handing over the ticket."],
    },
    troubleshooting: [
      ["No patient match appears.", "Use at least two name characters or four consecutive mobile digits. Check the spelling or number with the patient. Review possible matches before confirming a new record."],
      ["Walk-in registration is blocked.", "Read the message. Confirm required details, the complete mobile number, service selections, dentist availability, capacity, and whether the patient already has an active ticket."],
      ["Call next patient is disabled.", "A called patient may still need presence confirmation or the recall/skip process. Check for waiting patients and wait for any update to finish."],
      ["Account recovery is unavailable.", "Check whether the account is active and all identity details are present. Ask an administrator to resolve account status or missing details. All identity checks must match."],
      ["A queue change failed or information may be outdated.", "Select “Refresh”. Compare the latest called and serving tickets before repeating the action; another staff member may already have changed the queue."],
      ["The monitor has no voice announcements.", "Enable announcements from the monitor and follow its browser/voice recovery message. Keep using the visible display if speech remains unavailable."],
    ],
    support: "Contact the clinic administrator for unresolved account, duplicate-record, or queue problems.",
    faqs: [
      ["Why can I select only two services?", "Each dental ticket allows one or two services. Clear a selected service before choosing another."],
      ["Why is no SMS planned for a ticket?", "A patient who joins within the alert range receives no queue SMS and must stay nearby. Other eligible tickets may receive one approaching-turn alert. Relay the actual registration notice."],
      ["Does finishing a check-up save the doctor's notes?", "No. Queue completion and consultation saving are separate actions. The doctor can add the consultation to an eligible completed visit."],
      ["Can a returning patient interrupt the current visit?", "No. A confirmed return within the deadline keeps the ticket for the next opening after the current called or serving patient."],
      ["Can I send a recovery password to someone who is absent?", "Recovery requires the patient to be physically present and all identity details to match. Give the password directly to that verified patient."],
    ],
    conclusion: "Accurate patient matching, confirmed contact details, and timely presence checks keep reception and the dental queue coordinated. Relay each ticket's instructions and verify the latest queue before repeating an action.",
  },
  admin: {
    label: "Administrator",
    introduction: "The administrator dashboard brings together account management, queue oversight, appointment history, notification settings, and service statistics. This guide explains the actions available in each area and how to interpret their results.",
    workflow: ["Review activity", "Manage accounts", "Check notifications", "Read service reports"],
    before: [
      "Use your own administrator account. On a phone or narrow screen, select “Open menu” to reveal the dashboard sections.",
      "Verify patient identity and registered phone numbers before issuing or replacing temporary passwords.",
      "Review the confirmation before deactivating an account or cancelling a ticket. Access and queue changes affect the people using the clinic.",
    ],
    tasks: [
      {
        id: "admin-overview", title: "Review clinic activity and queue", summary: "Review today's live queue directly on the Dashboard overview.",
        steps: [
          "Open “Dashboard” to review Total Patient Visits, Total Doctors, Total Appointments, and Total Queues Completed. In today's queue statistics, Serving includes called patients.",
          "On “Dashboard”, use “Live queue monitor” to see Dental and General patients now being served and up next. Filter today's tickets by All queues, Dental, or General to review patients, queue types, statuses, and recorded reasons. It refreshes every 15 seconds; use “Refresh live queue” for an immediate update.",
          "To withdraw an eligible active ticket, select its “Cancel” button, choose the reason in “Reason for cancellation”, then select “Continue”. Staff and doctors handle calls and physical presence.",
          "Open “Doctors” to read Doctor Availability. Open “Patients History” for Appointment History; use “Previous” and “Next” to move through ten-record pages.",
        ],
        note: "Doctors and Patients History are viewing screens here. Doctor availability is changed by the doctor. Cancelled tickets may no longer appear in the active queue list.",
      },
      {
        id: "admin-staff", title: "Create and manage staff accounts", summary: "Manage doctor, staff, and administrator access in Accounts.",
        steps: [
          "Open “Accounts”, choose “Staff”, then select “Add Staff”.",
          "In “New Staff Account”, select the role and fill Phone, First Name, Last Name, Email, and Password. Doctors also require License Number; staff require Position.",
          "Select “Create Account”. Use a valid Philippine mobile number and check any error about an existing phone, email, or license.",
          "Use “Edit” and “Save Changes” to update supported account details. This form does not change the role or password.",
          "Use “Deactivate” or “Reactivate” and review the confirmation to change access. Enable “Show inactive” to find deactivated accounts. You cannot deactivate your own administrator account.",
        ],
      },
      {
        id: "admin-patients", title: "Create and assist patient accounts", summary: "Patient accounts use a temporary activation password sent by SMS.",
        steps: [
          "Open “Accounts”, choose “Patients”, then select “Add Patient”.",
          "Complete First Name, Last Name, Phone, Date of Birth, Gender, and Barangay. Set Priority Status only when appropriate, then select “Create Account”.",
          "Check the account confirmation and SMS status. Creating the account queues its activation password message; it does not register a queue ticket.",
          "Use “Search by name, contact, or barangay...” and “Show inactive” to find accounts. Use “Deactivate” or “Reactivate” when account access needs to change.",
          "For an active account still awaiting its first password change, “Issue replacement password” may be shown. Verify identity and the registered phone, check SMS history, then review the confirmation before replacing the password.",
        ],
        note: "A replacement makes the previous temporary password and any open password-setup session unusable. If the SMS status is unknown, verify the text-message provider's history before issuing another password.",
      },
      {
        id: "admin-recovery", title: "Assist with in-person account recovery", summary: "Use this when a verified patient needs to regain access.",
        steps: [
          "From patient account management, select “Account recovery” to open the patient's profile, then “Start account recovery”.",
          "Verify the patient is physically present and confirm first name, last name, registered phone, address, and birthday. Stop if any detail does not match.",
          "Select “Issue temporary password” and review the confirmation. Give the shown password directly to the verified patient; it works for one login within 30 minutes.",
          "Explain that the patient must set a new password within the 15-minute setup session after login. Select “Hide temporary password” when finished.",
        ],
      },
      {
        id: "admin-sms", title: "Set up and review SMS notifications", summary: "SMS means text messages. Use this area for approach alerts and account-message status.",
        steps: [
          "Open “Notifications”. In “SMS notifications”, set “Notify within the next” to a whole number from 1 to 100 patients.",
          "Select “Save”. One alert can be sent per eligible ticket as the patient's turn approaches.",
          "Review “Recent SMS activity” for Purpose, Recipient, Status, Details, and Created. Select “Refresh” for an update; the list also updates about every 15 seconds.",
          "Read status details before taking action. Queued, submitted, or pending does not confirm delivery; unknown means submission is uncertain and must be checked against provider history.",
        ],
        note: "Patients who join already within the alert range receive no queue SMS and must stay nearby. Changing this setting does not enable alerts for tickets already marked to receive none. A sent status does not prove that a patient read the message.",
      },
      {
        id: "admin-statistics", title: "Understand statistics and predictions", summary: "Read recorded service data separately from the demonstration forecast.",
        steps: [
          "Open “Statistics/Analytics”. Use “Year” to select an available historical year or “2026 prediction”.",
          "Read the chart legend: green shows 2025 actual data, blue shows the 2026 prediction, and the dashed gray range shows the estimate's uncertainty.",
          "Review “2026 forecast breakdown”, “Model performance by age group”, and “How to read these predictions” alongside the chart.",
        ],
        note: "BOHC means Basic Oral Health Care. The screen labels this a “Demonstration forecast” and includes sample history created for teaching. Predictions and accuracy scores are examples; do not treat them as official facility totals or guaranteed demand.",
      },
    ],
    screen: {
      src: "/assets/manual/admin-notifications.png", alt: "Administrator Notifications example with markers on the Notifications menu, alert range field, Save button, and Recent SMS activity Refresh button.",
      description: "This example shows notification controls. An empty activity list means there are no jobs in the displayed results.",
      labels: ["Notifications: opens the SMS settings and recent activity.", "Notify within the next: enter the approach-alert range, from 1 to 100 patients.", "Save: applies the alert setting. Read the stay-nearby rule for tickets already within range.", "Refresh: updates Recent SMS activity so you can check the latest status and details."],
    },
    troubleshooting: [
      ["An account seems to be missing.", "Enable “Show inactive”, clear the patient search, and check the correct Staff or Patients section. Use Previous/Next where available."],
      ["Account creation reports a duplicate.", "Check existing phone numbers, emails, or license numbers before trying again. Locate and review the existing account rather than creating another for the same person."],
      ["An SMS is queued or pending.", "Use Notifications → Recent SMS activity and Refresh. Sending and delivery take time. Check details rather than assuming that account creation guarantees receipt."],
      ["An SMS status is unknown.", "Verify the text-message provider's history before issuing a replacement password. The provider may have received the request even though its result is unknown."],
      ["Changing the alert range did not send more texts.", "Tickets that joined within their alert range remain set to receive no queue SMS. There is no manual queue-alert resend action. Ask staff to relay the ticket's stay-nearby instruction."],
      ["Statistics or queue data will not load.", "Check the connection and follow the displayed refresh instructions. Confirm current state before repeating any cancellation or account action."],
    ],
    support: "Coordinate with the clinic's designated system support person for persistent loading or account issues, and the SMS provider contact when message history needs verification.",
    faqs: [
      ["Does creating a patient account add a queue ticket?", "No. Account creation and queue registration are separate. The patient requests an eligible ticket or staff register a walk-in."],
      ["Can I call patients or change doctor availability here?", "Queue calls and presence checks belong to staff and doctors. The Doctors screen shows availability; the doctor changes it on their dashboard."],
      ["Can I change a staff account's role or password with Edit?", "The current edit form supports account details, not role or password changes. Ask designated system support if those need correction."],
      ["Does Sent mean the message was read?", "No. Review the provider status and details. A sent message is not proof that a patient received or read it."],
      ["Are predicted BOHC totals official counts?", "No. This is a demonstration forecast containing sample history created for teaching. Compare it with recorded data and read the screen's explanation before using it."],
    ],
    conclusion: "Keep account information accurate, check the latest queue and message statuses, and distinguish recorded activity from illustrative forecasts. Review confirmations carefully and route clinical queue actions to staff or doctors.",
  },
};
