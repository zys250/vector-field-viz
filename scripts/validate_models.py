"""Optional numeric checks for Vector Field Lab models.

Run with the local Python environment, for example:

    D:\\study\\code\\python_3.13_backup\\python.exe scripts\\validate_models.py

This script is intentionally independent from the React app. It helps compare
the browser math with NumPy/Matplotlib when tuning fluid or projection modules.
"""

from __future__ import annotations

import math
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


def water_velocity(x: np.ndarray, y: np.ndarray, speed=1.0, wave=0.8, swirl=1.2, core=1.1):
    wave_x = 1.15
    wave_y = 0.85
    core_sq = max(0.2, core) ** 2
    gaussian = np.exp(-(x * x + y * y) / (2 * core_sq))
    vx = speed + wave * wave_y * np.sin(wave_x * x) * np.cos(wave_y * y) - swirl * y * gaussian / core_sq
    vy = -wave * wave_x * np.cos(wave_x * x) * np.sin(wave_y * y) + swirl * x * gaussian / core_sq
    return vx, vy


def divergence(vx: np.ndarray, vy: np.ndarray, dx: float, dy: float):
    dvx_dx = np.gradient(vx, dx, axis=1)
    dvy_dy = np.gradient(vy, dy, axis=0)
    return dvx_dx + dvy_dy


def projection_gradient(x: np.ndarray, y: np.ndarray, z0=0.0, tilt_x=0.25, tilt_y=-0.15):
    z = z0 + tilt_x * x + tilt_y * y
    scalar = np.sin(x) + np.cos(y) + 0.35 * z * z
    gy, gx = np.gradient(scalar, y[:, 0], x[0, :])
    return scalar, gx, gy


def main():
    out_dir = Path("docs/generated")
    out_dir.mkdir(parents=True, exist_ok=True)

    xs = np.linspace(-5, 5, 80)
    ys = np.linspace(-4, 4, 70)
    x, y = np.meshgrid(xs, ys)
    dx = float(xs[1] - xs[0])
    dy = float(ys[1] - ys[0])

    vx, vy = water_velocity(x, y)
    div = divergence(vx, vy, dx, dy)
    max_water_div = float(np.max(np.abs(div)))

    scalar, gx, gy = projection_gradient(x, y)
    center = (len(ys) // 2, len(xs) // 2)
    center_gradient = (float(gx[center]), float(gy[center]))
    cx = float(x[center])
    cy = float(y[center])
    cz = 0.25 * cx - 0.15 * cy
    expected_gradient = (
        math.cos(cx) + 2 * 0.35 * cz * 0.25,
        -math.sin(cy) + 2 * 0.35 * cz * -0.15,
    )

    print("Water max |div u|:", f"{max_water_div:.6f}")
    print("Projection center gradient:", tuple(f"{value:.6f}" for value in center_gradient))
    print("Expected center gradient:", tuple(f"{value:.6f}" for value in expected_gradient))

    fig, axes = plt.subplots(1, 2, figsize=(10, 4), constrained_layout=True)
    axes[0].set_title("Water divergence check")
    im0 = axes[0].imshow(div, extent=[xs.min(), xs.max(), ys.min(), ys.max()], origin="lower", cmap="coolwarm")
    axes[0].streamplot(xs, ys, vx, vy, color="white", density=1.0, linewidth=0.7)
    fig.colorbar(im0, ax=axes[0], shrink=0.8)

    axes[1].set_title("3D scalar projected gradient")
    im1 = axes[1].imshow(scalar, extent=[xs.min(), xs.max(), ys.min(), ys.max()], origin="lower", cmap="viridis")
    skip = (slice(None, None, 6), slice(None, None, 6))
    axes[1].quiver(x[skip], y[skip], gx[skip], gy[skip], color="white", scale=45)
    fig.colorbar(im1, ax=axes[1], shrink=0.8)

    output = out_dir / "model-validation.png"
    fig.savefig(output, dpi=160)
    print("Saved:", output)

    if max_water_div > 0.08:
        raise SystemExit("Water divergence is higher than expected.")


if __name__ == "__main__":
    main()
