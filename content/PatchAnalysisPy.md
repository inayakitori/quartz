```python
from odbAccess import *
from abaqus import *
import os
# from loadinginfo import createLoadingData
from typing import Any
import numpy as np
import datetime
import traceback

mdb: Mdb = openMdb("../patch.cae")
model = mdb.models["Model-1"]
# set loading


def jobWithLoading(mdb, model, dx, dz, dr, with_patch):
    # suppressing/enabling
    def setFeatureStatus(parent, objects, enable):
        if enable:
            return parent.resumeFeatures(objects)
        else:
            return parent.suppressFeatures(objects)
    def setStatus(parent, objects, enable):
        for object in objects:
            if enable: parent[object].resume()
            else: parent[object].suppress()
    setFeatureStatus(model.rootAssembly, ("Adhesive-Layer-1", "Patch-1"), with_patch)
    setStatus(model.constraints, ("Adhesive-Patch-1", "Surface-Adhesive"), with_patch)
    setStatus(model.fieldOutputRequests, ("Adhesive", "Composite"), with_patch)
    model.ExpressionField("RotationY", "Z*sin(%f) + Y*(cos(%f)-1)" % (dr, dr))
    model.ExpressionField(
        "RotationZ", "Z * (cos(%f)-1) + Y*sin(%f) + %f" % (dr, dr, dz)
    )
    model.boundaryConditions["StretchR"].setValues(u1=dx, ur1=-dr) # must be negative rotation
    patchText = "" if with_patch else "less"
    name = ("Patch%s%+04.2fX%+04.2fZ%+05.2fR" % (patchText, dx, dz, dr * 180 / pi)).replace(".", "_")
    print(name)
    return mdb.Job(name, model), name


def writeInputsInRange(mdb, model, dxs, dzs, drs, patch_statuses):
    jobs = {}
    dxmax = max(1e-6,max(dxs))
    dzmax = max(1e-6,max(dzs))
    drmax = max(1e-6,max(drs))
    print(dxmax, dzmax, drmax)
    for with_patch in patch_statuses:
        for dx in dxs:
            for dz in dzs:
                for dr in drs:
                    if dx != dxmax and dz != dzmax and dr != drmax:
                        continue
                    job, name = jobWithLoading(mdb, model, dx, dz, dr, with_patch)
                    job.writeInput()
                    job = mdb.JobFromInputFile(name, name + ".inp")
                    jobs[name] = (job, dx, dz, dr, with_patch)
                    print(jobs[name])
    return jobs



def fieldComponent(fieldOutputs, fieldOutput, region, getComponent):
    return np.array(np.nan) if not region else np.array([
        getComponent(value)
        for value in fieldOutputs[fieldOutput].getSubset(region=region).values
    ])


def volumeMean(fieldOutputs, fieldOutput, region, getComponent):
    fo = fieldComponent(fieldOutputs, fieldOutput, region, getComponent)
    return np.mean(fo)
    # print("FO:" + str(fo.shape))
    # vol = fieldComponent(fieldOutputs, "EVOL", region, lambda v: v.data)
    # print("VOL:" + str(vol.shape))
    # return np.average(fo, weights=vol)


def getStatsForFrame(frame, assembly, stepLoading):
    hasPatch = stepLoading[3] != 0 # means we don't have to worry about weird float issues
    frameLoading = stepLoading[0:3] * frame.frameValue
    fo = frame.fieldOutputs
    # instances
    instances = assembly.instances
    crack_proximity = instances["SURFACE-TOP"].elementSets["CRACK-ANALYSIS"]
    crack = instances["SURFACE-TOP"].elementSets["SURFACE-WEAK"]
    surfaceElem = instances["SURFACE-TOP"].elementSets["PATCH-NO-CRACK"]
    surfaceNode = instances["SURFACE-TOP"].nodeSets["PATCH-NO-CRACK"]
    adhesive = None if ~hasPatch else instances["ADHESIVE-LAYER-1"]
    patch = None if ~hasPatch else instances["PATCH-1"]
    stretch = assembly.nodeSets["STRETCH"]
    # surface strains n rotation
    sE11 =  volumeMean(fo, "LE", surfaceElem, lambda v: v.data[0])
    sE12 =  volumeMean(fo, "LE", surfaceElem, lambda v: v.data[3])
    sUR =  np.mean(fieldComponent(fo, "UR", surfaceNode, lambda v: v.data[0]))
    patchStressMax = np.max(fieldComponent(fo, "S", patch, lambda v: v.mises))
    surfaceStressMax = np.max(fieldComponent(fo, "S", surfaceElem, lambda v: v.mises))
    crackStressMax = np.max(fieldComponent(fo, "S", crack_proximity, lambda v: v.mises))
    crackStrainE11 = np.max(fieldComponent(fo, "LE", crack, lambda v: v.data[0]))
    crackStrainEMax = np.max(fieldComponent(fo, "LE", crack, lambda v: v.maxInPlanePrincipal))
    crackStrainE22 = np.max(fieldComponent(fo, "LE", crack, lambda v: v.data[1]))
    crackStrainE12 = np.max(fieldComponent(fo, "LE", crack, lambda v: v.data[3]))
    adhesiveDegradationMax = np.max(fieldComponent(fo, "SDEG", adhesive, lambda v: v.data))
    adhesiveDegradationAvg= np.mean(fieldComponent(fo, "SDEG", adhesive, lambda v: v.data))
    sRFX = fieldComponent(fo, "RF", stretch, lambda v: v.data[0])
    sRFY = fieldComponent(fo, "RF", stretch, lambda v: v.data[1])
    sRFZ = fieldComponent(fo, "RF", stretch, lambda v: v.data[2])
    sPY =  fieldComponent(fo, "COORD", stretch, lambda v: v.data[1]) + fieldComponent(fo, "U", stretch, lambda v: v.data[1])
    sPZ =  fieldComponent(fo, "COORD", stretch, lambda v: v.data[2]) + fieldComponent(fo, "U", stretch, lambda v: v.data[2])
    stretchRMX = sPZ * sRFY - sPY * sRFZ
    # hashin it
    hashinFC = np.max(fieldComponent(fo, "HSNFCCRT", patch, lambda v: v.data))
    hashinFT = np.max(fieldComponent(fo, "HSNFTCRT", patch, lambda v: v.data))
    hashinMC = np.max(fieldComponent(fo, "HSNMCCRT", patch, lambda v: v.data))
    hashinMT = np.max(fieldComponent(fo, "HSNMTCRT", patch, lambda v: v.data))
    hashinModes = [hashinFC, hashinFT, hashinMC, hashinMT]
    hashinMax = max(hashinModes)
    return {
        "t"  : frame.frameValue,
        "hasPatch": hasPatch,
        "dx" : frameLoading[0],
        "dz" : frameLoading[1],
        "dr" : frameLoading[2], 
        "E11": sE11,
        "E12": sE12,
        "UR1": sUR,
        "RFX": np.sum(sRFX),
        "RFY": np.sum(sRFY),
        "RFZ": np.sum(sRFZ),
        "RMX": np.sum(stretchRMX),
        "AdhDMax": adhesiveDegradationMax,
        "AdhDAvg": adhesiveDegradationAvg,
        "PtchSMax": patchStressMax,
        "SurfSMax": surfaceStressMax,
        "CrckSMax": crackStressMax,
        "CrckE11": crackStrainE11,
        "CrckE12": crackStrainE12,
        "CrckE22": crackStrainE22,
        "CrckEMax": crackStrainEMax,
        "HshnMax": hashinMax,
        "HshnType": hashinModes.index(hashinMax),
    }


def getStatsForStep(step, assembly, stepLoading):
    return[getStatsForFrame(frame, assembly, stepLoading) for frame in step.frames]


def dictToCsvString(data: list[dict[str,Any]]):
    return "\n".join([", ".join([f"{value}" for value in data[0].keys()])] + \
              [", ".join([f"{value:+.8e}" for value in row.values()]) for row in data])


# jobs = writeInputsInRange(
#     mdb, model, np.linspace(0, 0.7, 8), np.linspace(0, 1, 8), np.linspace(0, pi/18, 8), [True, False]
# )
jobs = writeInputsInRange(
    mdb, model, np.linspace(0, 0.5, 9), np.linspace(0, 0.9, 9), np.linspace(0, pi/18, 9), [True, False]
)


# uniaxial cases:
if(False):
    jobs = {}
    jobs.update(writeInputsInRange(mdb, model, [1], [0], [0], [False, True]))
    jobs.update(writeInputsInRange(mdb, model, [0], [1], [0], [False, True]))
    jobs.update(writeInputsInRange(mdb, model, [0], [0], [pi/12], [False, True]))


def writeOdbStats(jobName, job, batchFilename):
    count_errored = 0
    odb = None
    try:
        odb = openOdb("./" + jobName + ".odb", readOnly=True)
        step = odb.steps["Step-1"]
        loading = np.array(jobs[jobName][1:5])
        csvstring = dictToCsvString(getStatsForStep(step, odb.rootAssembly, loading))
    except Exception:
        count_errored+=1
        extxt = traceback.format_exc()
        print(extxt)
        if odb: odb.close()
        return 1
        raise
    with open("../csvs2/" + jobName + "-data.csv", "w") as file:
        file.write(csvstring)
    if batchFilename:
        with open("../csvs2/" + batchFilename + ".csv", "a") as file:
            file.write("\n"+csvstring)
    with open("../csvs2/collated-data.csv", "a") as file:
        file.write("\n"+csvstring)
    if odb: odb.close()
    return 0


n = 6
count_total = len(jobs)
count_completed = 0
count_errored = 0
pending_jobs = list(jobs.keys())
stats = {}
batchFilename = "Data-" + datetime.datetime.now().strftime("%Y-%m-%dT%H_%M_%S")
while pending_jobs:
    jobsToComplete: list[tuple[str,Any]] = []
    jobsAdded = 0
    while pending_jobs and jobsAdded < 6:
        jobName = pending_jobs.pop()
        if os.path.exists("../csvs2/" + jobName + "-data.csv"):
            print(f"Skipped submitting {jobName}. data exists")
            continue # don't redo existing jobs
        # todo rewrite
        job = jobs[jobName][0]
        print(f"submitting {jobName}")
        job.submit()
        jobsToComplete.append((jobName,job))
        jobsAdded+=1
    for jobName, job in jobsToComplete:
        job.waitForCompletion()
        count_completed+=1
        odb = None
        count_errored += writeOdbStats(jobName, jobs[jobName], batchFilename)
    print(f"Jobs completed {count_completed}/{count_total} ({count_errored} errors)")

```