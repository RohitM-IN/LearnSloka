# Frequently Asked Questions (FAQ)

## 📋 General Questions

### Q: What is श्लोकपाठम् (Learn Stotra)?
**A:** It's a web application designed to help users learn Sanskrit stotras and mantras through synchronized audio and text. The app provides word-by-word synchronization, allowing learners to follow along with authentic pronunciations.

### Q: Do I need an internet connection to use the app?
**A:** Once the app is loaded and the audio files are cached, it can work offline. However, the initial load requires an internet connection to download the audio and subtitle files.

### Q: Can I use this on my mobile device?
**A:** Yes! The app is fully responsive and works on mobile browsers. There's also a native Android app built with Capacitor for a better mobile experience.

---

## 🎵 Audio & Synchronization

### Q: What audio technology does the app use?
**A:** The app uses the native HTML5 Audio API with custom React hooks for audio control. This provides:
- Better browser compatibility
- Reduced bundle size
- Native audio performance
- Direct control over audio elements

The custom `useAudioControl` hook handles:
- Play/pause functionality
- Seeking to specific timestamps  
- Playback speed control
- Volume management
- Audio event handling

### Q: Why doesn't the app use React Howler or other audio libraries?
**A:** We switched to native HTML5 Audio because:
- **Better Performance**: Native audio processing without additional abstraction layers
- **Smaller Bundle**: Reduces JavaScript bundle size significantly
- **Browser Compatibility**: Works consistently across all modern browsers
- **Direct Control**: Full access to audio element properties and events
- **Maintenance**: Fewer dependencies to maintain and update

### Q: What audio format is supported?
**A:** The app supports MP3 format. For optimal performance and compatibility, audio files should be encoded with specific parameters (see technical requirements below).

### Q: Why isn't the audio syncing properly with the text?
**A:** Audio sync issues can occur due to:
- Incorrect audio encoding parameters
- Misaligned SRT timestamps
- Browser audio processing delays

**Solution:** Ensure your audio is properly encoded and SRT timestamps are accurate.

### Q: How do I create SRT files for new stotras?
**A:** 
1. Use **Subtitle Edit** (free, open-source tool) to create and edit SRT files
2. Import your audio file into Subtitle Edit
3. Add text segments with precise timestamps
4. Export as SRT format
5. Test the synchronization in the app

---

## 🛠 Technical Requirements

### Q: What are the recommended audio encoding settings?
**A:** Use FFmpeg with these parameters for optimal compatibility:

```bash
ffmpeg -i input.mp3 -ar 48000 -ac 1 -b:a 64k output.mp3
```

**Explanation:**
- `-ar 48000`: Sample rate of 48kHz (standard for web audio)
- `-ac 1`: Mono audio (reduces file size, sufficient for voice)
- `-b:a 64k`: Bitrate of 64kbps (good quality-to-size ratio for voice)

### Q: Why these specific encoding parameters?
**A:**
- **48kHz sample rate**: Ensures compatibility across all browsers and devices
- **Mono audio**: Sanskrit recitations don't require stereo, saves bandwidth
- **64kbps bitrate**: Provides clear audio quality while keeping file sizes manageable for mobile users

### Q: The app crashes or has audio issues on some devices
**A:** This can happen due to browser audio API limitations:
- **Mobile browsers**: May have restrictions on autoplay and audio context
- **iOS Safari**: Requires user interaction before playing audio
- **Old Android browsers**: May have limited HTML5 audio support
- **Memory constraints**: Long audio files may cause issues on low-end devices

**Solutions:**
1. Always interact with the app before expecting audio to play
2. Clear browser cache and reload
3. Try a different browser (Chrome usually has the best audio support)
4. Ensure audio files are properly encoded with the recommended settings

### Q: What's the difference between your audio implementation and other music apps?
**A:** Our implementation is specifically optimized for learning:
- **Segment-based playback**: Jump to any verse instantly
- **Precise synchronization**: Sub-second accuracy with text highlighting  
- **Educational controls**: Repeat modes, speed adjustment for learning
- **Progress persistence**: Remember where you stopped for continued learning
- **Lightweight**: No heavy audio library dependencies

### Q: My audio file is too large. How can I reduce the size?
**A:** Use the FFmpeg command above, or try even lower bitrates:

```bash
# For very long stotras, use 48kbps
ffmpeg -i input.mp3 -ar 48000 -ac 1 -b:a 48k output.mp3

# For shorter stotras with high quality needs, use 96kbps
ffmpeg -i input.mp3 -ar 48000 -ac 1 -b:a 96k output.mp3
```

---

## 🔧 Development & Tools

### Q: What tools do I need to add new stotras?
**A:** Essential tools:
1. **Subtitle Edit** - For creating and editing SRT files
2. **FFmpeg** - For audio encoding and conversion
3. **Audacity** (optional) - For audio editing and cleanup
4. **Text editor** - For editing the songs.json file

