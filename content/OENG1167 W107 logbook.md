---
tags:
title: Capstone B W7 logbook
week: 2025-W35
subject: "[[Capstone Project]]"
subjectweek: W107
class: logbook
source: todo!()
where:
scopes:
  - Engineering/Capstone
---
![[OENG1167 W106 logbook#Todo]]

# This Week
## Monday
I inputted the new material values for the aluminium, adhesive, and patch. The adhesive is now using significantly stronger values, which makes sense as an adhesive needs to be strong.

After doing this, I'm focusing on making scripts that can help me run tests and extract information. A significant portion of this time was just getting a simple working script for extracting odb information easily. I am making many mistakes but I am also learning many things, which is a plus.

After finally setting up a good way to get position (COORD), displacement (U/UR), and force (RF/RM) values for the wall and stretch positions, I can now use the nodal values at the stretch location to get specific useful values:

```python
# for each frame:
tension = -sum(val.data[0] for val in fieldOutputs["RF"])
stretch = statistics.mean(val.data[0] for val in fieldOutputs["U"])
elongation = stretch / GEOMETRY["Length"]
```

From this I can then start getting values of crack stress vs applied tensile stress:

# What I learnt
- You can also specify a COORD field output to get the integration point original positions
![[Pasted image 20250908223448.png]]
- With FEA, some field outputs are at nodes, whereas some are at elements. The sets for these are different. **You cannot get displacements (U) on element sets**; you *must* use node sets.
- You can use the Abaqus/CAE kernel line to easily sandbox things before putting them in code
```python
>>> step.frames[0].fieldOutputs["COORD"].values[0].data
array([-5. , -0.075 , 9.799999], dtype=float32)
>>> step.frames[0].fieldOutputs["COORD"].getSubset(wallSet)
TypeError: arg1; found OdbSet, expecting UNDEFINED_POSITION, NODAL, ELEMENT_NODAL, INTEGRATION_POINT, ELEMENT_FACE_INTEGRATION_POINT, WHOLE_ELEMENT, WHOLE_REGION, WHOLE_MODEL, CENTROID, SURFACE_INTEGRATION_POINT, SURFACE_NODAL, ELEMENT_FACE or WHOLE_PART_INSTANCE
>>> step.frames[0].fieldOutputs["COORD"].getSubset()
openOdb(r'C:/Users/.../Twist.odb').steps['Step-1'].frames[0].fieldOutputs['COORD'].getSubset()
>>> step.frames[0].fieldOutputs["COORD"].getSubset(region=wallSet)
openOdb(r'C:/Users/.../Twist.odb').steps['Step-1'].frames[0].fieldOutputs['COORD'].getSubset(region=openOdb(r'C:/Users/.../Twist.odb').rootAssembly.elementSets['WALL'])
>>> wallOutputs = step.frames[0].fieldOutputs["COORD"].getSubset(region=wallSet)
>>> wallOutputs.values
openOdb(r'C:/Users/.../Twist.odb').steps['Step-1'].frames[0].fieldOutputs['COORD'].getSubset(region=openOdb(r'C:/Users/.../Twist.odb').rootAssembly.elementSets['WALL']).values
>>> wallOutputs.values[0].data
array([-58.564137, 0. , -47.995377], dtype=float32)
>>> wallOutputs = step.frames[0].fieldOutputs["U"].getSubset(region=wallSet)
>>> wallOutputs.values[0].data
IndexError: Sequence index out of range
```


```python
C:\Users\S3943498\...\Lapjoint3d>abaqus python abaqus_plugins/loadinginfo.py -odb Job-Patch.odb
Processing Step  1
"Step-1" F0 LoadingCase(tension=0.0, stretch=0.0, elongation=0.0, crackStress=0.0)
"Step-1" F1 LoadingCase(tension=14032.019073486328, stretch=0.1, elongation=0.0016666666915019354, crackStress=70.94763946533203)
"Step-1" F2 LoadingCase(tension=28032.499877929688, stretch=0.2, elongation=0.0033333333830038708, crackStress=141.6964569091797)
"Step-1" F3 LoadingCase(tension=42001.510009765625, stretch=0.3, elongation=0.005000000198682149, crackStress=212.3720245361328)
"Step-1" F4 LoadingCase(tension=55933.23010253906, stretch=0.4, elongation=0.0066666667660077415, crackStress=283.9537048339844)
"Step-1" F5 LoadingCase(tension=69818.291015625, stretch=0.5, elongation=0.008333333333333333, crackStress=358.57122802734375)
"Step-1" F6 LoadingCase(tension=83657.84155273438, stretch=0.6, elongation=0.010000000397364298, crackStress=436.7843933105469)
"Step-1" F7 LoadingCase(tension=97455.65112304688, stretch=0.7, elongation=0.011666666467984517, crackStress=518.5008544921875)
"Step-1" F8 LoadingCase(tension=111215.55419921875, stretch=0.8, elongation=0.013333333532015483, crackStress=603.2343139648438)
"Step-1" F9 LoadingCase(tension=124942.49658203125, stretch=0.9, elongation=0.014999999602635702, crackStress=689.9479370117188)
"Step-1" F10 LoadingCase(tension=138631.0654296875, stretch=1.0, elongation=0.016666666666666666, crackStress=778.7988891601562)
"Step-1" F11 LoadingCase(tension=152280.49853515625, stretch=1.1, elongation=0.01833333373069763, crackStress=871.8869018554688)
"Step-1" F12 LoadingCase(tension=165906.837890625, stretch=1.2, elongation=0.020000000794728596, crackStress=964.7281494140625)
"Step-1" F13 LoadingCase(tension=179509.77685546875, stretch=1.3, elongation=0.02166666587193807, crackStress=1056.3543701171875)
"Step-1" F14 LoadingCase(tension=193085.2802734375, stretch=1.4, elongation=0.023333332935969033, crackStress=1148.4420166015625)
"Step-1" F15 LoadingCase(tension=206632.98095703125, stretch=1.5, elongation=0.025, crackStress=1241.2662353515625)
"Step-1" F16 LoadingCase(tension=220152.28076171875, stretch=1.6, elongation=0.026666667064030966, crackStress=1334.7576904296875)
"Step-1" F17 LoadingCase(tension=233644.70556640625, stretch=1.7, elongation=0.02833333412806193, crackStress=1425.341796875)
"Step-1" F18 LoadingCase(tension=247105.5390625, stretch=1.8, elongation=0.029999999205271403, crackStress=1518.4952392578125)
"Step-1" F19 LoadingCase(tension=260536.919921875, stretch=1.9, elongation=0.03166666626930237, crackStress=1609.6663818359375)
"Step-1" F20 LoadingCase(tension=273938.232421875, stretch=2.0, elongation=0.03333333333333333, crackStress=1701.3314208984375)
Data written to Job-Patch.odb-data.csv
```