---
title: "Building a Jones Matrix Polarization Simulator"
date: 2026-01-20
category: build-log
description: "A walkthrough of designing a Jones matrix simulation framework for modeling polarization-sensitive OCT, from fiber components to round-trip catheter models."
tags:
  - polarization
  - simulation
  - matlab
  - python
  - optical coherence tomography
published: true
featured: false
---

## Motivation

Polarization-sensitive OCT (PS-OCT) can measure tissue birefringence — a property linked to collagen fiber organization in arteries, tendons, and the eye. But the polarization state evolves through every optical component in the system: fibers, couplers, circulators, and the catheter itself. To design a robust PS-OCT system, we need to simulate this evolution end-to-end.

The **Jones calculus** provides an elegant framework. Each optical element is represented by a 2×2 complex matrix, and the polarization state by a 2×1 Jones vector. Propagation through the system is simply matrix multiplication.

## Core Data Structures

First, let's define the fundamental types. In TypeScript (for our simulation config tool):

```typescript
/** 2x2 complex matrix representing an optical element */
interface JonesMatrix {
  m00: Complex;
  m01: Complex;
  m10: Complex;
  m11: Complex;
}

/** 2x1 complex vector representing a polarization state */
interface JonesVector {
  ex: Complex;
  ey: Complex;
}

interface Complex {
  re: number;
  im: number;
}

/** Multiply two Jones matrices */
function multiply(a: JonesMatrix, b: JonesMatrix): JonesMatrix {
  return {
    m00: cadd(cmul(a.m00, b.m00), cmul(a.m01, b.m10)),
    m01: cadd(cmul(a.m00, b.m01), cmul(a.m01, b.m11)),
    m10: cadd(cmul(a.m10, b.m00), cmul(a.m11, b.m10)),
    m11: cadd(cmul(a.m10, b.m01), cmul(a.m11, b.m11)),
  };
}
```

The actual numerical simulation runs in MATLAB for performance:

```matlab
function J = waveplate(delta, theta)
    % Quarter- or half-wave plate at angle theta
    % delta: phase retardation (pi/2 for QWP, pi for HWP)
    % theta: fast axis angle from horizontal
    
    c = cos(theta);
    s = sin(theta);
    R = [c s; -s c];  % Rotation matrix
    
    W = [exp(-1i*delta/2) 0; 0 exp(1i*delta/2)];
    
    J = R' * W * R;  % Rotated waveplate
end

function J = linear_polarizer(theta)
    % Linear polarizer with transmission axis at angle theta
    c = cos(theta);
    s = sin(theta);
    J = [c^2, c*s; c*s, s^2];
end

function J = fiber_section(length_m, birefringence, beat_length)
    % Single-mode fiber with linear birefringence
    % Models polarization mode dispersion (PMD)
    delta = 2 * pi * birefringence * length_m / beat_length;
    theta = rand() * pi;  % Random orientation (PMD model)
    J = waveplate(delta, theta);
end
```

## System Assembly

The full SS-OCT system model chains components in order. In Python, we build a clean pipeline:

```python
import numpy as np
from dataclasses import dataclass
from typing import List

@dataclass
class OpticalComponent:
    """Base class for Jones matrix optical components."""
    name: str
    jones_matrix: np.ndarray  # shape (2, 2), complex128
    
    def __post_init__(self):
        assert self.jones_matrix.shape == (2, 2), "Jones matrix must be 2x2"

def cascade(components: List[OpticalComponent]) -> np.ndarray:
    """Compute the total Jones matrix for a sequence of components.
    
    Components are ordered source-to-detector: the first element
    in the list is closest to the source.
    """
    result = np.eye(2, dtype=complex)
    for component in components:
        result = component.jones_matrix @ result
    return result

def build_ssoct_system(wavelength_nm: float) -> np.ndarray:
    """Build complete SS-OCT Jones matrix for given wavelength."""
    components = [
        OpticalComponent("source_fiber", fiber_jones(2.0, wavelength_nm)),
        OpticalComponent("coupler_50_50", coupler_jones(0.5)),
        OpticalComponent("circulator", circulator_jones()),
        OpticalComponent("catheter_fiber", fiber_jones(1.5, wavelength_nm)),
        OpticalComponent("sample", sample_jones(wavelength_nm)),
        OpticalComponent("catheter_return", fiber_jones(1.5, wavelength_nm)),
        OpticalComponent("circulator_return", circulator_jones()),
        OpticalComponent("detector_fiber", fiber_jones(0.5, wavelength_nm)),
    ]
    return cascade(components)
```

## Configuration Format

System configurations are stored in YAML for readability:

```yaml
system:
  name: "SS-OCT Benchtop Prototype"
  wavelength_center_nm: 1310
  wavelength_bandwidth_nm: 100
  
components:
  - type: fiber
    length_m: 2.0
    birefringence: 1.0e-4
    beat_length_m: 0.013
    
  - type: coupler
    splitting_ratio: 0.5
    excess_loss_dB: 0.3
    
  - type: circulator
    isolation_dB: 40
    insertion_loss_dB: 0.7
    
  - type: catheter
    length_m: 1.5
    rotation_speed_rpm: 6000
    sheath_birefringence: 2.5e-4
```

## Validation

We validate the simulation against known analytical results. For a quarter-wave plate at 45°, horizontally polarized input should become right-circularly polarized:

```python
def test_qwp_45():
    """Quarter-wave plate at 45° converts H-pol to RCP."""
    qwp = waveplate(np.pi / 2, np.pi / 4)
    h_pol = np.array([1, 0], dtype=complex)
    
    output = qwp @ h_pol
    expected = np.array([1, -1j]) / np.sqrt(2)
    
    np.testing.assert_allclose(output, expected, atol=1e-10)
```

The simulation framework is now complete and ready for integration with our spectroscopic inverse algorithm. The full codebase will be released alongside the forthcoming publication.
