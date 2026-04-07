---
title: "Optical Coherence Tomography Fundamentals"
date: 2025-06-15
updatedDate: 2026-01-10
maturity: evergreen
description: "Core principles of OCT: low-coherence interferometry, axial resolution, sensitivity advantage of Fourier-domain detection."
tags:
  - oct
  - interferometry
  - imaging
published: true
---

Optical coherence tomography is an interferometric imaging technique that uses broadband light to achieve micrometer-scale axial resolution in biological tissue. The key insight is that **low-coherence interferometry** provides depth sectioning without confocal gating — the coherence length of the source directly determines the axial point spread function.

## Axial Resolution

The axial resolution is determined by the coherence length of the source:

$$\delta z = \frac{2 \ln 2}{\pi} \cdot \frac{\lambda_0^2}{\Delta\lambda}$$

where $\lambda_0$ is the center wavelength and $\Delta\lambda$ is the full-width half-maximum bandwidth. This is fundamentally different from confocal microscopy, where axial resolution depends on the numerical aperture.

## Fourier-Domain Detection

Modern OCT systems use Fourier-domain detection — either spectral-domain (spectrometer-based) or swept-source (tunable laser). The key advantage is the **sensitivity gain**: Fourier-domain OCT achieves 20–30 dB higher sensitivity than time-domain OCT because all depth points are measured simultaneously. This connects to the [[Fellgett Advantage in Spectroscopy]] principle from Fourier transform spectroscopy.

## Spectroscopic Extensions

By analyzing the wavelength-dependent signal, we can extract tissue optical properties — see [[Inverse Problems in Optical Imaging]] for the mathematical framework. This is the basis of spectroscopic OCT (S-OCT), which adds quantitative biochemical contrast to the structural images.

## Polarization-Sensitive OCT

Adding polarization diversity detection enables measurement of tissue birefringence, which is related to collagen fiber organization. The Jones matrix formalism provides the mathematical framework — see [[Jones Calculus for Fiber Optics]] for details.

The combination of spectroscopic and polarization-sensitive measurements provides three independent contrast mechanisms (scattering, absorption, birefringence) from a single imaging modality.
