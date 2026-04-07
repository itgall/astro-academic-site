---
title: "Spectroscopic Intravascular OCT"
number: "01"
date: 2024-09-01
tags:
  - optical coherence tomography
  - spectroscopy
  - inverse problems
  - intravascular imaging
highlightTag: "spectroscopy"
institution: "Example Research Lab, Example University"
contentMode: freeform
techStack:
  - MATLAB
  - Python
  - COMSOL
  - Zemax
  - SolidWorks
githubUrl: ""
published: true
relatedPublications:
  - doe2026ssoct
  - doe2025inverse
  - doe2025cleo
---

## Overview

Spectroscopic intravascular OCT (S-OCT) extends conventional OCT by extracting wavelength-dependent tissue optical properties from the broadband interference signal. This enables quantitative characterization of coronary artery tissue composition — distinguishing lipid-rich necrotic cores from fibrous caps and calcified regions — without the need for additional imaging modalities.

## Technical Approach

The system is built on a swept-source OCT platform operating at 1310 nm center wavelength with 100 nm bandwidth. Key innovations include:

**Inverse algorithm design.** We developed a Tikhonov-regularized spectral fitting framework that extracts depth-resolved scattering and absorption coefficients from the OCT signal. The algorithm handles the ill-posed nature of the inverse problem through joint regularization across wavelengths, exploiting the spectral smoothness of biological chromophores as a physical prior.

**Polarization-sensitive extension.** By incorporating Jones matrix analysis of the polarization state evolution through the catheter and tissue, we add birefringence as a third contrast mechanism alongside scattering and absorption. This is particularly valuable for characterizing collagen organization in fibrous caps.

**Real-time processing pipeline.** The computational framework is designed for eventual real-time operation during catheterization procedures, using GPU-accelerated spectral processing and pre-computed lookup tables for the inverse solver.

## Current Status

The inverse algorithm has been validated on tissue-mimicking phantoms with known optical properties, achieving relative reconstruction error below 5%. We are currently preparing for *ex vivo* validation on human coronary artery specimens, with *in vivo* animal studies planned for late 2026.

## Impact

Reliable, quantitative tissue characterization during cardiac catheterization could transform the management of coronary artery disease. Current clinical OCT provides structural images but cannot quantify tissue composition — clinicians must infer plaque vulnerability from morphological features alone. S-OCT would provide direct biochemical contrast, enabling more accurate identification of vulnerable plaques and better-informed treatment decisions.
