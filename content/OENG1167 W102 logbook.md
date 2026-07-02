---
title: Capstone B W2 logbook
tags: 
week: 2025-W31
subject: "[[Capstone Project]]"
subjectweek: W102
class: logbook
source: todo!()
where: 
cssclasses:
  - clean-embeds
scopes:
  - Engineering/Capstone
---
- [ ]   [[Capstone Project]] #uni/class/logbook (@2025-W31-D7 23:54) (todo!()) 
# This Week
## Summary
- 2D lap joint -> 3D lap joint (still isotropic adherends)
## Monday
Meeting w supervisor.
## Thursday
Creating a 3D lap joint model (currently with isotropic adherends). Got better at seeding the mesh edges. Initially the mesh was *way* too fine.
![[LapJointElementCount.png]]
I later fixed this to have less elements.
![[Pasted image 20250810183044.png]]
Here it also shows where the adhesive has yielded. This is with an eccentric load downwards and to the left. Next step is to make the adherends composite materials.

![[Pasted image 20250810195351.png]]
# What I learnt
- Don't create a mesh with over a million elements.
- Modelling the 3D case is very similar it's just that you extrude the original sketch
- You can easily seed the edges by setting the view to partially transparent and dragging, as opposed to trying to click them
- It's really hard to set the correct force in an Abaqus/Explicit model without damage modelling because if it's too much end exceeds the adhesives ultimate strength it wants to just extend forever.
# Todo
- [x] Composite adherends
- [ ] Discuss with team what the loading shape should be

