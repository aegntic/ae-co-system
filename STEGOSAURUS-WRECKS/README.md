# STEGOSAURUS WRECKS 🦕🔮

A tool for embedding hidden messages or files within images using LSB (Least Significant Bit) steganography. This application provides a user-friendly web interface built with Streamlit.

## Features

* Embed text messages into images.
* Embed arbitrary files (zlib-compressed) into images.
* Choose specific color planes (R, G, B, A, or RGB) for embedding data.
* User-friendly web interface via Streamlit.
* Option to use a default "jailbreak" prompt text.
* Configurable output filename (defaults to a prompt injection suggestion).
* Image compression to attempt to keep output under 900 KB.
* Download link for the final encoded image.

## Requirements

* Python 3.x
* Required Python libraries:
    * `streamlit`
    * `Pillow` (PIL fork)

## Installation

1.  **Clone the repository (or your fork):**
    ```bash
    git clone <your-repository-url>
    cd STEGOSAURUS-WRECKS
    ```
2.  **Install dependencies:**
    It's recommended to use a virtual environment.
    ```bash
    python -m venv venv
    source venv/bin/activate # On Windows use `venv\Scripts\activate`
    pip install streamlit Pillow
    ```
    (Alternatively, if you create a `requirements.txt` file containing `streamlit` and `Pillow`, you can just run `pip install -r requirements.txt`)

## How to Run

1.  Make sure you are in the repository's root directory and have activated your virtual environment (if using one).
2.  Run the Streamlit application using the following command:
    ```bash
    streamlit run app.py
    ```
3.  Streamlit will start a local web server and should automatically open the application in your default web browser. If not, it will display the local URL (usually `http://localhost:8501`) which you can navigate to manually.

## How to Use

1.  **Upload Image:** Click "Choose an image..." to upload your base image (PNG, JPG, JPEG). If no image is uploaded, a default image will be used.
2.  **Select Embedding Type:** Choose whether you want to embed "Text" or a "Zlib Compressed File".
3.  **Provide Data:**
    * **If Text:** Enter the text you want to hide. You can also check "Enable Jailbreak Text" to use or modify a pre-defined prompt.
    * **If Zlib Compressed File:** Click "Upload a file to embed..." to select the file you want to hide. The file will be compressed using zlib before embedding.
4.  **Select Color Plane:** Choose the color plane(s) (RGB, R, G, B, or A) where the data's bits will be hidden. Using more planes increases capacity but might affect the image more noticeably.
5.  **Output File Path:** Optionally, change the suggested output filename.
6.  **Encode:** Click the "Encode" button.
7.  **Download:** Once processing is complete, the resulting image will be displayed, and a download link will appear below it. Click the link to save the image containing the hidden data.

## How it Works

This tool uses Least Significant Bit (LSB) steganography. It modifies the least significant bit(s) of the chosen color channels (Red, Green, Blue, Alpha) in each pixel of the image to store the bits of your secret message or file. This generally causes minimal visual changes to the image. Text is embedded directly, while files are first compressed using zlib to save space.
