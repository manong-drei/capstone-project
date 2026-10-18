const {open,snap,inventory,BASE}=require('./capture.cjs');
const b=(page,name)=>page.getByRole('button',{name,exact:true});
async function pub(){
 const {browser,page}=await open(null);
 await snap(page,'public_home',[
  {selector:page.getByRole('link',{name:'Log in',exact:true}).first(),text:'Log in opens the sign in page'},
  {selector:page.getByRole('link',{name:'Why E-Kalusugan'}),text:'Why E Kalusugan jumps to the feature overview'},
  {selector:page.getByRole('link',{name:'Your next visit'}),text:'Your next visit jumps to the sign in invitation'}
 ]);
 await page.goto(BASE+'/login',{waitUntil:'networkidle'});
 await snap(page,'public_login',[
  {selector:'input[name="phone"]',text:'Phone Number enter your registered login phone'},
  {selector:'input[name="password"]',text:'Password enter your password'},
  {selector:page.locator('input[name="password"]').locator('..').getByRole('button'),text:'Eye icon shows or hides the password',dx:10},
  {selector:b(page,'Forgot password?'),text:'Forgot password opens reception recovery instructions'},
  {selector:b(page,'Login'),text:'Login opens the dashboard assigned to your role'},
  {selector:b(page,'terms and conditions'),text:'Terms and privacy links open the policy dialog'}
 ]);
 await b(page,'Forgot password?').click();
 await snap(page,'public_recovery',[{selector:'#recovery-help',text:'Reception recovery steps verify your identity in person'},{selector:b(page,'Forgot password?'),text:'Forgot password expands or collapses these instructions'}]);
 await b(page,'Forgot password?').click();await b(page,'terms and conditions').click();
 await snap(page,'public_terms',[{selector:page.getByText('Terms, Privacy & Consent',{exact:true}),text:'Terms and privacy dialog read the displayed policy'}]);
 await browser.close();
}
async function patient(){
 const {browser,page}=await open('patient');
 await snap(page,'patient_home',[
 {selector:page.getByRole('button',{name:/^Get queue ticket/}),text:'Get queue ticket opens the dental service selection'},
 {selector:page.getByRole('button',{name:/^Appointment history/}).first(),text:'Appointment history displays earlier appointments'},
 {selector:page.getByText('My queue number',{exact:true}),text:'My queue number shows your active ticket'},
 {selector:page.getByText('Doctor availability',{exact:true}),text:'Doctor availability shows the current availability status'},
 {selector:page.getByRole('button',{name:/^Location/i}),text:'Location opens the clinic map'}]);
 await page.getByRole('button',{name:/^Get queue ticket/}).click();
 await page.getByRole('checkbox').first().check();
 await snap(page,'patient_ticket',[{selector:'dialog fieldset',text:'Dental services choose one or two services'},{selector:page.getByRole('status'),text:'Selection counter shows the two service limit'},{selector:b(page,'Get Queue Ticket'),text:'Get Queue Ticket submits the request'},{selector:b(page,'Close queue ticket'),text:'Close returns to the dashboard'}]);
 await b(page,'Close queue ticket').click();
 await page.getByRole('button',{name:/^Appointment history/}).first().click();
 await inventory(page);
 await snap(page,'patient_history',[{selector:page.getByRole('heading').first(),text:'Appointment history lists your recorded appointments'},{selector:page.getByRole('button',{name:/back/i}).first(),text:'Back returns to the patient dashboard'}]);
 await browser.close();
}
async function staff(){
 const {browser,page}=await open('staff');
 await snap(page,'staff_home',[
 {selector:b(page,'Account recovery'),text:'Account recovery opens the patient lookup'},
 {selector:b(page,'Refresh'),text:'Refresh reloads the current queue'},
 {selector:page.getByRole('link',{name:/Open dental monitor/}),text:'Open dental monitor displays the queue in a new tab'},
 {selector:'#dental-queue',text:'Dental queue contains the calling and ticket controls'},
 {selector:'#walk-in-registration',text:'Register dental walk in finds or creates a patient and ticket'}]);
 await page.setViewportSize({width:1360,height:1180});
 await snap(page,'staff_walkin',[
 {selector:'#patient-lookup',text:'Find patient search for an existing record first'},
 {selector:'#walkin-name',text:'Full name enter the patient first and last name'},
 {selector:'#walkin-contact',text:'Confirmed mobile number enter ten digits after the displayed plus 63'},
 {selector:page.getByRole('button',{name:'Register and assign dental queue'}),text:'Register and assign dental queue saves the record and issues a ticket'}]);
 await page.setViewportSize({width:1360,height:900});
 await b(page,'Account recovery').click();
 await inventory(page);
 await snap(page,'staff_recovery',[{selector:'#account-recovery-search',text:'Account recovery search finds the patient before identity checks'},{selector:b(page,'Account recovery'),text:'Account recovery opens or closes the search panel'}]);
 await page.goto(BASE+'/general-queue-monitor',{waitUntil:'networkidle'});
 await inventory(page);
 await snap(page,'staff_monitor',[{selector:page.getByRole('button').first(),text:'Display control enables the queue monitor interaction'}]);
 await browser.close();
}
(async()=>{for(const task of process.argv.slice(2)){console.log('Task '+task); await ({public:pub,patient,staff})[task]();}})().catch(e=>{console.error(e);process.exit(1)});
