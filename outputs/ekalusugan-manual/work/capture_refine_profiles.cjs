const {open,snap,BASE,OUT}=require('./capture.cjs');const fs=require('fs');const path=require('path');
const texts=id=>JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'),'utf8')).labels.map(x=>x.text.replace(/\.+$/,''));
(async()=>{const{browser,page:p}=await open('staff');try{
const b=name=>p.getByRole('button',{name,exact:true});
const profile=id=>({success:true,data:{patient_id:id,user_id:id===900101?id:null,first_name:'Sample',last_name:'User',date_of_birth:'1990-01-01',gender:'Other',contact_number:'09XXXXXXXXX',barangay:'Sample barangay',city:'Bago City',archived_into_patient_id:null,account:id===900101?{is_active:true,phone:'09XXXXXXXXX',credential_version:1}:null,visits:[]}});
await p.route('**/api/patients/900101',r=>r.fulfill({status:200,json:profile(900101)}));
await p.route('**/api/patients/900201',r=>r.fulfill({status:200,json:profile(900201)}));
await p.route('**/api/patients/search?name=Sample',r=>r.fulfill({status:200,json:{success:true,data:[{patient_id:900101,first_name:'Sample',last_name:'User',date_of_birth:'1990-01-01',masked_contact:'09XXXXXXXXX'}]}}));
await p.setViewportSize({width:1160,height:850});
await p.goto(BASE+'/staff/patients/900101',{waitUntil:'networkidle'});await b('Start account recovery').click();await p.getByRole('checkbox').nth(0).check();await p.getByRole('checkbox').nth(1).check();
const crop=async bottom=>{const a=await p.locator('main > section').first().boundingBox();const z=await bottom.boundingBox();return{x:a.x-22,y:a.y-22,width:a.width+44,height:z.y+z.height-a.y+44};};
let id='staff_recovery_verify';let t=texts(id);
await snap(p,id,[p.locator('main > section').first(),p.getByRole('group',{name:'Identity verification'}),b('Issue temporary password'),b('Close recovery')].map((selector,i)=>({selector,text:t[i]})),{scenario:true,anonymized:true,profile_anonymized:true,source:'Browser-only complete demonstration patient GET; current application recovery form. Only two verification boxes selected; no password issued.',clip:await crop(b('Close recovery'))});
await p.goto(BASE+'/staff/patients/900201',{waitUntil:'networkidle'});await p.locator('#merge-search').fill('Sample');await p.locator('input[name="merge-target"]').waitFor();await p.locator('input[name="merge-target"]').check();
id='staff_merge';t=texts(id);
await snap(p,id,[p.locator('main > section').first(),p.locator('#merge-search'),p.locator('input[name="merge-target"]'),b('Merge into selected patient')].map((selector,i)=>({selector,text:t[i]})),{scenario:true,anonymized:true,profile_anonymized:true,source:'Browser-only demonstration patient/search GET responses; current application merge form. Destination selected but merge not submitted.',clip:await crop(b('Merge into selected patient'))});
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
