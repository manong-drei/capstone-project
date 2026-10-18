const {open,snap,BASE}=require('./capture.cjs');
(async()=>{
 const {browser,page}=await open('staff',{viewport:{width:1160,height:720}});
 try {
  await page.route('**/api/patients/900501',r=>r.fulfill({json:{success:true,data:{
    patient_id:900501,user_id:900501,first_name:'Sample',last_name:'Patient',date_of_birth:'1990-01-01',gender:'Other',contact_number:'09XXXXXXXXX',barangay:'Poblacion',city:'Bago City',account:{is_active:true,phone:'09XXXXXXXXX',credential_version:1},visits:[
    {id:900502,queue_number:'AQ07',created_at:'2026-10-18T08:30:00+08:00',category:'dental',status:'waiting'},
    {id:900503,queue_number:'AQ03',created_at:'2026-10-17T09:00:00+08:00',category:'dental',status:'done'}]}}}));
  await page.goto(BASE+'/staff/patients/900501',{waitUntil:'networkidle'});
  const box=await page.locator('main').boundingBox();
  await snap(page,'staff_profile',[
   {selector:page.getByRole('link',{name:/Staff dashboard/}),text:'Staff dashboard returns to dental queue management'},
   {selector:page.locator('main > section').first(),text:'Patient identity verify the record before acting'},
   {selector:'#account-recovery-title',text:'Account recovery requires an active eligible login'},
   {selector:page.getByRole('heading',{name:/^Queue history/}),text:'Queue history lists recorded visits and statuses'}
  ],{scenario:true,clip:{x:Math.max(0,box.x-12),y:Math.max(0,box.y-16),width:box.width+24,height:Math.min(box.height+32,720)}});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
