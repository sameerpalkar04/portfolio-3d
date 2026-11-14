# ScriptSync

A local pipeline that translates a video end to end. It handles both:

- **On-screen text in video frames**, using OCR and then redrawing the translated text in place
- **Spoken audio**, using speech recognition, translation and text-to-speech dubbing

## What the pipeline does

1. Translates on-screen text with the multithreaded video pipeline.
2. Extracts the source audio from the input video.
3. Transcribes speech with `faster-whisper`.
4. Translates the transcript with NLLB (`facebook/nllb-200-distilled-600M`).
5. Synthesises dubbed speech with MMS-TTS (`facebook/mms-tts-*`).
6. Muxes the translated video and dubbed audio into the final MP4.

## Project layout

| File | Role |
|---|---|
| `av_translate.py` | Entry point for the end-to-end audio–video pipeline |
| `cli.py` | Command-line wiring |
| `runner.py` | Orchestrates the audio–video flow |
| `presets.py` | Preset configuration |
| `audio/` | Audio modules: ASR, TTS, media, translation, types |
| `video/` | Video modules: OCR, frame rendering, video pipeline |

## Running it

```bash
python av_translate.py \
  --input input.mp4 \
  --output translated_output.mp4 \
  --source-lang fr \
  --target-lang hi \
  --device auto \
  --preset balanced
```

## Presets

| Preset | Trade-off |
|---|---|
| `turbo` | Favours speed |
| `balanced` | The default trade-off |
| `quality` | Denser frame processing and more conservative settings |

Any preset parameter can be overridden by hand:

```bash
python av_translate.py \
  --input input.mp4 \
  --output translated_custom.mp4 \
  --source-lang fr \
  --target-lang hi \
  --preset turbo \
  --asr-model large-v3 \
  --difference-threshold 0.06
```

## Key options

| Option | What it sets |
|---|---|
| `--input` | Input video path |
| `--output` | Final translated output path |
| `--source-lang` | Source language (ISO-639-1 code) |
| `--target-lang` | Target language (ISO-639-1 code) |
| `--preset` | `turbo`, `balanced` or `quality` |
| `--device` | `auto`, `cuda` or `cpu` |

Advanced frame-processing controls: `--difference-threshold`, `--max-consecutive-skips`, `--max-workers`, `--gpu-concurrency-limit`, `--queue-size` and `--frame-timeout`.

## Speed and quality

- Use a GPU for the best speed with `--device cuda`, or `--device auto` when CUDA is available.
- Frame differencing skips frames whose text hasn't changed, so only new text goes through OCR.

## Requirements

- `ffmpeg` and `ffprobe` installed and on `PATH`
- Python dependencies from `requirements.txt` (`pip install -r requirements.txt`)
- Internet access on the first run, to download the model weights
