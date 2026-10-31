#!/usr/bin/env python3
"""Rebuild team logo PNG transparency and import unaltered official FIRST PNG assets."""
from pathlib import Path
from io import BytesIO
from collections import deque
from PIL import Image
import numpy as np, requests, zipfile, re
LOGOS=Path("logos")
TEAM=("tiger-paws-24471","tiger-cubs-29168","tiger-kits-31558","tiger-claws-31575","tiger-eyes-31577","siberian-tigers-38050","bengal-tigers-52545","tungsten-tigers","chromium-tigers","iridium-tigers","additional-black-logo")
for name in TEAM:
 p=LOGOS/(name+".png")
 if not p.exists(): print("Missing",p);continue
 im=Image.open(p).convert("RGBA")
 arr=np.array(im)
 if name.startswith(("tiger-","bengal-","siberian-")):
  rgb=arr[:,:,:3].astype(np.int16)
  bg=np.median(np.concatenate((rgb[0],rgb[-1],rgb[:,0],rgb[:,-1])),axis=0)
  distance=np.linalg.norm(rgb-bg,axis=2)
  mask=distance<52
  # Remove only background-connected orange; preserve orange enclosed by the emblem.
  from scipy.ndimage import binary_propagation,binary_dilation
  seeds=np.zeros(mask.shape,dtype=bool)
  seeds[0]=mask[0];seeds[-1]=mask[-1];seeds[:,0]=mask[:,0];seeds[:,-1]=mask[:,-1]
  outside=binary_propagation(seeds,mask=mask)
  arr[outside,3]=0
  ring=binary_dilation(outside)&~outside
  arr[ring,3]=(arr[ring,3].astype(float)*np.clip((distance[ring]-20)/32,.25,1)).astype("uint8")
 ys,xs=np.where(arr[:,:,3]>10)
 if len(xs):
  cropped=Image.fromarray(arr).crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
 else:cropped=Image.fromarray(arr)
 padding=round(max(cropped.size)*.10)
 dest=Image.new("RGBA",(cropped.width+2*padding,cropped.height+2*padding))
 dest.alpha_composite(cropped,(padding,padding))
 dest.save(p,optimize=True)
 print("Cleaned",p)
# Official artwork is NEVER recolored, cropped, redrawn or altered.
# Choose the FIRST-supplied full color RGB PNG, keeping its intrinsic clear space.
SOURCE={
 "first":"https://www.firstinspires.org/hubfs/logo-library/first/first-logo-all-formats.zip",
 "first-alumni":"https://www.firstinspires.org/hubfs/logo-library/first/first-alumni-logo-all-formats.zip",
 "first-elements":"https://www.firstinspires.org/hubfs/logo-library/first/SeparateElements.zip",
 "fll":"https://www.firstinspires.org/hubfs/logo-library/fll/firstlegoleague-logo-all-formats.zip",
 "fll-challenge":"https://www.firstinspires.org/hubfs/logo-library/fll/firstlegoleaguechallenge-lockup-all-formats.zip",
 "fll-explore":"https://www.firstinspires.org/hubfs/logo-library/fll/firstlegoleagueexplore-lockup-all-formats.zip",
 "fll-discover":"https://www.firstinspires.org/hubfs/logo-library/fll/firstlegoleaguediscover-lockup-all-formats.zip",
 "ftc":"https://www.firstinspires.org/hubfs/logo-library/ftc/firsttechchallenge-logo-all-formats.zip",
 "frc":"https://www.firstinspires.org/hubfs/logo-library/frc/firstroboticscompetition-logo-all-formats.zip",
}
out=LOGOS/"FIRST Logos";out.mkdir(parents=True,exist_ok=True)
for key,url in SOURCE.items():
 try:
  response=requests.get(url,timeout=55);response.raise_for_status()
  z=zipfile.ZipFile(BytesIO(response.content))
  names=[x for x in z.namelist() if x.lower().endswith(".png") and not x.startswith("__MACOSX") and "one-color" not in x.lower() and "one_color" not in x.lower()]
  def rank(s):
   s=s.lower()
   return (("rgb" in s)*15+("full-color" in s or "full_color" in s)*15+("vertical" in s or "vert" in s)*5+("horizontal" in s or "horiz" in s)*2-("reverse" in s)*20-("small" in s)*2-("thumbnail" in s)*9)
  names.sort(key=rank,reverse=True)
  if not names: print("No approved PNG in",key);continue
  # Save all distinct layouts in FIRST's original supplied PNG format.
  # Do not edit, recolor, resize or trim official image content.
  variants={"vertical":None,"horizontal":None,"one-color":None}
  for filename in names:
   lower=filename.lower()
   if "vert" in lower and variants["vertical"] is None: variants["vertical"]=filename
   if ("horiz" in lower or "horizontal" in lower) and variants["horizontal"] is None: variants["horizontal"]=filename
   if ("onecolor" in lower or "one-color" in lower or "blackwhite" in lower or "black_white" in lower) and variants["one-color"] is None: variants["one-color"]=filename
  variants["default"]=names[0]
  for suffix,filename in variants.items():
   if filename is None:continue
   data=z.read(filename)
   img=Image.open(BytesIO(data));img.verify()
   target=key+".png" if suffix=="default" else key+"-"+suffix+".png"
   (out/target).write_bytes(data)
   print("Imported official",target,filename)
  if key=="first-elements":
   for label,words in {"icon":["icon"],"wordmark":["wordmark"],"acronym":["acronym"]}.items():
    matches=[n for n in names if any(w in n.lower() for w in words)]
    if matches:
     file=matches[0]
     data=z.read(file);Image.open(BytesIO(data)).verify()
     (out/("first-"+label+".png")).write_bytes(data)
     print("Imported supporting element",label,file)
 except Exception as e: print("Official FIRST import unavailable:",key,str(e))
