import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import '../services/encryption_service.dart';

class SecurityCenterScreen extends StatefulWidget {
  const SecurityCenterScreen({Key? super.key}) : super(key: key);

  @override
  State<SecurityCenterScreen> createState() => _SecurityCenterScreenState();
}

class _SecurityCenterScreenState extends State<SecurityCenterScreen> {
  final EncryptionService _encryptionService = EncryptionService();
  final _inputController = TextEditingController();
  
  String _encryptedResult = '';
  String _decryptedResult = '';
  bool _isProcessing = false;

  // Variables 2FA
  bool _is2FAEnabled = false;
  String _mockSecret2FA = 'FUTINVEST777TRUSTKEY';
  String _current2FACode = '';
  int _secondsRemaining = 30;
  Timer? _2faTimer;

  @override
  void initState() {
    super.initState();
    _generate2FACode();
    _start2FATimer();
  }

  void _start2FATimer() {
    _2faTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          if (_secondsRemaining > 1) {
            _secondsRemaining--;
          } else {
            _secondsRemaining = 30;
            _generate2FACode();
          }
        });
      }
    });
  }

  void _generate2FACode() {
    final random = Random();
    final code = 100000 + random.nextInt(900000); // Código de 6 dígitos
    setState(() {
      _current2FACode = code.toString();
    });
  }

  Future<void> _handleEncrypt() async {
    if (_inputController.text.isEmpty) return;

    setState(() {
      _isProcessing = true;
      _decryptedResult = '';
    });

    try {
      final encrypted = await _encryptionService.encryptText(_inputController.text);
      setState(() {
        _encryptedResult = encrypted;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al cifrar: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  Future<void> _handleDecrypt() async {
    if (_encryptedResult.isEmpty) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      final decrypted = await _encryptionService.decryptText(_encryptedResult);
      setState(() {
        _decryptedResult = decrypted;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al descifrar: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  @override
  void dispose() {
    _inputController.dispose();
    _2faTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Centro de Seguridad',
              style: theme.textTheme.headlineMedium?.copyWith(fontSize: 22),
            ),
            const SizedBox(height: 8),
            Text(
              'Cifrado de grado militar AES-256 GCM y mecanismos de autenticación avanzada para tu portafolio.',
              style: theme.textTheme.bodyLarge?.copyWith(fontSize: 14, color: const Color(0xFF667085)),
            ),
            const SizedBox(height: 20),

            // Tarjeta de Cifrado AES-256
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.enhanced_encryption, color: Color(0xFF002855)),
                        SizedBox(width: 8),
                        Text(
                          'Demostración de Cifrado AES-256 GCM',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF002855)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Las llaves son generadas localmente y se almacenan cifradas mediante hardware en tu dispositivo.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF667085)),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _inputController,
                      decoration: InputDecoration(
                        labelText: 'Texto a Cifrar',
                        hintText: 'Ingresa un dato sensible (ej. clave de retiro)',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isProcessing ? null : _handleEncrypt,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF002855),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Cifrar Datos'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: (_isProcessing || _encryptedResult.isEmpty) ? null : _handleDecrypt,
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Color(0xFF002855)),
                              foregroundColor: const Color(0xFF002855),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Descifrar'),
                          ),
                        ),
                      ],
                    ),

                    // Resultados del Cifrado
                    if (_encryptedResult.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      const Text(
                        'Resultado Encriptado (Base64 + IV):',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF667085)),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8F9FA),
                          border: Border.all(color: const Color(0xFFE1E2E5)),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: SelectableText(
                          _encryptedResult,
                          style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
                        ),
                      ),
                    ],

                    if (_decryptedResult.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      const Text(
                        'Resultado Descifrado:',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF12B76A)),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF12B76A).withOpacity(0.08),
                          border: Border.all(color: const Color(0xFF12B76A)),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _decryptedResult,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF12B76A),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Tarjeta Autenticación 2FA
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.phonelink_ring, color: Color(0xFFD90000)),
                            SizedBox(width: 8),
                            Text(
                              'Autenticador 2FA (TOTP)',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1A1C1E)),
                            ),
                          ],
                        ),
                        Switch(
                          value: _is2FAEnabled,
                          activeColor: const Color(0xFF12B76A),
                          onChanged: (val) {
                            setState(() {
                              _is2FAEnabled = val;
                            });
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(_is2FAEnabled
                                    ? 'Autenticación 2FA Activada'
                                    : 'Autenticación 2FA Desactivada'),
                                backgroundColor: _is2FAEnabled ? const Color(0xFF12B76A) : const Color(0xFFD90000),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Agrega una capa adicional de seguridad a tus transacciones financieras mediante códigos temporales.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF667085)),
                    ),
                    const SizedBox(height: 16),

                    if (_is2FAEnabled) ...[
                      Center(
                        child: Column(
                          children: [
                            const Text(
                              'CÓDIGO DE SEGURIDAD TEMPORAL',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF667085)),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${_current2FACode.substring(0, 3)} ${_current2FACode.substring(3)}',
                              style: TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.w800,
                                color: theme.colorScheme.primary,
                                letterSpacing: 2.0,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(
                                    value: _secondsRemaining / 30,
                                    strokeWidth: 2.5,
                                    color: _secondsRemaining < 8 ? const Color(0xFFD90000) : const Color(0xFF002855),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'El código cambia en $_secondsRemaining segundos',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: _secondsRemaining < 8 ? const Color(0xFFD90000) : const Color(0xFF667085),
                                    fontWeight: _secondsRemaining < 8 ? FontWeight.bold : FontWeight.normal,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Llave Secreta: $_mockSecret2FA',
                              style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.grey),
                            ),
                          ],
                        ),
                      )
                    ] else ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8F9FA),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFE1E2E5)),
                        ),
                        child: const Center(
                          child: Text(
                            'Activa el interruptor arriba para habilitar y simular tu código 2FA.',
                            style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Color(0xFF667085)),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
