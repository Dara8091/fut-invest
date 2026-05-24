import 'package:flutter/material.dart';

class FutInvestTheme {
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF002855),
        primary: const Color(0xFF002855),
        secondary: const Color(0xFFD90000),
        surface: const Color(0xFFF8F9FA),
        onPrimary: Colors.white,
        error: const Color(0xFFD90000),
      ),
      cardTheme: CardTheme(
        color: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8.0),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF002855),
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w600,
          color: Color(0xFF002855),
        ),
        bodyLarge: TextStyle(
          fontFamily: 'Inter',
          fontSize: 16,
          color: Color(0xFF1A1C1E),
        ),
      ),
    );
  }
}
