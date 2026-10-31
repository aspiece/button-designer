#!/usr/bin/env python3
"""Download unmodified official 2026–2027 FIRST season PNG logos and update catalog."""
import io,json,urllib.request,zipfile
from pathlib import Path
from PIL import Image
BASE="https://www.firstinspires.org/hubfs/web/brand/season/2027/downloads/"
SEASONS={
 "canopy":("first-canopy-logos.zip","FIRST CANOPY 2026–27"),
 "bioglow":("first-bioglow-logos.zip","FIRST LEGO League BIOGLOW 2026–27"),
 "biobuzz":("first-biobuzz-logos.zip","FIRST Tech Challenge BIOBUZZ 2026–27"),
 "biocore":("first-biocore-logos.zip","FIRST Robotics Competition BIOCORE 2026–27"),
}
DEST=Path("logos")/"FIRST Logos"/"2026-27"
DEST.mkdir(parents=True,exist_ok=True)
catalog=Path("logos/catalog.json")
doc=json.loads(catalog.read_text(encoding="utf8"))
known={x["path"] for x in doc["images"]}
for key,(filename,title) in SEASONS.items():
 try:
  req=urllib.request.Request(BASE+filename,headers={"User-Agent":"Mozilla/5.0 FIRST educational team logo catalog"})
  with urllib.request.urlopen(req,timeout=50) as response:data=response.read(25_000_000)
  with zipfile.ZipFile(io.BytesIO(data)) as archive:
   found=[]
   for member in archive.infolist():
    if member.is_dir() or not member.filename.lower().endswith(".png"):continue
    if member.file_size>6_000_000:continue
    raw=archive.read(member)
    try:
     im=Image.open(io.BytesIO(raw))
     im.verify()
    except Exception:continue
    # Prefer authentic RGB transparent production-ready logos (not background wallpapers).
    name=member.filename.lower()
    score=(("rgb" in name)*30+("full" in name)*15+("transparent" in name)*20+
           ("color" in name)*5+("lockup" in name)*5-("background" in name)*30-
           ("black" in name or "white" in name or "spot" in name or "cmyk" in name)*15)
    found.append((score,member.filename,raw))
   found.sort(key=lambda x:(-x[0],len(x[2])))
   if not found:print("No approved PNG found:",key);continue
   # Import one original high-quality logo per season. No recoloring or cropping.
   _,source,raw=found[0]
   target=DEST/(key+".png")
   target.write_bytes(raw)
   path=target.as_posix()
   if path not in known:
    doc["images"].append({"path":path,"name":title,"category":"FIRST Logos",
      "tags":["FIRST","Current Season","2026-27",key.upper()]})
    known.add(path)
   print("Added:",path,"from",source)
 except Exception as exc:
  print("Could not import",key,":",exc)
doc["images"].sort(key=lambda x:(x["category"],x["name"]))
catalog.write_text(json.dumps(doc,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