### Q: How do I add a new stotra to the application?
**A:** Follow these steps:

1. **Prepare the audio:**
   ```bash
   ffmpeg -i your-stotra.mp3 -ar 48000 -ac 1 -b:a 64k processed-stotra.mp3
   ```

2. **Create SRT file using Subtitle Edit:**
   - Import the processed audio
   - Add Sanskrit text with precise timestamps
   - Save as .srt file

3. **Add files to project:**
   - Place audio file in `public/stotra-name/`
   - Place SRT file in same directory

4. **Update songs.json:**
   ```json
   {
     "id": 4,
     "title": "Your Stotra Title",
     "slug": "your-stotra-slug",
     "artist": "Artist Name",
     "tags": ["hindu", "mantra", "relevant-tag"],
     "audioSrc": "/stotra-name/audio.mp3",
     "srtUrl": "/stotra-name/subtitles.srt"
   }
   ```

### Q: Where can I download Subtitle Edit?
**A:** Download from the official website: [nikse.dk/SubtitleEdit](https://nikse.dk/SubtitleEdit)
- It's free and open-source
- Available for Windows, Linux, and macOS
- Supports waveform visualization for precise timing

### Q: Where can I get FFmpeg?
**A:** Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- Free and open-source
- Available for all operating systems
- Essential for audio/video processing

---

## 🐛 Troubleshooting

### Q: The app won't load or crashes on mobile
**A:** Try these solutions:
1. Clear browser cache and cookies
2. Ensure stable internet connection for initial load
3. Close other apps to free up memory
4. Try a different browser (Chrome, Firefox, Safari)

### Q: Audio stutters or has poor quality
**A:** 
1. Check your internet connection
2. Ensure audio files are properly encoded (see technical requirements)
3. Try lowering playback speed temporarily
4. Clear browser cache

### Q: Text doesn't scroll automatically to current verse
**A:**
1. Check if auto-scroll is enabled in settings
2. Try refreshing the page
3. Ensure JavaScript is enabled in your browser

### Q: Can't resume from where I left off
**A:**
1. Ensure browser allows local storage
2. Don't use private/incognito mode
3. Try the "Continue" option when prompted

### Q: SRT subtitles are out of sync
**A:**
1. Re-check timestamps in Subtitle Edit
2. Verify audio encoding is correct
3. Test with a small section first
4. Consider browser processing delays (add small offset if needed)

---

## 📱 Mobile App Issues

### Q: How do I install the Android app?
**A:** 
1. Download the APK from the releases page
2. Enable "Install from unknown sources" in Android settings
3. Install the APK file
4. Launch the app

### Q: The back button doesn't work properly in Android app
**A:** This is handled by Capacitor. If issues persist:
1. Try restarting the app
2. Check for app updates
3. Report the issue with device details

---

## 🔍 Content Questions

### Q: Can I request new stotras to be added?
**A:** Yes! Please create an issue on GitHub with:
- Stotra name and significance
- Audio source (if you have one)
- Text in Devanagari script
- Any specific requirements

### Q: Are there plans to add other languages?
**A:** Currently focused on Sanskrit stotras. Other languages may be considered based on community interest and availability of authentic audio sources.

### Q: How do I report incorrect text or pronunciation?
**A:** Please create an issue on GitHub with:
- Stotra name
- Specific verse or timestamp
- Correct text/pronunciation
- Source reference if available

---

## 💡 Tips for Best Experience

### Q: How can I learn more effectively using this app?
**A:**
1. Start with slower playback speeds (0.5x or 0.75x)
2. Use repeat mode for difficult verses
3. Practice individual segments before full playback
4. Adjust font size for comfortable reading
5. Use headphones for better audio clarity

### Q: What's the best way to memorize stotras?
**A:**
1. Listen multiple times without following text
2. Follow along with text while listening
3. Practice individual verses with repeat mode
4. Gradually increase playback speed
5. Test yourself by pausing and reciting

---

## 📞 Support

### Q: Where can I get help or report bugs?
**A:** 
- **GitHub Issues**: [github.com/RohitM-IN/LearnSloka/issues](https://github.com/RohitM-IN/LearnSloka/issues)
- **Email**: Contact the developer through GitHub profile
- **Documentation**: Check this FAQ and README files

### Q: How can I contribute to the project?
**A:**
1. Fork the repository on GitHub
2. Create a feature branch
3. Make your changes
4. Submit a pull request
5. Follow the contribution guidelines in CONTRIBUTING.md

---

*Last updated: August 30, 2025*

---

**Note:** This FAQ is regularly updated. If you don't find your question here, please check the GitHub issues or create a new issue for assistance.