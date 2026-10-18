const {open,snap}=require('./capture.cjs');
(async()=>{
 const {browser,page}=await open('staff',{viewport:{width:1360,height:1600}});
 try {
  const box=await page.locator('#walk-in-registration').boundingBox();
  await snap(page,'staff_find',[
   {selector:'#patient-lookup',text:'Find an existing patient search before creating a new record'},
   {selector:'#walkin-name',text:'Full name enter or confirm the patient name'},
   {selector:'#walkin-contact',text:'Confirmed mobile number verify the number with the patient'}
  ],{clip:{x:box.x-12,y:box.y-12,width:box.width+24,height:650}});
  const service=page.locator('legend').filter({hasText:'Dental services'});
  const sb=await service.boundingBox();
  await snap(page,'staff_services',[
   {selector:service,text:'Dental services select one or two required services'},
   {selector:page.getByRole('radio',{name:'Priority',exact:true}),text:'Priority use only for a verified eligible patient'},
   {selector:page.getByRole('button',{name:'Register and assign dental queue',exact:true}),text:'Register and assign dental queue creates the visit and issues a number'}
  ],{clip:{x:box.x-12,y:sb.y-20,width:box.width+24,height:box.y+box.height-sb.y+32}});
  const rows=[
   {id:99991,queue_number:'AQ07',status:'called',category:'dental',type:'regular',full_name:'Sample Patient',is_walk_in:1,services:['CONSULTATION'],call_count:2,last_called_at:new Date(Date.now()-45000).toISOString()},
   {id:99992,queue_number:'AQ08',status:'waiting',category:'dental',type:'regular',full_name:'Sample Patient',is_walk_in:1,services:['CONSULTATION']},
   {id:99993,queue_number:'AQ06',status:'missed',category:'dental',type:'regular',full_name:'Sample Patient',is_walk_in:1,services:['CONSULTATION'],grace_expires_at:new Date(Date.now()+7*60000).toISOString()}
  ];
  await page.route('**/api/queue?category=dental',r=>r.fulfill({json:rows}));
  await page.reload({waitUntil:'networkidle'});
  const qb=await page.locator('#dental-queue').boundingBox();
  await snap(page,'staff_called',[
   {selector:page.getByRole('button',{name:'Patient present',exact:true}),text:'Patient present confirms physical presence and starts service'},
   {selector:page.getByRole('button',{name:/Skip and call next/}),text:'Skip and call next moves an absent ticket into the return window'},
   {selector:page.getByRole('button',{name:/^Patient returned/}),text:'Patient returned confirms a missed patient before the deadline'},
   {selector:page.getByRole('button',{name:'Cancel queue AQ08',exact:true}),text:'Cancel opens the required cancellation reason'}
  ],{scenario:true,clip:{x:qb.x-12,y:qb.y-12,width:qb.width+24,height:qb.height+24}});
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
