# Geospatial Image Segmentation and Temporal Change Analysis

Dual-input semantic segmentation of paired geospatial images with a U-Net, plus a complete set of training scripts, from a 20-image prototype to config-driven production runs on the full dataset. The work is published in IEEE Xplore.

## Dataset

| | |
|---|---|
| Training pairs | 2,968 |
| Test pairs | 1,694 |
| Image size | 512 × 512 RGB |
| Classes | 3 (pixel values 0, 128, 255 → 0, 1, 2) |
| Task | Dual-output semantic segmentation |

Each sample is a pair of input images (`im1`, `im2`) with a segmentation mask for each (`label1`, `label2`).

## Model

An enhanced dual-input U-Net:

- **Input:** 6 channels (two 3-channel RGB images stacked)
- **Output:** two 3-class segmentation masks
- **Encoder:** 64 → 128 → 256 → 512, with a 1024-channel bottleneck
- Skip connections, batch normalisation, ReLU and dropout
- Attention mechanisms in the full-dataset model
- About **31M parameters** (~120 MB of weights)

## Training pipeline

| Script | Images | GPU-optimised | Augmentation | Early stopping | Config-driven | Time |
|---|---|---|---|---|---|---|
| `train_model.py` | 20 | Basic | – | – | – | 5–10 min |
| `train_model_gpu_optimized.py` | 20 | ✓ | – | – | – | 2–5 min |
| `train_full_dataset.py` | 4,662 | ✓ | ✓ | ✓ | – | 2–8 h |
| `train_with_config.py` | Any | ✓ | ✓ | ✓ | ✓ | Configurable |

`resume_training.py` picks training back up from any saved checkpoint.

### Techniques

- **Focal loss** to handle class imbalance
- **Mixed precision** training with gradient scaling
- **CosineAnnealingWarmRestarts** learning-rate schedule with the AdamW optimiser
- **Early stopping** (patience of 10 epochs) and checkpoints every 10 epochs
- **Augmentation:** horizontal and vertical flips, ±15° rotation, colour jitter, applied identically to images and masks
- Automatic batch size (2–16, from GPU memory), memory pinning and non-blocking transfers: **2–4× faster** on GPU

### Config-driven experiments

Every parameter lives in a YAML file, so experiments are named, versioned and reproducible:

```yaml
training:
  num_epochs: 50
  batch_size: "auto"
  learning_rate: 0.001
  optimizer: "AdamW"
  scheduler: "CosineAnnealingWarmRestarts"
model:
  features: [64, 128, 256, 512]
  dropout_rate: 0.1
```

```bash
python3 train_with_config.py --config config_quick_test.yaml
```

## Results

- **IoU:** 0.7–0.9, tracked per class and as a mean
- **F1 score:** 0.8–0.95
- Full-dataset training takes 2–8 hours on a GPU using 2–8 GB of memory
- JSON training logs, loss and metric curves, and sample predictions for visual checks
