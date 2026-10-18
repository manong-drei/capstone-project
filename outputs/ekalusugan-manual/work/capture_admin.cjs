const {open,snap:rawSnap,inventory}=require('./capture.cjs');
const snap=(page,id,labels,opts={})=>rawSnap(page,id,labels,{...opts,profile_anonymized:true});
(async()=>{
 const s=await open('admin'); const p=s.page;
 await p.route('**/api/auth/profile',route=>route.fulfill({status:200,json:{success:true,data:{user_id:4,role:'admin',display_name:'Sample Administrator',first_name:'Sample',last_name:'Administrator',email:'sample@example.com'}}}));
 await p.reload({waitUntil:'networkidle'});await p.waitForTimeout(700);
 const b=text=>p.getByRole('button',{name:text,exact:true}).first();
 const label=(selector,text,dx,dy)=>({selector,text,dx,dy});
 async function tab(name){await b(name).click();await p.waitForTimeout(950);}
 await snap(p,'admin_home',[
  label(b('Dashboard'),'Dashboard — return to the administrator overview.'),
  label(p.getByText('Total Patient Visits',{exact:true}),'Overview cards — review recorded visits, doctors, appointments and completed queues.'),
  label(p.getByText('Queue Statistics · Today',{exact:true}),'Queue Statistics — check today’s waiting, serving, done and cancelled totals.'),
  label(b('Monthly'),'Monthly / Weekly / Daily — change the patient-volume chart period.'),
 ]);
 await tab('Queue Monitor');
 await snap(p,'admin_queue',[
  label(b('Queue Monitor'),'Queue Monitor — open the live queue list.'),
  label(p.getByRole('heading',{name:'Queue Monitor',exact:true}),'Live queue — view ticket numbers, patient names, priority and status; the list refreshes automatically.'),
  label(p.getByText('No queue entries today.',{exact:true}),'Empty queue — this message appears when today has no tickets.'),
 ]);
 await tab('Statistics/Analytics');
 await snap(p,'admin_statistics',[
  label(b('Statistics/Analytics'),'Statistics/Analytics — open oral health statistics and forecasting.'),
  label(p.locator('main select').first(),'Year — choose recorded historical figures or the 2026 prediction.'),
  label(p.locator('.ar-chart').first(),'Recipient chart — compare age groups and, for 2026, predictions with the 2025 actual figures.'),
 ]);
 await tab('Doctors');
 await snap(p,'admin_doctors',[
  label(b('Doctors'),'Doctors — view registered doctors and their availability.'),
  label(p.getByRole('heading',{name:'Doctor Availability',exact:true}),'Doctor Availability — read each doctor’s name and service.'),
  label(p.locator('main .grid').first(),'Availability badges — identify available and on-leave doctors.'),
 ]);
 await tab('Patients History');
 await p.setViewportSize({width:1360,height:1100});
 await snap(p,'admin_history',[
  label(b('Patients History'),'Patients History — open appointment and patient history records.'),
  label(p.getByRole('heading',{name:'Patients History',exact:true}),'History table — review appointment date, patient, doctor and status.'),
  label(p.locator('main table').first(),'Recorded appointments — inspect each row and use the page controls below the table for more records.'),
  label(b('Next'),'Previous / Next — move through the appointment history pages.'),
 ]);
 await p.setViewportSize({width:1360,height:900});
 await tab('Notifications');
 await snap(p,'admin_notifications',[
  label(b('Notifications'),'Notifications — manage queue SMS settings and review SMS activity.'),
  label(p.locator('#sms-threshold'),'Notify within the next — enter a whole-number queue threshold from 1 to 100.'),
  label(b('Save'),'Save — apply the notification threshold.'),
  label(p.getByRole('button',{name:'Refresh SMS activity'}),'Refresh — reload SMS delivery activity immediately.'),
 ]);
 await tab('Accounts');
 await snap(p,'admin_staff',[
  label(b('Accounts'),'Accounts — open account management.'),
  label(b('Staff'),'Staff / Patients — switch the account list.'),
  label(p.getByText('Show inactive',{exact:true}),'Show inactive — include deactivated staff accounts in the list.'),
  label(b('Add Staff'),'Add Staff — open a form for a doctor, staff or administrator account.'),
  label(b('Edit'),'Edit — update an existing staff member’s account details.'),
  label(b('Deactivate'),'Deactivate — open the confirmation that removes this account’s system access.'),
 ]);
 await b('Add Staff').click();
 await p.setViewportSize({width:1360,height:1100});
 await snap(p,'admin_staff_form',[
  label(p.locator('main select').first(),'Role — choose Doctor, Staff or Admin.'),
  label(p.getByText('First Name',{exact:true}).first(),'Identity and contact fields — enter the account holder’s first name, last name, email and phone.'),
  label(p.getByText('Password',{exact:true}).first(),'Password — set the initial password for the staff account.'),
  label(p.getByPlaceholder('PRC License No.'),'Role-specific field — enter the doctor’s license number; Staff uses Position.'),
  label(b('Cancel'),'Cancel — close the new-account form.'),
  label(b('Create Account'),'Create Account — validate and create the staff account.'),
 ]);
 await b('Cancel').click();
 await p.setViewportSize({width:1360,height:900});
 await b('Patients').click();await p.waitForTimeout(1000);
 await p.setViewportSize({width:1360,height:1100});
 await snap(p,'admin_patients',[
  label(b('Patients'),'Patients — switch to patient account management.'),
  label(b('Add Patient'),'Add Patient — open the assisted patient-account form.'),
  label(p.getByPlaceholder('Search by name, contact, or barangay...'),'Search — filter the patient list by name, contact or barangay.'),
  label(p.getByText('Show inactive',{exact:true}),'Show inactive — include deactivated patient accounts.'),
  label(b('Deactivate'),'Deactivate — open the account-access confirmation.'),
  label(b('Next'),'Previous / Next — move through the patient-account pages.'),
 ]);
 await b('Add Patient').click();await p.setViewportSize({width:1360,height:1100});
 await snap(p,'admin_patient_form',[
  label(p.getByPlaceholder('Juan'),'First Name and Last Name — enter the patient’s identity.'),
  label(p.getByPlaceholder('09XX XXX XXXX'),'Phone — enter the patient’s mobile number.'),
  label(p.locator('main input[type=date]').first(),'Date of Birth — choose the patient’s birth date.'),
  label(p.locator('main select').nth(1),'Address / Barangay — choose the patient’s barangay.'),
  label(p.locator('main select').nth(2),'Priority Status — choose None, Senior Citizen, PWD or Pregnant, as applicable.'),
  label(b('Create Account'),'Create Account — submit the patient details; Cancel closes the form.'),
 ]);
 await s.browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
