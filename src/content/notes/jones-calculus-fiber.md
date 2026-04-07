---
title: "Jones Calculus for Fiber Optics"
date: 2025-12-01
maturity: budding
description: "Applying the Jones matrix formalism to model polarization evolution in single-mode fiber systems."
tags:
  - polarization
  - fiber optics
  - jones calculus
  - mathematics
published: true
---

The Jones calculus represents polarization states as 2-component complex vectors and optical elements as 2×2 complex matrices. For fiber optic systems, this formalism is essential because single-mode fibers exhibit birefringence that evolves the polarization state unpredictably.

## Key Matrices

A wave plate with retardation $\delta$ and fast axis at angle $\theta$ has Jones matrix:

$$J = R(-\theta) \begin{pmatrix} e^{-i\delta/2} & 0 \\ 0 & e^{i\delta/2} \end{pmatrix} R(\theta)$$

For a fiber section, the birefringence is characterized by the **beat length** — the propagation distance over which the two polarization modes accumulate a $2\pi$ phase difference.

## Application to OCT

In intravascular OCT, the catheter fiber introduces unknown birefringence that must be calibrated out. This connects to the polarization-sensitive extension described in [[Optical Coherence Tomography Fundamentals]].

The round-trip Jones matrix through the catheter is $J_{\text{RT}} = J_{\text{fiber}}^T J_{\text{sample}} J_{\text{fiber}}$, which can be decomposed to extract the sample's Jones matrix if the fiber matrix is known or can be calibrated.

## Müller Matrix Alternative

For depolarizing samples, the Jones formalism is insufficient — we need the 4×4 Müller matrix formalism that handles partially polarized light. See [[Müller Matrix Polarimetry]] for the extension to depolarizing media.

## Practical Considerations

In practice, fiber birefringence drifts with temperature, stress, and bending — making real-time calibration essential. The standard approach uses a reference reflector to measure the fiber's round-trip Jones matrix before each imaging frame.

This is an active area of research in our group — see the [[Inverse Problems in Optical Imaging]] note for how we incorporate polarization into the spectroscopic inverse framework.
