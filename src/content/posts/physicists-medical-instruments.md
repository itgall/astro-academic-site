---
title: "Why Physicists Should Build Medical Instruments"
date: 2025-11-08
category: essay
description: "The case for physics-trained researchers in biomedical optics — and why the best instruments come from people who understand the light, not just the disease."
tags:
  - biophotonics
  - career
  - physics
  - research philosophy
published: true
featured: false
---

## The Translation Gap

There's a persistent gap in biomedical optics between the physicists who understand the light and the clinicians who understand the tissue. Both sides speak confidently about their respective domains, but the instruments that bridge them — the ones that actually make it into the catheterization lab or the operating room — tend to come from teams where someone holds both mental models simultaneously.

I don't mean teams where a physicist and a clinician collaborate across a hallway. I mean individuals who internalize the physics deeply enough to see the design space, and who spend enough time in the clinical environment to understand what "useful" actually means to a physician holding a catheter at 2 AM.

## The Physics Advantage

A physicist approaching OCT system design thinks in terms of first principles: the coherence length of the source determines axial resolution, the numerical aperture of the optics sets the lateral spot size, and the detector bandwidth limits the imaging depth[^1]. These are not parameters to be optimized — they are constraints that define the fundamental trade-off surface.

[^1]: For a detailed treatment of the resolution–bandwidth trade-off, see the mathematical framework in my [practical guide to inverse spectroscopic OCT](/blog/inverse-spectroscopic-oct/).

This matters because the most impactful innovations in biomedical optics have come from rethinking the physics, not from incremental engineering improvements. Fourier-domain OCT achieved a 20–30 dB sensitivity advantage over time-domain OCT not through better detectors, but through a different measurement geometry that exploits the Fourier transform relationship between spectral and spatial domains[^2].

[^2]: This sensitivity advantage is known as the Fellgett advantage in the spectroscopy community. It arises from the multiplexing of spectral channels — all wavelengths contribute signal simultaneously rather than being measured sequentially.

Similarly, photoacoustic imaging emerged from recognizing that the thermoelastic effect — a phenomenon understood since the 19th century — could be harnessed to achieve optical contrast at ultrasonic resolution depths[^3]. The physics was known for over a century. The insight was seeing its application.

[^3]: Our group's [NIR-II photoacoustic imaging project](/projects/nir-ii-photoacoustic/) extends this principle into the second near-infrared window (1000–1700 nm), where reduced scattering enables deeper penetration into tissue.

## Building, Not Just Modeling

The danger for physics-trained researchers is the temptation to stay in the modeling realm. Simulations are seductive because they're clean: no alignment drift, no connector losses, no vibrations from the building's HVAC system. But the gap between a simulated system and a working instrument is where most of the real learning happens.

I've found that the best approach is to maintain fluency in both: use simulation to explore the design space quickly, then build prototypes to discover the failure modes that simulations miss. The COMSOL model of a fiber coupler doesn't capture the slow polarization drift from thermal cycling. The Zemax ray trace doesn't show you that the catheter sheath introduces a wavelength-dependent birefringence that varies with bending radius.

These are the details that determine whether an instrument works in the lab or in the clinic. And they are, fundamentally, physics problems — just ones that require building things to discover.

## The Path Forward

For early-career physicists considering biomedical optics: the field desperately needs people who can think from Maxwell's equations to clinical workflow in a single conversation. The tools are powerful, the problems are meaningful, and the impact is direct.

The key is to resist the gravitational pull toward either pure theory or pure engineering. The most valuable work happens at the interface — where the physics meets the tissue, and where the instrument meets the physician's hand.
