import 'dart:convert';
import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:encrypt/encrypt.dart' as encrypt;

/// Servicio encargado del cifrado y descifrado de datos sensibles en la app fut.invest.
/// Utiliza cifrado simétrico AES-256 (CBC/GCM) y almacena la clave de manera segura
/// en el almacenamiento de hardware seguro mediante [FlutterSecureStorage].
class EncryptionService {
  static const _storage = FlutterSecureStorage();
  static const String _keyAlias = 'fut_invest_aes_key';

  // Clave en memoria una vez inicializado el servicio
  encrypt.Key? _encryptionKey;

  /// Inicializa la clave de cifrado. Si no existe, genera una nueva clave de 256 bits (32 bytes)
  /// y la almacena de forma segura usando Secure Storage.
  Future<void> init() async {
    String? storedKey = await _storage.read(key: _keyAlias);

    if (storedKey == null) {
      // Generar una clave segura aleatoria de 32 bytes (256 bits)
      final random = Random.secure();
      final values = List<int>.generate(32, (i) => random.nextInt(256));
      final newKeyBase64 = base64UrlEncode(values);

      // Guardar clave en almacenamiento seguro
      await _storage.write(key: _keyAlias, value: newKeyBase64);
      _encryptionKey = encrypt.Key.fromBase64(newKeyBase64);
    } else {
      _encryptionKey = encrypt.Key.fromBase64(storedKey);
    }
  }

  /// Cifra un texto utilizando AES-256. Retorna una cadena codificada en Base64 que contiene
  /// el vector de inicialización (IV) y el criptograma cifrado.
  Future<String> encryptText(String plainText) async {
    if (_encryptionKey == null) {
      await init();
    }

    final iv = encrypt.IV.fromLength(16); // Vector de inicialización aleatorio
    final encrypter = encrypt.Encrypter(encrypt.AES(_encryptionKey!, mode: encrypt.AESMode.sic));

    final encrypted = encrypter.encrypt(plainText, iv: iv);
    
    // Concatenamos el IV y el texto cifrado separados por un punto para guardarlo o transmitirlo
    final payload = {
      'iv': iv.base64,
      'ciphertext': encrypted.base64,
    };

    return base64Encode(utf8.encode(jsonEncode(payload)));
  }

  /// Descifra una cadena previamente cifrada con [encryptText].
  Future<String> decryptText(String encryptedBase64Payload) async {
    if (_encryptionKey == null) {
      await init();
    }

    try {
      final decodedJson = utf8.decode(base64Decode(encryptedBase64Payload));
      final Map<String, dynamic> payload = jsonDecode(decodedJson);

      final iv = encrypt.IV.fromBase64(payload['iv']!);
      final ciphertext = encrypt.Encrypted.fromBase64(payload['ciphertext']!);

      final encrypter = encrypt.Encrypter(encrypt.AES(_encryptionKey!, mode: encrypt.AESMode.sic));
      final decrypted = encrypter.decrypt(ciphertext, iv: iv);

      return decrypted;
    } catch (e) {
      throw Exception('Fallo en el descifrado: Datos corruptos o clave incorrecta. $e');
    }
  }
}
