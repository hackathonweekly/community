---
name: html2png
description: Convert an HTML file to a PNG screenshot. Use when user wants to generate a PNG image from an HTML file, take a screenshot of HTML, or convert HTML to image.
argument-hint: <html-file-path> [output-png-path]
allowed-tools: Bash, Read, Write
---

# HTML to PNG Converter

Convert an HTML file to a high-quality PNG image using Puppeteer (headless Chrome).

## When to Use This Skill

- User wants to convert an HTML file to a PNG image
- User wants to screenshot/capture an HTML page
- User mentions "html to png", "html to image", "screenshot html"

## Instructions

### Step 1: Parse arguments

- `$ARGUMENTS` contains the arguments passed by the user
- First argument: path to the HTML file (required)
- Second argument: path to the output PNG file (optional, defaults to same name with `.png` extension)
- If no arguments provided, ask the user for the HTML file path

### Step 2: Run the conversion script

Run the conversion using the project's `scripts/html2png.mjs` script:

```bash
node scripts/html2png.mjs <html-file> [output-png] [--width=1300] [--scale=2]
```

Options:
- `--width=N`: viewport width in pixels (default: 1300)
- `--scale=N`: device scale factor for retina output (default: 2)

### Step 3: Report result

- Confirm the PNG was created and report the file path and size
- If the user wants to preview, read the PNG file to display it
