---
tags:
  - programming/docker
  - programming/xml
  - programming/networking
  - top-level
scopes:
  - public
---
# Design Requirements
There are a few moving parts to hosting this website, and multiple design requirements:
- The core content must be in **markdown database** format. I love Obsidian, and use it across all my devices so being able to edit the content via obsidian is essential.
- The website has to be very customisable as well. I should be able to create my own js panels if I want (e.g if I want a custom directory menu).
	- As part of customisation, it would be ideal if I can have a sort of "permissions" system for the website. In that, If I want to host files and just share the url to my friends, I should be able to share that to them without the page being indexed or included in searches.
- I have by home pc and I don't want to pay for server hosting or ec2 instances right now; however, I want the ability to swap in the future. This makes me think I need some sort of containerisation/build process so I can easily move around my changes
- The website should **update fast** with changes I make, at least under 10 seconds. Nothing I decide to put in the garden is secret, and I don't mind draft files existing and a few \#todos here and there.
- I want to learn **networking and webserver hosting basics**. When I started off programming in Java, I used to write single threaded simple applications. Then over the years I've started learning a little bit how to do concurrency, cross-application communication, a bunch of other different things that aren't just "writing a single file". My ability to work with networking stuff is extremely lacklustre and I want to fix that so I can feel comfortable making my own applications. This also leans a bit into my [[Inaya#Learning Philosophy|learning philosophy]]. If I wanted to make this easy I'd just use obsidian publish but what's the fun in that :p

So we need to make a live-updating feature-rich markdown documentation-style webserver that can be moved around if need be. This introduces a few different things we have to sort out
# The pieces
If I'm going to host this, I'm going to need 1) A static site generator, 2) some easy way to serve it, and 3) an easy way to synchronise the files.
## Static Site Generators
For this, I used the 


#todo