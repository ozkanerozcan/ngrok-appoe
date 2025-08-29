# AppOE - Modern React Native Expo Application

A modern, cross-platform React Native Expo application with Supabase integration, dark mode support, and PWA capabilities.

## 🚀 Features

### Core Features

- **React Native Expo 53.0.22** - Latest stable version
- **JavaScript** - No TypeScript for simplicity
- **Supabase Integration** - Database and authentication
- **PWA Support** - Progressive Web App capabilities
- **Cross-Platform** - Works on mobile and web
- **File-based Routing** - Using Expo Router

### UI/UX Features

- **Modern Design** - Clean, user-friendly interface
- **Dark Mode Support** - Automatic theme switching
- **Cross-platform Notifications** - Toast messages instead of mobile-only alerts
- **Responsive Design** - Optimized for all screen sizes
- **Modal Navigation** - Effective modal usage for better UX

### Technical Features

- **Authentication System** - Sign up/Sign in with Supabase
- **Environment Variables** - Secure configuration
- **Error Handling** - Comprehensive error management
- **State Management** - React Context API
- **Theme System** - Dynamic light/dark mode switching

## 📱 Screenshots

The application features a modern authentication screen with:

- Clean sign-in/sign-up forms
- Smooth transitions between modes
- Professional styling with rounded corners
- Proper form validation and error handling

## 🛠 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd appoe
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**

   ```bash
   # For web
   npm run web

   # For mobile (iOS)
   npm run ios

   # For mobile (Android)
   npm run android
   ```

## 📁 Project Structure

```
appoe/
├── app/                    # File-based routing
│   ├── (tabs)/            # Tab navigation
│   │   ├── _layout.js     # Tab layout
│   │   ├── index.js       # Home screen
│   │   ├── profile.js     # Profile screen
│   │   └── settings.js    # Settings screen
│   ├── _layout.js         # Root layout
│   ├── index.js           # Entry point
│   ├── auth.js            # Authentication screen
│   └── modal.js           # Modal example
├── src/
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.js # Authentication context
│   │   └── ThemeContext.js# Theme context
│   ├── lib/
│   │   └── supabase.js    # Supabase configuration
│   └── utils/
│       └── toast.js       # Toast notifications
├── public/
│   └── manifest.json      # PWA manifest
├── .env                   # Environment variables
├── app.json              # Expo configuration
├── metro.config.js       # Metro bundler config
└── package.json          # Dependencies
```

## 🎨 Theming

The application supports both light and dark themes:

- **Light Theme**: Clean white background with blue accents
- **Dark Theme**: Dark background with bright accents
- **Automatic Detection**: Respects system preferences
- **Manual Toggle**: Users can switch themes in settings

## 🔐 Authentication

Powered by Supabase Auth:

- **Sign Up**: Create new accounts with email/password
- **Sign In**: Authenticate existing users
- **Session Management**: Automatic session handling
- **Error Handling**: User-friendly error messages

## 🌐 PWA Support

The application is configured as a Progressive Web App:

- **Manifest**: Proper PWA manifest configuration
- **Offline Support**: Basic offline functionality
- **Install Prompt**: Can be installed on devices
- **Responsive**: Works on all screen sizes

## 📱 Cross-Platform Compatibility

- **Web**: Runs in modern browsers
- **iOS**: Native iOS app via Expo
- **Android**: Native Android app via Expo
- **Consistent UX**: Same experience across platforms

## 🔧 Development

### Available Scripts

- `npm run start` - Start Expo development server
- `npm run web` - Start web development server
- `npm run ios` - Start iOS simulator
- `npm run android` - Start Android emulator

### Key Dependencies

- **expo**: ~53.0.22
- **expo-router**: File-based routing
- **@supabase/supabase-js**: Supabase client
- **react-native-toast-message**: Cross-platform notifications
- **@react-native-async-storage/async-storage**: Local storage
- **react-native-safe-area-context**: Safe area handling

## 🚀 Deployment

### Web Deployment

```bash
npm run build:web
```

### Mobile Deployment

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
```

## 📝 Environment Variables

Required environment variables:

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Expo Team** - For the amazing development platform
- **Supabase Team** - For the backend-as-a-service platform
- **React Native Community** - For the ecosystem and tools

---

Built with ❤️ using React Native Expo and Supabase
