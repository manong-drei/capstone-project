const {open,snap,BASE,OUT}=require('./capture.cjs');
const fs=require('fs');const path=require('path');
const label=(selector,text)=>({selector,text});
const oldLabels=id=>JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'),'utf8')).labels.map(x=>x.text.replace(/\.+$/,''));
const pad=async(locator,n=18)=>{const z=await locator.boundingBox();if(!z)throw Error('Missing crop target');return{x:Math.max(0,z.x-n),y:Math.max(0,z.y-n),width:z.width+2*n,height:z.height+2*n};};
const formClip=async locator=>{const z=await locator.boundingBox();return{x:z.x-12,y:z.y,width:z.width+24,height:z.height};};
(async()=>{
const {browser,page:p}=await open('admin');
try{
 const b=name=>p.getByRole('button',{name,exact:true}).first();
 const tab=async name=>{await b(name).click();await p.waitForTimeout(800);};
 const retake=async(id,selectors,opts={})=>{const texts=oldLabels(id);await snap(p,id,selectors.map((selector,i)=>label(selector,texts[i])),{profile_anonymized:true,anonymized:true,...opts});};
 await tab('Doctors');
 const docbox=await p.locator('main > div').first().boundingBox();
 const navbox=await b('Doctors').boundingBox();
 await retake('admin_doctors',[b('Doctors'),p.getByRole('heading',{name:'Doctor Availability',exact:true}),p.locator('main .grid').first()],{clip:{x:0,y:0,width:1360,height:Math.ceil(Math.max(docbox.y+docbox.height,navbox.y+navbox.height)+22)}});
 await tab('Accounts');await b('Add Staff').click();await p.setViewportSize({width:1100,height:1000});
 const staffForm=p.getByRole('heading',{name:'New Staff Account',exact:true}).locator('..');
 await retake('admin_staff_form',[p.locator('main select').first(),p.getByText('First Name',{exact:true}).first(),p.getByText('Password',{exact:true}).first(),p.getByPlaceholder('PRC License No.'),b('Cancel'),b('Create Account')],{clip:await formClip(staffForm)});
 await b('Cancel').click();await p.setViewportSize({width:1360,height:1100});await b('Patients').click();await p.waitForTimeout(800);
 await p.setViewportSize({width:1360,height:1100});
 const patientCard=await p.locator('main > div').first().boundingBox();
 await retake('admin_patients',[b('Patients'),b('Add Patient'),p.getByPlaceholder('Search by name, contact, or barangay...'),p.getByText('Show inactive',{exact:true}),b('Deactivate'),b('Next')],{clip:{x:0,y:0,width:1360,height:Math.ceil(patientCard.y+patientCard.height+18)}});
 await b('Add Patient').click();await p.setViewportSize({width:1100,height:1000});
 const patientForm=p.getByRole('heading',{name:'New Patient Account',exact:true}).locator('..');
 await retake('admin_patient_form',[p.getByPlaceholder('Juan'),p.getByPlaceholder('09XX XXX XXXX'),p.locator('main input[type=date]').first(),p.locator('main select').nth(1),p.locator('main select').nth(2),b('Create Account')],{clip:await formClip(patientForm)});
 await p.setViewportSize({width:1360,height:1100});
 await tab('Patients History');
 const historyCard=await p.locator('main > div').first().boundingBox();
 await retake('admin_history',[b('Patients History'),p.getByRole('heading',{name:'Patients History',exact:true}),p.locator('main table').first(),b('Next')],{clip:{x:0,y:0,width:1360,height:Math.ceil(historyCard.y+historyCard.height+18)}});
 await p.setViewportSize({width:1360,height:900});
 await p.route('**/api/queue',route=>route.fulfill({status:200,json:[{id:99991,queue_number:'DQ-101',status:'waiting',category:'dental',type:'regular',full_name:'Sample Patient',first_name:'Sample',last_name:'Patient'}]}));
 await tab('Queue Monitor');await b('Cancel').click();await p.getByRole('radio').first().check();
 const modal=p.getByRole('dialog');
 await snap(p,'admin_cancel',[
  label(p.getByRole('heading',{name:'Reason for cancellation',exact:true}),'Reason for cancellation — confirm that you opened the cancellation dialog for the intended ticket'),
  label(p.getByRole('radio').first(),'Reason — select the reason that applies; a reason is required'),
  label(b('Cancel'),'Cancel — close the dialog and leave the ticket unchanged'),
  label(b('Continue'),'Continue — cancel the selected ticket using the chosen reason')
 ],{scenario:true,profile_anonymized:true,anonymized:true,source:'Browser-only sample waiting queue GET; current React cancellation dialog. No cancellation submitted.',clip:await pad(modal,24)});
 await b('Cancel').click();
 await tab('Notifications');
 const sections=p.locator('main section');const last=await sections.last().boundingBox();
 await retake('admin_notifications',[b('Notifications'),p.locator('#sms-threshold'),b('Save'),p.getByRole('button',{name:'Refresh SMS activity'})],{source:'Anonymized live GET response; current notification interface empty activity state. No messages sent or settings saved.',clip:{x:0,y:0,width:1360,height:Math.ceil(last.y+last.height+24)}});
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
