from pathlib import Path
import pypdfium2 as pdfium
from pypdf import PdfReader
import json
root=Path(__file__).resolve().parent.parent
pdf=root/'qa/EKalusugan_User_Manual.pdf'
doc=pdfium.PdfDocument(pdf)
reader=PdfReader(pdf)
report=[]
for i in range(len(doc)):
 page=doc[i]
 image=page.render(scale=1.5).to_pil()
 image.save(root/'qa'/f'page-{i+1}.png')
 text=reader.pages[i].extract_text() or ''
 report.append({'page':i+1,'words':len(text.split()),'chars':len(text),'first_lines':text.splitlines()[:4],'last_lines':text.splitlines()[-4:]})
(root/'qa/page_report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(root/'qa/all_text.txt').write_text('\n\n'.join((x.extract_text() or '') for x in reader.pages),encoding='utf-8')
print('Rendered pages',len(doc))
print('Sparse pages',[(x['page'],x['words']) for x in report if x['words']<60])
print('\n'.join(str(x['page'])+' '+str(x['words'])+' '+(' | '.join(x['first_lines'][1:3])) for x in report))
