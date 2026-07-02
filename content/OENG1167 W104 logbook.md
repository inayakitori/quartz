---
tags: 
aliases: 
week: 2025-W33
subject: "[[Capstone Project]]"
subjectweek: W104
class: logbook
source: todo!()
where: 
cssclasses:
  - clean-embeds
title: Capstone B W4 logbook
scopes:
  - Engineering/Capstone
---
- [x]   [[Capstone Project]] #uni/class/logbook (@2025-W33-D7 23:54) (todo!()) 

![[OENG1167 W103 logbook#Todo]]
# This Week
## Monday
Meeting with Adrian. He's happy with the fact that we're assigning/micromanaging tasks more.
Jalisha and I finalised that the crack length should be 3mm

![[Pasted image 20250814173045.png]]

[Source](https://www.afgrow.net/applications/DTDHandbook/pdfs/Sec3_1_0.pdf)
We have yet to finalise material properties but that can come later as it's just a matter of changing numbers in Abaqus.
We have also decided to try to do as much of the report as possible before the poster because then making the poster is just a matter of summarising existing information :3
## Tuesday
We have confirmed that the modelled surface will be 5 x 50 x 15 (depth) mm for the sake of having consistent analyses.

## Wednesday
I added some information on the modelling of the patch repair to the completion plan introduction.

## Thursday
Finalising completion timeline by adding in the tasks that Jalisha, Sam and Mitch will do for the scarf repair.

## Sunday
Proofreading completion plan and adding patch repair info to the Completed Tasks part.

![[layering.png|400]]
![[HTF.png]]
I can do a displacement load based off a normal co-ordinate system but not for a cylindrical system (which I wanted to use so that I can apply a torsional displacement). It gives an error for having elements on the rotational axis itself right now so maybe a rotation would have to be define through a script or some other method (like just rotating the corner nodes).

Submitted completion plan!
# Todo
- [ ] Touch base w/ Ethan on material properties
- [ ] Get the jobs running via Python scripts
- [x] Find out how to apply a torsional displacement BC
