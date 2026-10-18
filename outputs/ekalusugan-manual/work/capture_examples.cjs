const {open,snap,BASE}=require('./capture.cjs');
async function run(){
 const {browser,page}=await open('patient');
 let state='waiting';
 const example=()=>({id:99991,queue_number:'AQ07',status:state,category:'dental',type:'regular',full_name:'Sample Patient',services:['CONSULTATION'],sms_alert_state:'suppressed',sms_initial_position:3,grace_expires_at:new Date(Date.now()+8*60000).toISOString()});
 await page.route('**/api/queue/me',r=>r.fulfill({json:example()}));
 await page.reload({waitUntil:'networkidle'});
 await snap(page,'patient_active',[
 {selector:page.getByText('Your Queue Number',{exact:true}),text:'Your Queue Number identify yourself to staff using this ticket'},
 {selector:page.getByText('Waiting',{exact:true}),text:'Waiting read this status and follow the instructions above'},
 {selector:page.getByRole('button',{name:'Cancel Queue',exact:true}),text:'Cancel Queue opens the required cancellation reason'}],{scenario:true,scrollY:250});
 await page.getByRole('button',{name:'Cancel Queue',exact:true}).click();
 await page.getByRole('radio').first().check();
 await snap(page,'patient_cancel',[
 {selector:page.getByRole('radio').first(),text:'Reason select the reason that applies'},
 {selector:page.getByRole('button',{name:'Continue',exact:true}),text:'Continue confirms cancellation with the selected reason'},
 {selector:page.getByRole('button',{name:'Cancel',exact:true}),text:'Cancel closes the dialog and keeps your ticket'}],{scenario:true});
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 state='missed';await page.reload({waitUntil:'networkidle'});
 await snap(page,'patient_missed',[
 {selector:page.getByRole('status').first(),text:'Return deadline report to staff before the displayed time'},
 {selector:page.getByText('Missed call',{exact:true}),text:'Missed call staff must confirm your return'}],{scenario:true,scrollY:250});
 await page.goto(BASE+'/change-password',{waitUntil:'networkidle'});
 await snap(page,'password_change',[
 {selector:'input[name="oldPassword"]',text:'Current Password enter the password you currently use'},
 {selector:'input[name="newPassword"]',text:'New Password use at least eight characters including a number'},
 {selector:'input[name="confirmPassword"]',text:'Confirm New Password enter the same new password again'},
 {selector:page.getByRole('button',{name:'Update Password'}),text:'Update Password saves the new password'}]);
 await browser.close();
}
run().catch(e=>{console.error(e);process.exit(1)});
