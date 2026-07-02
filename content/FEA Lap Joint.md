---
tags:
  - capstone
  - engineering
  - Engineering/FEA/Abaqus
scopes:
  - draft
---
# Lap Joint Elasticity/Plasticity
Continued working on lap joint, with a few different cases. currently isotropic materials (aluminium adherents and Loctite 3421 adhesive) but will consider adhesive later
## Elastic Adhesive
![[lapjoint-elastic.svg]]
This one had the adhesive as purely elastic. ofc this assumes it'll stick forever which is not true. For this one you just need to add elastic properties
## Elastic-plastic
![[Job-1.odb]]
![[lapjoint-elastic-plastic.svg]]
For this one, we assume that it's elastic until a failure stress, after which point the adhesive essentially gives instantly. We can look at the plastic shear (S12) and plastic strain (S11) to see where the plastic region begins. This one is similar to the previous lap joint but you add a single plastic stress point

## True stress-strain
![[Job-2.odb]]
![[lapjoint-true-stress-strain.svg]]
For this one, the actual stress-strain curve data is used. We can model the plastic strain by starting from the point the material first starts to give. 
Compared to the previous ones we can see there are some differences
(I didn't extract the data from each output so I cannot show the differences)
