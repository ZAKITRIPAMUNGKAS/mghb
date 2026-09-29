import sys,os,json
sys.path.insert(0,r"D:\GEMALA.CREATIVE\mghb")
os.chdir(r"D:\GEMALA.CREATIVE\mghb")
from server import plan_journey
j = plan_journey(-6.194, 106.791, -6.198, 106.790, "07:00:00")
print(len(j), "journeys")
if j:
    print(json.dumps(j[0], indent=2, ensure_ascii=False)[:2000])
