# श्लोकपाठम् (Learn Stotra)

A modern web application for learning Sanskrit stotras and mantras with synchronized audio and text. Practice sacred verses with proper pronunciation and timing through an interactive learning experience.

## 🌟 Features

### 📖 Interactive Learning
- **Synchronized Audio-Text**: Follow along with highlighted Sanskrit text while listening to authentic pronunciations
- **SRT Subtitle Support**: Precise word-by-word synchronization using subtitle files
- **Progress Tracking**: Resume from where you left off with automatic position saving

### 🎵 Audio Controls
- **Playback Speed Control**: Adjust speed from 0.5x to 2x for comfortable learning
- **Segment Repeat**: Practice specific verses multiple times
- **Individual Segment Control**: Click on any verse to jump directly to that section

### 🎯 Learning Features
- **Customizable Font Size**: Adjust text size for comfortable reading
- **Auto-scroll**: Automatically scroll to current verse during playback
- **Repeat Modes**: Set global repeat counts or infinite repeat for challenging sections
- **Mobile & Desktop Support**: Responsive design for learning on any device

### 📱 Cross-Platform
- **Progressive Web App (PWA)**: Install on mobile devices like a native app
- **Android App**: Built with Capacitor for native Android experience
- **Offline Support**: Works offline once loaded

## 📚 Available Stotras

Currently includes authentic recordings by आचार्य श्रेयस कुह्रेकर:

1. **रुद्रपाठ (Rudra Path)** - Sacred hymns to Lord Shiva
2. **पुरुष सूक्त (Purusha Sukta)** - Cosmic hymn from Rigveda
3. **श्रीसूक्तम् (Sri Suktam)** - Hymns to Goddess Lakshmi

## 🛠 Technology Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom Sanskrit-friendly design
- **Audio**: React Howler for advanced audio control
- **Mobile**: Capacitor for native mobile apps
- **Icons**: React Icons & Ant Design Icons

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/RohitM-IN/LearnSloka.git
cd learnstotra

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Android Development

```bash
# Build and sync with Android
pnpm build
npx cap sync android

# Open in Android Studio
npx cap open android
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Player.tsx      # Main audio player component
│   ├── MainControls.tsx # Desktop controls
│   ├── MobileControls.tsx # Mobile-specific controls
│   └── SegmentList.tsx # Scrollable verse list
├── hooks/              # Custom React hooks
│   ├── useAudioControl.ts
│   ├── useSRTLoader.ts
│   └── usePositionPersistence.ts
├── utils/              # Utility functions
│   └── parser.ts       # SRT file parser
└── @types/             # TypeScript definitions
```

## 🎨 Features in Detail

### Audio Synchronization
The app uses SRT (SubRip) files to synchronize audio with text, providing:
- Precise timing for each Sanskrit verse
- Smooth visual feedback with progress indicators
- Automatic scrolling to current verse

### Learning Modes
- **Linear Learning**: Play from beginning to end
- **Segment Practice**: Focus on specific difficult verses
- **Repeat Learning**: Customize repetition for memorization

### Accessibility
- High contrast design for better readability
- Customizable font sizes
- Keyboard navigation support
- Screen reader friendly

## ❓ FAQ & Troubleshooting

Have questions or facing issues? Check out our comprehensive [FAQ document](FAQ.md) which covers:

- **Audio synchronization issues** and solutions
- **Tools and software** used (Subtitle Edit, FFmpeg)
- **Technical requirements** for audio encoding
- **Step-by-step guides** for adding new stotras
- **Mobile app troubleshooting**
- **Learning tips** for effective practice
- **Development setup** and contribution guidelines

For quick technical reference:
- **Audio encoding**: Use `ffmpeg -i input.mp3 -ar 48000 -ac 1 -b:a 64k output.mp3`
- **SRT creation**: Use Subtitle Edit for precise synchronization
- **Support**: Create an issue on GitHub for help

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

Before contributing, check the [FAQ](FAQ.md) for development setup and technical requirements.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- आचार्य श्रेयस कुह्रेकर for providing authentic Sanskrit pronunciations
- The Sanskrit community for preserving these sacred texts
- All contributors and users of this application

---

Created with ❤️ by **Rohit Sopan Mahajan**

*"यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः।
तत्र श्रीर्विजयो भूतिर्ध्रुवा नीतिर्मतिर्मम॥"* 
