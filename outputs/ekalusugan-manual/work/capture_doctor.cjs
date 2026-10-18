const {open,snap} = require('./capture.cjs');

async function main() {
  const {browser,context,page} = await open('doctor',{viewport:{width:1360,height:1100}});
  try {
    const date = '2026-10-18';
    const until = '2026-10-19';
    const sampleReport = Array.from({length:24},()=>Array(24).fill(null));
    sampleReport[0] = [3,2,4,5,1,0,2,1,0,1,0,0,2,3,1,2,1,1,1,2,3,4,1,1];
    sampleReport[23] = [1,2,2,3,0,1,0,0,null,null,null,null,1,1,0,1,0,1,1,0,1,1,0,1];
    const completed = [
      {barangay:'Abuanan',age_group:'20–59 years',sex:'Male',count:3},
      {barangay:'Abuanan',age_group:'20–59 years',sex:'Female',count:2},
      {barangay:'Taloc',age_group:'5–9 years',sex:'Female',count:2},
      {barangay:'Taloc',age_group:'60+ years',sex:'Male',count:1}
    ];
    const sampleQueue = [
      {id:90001,queue_number:'DQ-001',status:'serving',category:'dental',type:'regular',services:['CONSULTATION'],full_name:'Sample Patient 01',patient_id:90001,is_walk_in:0,has_consultation:false},
      {id:90002,queue_number:'DQ-002',status:'waiting',category:'dental',type:'priority',services:['TOOTH EXTRACTION'],full_name:'Sample Patient 02',patient_id:90002,is_walk_in:0},
      {id:90003,queue_number:'DQ-003',status:'waiting',category:'dental',type:'regular',services:['CONSULTATION'],full_name:'Sample Patient 03',is_walk_in:1},
      {id:90004,queue_number:'DQ-004',status:'done',category:'dental',type:'regular',services:['CONSULTATION'],full_name:'Sample Patient 04',updated_at:date+'T02:20:00Z',has_consultation:false},
      {id:90005,queue_number:'DQ-005',status:'done',category:'dental',type:'priority',services:['CONSULTATION'],full_name:'Sample Patient 05',updated_at:date+'T02:40:00Z',has_consultation:true}
    ];
    await context.addInitScript(()=>{
      const user=JSON.parse(sessionStorage.getItem('ek_user')||'{}');
      sessionStorage.setItem('ek_user',JSON.stringify({...user,role:'doctor',display_name:'Sample Doctor'}));
    });
    await page.route('**/api/**', async route => {
      if(route.request().method()!=='GET') return route.fulfill({status:403,json:{message:'Documentation preview does not save changes.'}});
      const url=new URL(route.request().url());
      let json;
      if(url.pathname==='/api/auth/profile') json={success:true,data:{role:'doctor',display_name:'Sample Doctor',first_name:'Sample',last_name:'Doctor'}};
      else if(url.pathname==='/api/queue') json=sampleQueue;
      else if(url.pathname==='/api/doctor/daily-settings') json={appointment_limit:10,walk_in_limit:5,booked_count:5,walkin_count:3,is_available:1};
      else if(url.pathname==='/api/doctor/analytics') json={report_date:date,period:'today',from:date,until,patients:8,waiting:2,serving:1,completed:8,priority:2,appointments:5,walk_ins:3,age_groups:[{age_group:'20–59 years',count:5},{age_group:'5–9 years',count:2},{age_group:'60+ years',count:1}],completed_demographics:completed};
      else if(url.pathname==='/api/doctor/report') json={period:'today',from:date,until,reports:[sampleReport]};
      else if(url.pathname==='/api/doctor/daily-report') json={data:sampleReport};
      else if(url.pathname==='/api/appointments/doctor') json={appointments:[
        {appointment_id:90001,patient_full_name:'Sample Patient 01',appointment_date:date,appointment_time:'09:00:00',queue_services:'["CONSULTATION"]'},
        {appointment_id:90002,patient_full_name:'Sample Patient 02',appointment_date:date,appointment_time:'09:30:00',queue_services:'["TOOTH EXTRACTION"]'},
        {appointment_id:90003,patient_full_name:'Sample Patient 03',appointment_date:date,appointment_time:'10:00:00',queue_services:'["CONSULTATION"]'}
      ]};
      else return route.fallback();
      return route.fulfill({status:200,json});
    });
    const capture=(id,labels,opts={})=>snap(page,id,labels,{...opts,scenario:true,scenarioNote:'Actual current React interface with browser-only sample records; no backend records were created or changed.'});
    await page.reload({waitUntil:'networkidle'});
    await page.waitForTimeout(500);
    await capture('doctor_home',[
      {selector:page.getByRole('button',{name:'Analytics',exact:true}),text:'Analytics — view dental activity, clinical entries, and reports'},
      {selector:page.getByRole('button',{name:'Appointment History',exact:true}),text:'Appointment History — review your appointments'},
      {selector:page.locator('button[aria-haspopup="menu"]'),text:'Account menu — check your identity or Log Out'},
      {selector:page.getByRole('button',{name:/^(Available|Unavailable)$/}),text:'Availability — select the current status to change it'},
      {selector:page.getByRole('button',{name:'Apply',exact:true}),text:'Apply — save daily capacity settings'}
    ]);
    await capture('doctor_capacity',[
      {selector:page.getByRole('button',{name:/^Daily Capacity/}),text:'Daily Capacity — expand or collapse this panel'},
      {selector:page.locator('input[type="range"]'),text:'Appointment Limit — choose 0 to 10 appointments'},
      {selector:page.locator('input[type="number"]'),text:'Walk-In Capacity — enter 0 to 30 slots'},
      {selector:page.getByRole('button',{name:'Apply',exact:true}),text:'Apply — save both limits; wait for Saved ✓'}
    ],{scrollY:360});
    await capture('doctor_queue',[
      {selector:page.getByText('Now Queuing',{exact:true}),text:'Now Queuing — the current called or serving ticket'},
      {selector:page.getByText('Next Queuing',{exact:true}),text:'Next Queuing — the next waiting ticket'},
      {selector:page.getByRole('button',{name:'Mark as Complete',exact:true}),text:'Mark as Complete — finish a serving ticket'},
      {selector:page.getByRole('button',{name:/^(Next|Consult|Awaiting patient)$/}),text:'Next / Consult — call a waiting ticket or open clinical notes'},
      {selector:page.getByText('Completed List',{exact:true}),text:'Completed List — finished visits and Add notes when available'},
      {selector:page.getByText('Next Queue',{exact:true}),text:'Next Queue — upcoming dental ticket numbers'}
    ],{scrollY:720});
    await page.getByRole('button',{name:'Consult',exact:true}).click();
    await page.locator('textarea').nth(0).fill('Example only: patient reports tooth discomfort. Findings reviewed during the dental examination.');
    await page.locator('textarea').nth(1).fill('Example assessment — replace with the actual clinical diagnosis.');
    await page.locator('textarea').nth(2).fill('Example follow-up guidance — enter the clinician’s instructions here.');
    await capture('doctor_consultation',[
      {selector:page.getByRole('heading',{name:'Consultation Notes',exact:true}),text:'Consultation Notes — verify the patient and queue number'},
      {selector:page.locator('textarea').nth(0),text:'Consultation Notes — required clinical findings'},
      {selector:page.locator('textarea').nth(1),text:'Diagnosis — enter the clinical assessment'},
      {selector:page.locator('textarea').nth(2),text:'Prescription / Recommendations — treatment and follow-up'},
      {selector:page.getByRole('button',{name:'Save Consultation',exact:true}),text:'Save Consultation — save documentation and finish the serving visit'},
      {selector:page.getByRole('button',{name:'Cancel',exact:true}),text:'Cancel — close without saving'}
    ]);
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
    sampleQueue[0]={...sampleQueue[0],status:'called',call_count:1,last_called_at:new Date(Date.now()-40000).toISOString()};
    sampleQueue.push({id:90006,queue_number:'DQ-006',status:'missed',category:'dental',type:'regular',services:['CONSULTATION'],full_name:'Sample Patient 06',grace_expires_at:new Date(Date.now()+6*60000).toISOString()});
    await page.reload({waitUntil:'networkidle'});
    const recoveryY=await page.getByRole('region',{name:'Called patient controls'}).evaluate(e=>e.getBoundingClientRect().top+window.scrollY-180);
    await capture('doctor_called',[
      {selector:page.getByRole('region',{name:'Called patient controls'}),text:'Called patient controls — read the call number and wait time'},
      {selector:page.getByRole('button',{name:'Start consultation',exact:true}),text:'Start consultation — confirm that the patient is physically present'},
      {selector:page.getByRole('button',{name:'Call again',exact:true}),text:'Call again — second call after the 30-second countdown'},
      {selector:page.getByRole('heading',{name:'Missed patients · 10-minute return window',exact:true}),text:'Missed patients — return deadline for a skipped ticket'},
      {selector:page.getByRole('button',{name:/^Patient returned/}),text:'Patient returned — restore a missed ticket before its deadline'}
    ],{scrollY:recoveryY});
    await page.getByRole('button',{name:'Analytics',exact:true}).click();
    await page.waitForTimeout(1200);
    await capture('doctor_analytics',[
      {selector:page.getByRole('button',{name:'Back to dashboard',exact:true}),text:'Back to dashboard — return to the dental queue'},
      {selector:page.getByRole('group',{name:'Analytics period'}),text:'Today / This week / This month — choose the report period'},
      {selector:page.locator('.da-month-picker'),text:'Report date — select an earlier date or period'},
      {selector:page.getByRole('button',{name:'Daily barangay entries',exact:true}),text:'Daily barangay entries — open manual clinical counts'}
    ]);
    await page.getByRole('button',{name:'Daily barangay entries',exact:true}).click();
    await page.waitForTimeout(700);
    await page.setViewportSize({width:1360,height:1250});
    const manualY = await page.locator('#da-manual-entries').evaluate(e=>e.getBoundingClientRect().top+window.scrollY-30);
    await capture('doctor_report_entry',[
      {selector:page.locator('.da-entry-controls input[type="date"]'),text:'Entry date — choose the clinical reporting day'},
      {selector:page.locator('.da-entry-controls select'),text:'Barangay — choose the area for these clinical counts'},
      {selector:page.locator('.da-entry-group').first(),text:'Clinical measures — enter verified Male and Female counts'},
      {selector:page.locator('.da-entry-pregnant'),text:'Pregnant BOHC — record counts by the displayed age groups'},
      {selector:page.getByRole('button',{name:'Save entries',exact:true}),text:'Save entries — save changes before changing the date'}
    ],{scrollY:manualY});
    await page.setViewportSize({width:1360,height:1100});
    await page.getByRole('button',{name:'Daily barangay entries',exact:true}).click();
    const reportY = await page.getByText('Manual clinical counts',{exact:true}).first().evaluate(e=>e.getBoundingClientRect().top+window.scrollY-30);
    await capture('doctor_report',[
      {selector:page.getByText('Manual clinical counts',{exact:true}).first(),text:'Manual clinical counts — saved daily clinical measures'},
      {selector:page.getByRole('group',{name:'Report pages'}),text:'Page 1 / Page 2 — switch the clinical measure table'},
      {selector:page.locator('.da-page .da-month-table:not(.da-completed-table)').first(),text:'Clinical report table — barangay totals and clinical measures'},
      {selector:page.getByRole('button',{name:'Print report',exact:true}),text:'Print report — opens the browser print dialog when data is ready'},
      {selector:page.getByRole('button',{name:'Download Excel',exact:true}),text:'Download Excel — saves the period report when data is ready'}
    ],{scrollY:reportY});
    await page.getByRole('button',{name:'Appointment History',exact:true}).click();
    await page.waitForTimeout(700);
    await page.setViewportSize({width:1360,height:700});
    await capture('doctor_history',[
      {selector:page.getByRole('button',{name:'← Back',exact:true}),text:'Back — return to the Doctor dashboard'},
      {selector:page.getByRole('button',{name:'Today',exact:true}),text:'Today — show appointments for the current day'},
      {selector:page.getByRole('button',{name:'All',exact:true}),text:'All — show the full loaded appointment history'},
      {selector:page.locator('th').filter({hasText:'Date'}),text:'Date — select a heading to sort; select again to reverse'},
      {selector:page.locator('th').filter({hasText:'Services'}),text:'Services — review the appointment’s service details'}
    ]);
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
