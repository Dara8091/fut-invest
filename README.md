# fut.invest — Panel de Inversión y Código Flutter

Este repositorio contiene la arquitectura de marca y los tokens de diseño **Institutional Trust** implementados para el proyecto **fut.invest**.

Dado que tu sistema local no dispone de Flutter instalado de forma global, hemos generado una **arquitectura híbrida premium**:
1. **Un Prototipo Interactivo Web (SPA):** Diseñado con HTML5, CSS3 y Vanilla JavaScript. Te permite visualizar y probar el comportamiento real de la aplicación en vivo con animaciones fluidas y simuladores funcionales.
2. **Estructura y Código de Flutter (`lib/`):** El código limpio en Dart estructurado y listo para producción, ubicado en la raíz del proyecto para que puedas copiar la estructura física directamente a tu entorno Flutter.

---

## 📂 Estructura del Espacio de Trabajo

```
fut_invest/
├── index.html                  # Estructura principal de la SPA Web
├── style.css                   # Diseño CSS Premium, variables y animaciones
├── app.js                      # Controlador de eventos JS, simulaciones y lógica
├── README.md                   # Esta documentación
└── lib/                        # Estructura original de Flutter
    ├── theme/
    │   └── app_theme.dart      # Tu ThemeData de Flutter (colores de la marca)
    ├── services/
    │   └── encryption_service.dart # Cifrado AES-256 GCM con Secure Storage
    └── screens/
        ├── dashboard_screen.dart # Dashboard Flutter con balance y ROI dinámico
        ├── wallet_screen.dart    # Pasarela cripto Flutter con validación Regex y QR
        ├── security_screen.dart  # Centro de seguridad con simulador AES/2FA
        └── binary_tree_screen.dart # Árbol Binario con InteractiveViewer
```

---

## 🚀 ¿Cómo Ejecutar el Prototipo Web?

Para ver el prototipo interactivo con todo su diseño premium, simplemente abre el archivo `index.html` en cualquier navegador web moderno. 

También puedes ejecutar un servidor local rápido utilizando Python, Node.js o el servidor integrado de tu IDE. Por ejemplo:

**Con Python:**
```bash
python -m http.server 8000
```
Luego accede a `http://localhost:8000` en tu navegador.

---

## 📱 Guía de Integración en tu Proyecto Flutter

Para trasladar esta lógica a tu aplicación Flutter real, sigue estos pasos:

1. **Dependencias Requeridas:**
   Asegúrate de agregar las siguientes dependencias en tu archivo `pubspec.yaml`:
   ```yaml
   dependencies:
     flutter:
       sdk: flutter
     flutter_secure_storage: ^9.0.0 # Para el almacenamiento de hardware seguro
     encrypt: ^5.0.3                # Para cifrado AES-256 GCM
   ```

2. **Copiado de Archivos:**
   Copia directamente el contenido de la carpeta `lib/` de este directorio e incorpóralo en la carpeta `lib/` de tu proyecto de Flutter.

3. **Configuración de Temas:**
   En tu archivo `lib/main.dart`, inicializa tu aplicación usando el tema definido en `FutInvestTheme`:
   ```dart
   import 'package:flutter/material.dart';
   import 'theme/app_theme.dart';
   import 'screens/dashboard_screen.dart';

   void main() {
     runApp(const MyApp());
   }

   class MyApp extends StatelessWidget {
     const MyApp({super.key});

     @override
     Widget build(BuildContext context) {
       return MaterialApp(
         title: 'fut.invest',
         theme: FutInvestTheme.light, // Aplicación del tema de la marca
         home: const DashboardScreen(),
       );
     }
   }
   ```

---

## ✨ Características Especiales del Prototipo Web
- **Dashboard en Vivo:** El balance y el porcentaje de ROI diario (rango de 1.5% a 2.5%) fluctúan dinámicamente en tiempo real cada 4 segundos.
- **Calculadora ROI Interactiva:** Te permite deslizar un monto para ver las ganancias estimadas de forma inmediata.
- **Validador de Billeteras Regex:** Compara en tiempo real tus direcciones BTC, USDT ERC-20 y USDT TRC-20 con expresiones regulares, habilitando o bloqueando las opciones de pago según la validez del monedero.
- **Cifrador AES-256 en Vivo:** Simula el cifrado local a nivel de bytes, permitiéndote ingresar texto, ver el criptograma resultante y descifrarlo en vivo.
- **2FA TOTP Simulator:** Simula un token autenticador real con códigos de 6 dígitos que expiran y cambian automáticamente cada 30 segundos con una barra de carga decreciente.
- **Árbol Binario Interactivo:** Canvas SVG adaptativo que permite hacer Zoom (acercar/alejar/restablecer) y Paneo (arrastrar) sobre la red organizacional. Al hacer clic en cualquier miembro de la red, verás sus puntos acumulados en el HUD dinámico del panel izquierdo.
- **Flutter Code Hub:** Un explorador de código interactivo integrado que te permite visualizar los archivos `.dart` físicos del proyecto y copiarlos con un solo clic.
