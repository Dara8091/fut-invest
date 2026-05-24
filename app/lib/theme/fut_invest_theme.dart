import 'package:flutter/material.dart';

class FutInvestTheme {
  // Dark mode palette
  static const Color bgDeep = Color(0xFF080C14);
  static const Color bgSurface = Color(0xFF0D1321);
  static const Color neonCyan = Color(0xFF00D4FF);
  static const Color neonMagenta = Color(0xFFFF2D95);
  static const Color neonGreen = Color(0xFF00FF88);
  static const Color neonAmber = Color(0xFFFFB800);

  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bgDeep,
      colorScheme: ColorScheme.dark(
        primary: neonCyan,
        secondary: neonMagenta,
        tertiary: neonGreen,
        surface: bgSurface,
        error: neonMagenta,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bgSurface,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardTheme(
        color: bgSurface.withOpacity(0.75),
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0x1A00D4FF)),
        ),
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontFamily: 'Space Grotesk',
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        headlineMedium: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        bodyLarge: TextStyle(
          fontFamily: 'Inter',
          fontSize: 16,
          color: Color(0xFFE8EDF5),
        ),
        bodyMedium: TextStyle(
          fontFamily: 'Inter',
          fontSize: 14,
          color: Color(0xFF8892B0),
        ),
        labelLarge: TextStyle(
          fontFamily: 'JetBrains Mono',
          fontWeight: FontWeight.w700,
          color: neonCyan,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: neonCyan,
          foregroundColor: bgDeep,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 4,
          shadowColor: neonCyan.withOpacity(0.3),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bgSurface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0x1A00D4FF)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0x1A00D4FF)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: neonCyan, width: 2),
        ),
        labelStyle: const TextStyle(color: Color(0xFF8892B0)),
        hintStyle: const TextStyle(color: Color(0xFF4A5278)),
      ),
    );
  }

  // Legacy light theme
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF002855),
        primary: const Color(0xFF002855),
        secondary: const Color(0xFFD90000),
        surface: const Color(0xFFF8F9FA),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF002855),
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardTheme(
        color: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  static bool isDarkMode(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark;
  }
}
