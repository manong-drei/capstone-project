const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/ACER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const OUT = path.resolve(__dirname, '../screenshots');
const BASE = 'http://127.0.0.1:3000';
function anonymize(value, key = '') {
  if (Array.isArray(value)) return value.map(v => anonymize(v));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, anonymize(v,k)]));
  if (value == null || value === '') return value;
  if (/^(first_name|doctor_first_name|patient_first_name|staff_first_name)$/i.test(key)) return 'Sample';
  if (/^(last_name|doctor_last_name|patient_last_name|staff_last_name)$/i.test(key)) return 'User';
  if (/^(middle_name|middle_initial)$/i.test(key)) return '';
  if (/^(full_name|fullName|patient_name|patient_full_name|doctor_name|display_name|name)$/i.test(key)) return 'Sample User';
  if (/phone|contact_number|masked_contact|recipient|mobile/i.test(key) && typeof value === 'string') return '09XXXXXXXXX';
  if (/email/i.test(key) && typeof value === 'string') return 'sample@example.com';
  if (/^(birth_date|birthday|date_of_birth)$/i.test(key)) return '1990-01-01';
  if (/^(address|street|house_number|emergency_contact|emergency_contact_name)$/i.test(key)) return 'Sample address';
  if (/^(diagnosis|notes|complaint|chief_complaint|treatment|prescription|allergies|medical_history)$/i.test(key) && typeof value === 'string') return 'Sample clinical entry';
  return value;
}
async function open(role, opts = {}) {
 const browser = await chromium.launch({ headless:true, channel:'msedge' });
 const context = await browser.newContext({ viewport:{width:1360,height:900}, deviceScaleFactor:1.5, reducedMotion:'reduce', ...opts });
 if (role) {
  const response = await fetch('http://127.0.0.1:5000/api/auth/dev-login', {method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify({role})});
  const session = await response.json();
  if (!session.token) throw new Error('Development session unavailable');
  const user = anonymize(session.user);
  await context.addInitScript(({token,user}) => {sessionStorage.setItem('ek_token',token); sessionStorage.setItem('ek_user',JSON.stringify(user));}, {token:session.token,user});
 }
 const page = await context.newPage();
 await page.route('**/api/**', async route => {
   if(route.request().method() !== 'GET') return route.fulfill({status:403,json:{message:'Documentation preview does not save changes.'}});
   const response = await route.fetch();
   let json; try {json = await response.json();} catch { return route.fulfill({response}); }
   json = anonymize(json);
   if (role && new URL(route.request().url()).pathname === '/api/auth/profile' && json.data) {
     json.data.role = role;
     json.data.display_name = ({patient:'Sample Patient',doctor:'Sample Dentist',staff:'Sample Staff',admin:'Sample Administrator'})[role];
   }
   return route.fulfill({response,json});
 });
 page.on('dialog', d => d.dismiss());
 await page.goto(BASE + (role ? '/' + role : '/'), {waitUntil:'networkidle'});
 await page.waitForTimeout(700);
 return {browser,context,page};
}
async function snap(page,id,labels=[],opts={}) {
 await page.evaluate(()=>document.querySelectorAll('.manual-label').forEach(e=>e.remove()));
 await page.evaluate(y=>window.scrollTo(0,y),opts.scrollY??0);
 for(let i=0;i<labels.length;i++) {
  const label=labels[i];
  const locator=typeof label.selector==='string' ? page.locator(label.selector).first() : label.selector;
  const box=await locator.boundingBox();
  if(!box) throw new Error(id+': missing annotation '+label.text);
  await page.evaluate(({box,n,dx,dy})=>{
   const d=document.createElement('div');d.className='manual-label';d.textContent=n;
   const modal=document.querySelector('dialog[open]');
   Object.assign(d.style,{position:modal?'fixed':'absolute',left:Math.max(2,box.x+(dx??-9)+(modal?0:window.scrollX))+'px',top:Math.max(2,box.y+(dy??-9)+(modal?0:window.scrollY))+'px',width:'26px',height:'26px',borderRadius:'50%',background:'#b91c1c',color:'white',border:'2px solid white',font:'bold 16px Arial',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 1px 4px #0008',zIndex:2147483647,pointerEvents:'none'});(modal||document.body).append(d);
  },{box,n:i+1,dx:label.dx,dy:label.dy});
 }
 await page.screenshot({path:path.join(OUT,id+'.png'),fullPage:opts.fullPage??false,animations:'disabled',...(opts.clip?{clip:opts.clip}:{})});
 await page.evaluate(()=>document.querySelectorAll('.manual-label').forEach(e=>e.remove()));
 fs.writeFileSync(path.join(OUT,id+'.json'),JSON.stringify({id,labels:labels.map((l,i)=>({number:i+1,text:l.text})),...opts},null,2));
 console.log('Captured '+id);
}
async function inventory(page) {console.log(JSON.stringify(await page.locator('button,a,input,select').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().width>0).map(e=>({tag:e.tagName,text:(e.innerText||'').trim().slice(0,90),aria:e.getAttribute('aria-label'),placeholder:e.getAttribute('placeholder'),name:e.getAttribute('name')}))),null,2));}
module.exports={open,snap,inventory,BASE,OUT};
if(require.main===module) (async()=>{const role=process.argv[2];const s=await open(role==='public'?null:role); await inventory(s.page); await s.browser.close();})().catch(e=>{console.error(e);process.exit(1)});
