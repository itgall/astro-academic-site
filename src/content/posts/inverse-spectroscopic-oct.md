---
title: "Inverse Methods for Spectroscopic OCT: A Practical Guide"
date: 2026-02-15
category: technical
description: "An overview of inverse algorithm design for extracting tissue optical properties from spectroscopic OCT data, with emphasis on regularization strategies."
tags:
  - optical coherence tomography
  - inverse problems
  - spectroscopy
  - biophotonics
published: true
featured: true
---

## The Forward Problem

Spectroscopic optical coherence tomography (S-OCT) measures the wavelength-dependent backscatter from tissue[^1]. The forward model relates the measured spectral interference signal $S(\lambda)$ to the tissue's optical properties — specifically the scattering coefficient $\mu_s(\lambda)$ and the absorption coefficient $\mu_a(\lambda)$. This work builds on our [Spectroscopic IV-OCT project](/projects/spectroscopic-ivoct/).

[^1]: S-OCT is distinct from conventional OCT in that it resolves wavelength-dependent tissue properties rather than producing purely structural images. The spectroscopic analysis is performed in the short-time Fourier transform domain, trading axial resolution for spectral resolution.

In its simplest form, the detected signal from a single scatterer at depth $z$ can be written as:

$$
S(\lambda, z) = S_0(\lambda) \cdot r(z) \cdot \exp\left(-2 \int_0^z \mu_t(\lambda, z') \, dz'\right)
$$

where $S_0(\lambda)$ is the source spectrum, $r(z)$ is the local reflectivity, and $\mu_t = \mu_s + \mu_a$ is the total attenuation coefficient. The factor of 2 accounts for the double-pass geometry inherent to OCT.

## The Inverse Problem

Extracting $\mu_s(\lambda)$ and $\mu_a(\lambda)$ from the measured signal is an **ill-posed inverse problem**. The key challenges include:

1. **Depth-dependent attenuation** — the signal at depth $z$ is coupled to all tissue above it
2. **Spectral mixing** — scattering and absorption both contribute to $\mu_t$
3. **Noise amplification** — direct inversion amplifies measurement noise exponentially with depth

### Tikhonov Regularization

The standard approach is to minimize a regularized objective:

$$
\hat{\mu} = \arg\min_{\mu} \left\{ \|A\mu - b\|_2^2 + \alpha \|L\mu\|_2^2 \right\}
$$

where $A$ is the forward operator, $b$ is the measured data, $L$ is a regularization matrix (often the identity or a finite-difference operator), and $\alpha > 0$ is the regularization parameter.

The choice of $\alpha$ is critical[^2]. Too large, and the solution is over-smoothed; too small, and noise dominates. We use the **L-curve method** to select $\alpha$ automatically by finding the corner of the trade-off curve between $\|A\mu - b\|_2$ and $\|L\mu\|_2$.

[^2]: The regularization parameter can also be selected via generalized cross-validation (GCV) or the discrepancy principle. In practice, L-curve tends to perform best for our problem because the forward operator is moderately ill-conditioned with condition numbers typically in the range $10^3$–$10^5$.

## Implementation Notes

The core solver is implemented in MATLAB using a custom iterative scheme. Here's a simplified version of the depth-resolved spectral fitting:

```matlab
function [mu_s, mu_a] = spectral_fit(signal, wavelengths, depth_axis, alpha)
    % Construct forward operator A for each depth
    N_z = length(depth_axis);
    N_lambda = length(wavelengths);
    
    for iz = 1:N_z
        A = build_forward_operator(wavelengths, depth_axis(1:iz));
        b = log(signal(:, iz) ./ signal(:, 1));
        
        % Tikhonov solve with L-curve selection
        [mu_t(:, iz), ~] = tikhonov_solve(A, b, alpha);
    end
    
    % Separate scattering and absorption via spectral model
    [mu_s, mu_a] = decompose_attenuation(mu_t, wavelengths);
end
```

For Python users, the equivalent can be written with NumPy and SciPy:

```python
import numpy as np
from scipy.optimize import minimize

def spectral_fit(signal: np.ndarray, wavelengths: np.ndarray, alpha: float):
    """Depth-resolved spectral fitting with Tikhonov regularization."""
    n_wavelengths, n_depths = signal.shape
    mu_t = np.zeros_like(signal)
    
    for iz in range(1, n_depths):
        A = build_forward_operator(wavelengths, iz)
        b = np.log(signal[:, iz] / signal[:, 0])
        
        # Closed-form Tikhonov solution
        mu_t[:, iz] = np.linalg.solve(
            A.T @ A + alpha * np.eye(A.shape[1]),
            A.T @ b
        )
    
    return mu_t
```

## Results and Future Directions

Our inverse algorithm achieves spectral reconstruction with relative error below 5% for tissue phantoms with known optical properties. The key insight is that **joint regularization across wavelengths** outperforms independent per-wavelength fitting — the spectral smoothness of biological chromophores provides a powerful physical prior.

Next steps include extending the framework to handle multiple scattering via a diffusion approximation correction term, and integrating physics-informed neural networks for learned regularization. The energy functional becomes:

$$
\mathcal{L}(\theta) = \frac{1}{N} \sum_{i=1}^{N} \left\| \mathcal{F}_\theta(\mathbf{x}_i) - \mathbf{y}_i \right\|^2 + \lambda \left\| \nabla \cdot (\kappa \nabla u) + \mu_a u - q \right\|^2
$$

where the second term enforces the diffusion equation as a physics constraint.
