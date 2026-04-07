---
title: "Inverse Problems in Optical Imaging"
date: 2025-09-20
updatedDate: 2026-02-01
maturity: budding
description: "Framework for inverse problems in optics: ill-posedness, regularization, and the role of physical priors."
tags:
  - inverse problems
  - regularization
  - imaging
  - mathematics
published: true
---

Inverse problems in optical imaging are concerned with recovering internal properties of a medium (absorption, scattering, refractive index) from external measurements of light. These problems are almost always **ill-posed** in the sense of Hadamard: solutions may not exist, may not be unique, or may not depend continuously on the data.

## The Regularization Imperative

Because direct inversion amplifies noise, we must impose additional structure on the solution. The standard approach is **Tikhonov regularization**, which adds a penalty term to the least-squares objective. But the choice of regularization — and its strength — encodes our prior knowledge about the solution.

For biological tissue, physically motivated priors include:
- **Spectral smoothness** — chromophore absorption spectra vary slowly with wavelength
- **Spatial continuity** — tissue properties don't change discontinuously (usually)
- **Non-negativity** — optical properties are positive

These connect directly to the work in [[Optical Coherence Tomography Fundamentals]], where we exploit spectral smoothness as a regularization prior for S-OCT inverse algorithms.

## Physics-Informed Approaches

Recent work incorporates the governing physics (e.g., the radiative transfer equation or diffusion approximation) directly into the inversion, either as hard constraints or as penalty terms in a neural network loss function. This connects to the broader trend of physics-informed neural networks (PINNs).

## Open Questions

- How do we select regularization parameters automatically in the clinical setting, where ground truth is unavailable?
- Can learned regularization (via neural networks) outperform hand-crafted priors while maintaining physical interpretability?
- What is the fundamental information-theoretic limit on what can be recovered from a given measurement geometry?
