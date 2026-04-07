---
title: "Fellgett Advantage in Spectroscopy"
date: 2026-01-05
maturity: seedling
description: "The multiplex advantage in Fourier transform spectroscopy and its implications for OCT sensitivity."
tags:
  - spectroscopy
  - signal processing
  - fourier analysis
published: true
---

The Fellgett advantage (also called the multiplex advantage) states that a Fourier transform spectrometer achieves a signal-to-noise ratio improvement of $\sqrt{N}$ over a scanning monochromator, where $N$ is the number of spectral elements.

This arises because the Fourier transform spectrometer measures all wavelengths simultaneously — each detector sample contains information about every spectral channel. In contrast, a scanning instrument measures one channel at a time, wasting photons at all other wavelengths.

## Connection to OCT

The same principle explains the sensitivity advantage of Fourier-domain OCT over time-domain OCT. In FD-OCT, the spectral interferogram encodes all depth points simultaneously, while TD-OCT scans one depth at a time. The result is a 20–30 dB sensitivity improvement — see [[Optical Coherence Tomography Fundamentals]] for the full context.

## Limitations

The Fellgett advantage assumes detector-noise-limited operation. When the dominant noise source is photon shot noise (which scales with total detected power), the multiplex advantage is reduced or eliminated. This is relevant for high-power swept-source OCT systems.

Still developing my understanding of how this interacts with relative intensity noise (RIN) in swept-source lasers — this may be a case where the Fellgett advantage is partially negated by the excess noise of the broadband source.
