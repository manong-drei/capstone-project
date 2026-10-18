const fs=require('fs');
const path=require('path');
const sharp=require('C:/Users/ACER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'../screenshots');
const originals=path.join(__dirname,'doctor_crop_originals');
fs.mkdirSync(originals,{recursive:true});
const crops={
  doctor_capacity:{left:20,top:170,width:2000,height:445},
  doctor_queue:{left:20,top:235,width:2000,height:965},
  doctor_consultation:{left:610,top:370,width:820,height:920},
  doctor_report_entry:{left:210,top:24,width:1620,height:1710},
  doctor_report:{left:210,top:150,width:1620,height:1075},
  doctor_called:{left:20,top:460,width:2000,height:825}
};
(async()=>{
  for(const [id,rect] of Object.entries(crops)){
    const target=path.join(root,id+'.png');
    const original=path.join(originals,id+'.png');
    if(!fs.existsSync(original))fs.copyFileSync(target,original);
    const metadata=await sharp(original).metadata();
    if(rect.left+rect.width>metadata.width||rect.top+rect.height>metadata.height)throw new Error('Crop exceeds image '+id);
    const data=await sharp(original).extract(rect).png().toBuffer();
    fs.writeFileSync(target,data);
    const sidecar=path.join(root,id+'.json');
    const note=JSON.parse(fs.readFileSync(sidecar,'utf8'));
    note.crop={...rect,unit:'source pixels',original_width:metadata.width,original_height:metadata.height};
    fs.writeFileSync(sidecar,JSON.stringify(note,null,2));
    console.log(id,rect.width+'x'+rect.height);
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
