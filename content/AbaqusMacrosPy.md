```python
# -*- coding: mbcs -*-
# Do not delete the following import lines
from abaqus import *
from abaqusConstants import *
import __main__

FRAME_FOR_LOADING = {
    "+0_50X+0_00Z+0_00R": 8,
    "+0_00X+0_90Z+0_00R": 9,
    "+0_00X+0_00Z+10_00R": 17,
    "+0_12X+0_90Z+2_50R": 8,
    "+0_50X+0_00Z+10_00R": 9
    }

def createNextViewport():
    maxNum = max(map(lambda vp: int(vp.split(" ")[1]), session.viewports.keys()))
    session.Viewport(f"Viewport: {maxNum+1}")

def manageViewportCount(desiredCount):
    print(f"Want {desiredCount} viewports and have {len(session.viewports)}")
    sortedKeys = sorted(session.viewports.keys(), key = lambda vp: int(vp.split(" ")[1]))
    if desiredCount < len(session.viewports) and False: # actually don't ever delete viewports
        session.viewports[sortedKeys[0]].makeCurrent()
        print("Removing excess viewports")
        for i, key in enumerate(sortedKeys):
            if i >= desiredCount:
                del session.viewports[key]
    elif desiredCount > len(session.viewports):
        print("Adding needed viewports")
        for i in range(len(session.viewports), desiredCount):
            createNextViewport()
    # re-sort
    sortedKeys = sorted(session.viewports.keys(), key = lambda vp: int(vp.split(" ")[1]))
    vps = {i:session.viewports[i] for i in sortedKeys}
    return vps

def ShowFieldOutput(viewportSettings):
    
    vps = manageViewportCount(len(viewportSettings))
    usedViewports = [];
                     
    for settings, viewport in zip(viewportSettings,vps.values()):
        viewport.view.setProjection(projection=PARALLEL)
        viewport.odbDisplay.contourOptions.setValues(maxAutoCompute=ON, minAutoCompute=ON)
        viewport.makeCurrent()
        viewport.odbDisplay.contourOptions.setValues(
        colorByMatchingPlies=ON if settings[3] else OFF)
        if settings[1]:
            viewport.odbDisplay.setPrimaryVariable(
                variableLabel=settings[0],
                outputPosition=INTEGRATION_POINT,
                refinement=settings[1]
                )
        else:
            viewport.odbDisplay.setPrimaryVariable(
                variableLabel=settings[0],
                outputPosition=INTEGRATION_POINT
                )
        
        viewport.odbDisplay.basicOptions.setValues(
            sectionResults=USE_ENVELOPE,
            envelopeCriteria=settings[2]
            ) 
        viewport.odbDisplay.display.setValues(plotState=(CONTOURS_ON_UNDEF,))
        usedViewports.append(viewport)
        
    
    # get mins and maxes
    legendGroups = set([settings[4] for settings in viewportSettings])
    for lg in legendGroups:
        if lg is None: continue
        connectedVPsIx = [i for i,settings in enumerate(viewportSettings) if settings[4] == lg]
        connectedVPs = [usedViewports[i] for i in connectedVPsIx]
        lgMin = 1e9
        lgMax = -1e9
        for vp in connectedVPs:
            lgMax = max(lgMax, vp.odbDisplay.contourOptions.autoMaxValue)
            lgMin = min(lgMax, vp.odbDisplay.contourOptions.autoMinValue)
        # now that we have min/max set to that
        for vp in connectedVPs:
            vp.odbDisplay.contourOptions.setValues(
                maxAutoCompute=OFF, maxValue=lgMax, minAutoCompute=OFF, minValue=lgMin)
            
    
    return usedViewports
        

def FOStress():
    viewportSettings = [
        ("S", (INVARIANT, "Mises"), MAX_VALUE, False, 0),
        ("S", (INVARIANT, "Mises"), MIN_VALUE, False, 0),
        ("S", (COMPONENT, "S11"), MAX_VALUE, False, 1),
        ("S", (COMPONENT, "S11"), MIN_VALUE, False, 1),
        ("S", (COMPONENT, "S22"), MAX_VALUE, False, 2),
        ("S", (COMPONENT, "S22"), MIN_VALUE, False, 2),
        ("S", (COMPONENT, "S12"), MAX_VALUE, False, 3),
        ("S", (COMPONENT, "S12"), MIN_VALUE, False, 3)
        ]
    return ShowFieldOutput(viewportSettings)

    
def FOHashin():
    viewportSettings = [
        ("HSNFCCRT", None, MAX_VALUE, False, None),
        ("HSNFCCRT", None, MIN_VALUE, True, None),
        ("HSNFTCRT", None, MAX_VALUE, False, None),
        ("HSNFTCRT", None, MIN_VALUE, True, None),
        ("HSNMCCRT", None, MAX_VALUE, False, None),
        ("HSNMCCRT", None, MIN_VALUE, True, None),
        ("HSNMTCRT", None, MAX_VALUE, False, None),
        ("HSNMTCRT", None, MIN_VALUE, True, None)
        ]
    return ShowFieldOutput(viewportSettings)
    
    
def FOAdhesive():
    viewportSettings = [
        ("SDEG", None, MAX_VALUE, False, None),
        ("S", (INVARIANT, "Mises"), MAX_VALUE, False, None)
        ]
    return ShowFieldOutput(viewportSettings)
    
    
def ViewSettings():
    import connectorBehavior
    viewport = session.viewports.values()[0]
    viewport.viewportAnnotationOptions.setValues(title=OFF, 
        state=OFF, compass=OFF)
    viewport.viewportAnnotationOptions.setValues(
        triadPosition=(95, 90))
    viewport.viewportAnnotationOptions.setValues(
        legendFont='-*-verdana-medium-r-normal-*-*-70-*-*-p-*-*-*')


def StressSurface():
    session.viewports[session.currentViewportName].odbDisplay.contourOptions.setValues(
        maxAutoCompute=OFF, maxValue=345, minAutoCompute=OFF, minValue=-345)
        
        
def StressPatch():
    session.viewports[session.currentViewportName].odbDisplay.contourOptions.setValues(
        maxAutoCompute=OFF, maxValue=400, minAutoCompute=OFF, minValue=-400)


def ContourColors():
    session.viewports[session.currentViewportName].odbDisplay.contourOptions.setValues(
        outsideLimitsAboveColor='#FF00F8', outsideLimitsBelowColor='#6C008A')


def SaveToImage(imageInfo, viewports):
    size = (3840, 2010)# (2560, 1340)
    session.printOptions.setValues(vpDecorations=OFF, reduceColors=False)
    session.pngOptions.setValues(imageSize = size)
    odbName = session.viewports.values()[0].displayedObject.name.split("/")[-1].strip(".odb");
    loading = odbName.strip("Patch").strip("less");
    hasPatch = not "less" in odbName
    fileName = loading + "-" + imageInfo
    if imageInfo == "SurfaceStress":
        fileName +=  "-Patch" if hasPatch else "-Patchless"
    filePatch = 'C:/Users/S3943498/OneDrive - RMIT University/Documents/Capstone personal/Patch/images/' + fileName
    session.printToFile(
        fileName=filePatch, 
        format=PNG, canvasObjects=tuple(viewports))
    print(f"Saving {imageInfo} to ./images/{fileName}")


def ShowSurface():
    import displayGroupOdbToolset as dgo
    leaf = dgo.LeafFromElementSets(elementSets=('SURFACE-TOP.REMESH', ))
    session.viewports[session.currentViewportName].odbDisplay.displayGroup.replace(leaf=leaf)
    session.viewports[session.currentViewportName].view.setValues(session.views['User-1'])



def ShowPatch():
    import displayGroupOdbToolset as dgo
    leaf = dgo.LeafFromPartInstance(partInstanceName=('PATCH-1', ))
    session.viewports[session.currentViewportName].odbDisplay.displayGroup.replace(leaf=leaf)
    session.viewports[session.currentViewportName].view.setValues(session.views['User-3'])


def ShowAdhesive():
    import displayGroupOdbToolset as dgo
    leaf = dgo.LeafFromPartInstance(partInstanceName=('ADHESIVE-LAYER-1', ))
    session.viewports[session.currentViewportName].odbDisplay.displayGroup.replace(leaf=leaf)
    session.viewports[session.currentViewportName].view.setValues(session.views['User-2'])

    
def APatchStress():
    ShowPatch()
    SaveToImage("PatchStress", FOStress())
    
    
def APatchHashin():
    ShowPatch()
    SaveToImage("PatchHashin", FOHashin())
    
    
def ASurfaceStress():
    ShowSurface()
    SaveToImage("SurfaceStress", FOStress())
    
def AAdhesiveAll():
    ShowAdhesive()
    SaveToImage("AdhesiveAll", FOAdhesive())

def AAAGetImagesForOdb(odb):
    odbName = odb.name.split("/")[-1].strip(".odb")
    loading = odbName.strip("Patch").strip("less")
    # get frame for this odb
    if loading in FRAME_FOR_LOADING:
        frameIx = FRAME_FOR_LOADING[loading]
        frame = odb.steps['Step-1'].frames[frameIx]
    else:
        frameIx = len(odb.steps['Step-1'].frames)-1
        
    print(odbName + " : " + loading + ", Frame " + str(frameIx))
    for viewport in session.viewports.values():
        viewport.setValues(displayedObject = odb)
        viewport.odbDisplay.setFrame(step='Step-1', frame=frameIx) 
    manageViewportCount(8)
    if "less" in odbName:
        # patchless, only do surface
        ASurfaceStress()
    else:
        ASurfaceStress()
        APatchHashin()
        APatchStress() # have to do stress before changing element set
        AAdhesiveAll()
    
def AAAGetImagesForViewportOdb():
    odb = session.viewports[session.currentViewportName].displayedObject
    AAAGetImagesForOdb(odb)

 
def AAAAGetImagesForLoadedOdbs():
    for odb in session.odbs.values():
        AAAGetImagesForOdb(odb)


def ZZImports():
    import section
    import regionToolset
    import displayGroupMdbToolset as dgm
    import part
    import material
    import assembly
    import step
    import interaction
    import load
    import mesh
    import optimization
    import job
    import sketch
    import visualization
    import xyPlot
    import displayGroupOdbToolset as dgo
    import connectorBehavior
    pass

```