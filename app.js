// ==========================================
// fut.invest - Interactive Controller
// ==========================================

// --- Sentry error tracking (global) ---
window.addEventListener('error', function (e) {
    if (window.Sentry && window.SENTRY_DSN) {
        Sentry.captureException(e.error || e.message);
    }
});
window.addEventListener('unhandledrejection', function (e) {
    if (window.Sentry && window.SENTRY_DSN) {
        Sentry.captureException(e.reason);
    }
});

// --- Flutter Code Files Database ---
const FLUTTER_CODEBASE = {
    app_theme: `import 'package:flutter/material.dart';

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
}`,

    encryption_service: `import 'dart:convert';
import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:encrypt/encrypt.dart' as encrypt;

/// Servicio encargado del cifrado y descifrado de datos sensibles en la app fut.invest.
/// Utiliza cifrado simétrico AES-256 (CBC/GCM) y almacena la clave de manera segura
/// en el almacenamiento de hardware seguro mediante [FlutterSecureStorage].
class EncryptionService {
  static const _storage = FlutterSecureStorage();
  static const String _keyAlias = 'fut_invest_aes_key';

  encrypt.Key? _encryptionKey;

  Future<void> init() async {
    String? storedKey = await _storage.read(key: _keyAlias);

    if (storedKey == null) {
      final random = Random.secure();
      final values = List<int>.generate(32, (i) => random.nextInt(256));
      final newKeyBase64 = base64UrlEncode(values);

      await _storage.write(key: _keyAlias, value: newKeyBase64);
      _encryptionKey = encrypt.Key.fromBase64(newKeyBase64);
    } else {
      _encryptionKey = encrypt.Key.fromBase64(storedKey);
    }
  }

  Future<String> encryptText(String plainText) async {
    if (_encryptionKey == null) await init();

    final iv = encrypt.IV.fromLength(16);
    final encrypter = encrypt.Encrypter(encrypt.AES(_encryptionKey!, mode: encrypt.AESMode.sic));

    final encrypted = encrypter.encrypt(plainText, iv: iv);
    
    final payload = {
      'iv': iv.base64,
      'ciphertext': encrypted.base64,
    };

    return base64Encode(utf8.encode(jsonEncode(payload)));
  }

  Future<String> decryptText(String encryptedBase64Payload) async {
    if (_encryptionKey == null) await init();

    try {
      final decodedJson = utf8.decode(base64Decode(encryptedBase64Payload));
      final Map<String, dynamic> payload = jsonDecode(decodedJson);

      final iv = encrypt.IV.fromBase64(payload['iv']!);
      final ciphertext = encrypt.Encrypted.fromBase64(payload['ciphertext']!);

      final encrypter = encrypt.Encrypter(encrypt.AES(_encryptionKey!, mode: encrypt.AESMode.sic));
      final decrypted = encrypter.decrypt(ciphertext, iv: iv);

      return decrypted;
    } catch (e) {
      throw Exception('Fallo en el descifrado: Datos corruptos o clave incorrecta. \$e');
    }
  }
}`,

    dashboard_screen: `import 'dart:math';
import 'package:flutter/material.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? super.key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  double _totalBalance = 12450.75;
  double _dailyROIPercentage = 1.85;
  double _accumulatedEarnings = 342.10;
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _simulateLiveROIUpdate();
  }

  void _simulateLiveROIUpdate() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        setState(() {
          _dailyROIPercentage = 1.5 + _random.nextDouble() * 1.0;
          double gain = _totalBalance * (_dailyROIPercentage / 100) / 86400 * 4;
          _totalBalance += gain;
          _accumulatedEarnings += gain;
        });
        _simulateLiveROIUpdate();
      }
    });
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Bienvenido a', style: theme.textTheme.bodyLarge?.copyWith(color: const Color(0xFF667085))),
                    Text('fut.invest', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800, fontSize: 28)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: const Color(0xFF12B76A).withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                  child: Row(
                    children: const [
                      Icon(Icons.shield, color: Color(0xFF12B76A), size: 16),
                      SizedBox(width: 4),
                      Text('Trust Sec', style: TextStyle(color: Color(0xFF12B76A), fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                )
              ],
            ),
            const SizedBox(height: 24),
            Card(
              color: const Color(0xFF002855),
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('BALANCE TOTAL DE INVERSIÓN', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w500, letterSpacing: 1.2)),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('\\\$\${_totalBalance.toStringAsFixed(2)} USD', style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
                        const Icon(Icons.trending_up, color: Color(0xFF12B76A), size: 32),
                      ],
                    ),
                    const Divider(color: Colors.white24, height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Retorno Diario Actual (ROI)', style: TextStyle(color: Colors.white70, fontSize: 12)),
                            const SizedBox(height: 4),
                            Text('+\${_dailyROIPercentage.toStringAsFixed(2)}%', style: const TextStyle(color: Color(0xFF12B76A), fontWeight: FontWeight.bold, fontSize: 16)),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('Ganancias Acumuladas', style: TextStyle(color: Colors.white70, fontSize: 12)),
                            const SizedBox(height: 4),
                            Text('+\\\$\${_accumulatedEarnings.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                          ],
                        )
                      ],
                    )
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}`,

    wallet_screen: `import 'package:flutter/material.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({Key? super.key}) : super(key: key);

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final _addressController = TextEditingController();
  final _amountController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  String _selectedAsset = 'USDT (TRC20)';
  bool _isAddressValid = false;
  bool _showQRCode = false;
  bool _isLiquidating = false;

  final RegExp _btcRegex = RegExp(r'^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{25,39})\$');
  final RegExp _usdtTrc20Regex = RegExp(r'^T[A-Za-z0-9]{33}\$');
  final RegExp _usdtErc20Regex = RegExp(r'^0x[a-fA-F0-9]{40}\$');

  void _validateAddress(String address) {
    bool isValid = false;
    if (address.isEmpty) {
      isValid = false;
    } else if (_selectedAsset == 'BTC') {
      isValid = _btcRegex.hasMatch(address);
    } else if (_selectedAsset == 'USDT (TRC20)') {
      isValid = _usdtTrc20Regex.hasMatch(address);
    } else if (_selectedAsset == 'USDT (ERC20)') {
      isValid = _usdtErc20Regex.hasMatch(address);
    }

    setState(() {
      _isAddressValid = isValid;
      if (!isValid) _showQRCode = false;
    });
  }

  void _generateQR() {
    if (_formKey.currentState!.validate() && _isAddressValid) {
      setState(() {
        _showQRCode = true;
      });
    }
  }

  void _runTotalLiquidation() {
    setState(() {
      _isLiquidating = true;
    });

    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _isLiquidating = false;
          _addressController.clear();
          _amountController.clear();
          _showQRCode = false;
          _isAddressValid = false;
        });

        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Liquidación Exitosa'),
            content: const Text('La liquidación total de fondos ha sido autorizada. El pago será transmitido a la blockchain en breve.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Entendido'),
              ),
            ],
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // ... UI Layout ...
    return Scaffold();
  }
}`,

    security_screen: `import 'dart:async';
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

  bool _is2FAEnabled = false;
  String _mockSecret2FA = 'FUTINVEST777TRUSTKEY';
  String _current2FACode = '';
  int _secondsRemaining = 30;
  Timer? _2faTimer;

  // ... 2FA and encryption logic ...

  @override
  Widget build(BuildContext context) {
    // ... UI Layout with encrypt/decrypt tools ...
    return Scaffold();
  }
}`,

    binary_tree_screen: `import 'package:flutter/material.dart';

class BinaryTreeScreen extends StatefulWidget {
  const BinaryTreeScreen({Key? super.key}) : super(key: key);

  @override
  State<BinaryTreeScreen> createState() => _BinaryTreeScreenState();
}

class _BinaryTreeScreenState extends State<BinaryTreeScreen> {
  final int _leftPoints = 12500;
  final int _rightPoints = 8400;
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: Column(
        children: [
          // Header points ...
          Expanded(
            child: InteractiveViewer(
              boundaryMargin: const EdgeInsets.all(300.0),
              minScale: 0.3,
              maxScale: 2.0,
              child: Center(
                child: SizedBox(
                  width: 600,
                  height: 400,
                  child: Stack(
                    children: [
                      // Node layouts ...
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}`
};


document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let totalBalance = 12450.75;
    let accumulatedEarnings = 342.10;
    let currentRoi = 1.85;
    let activeTier = 'black'; // default tier in calculator
    let currentUser = null;

    const MOCK_DEPOSIT_ADDRESSES = {
        BTC: "1FutInvest883DepositBtcAddress777Xy",
        USDT_TRC20: "TInvestTRC20DepositUSDT998242Apx7",
        USDT_ERC20: "0xInvestERC20DepositUSDT88374242A77A1"
    };

    // --- DOM Elements ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('current-page-title');
    const pageSubtitle = document.getElementById('current-page-subtitle');

    // Balance/ROI live counters
    const liveBalanceEl = document.getElementById('live-balance');
    const liveEarningsEl = document.getElementById('live-earnings');
    const liveRoiEl = document.getElementById('live-roi-percentage');

    // Calculator Elements
    const calcInvestmentSlider = document.getElementById('calc-investment');
    const calcAmountLabel = document.getElementById('calc-amount-label');
    const calcDailyVal = document.getElementById('calc-daily');
    const calcMonthlyVal = document.getElementById('calc-monthly');
    const calcYearlyVal = document.getElementById('calc-yearly');
    const tierOptions = document.querySelectorAll('.tier-option');

    // Wallet Elements
    const walletAssetSelect = document.getElementById('wallet-asset');
    const walletAddressInput = document.getElementById('wallet-address');
    const walletValidationIcon = document.getElementById('wallet-validation-icon');
    const walletHelperText = document.getElementById('wallet-helper-text');
    const walletAmountInput = document.getElementById('wallet-amount');
    const btnShowQR = document.getElementById('btn-show-qr');
    const btnTotalLiquidation = document.getElementById('btn-total-liquidation');
    const qrContainerBox = document.getElementById('qr-container-box');
    const qrAssetLabel = document.getElementById('qr-asset-label');
    const qrAddressDisplay = document.getElementById('qr-wallet-address-display');

    // Wallet Deposit elements
    const subTabWithdrawBtn = document.getElementById('sub-tab-withdraw-btn');
    const subTabDepositBtn = document.getElementById('sub-tab-deposit-btn');
    const walletWithdrawContent = document.getElementById('wallet-withdraw-content');
    const walletDepositContent = document.getElementById('wallet-deposit-content');
    const depositAssetSelect = document.getElementById('deposit-asset');
    const btnGenerateDeposit = document.getElementById('btn-generate-deposit');
    const depositInstructionsCard = document.getElementById('deposit-instructions-card');
    const depositQRLabel = document.getElementById('deposit-qr-label');
    const depositAddressDisplay = document.getElementById('deposit-address-display');
    const btnCopyDeposit = document.getElementById('btn-copy-deposit');

    // Security Elements
    const aesInput = document.getElementById('aes-input');
    const btnEncrypt = document.getElementById('btn-aes-encrypt');
    const btnDecrypt = document.getElementById('btn-aes-decrypt');
    const aesResultsContainer = document.getElementById('aes-results-container');
    const aesCipherOutput = document.getElementById('aes-cipher-output');
    const aesPlainContainer = document.getElementById('aes-plain-container');
    const aesPlainOutput = document.getElementById('aes-plain-output');

    // 2FA Elements
    const toggle2fa = document.getElementById('2fa-toggle');
    const totpDisplayArea = document.getElementById('totp-display-area');
    const totpCodeEl = document.getElementById('totp-code');
    const totpTimerFill = document.getElementById('totp-timer-fill');
    const totpTimerText = document.getElementById('totp-timer-text');

    // Network elements (zoom & HUD)
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    const interactiveTree = document.getElementById('interactive-tree');
    
    // Code Hub Elements
    const fileItems = document.querySelectorAll('.file-item');
    const codeDisplay = document.getElementById('code-display');
    const activeFileName = document.getElementById('active-file-name');
    const btnCopyCode = document.getElementById('btn-copy-code');

    // Modal elements
    const modalAlert = document.getElementById('modal-alert');
    const modalAlertIcon = document.getElementById('modal-alert-icon');
    const modalAlertTitle = document.getElementById('modal-alert-title');
    const modalAlertMessage = document.getElementById('modal-alert-message');
    const btnCloseModal = document.getElementById('btn-close-modal');

    // --- Auth State & API Integration ---
    let isLiveMode = false;

    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authName = document.getElementById('auth-name');
    const authNameGroup = document.getElementById('auth-name-group');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authError = document.getElementById('auth-error');
    const authModalTitle = document.getElementById('auth-modal-title');
    const authModalDesc = document.getElementById('auth-modal-desc');
    const authToggleBtn = document.getElementById('auth-toggle-btn');
    const authToggleText = document.getElementById('auth-toggle-text');
    const authSkipBtn = document.getElementById('auth-skip-btn');
    let isRegisterMode = false;

    function showAuthError(msg) {
        authError.textContent = msg;
        authError.style.display = 'block';
    }

    function hideAuthError() {
        authError.style.display = 'none';
    }

    function toggleAuthMode() {
        isRegisterMode = !isRegisterMode;
        authModalTitle.textContent = isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión';
        authModalDesc.textContent = isRegisterMode
            ? 'Regístrate para acceder al panel de inversión institucional.'
            : 'Accede a tu panel de inversión institucional.';
        authNameGroup.style.display = isRegisterMode ? 'flex' : 'none';
        authToggleText.textContent = isRegisterMode ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?';
        authToggleBtn.textContent = isRegisterMode ? 'Inicia sesión' : 'Regístrate';
        authSubmitBtn.querySelector('span:last-child').textContent = isRegisterMode ? 'Crear Cuenta' : 'Ingresar';
        hideAuthError();
    }

    authToggleBtn.addEventListener('click', toggleAuthMode);

    authSkipBtn.addEventListener('click', () => {
        authModal.style.display = 'none';
        isLiveMode = false;
        updateLiveIndicator();
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAuthError();
        authSubmitBtn.disabled = true;
        authSubmitBtn.innerHTML = '<span class="material-icons-round pulse">sync</span> <span>Procesando...</span>';

        try {
            let user;
            if (isRegisterMode) {
                user = await ApiService.register(authEmail.value, authPassword.value, authName.value || undefined);
            } else {
                user = await ApiService.login(authEmail.value, authPassword.value);
            }
            authModal.style.display = 'none';
            isLiveMode = true;
            currentUser = user;
            updateLiveIndicator(user);
            toggleAdminTab(user);
            startOnboarding();
            await syncWithBackend();
        } catch (err) {
            showAuthError(err.message);
        } finally {
            authSubmitBtn.disabled = false;
            authSubmitBtn.innerHTML = `<span class="material-icons-round">login</span> <span>${isRegisterMode ? 'Crear Cuenta' : 'Ingresar'}</span>`;
        }
    });

    // Auto-show auth if token exists but expired, or show on first visit
    if (ApiService.token) {
        ApiService.me().then(user => {
            isLiveMode = true;
            currentUser = user;
            updateLiveIndicator(user);
            toggleAdminTab(user);
            syncWithBackend();
        }).catch(() => {
            ApiService.setToken(null);
            authModal.style.display = 'flex';
        });
    } else {
        setTimeout(() => { authModal.style.display = 'flex'; }, 500);
    }

    // --- Onboarding Tutorial ---
    const ONBOARDING_STEPS = [
        { target: '#btn-tab-dashboard', title: 'Dashboard', text: 'Aquí ves tu balance, ROI y contratos activos en tiempo real.' },
        { target: '#btn-tab-wallet', title: 'Billetera', text: 'Deposita fondos o solicita retiros desde esta sección.' },
        { target: '#btn-tab-security', title: 'Seguridad', text: 'Configura 2FA TOTP y cifrado AES-256 para proteger tu cuenta.' },
        { target: '#btn-tab-network', title: 'Red Binaria', text: 'Visualiza tu red multinivel y el volumen de tus referidos.' },
        { target: '#live-balance', title: 'Balance en Vivo', text: 'Tu balance se actualiza automáticamente con el ROI generado.' },
    ];

    let onboardingStep = -1;
    let onboardingOverlay = null;
    let onboardingTooltip = null;

    function createOnboardingElements() {
        onboardingOverlay = document.createElement('div');
        onboardingOverlay.id = 'onboarding-overlay';
        onboardingOverlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:none;';
        document.body.appendChild(onboardingOverlay);

        onboardingTooltip = document.createElement('div');
        onboardingTooltip.id = 'onboarding-tooltip';
        onboardingTooltip.style.cssText = 'position:fixed;z-index:10000;background:rgba(10,14,26,0.95);border:1px solid rgba(0,212,255,0.2);border-radius:12px;padding:20px 24px;max-width:360px;box-shadow:0 0 40px rgba(0,212,255,0.1);display:none;backdrop-filter:blur(12px);';
        onboardingTooltip.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                <span style="font-size:24px;color:#00D4FF;">rocket_launch</span>
                <div>
                    <div style="font-size:14px;font-weight:700;color:#00D4FF;" id="onb-title"></div>
                    <div style="font-size:11px;color:#606880;" id="onb-step">Paso 1 de ${ONBOARDING_STEPS.length}</div>
                </div>
            </div>
            <p style="font-size:13px;color:#C0C8E0;line-height:1.6;margin-bottom:16px;" id="onb-text"></p>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <button id="onb-skip" style="background:none;border:none;color:#606880;font-size:12px;cursor:pointer;font-family:inherit;">Saltar</button>
                <button id="onb-next" style="background:linear-gradient(135deg,#00D4FF,#0099CC);color:#fff;border:none;padding:8px 20px;border-radius:8px;font-weight:600;cursor:pointer;font-family:inherit;">Siguiente</button>
            </div>
        `;
        document.body.appendChild(onboardingTooltip);

        document.getElementById('onb-skip').addEventListener('click', finishOnboarding);
        document.getElementById('onb-next').addEventListener('click', showNextOnboardingStep);
    }

    function showOnboardingStep(index) {
        if (index >= ONBOARDING_STEPS.length) { finishOnboarding(); return; }
        onboardingStep = index;
        const step = ONBOARDING_STEPS[index];
        const target = document.querySelector(step.target);
        if (!target) { showNextOnboardingStep(); return; }

        onboardingOverlay.style.display = 'block';

        const titleEl = document.getElementById('onb-title');
        const textEl = document.getElementById('onb-text');
        const stepEl = document.getElementById('onb-step');
        if (titleEl) titleEl.textContent = step.title;
        if (textEl) textEl.textContent = step.text;
        if (stepEl) stepEl.textContent = `Paso ${index + 1} de ${ONBOARDING_STEPS.length}`;
        document.getElementById('onb-next').textContent = index < ONBOARDING_STEPS.length - 1 ? 'Siguiente' : 'Comenzar';

        const rect = target.getBoundingClientRect();
        const tooltipW = 360;
        let left = rect.left + rect.width / 2 - tooltipW / 2;
        let top = rect.bottom + 12;

        if (top + 250 > window.innerHeight) top = rect.top - 200;
        if (left < 12) left = 12;
        if (left + tooltipW > window.innerWidth - 12) left = window.innerWidth - tooltipW - 12;

        onboardingTooltip.style.left = `${left}px`;
        onboardingTooltip.style.top = `${top}px`;
        onboardingTooltip.style.display = 'block';

        target.style.outline = '2px solid #00D4FF';
        target.style.outlineOffset = '4px';
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function showNextOnboardingStep() {
        const prev = ONBOARDING_STEPS[onboardingStep];
        if (prev) {
            const prevEl = document.querySelector(prev.target);
            if (prevEl) { prevEl.style.outline = ''; prevEl.style.outlineOffset = ''; }
        }
        showOnboardingStep(onboardingStep + 1);
    }

    function finishOnboarding() {
        onboardingOverlay.style.display = 'none';
        onboardingTooltip.style.display = 'none';
        const prev = ONBOARDING_STEPS[onboardingStep];
        if (prev) {
            const prevEl = document.querySelector(prev.target);
            if (prevEl) { prevEl.style.outline = ''; prevEl.style.outlineOffset = ''; }
        }
        localStorage.setItem('futinvest_onboarding_done', 'true');
    }

    function startOnboarding() {
        if (localStorage.getItem('futinvest_onboarding_done') === 'true') return;
        if (!document.getElementById('onboarding-overlay')) createOnboardingElements();
        setTimeout(() => showOnboardingStep(0), 500);
    }

    // Listen for auth events
    window.addEventListener('auth:expired', () => {
        isLiveMode = false;
        currentUser = null;
        updateLiveIndicator();
        toggleAdminTab(null);
        showModal('warning_amber', 'Sesión Expirada', 'Tu sesión ha expirado. Inicia sesión nuevamente.');
        setTimeout(() => { authModal.style.display = 'flex'; }, 1000);
    });

    window.addEventListener('auth:logout', () => {
        isLiveMode = false;
        currentUser = null;
        updateLiveIndicator();
        toggleAdminTab(null);
        authModal.style.display = 'flex';
    });

    function updateLiveIndicator(user) {
        const existing = document.querySelector('.live-indicator');
        if (existing) existing.remove();

        const indicator = document.createElement('span');
        indicator.className = `live-indicator ${isLiveMode ? 'live' : 'demo'}`;
        indicator.innerHTML = `<span class="dot ${isLiveMode ? '' : 'pulse'}"></span> ${isLiveMode ? 'API Conectado' : 'Demo Local'}`;
        indicator.title = isLiveMode ? `Conectado como ${user?.email || 'usuario'}` : 'Usando datos de demostración locales';
        indicator.addEventListener('click', () => {
            if (isLiveMode) {
                ApiService.logout();
            } else {
                authModal.style.display = 'flex';
            }
        });
        document.querySelector('.user-profile').prepend(indicator);
    }

    // --- Withdrawal Queue ---
    async function renderWithdrawalQueue() {
        const container = document.getElementById('withdrawal-queue-list');
        if (!container) return;
        try {
            const data = await ApiService._fetch('/wallet/transactions?type=withdraw&limit=5');
            const withdrawals = (data.transactions || []).filter(t => t.type === 'withdraw');
            if (withdrawals.length === 0) {
                container.innerHTML = '<div class="text-muted" style="padding:16px;text-align:center;font-size:13px;">No hay retiros recientes.</div>';
                return;
            }
            container.innerHTML = withdrawals.map(t => {
                const statusClass = { pending: 'badge-warning', processing: 'badge-info', completed: 'badge-success', failed: 'badge-error', cancelled: 'badge-secondary' }[t.status] || 'badge-secondary';
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--color-border);">
                    <div>
                        <strong style="font-size:13px;">$${t.amount} ${t.asset}</strong>
                        <div style="font-size:11px;color:var(--color-text-muted);">${new Date(t.created_at).toLocaleString()}</div>
                    </div>
                    <span class="badge ${statusClass}">${t.status}</span>
                </div>`;
            }).join('');
        } catch (e) {
            // ignore
        }
    }

    // CSV Export
    document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
        try {
            const csvData = await ApiService.exportCSV();
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transacciones_${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            showModal('error', 'Error', 'No se pudo exportar CSV: ' + e.message);
        }
    });

    // Poll withdrawal queue every 30s
    setInterval(renderWithdrawalQueue, 30000);

    function toggleAdminTab(user) {
        const adminBtn = document.getElementById('btn-tab-admin');
        const settingsBtn = document.getElementById('btn-tab-settings');
        const profileBtn = document.getElementById('btn-tab-profile');
        if (!adminBtn) return;
        const role = user?.role || 'investor';
        if (role === 'admin' || role === 'superadmin') {
            adminBtn.style.display = 'flex';
        } else {
            adminBtn.style.display = 'none';
            if (document.getElementById('tab-admin')?.classList.contains('active')) {
                switchTab('dashboard');
            }
        }
        if (settingsBtn && user) {
            settingsBtn.style.display = 'flex';
        } else if (settingsBtn) {
            settingsBtn.style.display = 'none';
        }
        if (profileBtn && user) {
            profileBtn.style.display = 'flex';
        } else if (profileBtn) {
            profileBtn.style.display = 'none';
        }
    }

    async function syncWithBackend() {
        if (!ApiService.isAuthenticated) return;
        try {
            const data = await ApiService.getDashboard();
            totalBalance = data.balance;
            accumulatedEarnings = data.accumulatedEarnings;
            currentRoi = data.dailyRoi;
            activeTier = data.tier;

            liveBalanceEl.textContent = `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            liveEarningsEl.textContent = `+$${accumulatedEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
            liveRoiEl.textContent = `+${currentRoi.toFixed(2)}%`;

            renderWithdrawalQueue();
        } catch (e) {
            showNotification('API no disponible', 'Usando datos locales', 'info');
        }
    }

    // --- Admin Panel ---
    async function loadAdminStats() {
        try {
            const data = await ApiService.getAdminStats();
            document.querySelector('#admin-stat-users .stat-value').textContent = data.stats.totalUsers;
            document.querySelector('#admin-stat-deposits .stat-value').textContent = `$${data.stats.totalDeposits.toLocaleString()}`;
            document.querySelector('#admin-stat-withdrawals .stat-value').textContent = `$${data.stats.totalWithdrawals.toLocaleString()}`;
            document.querySelector('#admin-stat-pending .stat-value').textContent = data.stats.pendingWithdrawals;
            document.querySelector('#admin-stat-fees .stat-value').textContent = `$${data.stats.totalFees.toLocaleString()}`;
            document.querySelector('#admin-stat-users-today .stat-value').textContent = data.stats.totalUsersToday;
        } catch (e) {
            showNotification('Error', 'No se pudieron cargar las estadísticas', 'error');
        }
    }

    async function loadAdminPendingWithdrawals() {
        try {
            const data = await ApiService.getPendingWithdrawals();
            const tbody = document.getElementById('admin-pending-body');
            if (!data.withdrawals || data.withdrawals.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay retiros pendientes</td></tr>';
                return;
            }
            tbody.innerHTML = data.withdrawals.map(w => `
                <tr>
                    <td>#${w.id}</td>
                    <td>${w.full_name || w.email}</td>
                    <td>${w.asset}</td>
                    <td>$${w.amount.toFixed(2)}</td>
                    <td>$${w.fee.toFixed(2)}</td>
                    <td title="${w.address}">${w.address.slice(0, 12)}...</td>
                    <td>${new Date(w.created_at).toLocaleDateString()}</td>
                    <td class="actions-cell">
                        <button class="btn btn-sm btn-approve" data-id="${w.id}">
                            <span class="material-icons-round">check</span>
                        </button>
                        <button class="btn btn-sm btn-reject" data-id="${w.id}">
                            <span class="material-icons-round">close</span>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            document.getElementById('admin-pending-body').innerHTML = '<tr><td colspan="8" class="text-center">Error al cargar</td></tr>';
        }
    }

    async function loadAdminFeeConfig() {
        try {
            const data = await ApiService.getFeeConfigs();
            const tbody = document.getElementById('admin-fees-body');
            if (!data.feeConfigs || data.feeConfigs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center">Sin configuraciones</td></tr>';
                return;
            }
            tbody.innerHTML = data.feeConfigs.map(f => `
                <tr>
                    <td>${f.id}</td>
                    <td>${f.asset}</td>
                    <td>${f.network}</td>
                    <td>$${f.withdrawal_fee.toFixed(2)}</td>
                    <td>$${f.deposit_fee.toFixed(2)}</td>
                    <td>$${f.min_withdrawal.toFixed(2)}</td>
                    <td>$${f.max_withdrawal.toFixed(2)}</td>
                    <td>${f.confirmations}</td>
                    <td>
                        <button class="btn btn-sm btn-outline admin-edit-fee" data-id="${f.id}">
                            <span class="material-icons-round">edit</span>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            document.getElementById('admin-fees-body').innerHTML = '<tr><td colspan="9" class="text-center">Error al cargar</td></tr>';
        }
    }

    async function loadAdminUsers() {
        try {
            const data = await ApiService.getAdminUsers();
            const tbody = document.getElementById('admin-users-body');
            if (!data.users || data.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">Sin usuarios</td></tr>';
                return;
            }
            tbody.innerHTML = data.users.map(u => `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.email}</td>
                    <td>${u.full_name}</td>
                    <td><span class="badge ${u.role === 'admin' || u.role === 'superadmin' ? 'badge-admin' : 'badge-secondary'}">${u.role}</span></td>
                    <td><span class="badge badge-info">${u.tier}</span></td>
                    <td><span class="badge ${u.kyc_status === 'approved' ? 'badge-success' : u.kyc_status === 'rejected' ? 'badge-error' : 'badge-warning'}">${u.kyc_status}</span></td>
                    <td>${u.totp_enabled ? '✅' : '❌'}</td>
                    <td>${new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        } catch (e) {
            document.getElementById('admin-users-body').innerHTML = '<tr><td colspan="8" class="text-center">Error al cargar</td></tr>';
        }
    }

    async function loadAdminWithdrawalHistory() {
        const status = document.getElementById('admin-withdrawal-filter')?.value || '';
        try {
            const data = await ApiService.getAllWithdrawals(status);
            const tbody = document.getElementById('admin-history-body');
            if (!data.withdrawals || data.withdrawals.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">Sin retiros</td></tr>';
                return;
            }
            tbody.innerHTML = data.withdrawals.map(w => `
                <tr>
                    <td>#${w.id}</td>
                    <td>${w.full_name || w.email}</td>
                    <td>${w.asset}</td>
                    <td>$${w.amount.toFixed(2)}</td>
                    <td><span class="badge badge-${w.status}">${w.status}</span></td>
                    <td>${w.provider || '-'}</td>
                    <td>${new Date(w.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        } catch (e) {
            document.getElementById('admin-history-body').innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar</td></tr>';
        }
    }

    async function refreshAdminPanel() {
        loadAdminStats();
        loadAdminPendingWithdrawals();
        loadAdminFeeConfig();
        loadAdminUsers();
        loadAdminWithdrawalHistory();
    }

    // --- Admin Event Handlers ---
    document.addEventListener('click', async (e) => {
        const approveBtn = e.target.closest('.btn-approve');
        if (approveBtn) {
            const id = approveBtn.getAttribute('data-id');
            try {
                await ApiService.approveWithdrawal(id);
                showToast('Retiro aprobado', 'El retiro fue enviado al proveedor', 'success');
                refreshAdminPanel();
            } catch (err) {
                showToast('Error', err.message, 'error');
            }
            return;
        }

        const rejectBtn = e.target.closest('.btn-reject');
        if (rejectBtn) {
            const id = rejectBtn.getAttribute('data-id');
            if (!confirm('¿Rechazar este retiro?')) return;
            try {
                await ApiService.rejectWithdrawal(id, 'Rechazado por administrador');
                showToast('Retiro rechazado', '', 'info');
                refreshAdminPanel();
            } catch (err) {
                showToast('Error', err.message, 'error');
            }
            return;
        }

        const editFeeBtn = e.target.closest('.admin-edit-fee');
        if (editFeeBtn) {
            const id = editFeeBtn.getAttribute('data-id');
            const newFee = prompt('Nuevo fee de retiro:');
            if (newFee !== null && !isNaN(parseFloat(newFee))) {
                try {
                    await ApiService.updateFeeConfig(id, { withdrawal_fee: parseFloat(newFee) });
                    showToast('Fee actualizado', '', 'success');
                    loadAdminFeeConfig();
                } catch (err) {
                    showToast('Error', err.message, 'error');
                }
            }
            return;
        }
    });

    // Admin refresh buttons
    document.getElementById('admin-refresh-pending')?.addEventListener('click', loadAdminPendingWithdrawals);
    document.getElementById('admin-refresh-fees')?.addEventListener('click', loadAdminFeeConfig);
    document.getElementById('admin-refresh-users')?.addEventListener('click', loadAdminUsers);
    document.getElementById('admin-refresh-history')?.addEventListener('click', loadAdminWithdrawalHistory);
    document.getElementById('admin-withdrawal-filter')?.addEventListener('change', loadAdminWithdrawalHistory);

    // --- Settings Page ---
    document.getElementById('settings-password-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('settings-current-password').value;
        const newPassword = document.getElementById('settings-new-password').value;
        try {
            await ApiService._fetch('/settings/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            showToast('Contraseña actualizada', 'Se cerrarán todas las sesiones activas.', 'success');
            document.getElementById('settings-current-password').value = '';
            document.getElementById('settings-new-password').value = '';
        } catch (err) {
            showToast('Error', err.message, 'error');
        }
    });

    document.getElementById('btn-save-notifications')?.addEventListener('click', async () => {
        try {
            const emailNotif = document.getElementById('settings-email-notif').checked;
            const pushNotif = document.getElementById('settings-push-notif').checked;
            await ApiService._fetch('/settings/notifications', {
                method: 'POST',
                body: JSON.stringify({ emailNotifications: emailNotif, pushEnabled: pushNotif }),
            });
            showToast('Preferencias guardadas', '', 'success');
        } catch (err) {
            showToast('Error', err.message, 'error');
        }
    });

    document.getElementById('btn-copy-referral')?.addEventListener('click', () => {
        const code = document.getElementById('settings-referral-code').textContent;
        if (code && code !== '-') {
            navigator.clipboard.writeText(code).then(() => {
                showToast('Copiado', 'Código de referido copiado al portapapeles.', 'success');
            });
        }
    });

    document.getElementById('settings-delete-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!confirm('¿Estás seguro? Esta acción es irreversible.')) return;
        if (!confirm('TODOS tus datos serán eliminados permanentemente. ¿Continuar?')) return;
        const password = document.getElementById('settings-delete-password').value;
        try {
            await ApiService._fetch('/settings/account', {
                method: 'DELETE',
                body: JSON.stringify({ password }),
            });
            ApiService.logout();
            showToast('Cuenta eliminada', 'Sentimos verte partir.', 'info');
        } catch (err) {
            showToast('Error', err.message, 'error');
        }
    });

    // --- KYC Upload ---
    const kycFileInput = document.getElementById('kyc-file');
    const kycPreview = document.getElementById('kyc-upload-preview');
    if (kycFileInput) {
        kycFileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    kycPreview.innerHTML = '<img src="' + e.target.result + '" style="width:100%;display:block;">';
                    kycPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                kycPreview.innerHTML = '<span style="padding:12px;color:var(--text-muted);font-size:12px;">PDF: ' + file.name + '</span>';
                kycPreview.style.display = 'block';
            }
        });
    }

    document.getElementById('kyc-upload-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = document.getElementById('kyc-file').files[0];
        const docType = document.getElementById('kyc-doc-type').value;
        const msgEl = document.getElementById('kyc-upload-msg');
        if (!file) { msgEl.textContent = 'Selecciona un archivo.'; msgEl.style.display = 'block'; return; }
        try {
            msgEl.textContent = 'Subiendo...'; msgEl.style.display = 'block'; msgEl.style.color = 'var(--neon-cyan)';
            const reader = new FileReader();
            const base64 = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(file);
            });
            await ApiService._fetch('/settings/kyc', {
                method: 'POST',
                body: JSON.stringify({ documentType: docType, fileBase64: base64, fileName: file.name, mimeType: file.type }),
            });
            msgEl.textContent = 'Documento subido correctamente. Revisaremos tu verificación pronto.';
            msgEl.style.color = 'var(--neon-green)';
            document.getElementById('kyc-file').value = '';
            kycPreview.style.display = 'none';
        } catch (err) {
            msgEl.textContent = 'Error: ' + err.message;
            msgEl.style.color = 'var(--neon-magenta)';
        }
    });

    // --- Captcha Integration ---
    const captchaContainer = document.getElementById('captcha-container');
    let captchaWidgetId = null;
    if (typeof grecaptcha !== 'undefined' && captchaContainer) {
        captchaContainer.style.display = 'block';
    }

    function getCaptchaToken() {
        if (captchaWidgetId !== null && typeof grecaptcha !== 'undefined') {
            return grecaptcha.getResponse(captchaWidgetId);
        }
        return null;
    }

    // Integrate captcha with auth form
    const origAuthHandler = document.getElementById('auth-modal-form')?.onsubmit;
    document.getElementById('auth-modal-form')?.addEventListener('submit', function (e) {
        // Captcha token will be sent via header
        const token = getCaptchaToken();
        if (token) {
            // The api.js fetch will pick it up
        }
    });

    async function loadSettings() {
        try {
            const meData = await ApiService.me();
            const code = meData.referralCode;
            if (code) document.getElementById('settings-referral-code').textContent = code;

            const notifRes = await ApiService._fetch('/settings/notifications');
            document.getElementById('settings-email-notif').checked = notifRes.emailNotifications;
            document.getElementById('settings-push-notif').checked = notifRes.pushEnabled;

            const refRes = await ApiService._fetch('/referrals/stats');
            document.getElementById('settings-referral-count').textContent = refRes.referralCount;
            document.getElementById('settings-referral-earnings').textContent = `$${refRes.referralEarnings.toFixed(2)}`;

            const kycBadge = document.getElementById('kyc-status-badge');
            if (kycBadge && meData.kycStatus) {
                const labels = { pending: 'Pendiente de verificación', approved: 'Verificación aprobada', rejected: 'Verificación rechazada' };
                const icons = { pending: 'hourglass_empty', approved: 'verified', rejected: 'warning' };
                kycBadge.className = 'kyc-status-badge kyc-status-' + meData.kycStatus;
                kycBadge.innerHTML = '<span class="material-icons-round">' + (icons[meData.kycStatus] || 'help') + '</span>' +
                    '<span>' + (labels[meData.kycStatus] || meData.kycStatus) + '</span>';
                if (meData.kycStatus === 'approved') {
                    document.getElementById('kyc-upload-form').style.display = 'none';
                }
            }
        } catch (e) {
            showNotification('Error', 'No se pudieron cargar las configuraciones', 'error');
        }
    }

    if (document.getElementById('tab-settings')) {
        const origSwitch = window.switchTab;
        const origNavHandler = navItems[0]?.click?.toString();
    }
    // Override tab switch to load settings on demand
    document.querySelector('[data-tab="settings"]')?.addEventListener('click', () => {
        setTimeout(loadSettings, 100);
    });

    // --- Tab Router ---
    const PAGE_INFO = {
        dashboard: {
            title: "Dashboard de Inversionista",
            subtitle: "Rendimiento de tus contratos activos y balance del portafolio en tiempo real."
        },
        wallet: {
            title: "Billetera y Fondeo",
            subtitle: "Inyección de capital o liquidación de retiros verificados por la blockchain."
        },
        security: {
            title: "Centro de Seguridad",
            subtitle: "Protección de hardware AES-256 local y controles criptográficos TOTP."
        },
        network: {
            title: "Estructura de Red",
            subtitle: "Visualización interactiva en árbol binario del volumen organizacional."
        },
        codehub: {
            title: "Flutter Code Hub",
            subtitle: "Estructura física lib/ y módulos Dart generados en el espacio de trabajo."
        },
        admin: {
            title: "Panel de Administración",
            subtitle: "Gestión de retiros, usuarios y configuración del sistema."
        },
        settings: {
            title: "Configuración",
            subtitle: "Cambia tu contraseña, notificaciones y administra tu cuenta."
        },
        profile: {
            title: "Mi Perfil",
            subtitle: "Información personal, cartera y actividad reciente."
        }
    };

    // Global switch tab function
    window.switchTab = function(tabName) {
        const item = Array.from(navItems).find(i => i.getAttribute('data-tab') === tabName);
        if (item) {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            const targetContentEl = document.getElementById(`tab-${tabName}`);
            if (targetContentEl) {
                targetContentEl.classList.add('active');
            }

            if (PAGE_INFO[tabName]) {
                pageTitle.textContent = PAGE_INFO[tabName].title;
                pageSubtitle.textContent = PAGE_INFO[tabName].subtitle;
            }

            // Set subtab deposit active if navigating from dashboard new contract
            if (tabName === 'wallet') {
                subTabDepositBtn.click();
            }

            if (tabName === 'admin') {
                refreshAdminPanel();
            }

            if (tabName === 'profile') {
                loadProfile();
            }
        }
    };

    async function loadProfile() {
        try {
            const res = await ApiService._fetch('/api/profile');
            if (!res.ok) return;
            const data = await res.json();
            const u = data.user || {}, a = data.account || {};
            document.getElementById('profile-name').textContent = u.fullName || '—';
            document.getElementById('profile-email').textContent = u.email || '—';
            document.getElementById('profile-tier').textContent = (u.tier || 'silver').toUpperCase();
            document.getElementById('profile-tier').className = 'tier-badge ' + (u.tier || 'silver');
            document.getElementById('profile-balance').textContent = '$' + (a.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
            document.getElementById('profile-earnings').textContent = '$' + (a.accumulatedEarnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
            document.getElementById('profile-roi').textContent = (a.dailyRoi || 0) + '%';
            document.getElementById('profile-contracts').textContent = data.activeContracts || 0;
            document.getElementById('profile-since').textContent = u.memberSince ? new Date(u.memberSince).toLocaleDateString() : '—';
            document.getElementById('profile-kyc').textContent = u.kycStatus || '—';
            document.getElementById('profile-kyc').className = 'status-' + (u.kycStatus || 'pending');
            document.getElementById('profile-2fa').textContent = u.totpEnabled ? 'Activado' : 'No';
            const txContainer = document.getElementById('profile-recent-tx');
            const txs = data.recentTransactions || [];
            if (txs.length === 0) {
                txContainer.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px">Sin movimientos recientes</p>';
            } else {
                txContainer.innerHTML = txs.map(t =>
                    `<div class="tx-row"><span class="tx-type tx-${t.type || 'unknown'}">${t.type || '—'}</span><span>${t.asset || '—'}</span><span>$${t.amount || 0}</span><span class="tx-status tx-${t.status || 'pending'}">${t.status || '—'}</span></div>`
                ).join('');
            }
        } catch (e) {
            console.error('Error loading profile:', e);
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            const targetContentEl = document.getElementById(`tab-${targetTab}`);
            if (targetContentEl) {
                targetContentEl.classList.add('active');
            }

            if (PAGE_INFO[targetTab]) {
                pageTitle.textContent = PAGE_INFO[targetTab].title;
                pageSubtitle.textContent = PAGE_INFO[targetTab].subtitle;
            }

            if (targetTab === 'codehub') {
                if (codeDisplay.textContent === '...' || codeDisplay.textContent === '') {
                    loadCodeFile('app_theme');
                }
            }

            if (targetTab === 'admin') {
                refreshAdminPanel();
            }

            if (targetTab === 'profile') {
                loadProfile();
            }

            if (targetTab === 'settings') {
                setTimeout(loadSettings, 100);
            }
        });
    });


    // --- Live Financial Updates Simulator ---
    function simulateLiveROI() {
        setInterval(() => {
            currentRoi = 1.5 + Math.random() * 1.0;
            liveRoiEl.textContent = `+${currentRoi.toFixed(2)}%`;

            const increment = totalBalance * (currentRoi / 100) / 86400 * 4;
            totalBalance += increment;
            accumulatedEarnings += increment;

            liveBalanceEl.textContent = `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            liveEarningsEl.textContent = `+$${accumulatedEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

            // Prepends or updates the dynamic ledger row to feel 100% alive
            updateRoiLedger(currentRoi);
        }, 4000);
    }
    simulateLiveROI();

    function updateRoiLedger(rate) {
        const tbody = document.getElementById('roi-ledger-tbody');
        if (!tbody) return;

        // Calculate a realistic gain of the total active contracts ($10,000)
        const activeCapital = 10000;
        const gain = activeCapital * (rate / 100);

        const newRowHTML = `
            <td>Hoy (En Vivo)</td>
            <td class="text-success font-bold">+${rate.toFixed(2)}%</td>
            <td>$${gain.toFixed(2)} USD</td>
            <td><span class="badge badge-success pulse">Fluctuando</span></td>
        `;

        // If the first row is a "fluctuating" row, replace it. Otherwise insert
        const firstRow = tbody.rows[0];
        if (firstRow && firstRow.cells[3].innerText.includes('Fluctuando')) {
            firstRow.innerHTML = newRowHTML;
        } else {
            const row = tbody.insertRow(0);
            row.innerHTML = newRowHTML;
            
            // Limit rows to 6
            if (tbody.rows.length > 6) {
                tbody.deleteRow(6);
            }
        }
    }


    // --- Market Ticker Simulation ---
    function simulateMarketTicker() {
        function r() { return (Math.random() - 0.5) * 0.02; }
        let prices = { btc: 68420 + Math.random() * 500, eth: 3520 + Math.random() * 50, fut: 1250 + Math.random() * 30 };
        let changes = { btc: 0, eth: 0, fut: 0 };
        setInterval(() => {
            Object.keys(prices).forEach(k => { const c = r(); prices[k] += c; changes[k] = c; });
            const fmt = (v) => v.toFixed(2);
            const chg = (c) => c >= 0 ? `<span class="ticker-change up">+${(c/prices.btc*100).toFixed(2)}%</span>` : `<span class="ticker-change down">${(c/prices.btc*100).toFixed(2)}%</span>`;
            document.getElementById('ticker-btc').textContent = '$' + fmt(prices.btc);
            document.getElementById('ticker-btc-chg').innerHTML = chg(changes.btc);
            document.getElementById('ticker-eth').textContent = '$' + fmt(prices.eth);
            document.getElementById('ticker-eth-chg').innerHTML = chg(changes.eth);
            document.getElementById('ticker-fut').textContent = '$' + fmt(prices.fut);
            document.getElementById('ticker-fut-chg').innerHTML = chg(changes.fut);
            document.getElementById('ticker-vol').textContent = '$' + (80000000 + Math.random() * 50000000).toLocaleString('en-US', {maximumFractionDigits:0});
            document.getElementById('trade-price').textContent = '$' + fmt(prices.fut);
        }, 2500);
    }
    simulateMarketTicker();

    // --- Trading Widget ---
    document.getElementById('trade-buy-btn')?.addEventListener('click', () => {
        document.querySelectorAll('.trade-type-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('trade-buy-btn').classList.add('active');
    });
    document.getElementById('trade-sell-btn')?.addEventListener('click', () => {
        document.querySelectorAll('.trade-type-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('trade-sell-btn').classList.add('active');
    });
    document.getElementById('btn-execute-trade')?.addEventListener('click', () => {
        const side = document.querySelector('.trade-type-btn.active')?.dataset?.side || 'buy';
        const asset = document.getElementById('trade-asset')?.value || 'FUT';
        const amount = parseFloat(document.getElementById('trade-amount')?.value) || 0;
        if (amount < 10) { showNotification('Error', 'Monto mínimo $10 USD', 'error'); return; }
        showNotification(side === 'buy' ? 'Compra ejecutada' : 'Venta ejecutada',
            `${side === 'buy' ? 'Comprados' : 'Vendidos'} $${amount} de ${asset}`, 'success');
    });

    // --- Performance Chart ---
    function drawPerfChart() {
        const canvas = document.getElementById('perf-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;
        const data = Array.from({length:14}, () => 1.2 + Math.random() * 1.8);
        const bal = Array.from({length:14}, (_,i) => 10000 + i * 200 + Math.random() * 500);
        const pad = {t:20, b:20, l:40, r:20};
        const xStep = (W - pad.l - pad.r) / (data.length - 1);
        ctx.clearRect(0,0,W,H);
        function drawLine(arr, color, fill) {
            ctx.beginPath();
            arr.forEach((v,i) => { const x = pad.l + i * xStep; const y = pad.t + (1 - (v-Math.min(...arr))/(Math.max(...arr)-Math.min(...arr)||1)) * (H - pad.t - pad.b); i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); });
            if (fill) { ctx.lineTo(pad.l + (arr.length-1) * xStep, H - pad.b); ctx.lineTo(pad.l, H - pad.b); ctx.closePath(); ctx.fillStyle = color + '15'; ctx.fill(); }
            ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
        }
        drawLine(data, '#00D4FF', true);
        drawLine(bal.map(v=>(v-9000)/1000), '#00FF88', false);
        ctx.fillStyle = '#4A5278'; ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText('ROI %', pad.l, 14);
        ctx.fillText('7d', W - pad.r - 20, H - 6);
    }
    setTimeout(drawPerfChart, 300);
    window.addEventListener('resize', () => setTimeout(drawPerfChart, 300));

    // --- Investment Plans & Modal ---
    window.showAllPlans = function() {
        document.getElementById('plans-grid')?.scrollIntoView({ behavior: 'smooth' });
    };

    const PLAN_DATA = {
        Interbank: { rate: 4.2, term: '30 días', min: 5000, max: 50000, color: 'var(--neon-cyan)' },
        Institutional: { rate: 6.8, term: '60 días', min: 10000, max: 250000, color: '#A78BFA' },
        Crypto: { rate: 9.5, term: 'Flexible', min: 500, max: 25000, color: '#FFB800' },
        Premium: { rate: 12.0, term: '90 días', min: 25000, max: 500000, color: '#FFD700' },
    };

    window.openInvestModal = function(planName) {
        const plan = PLAN_DATA[planName];
        if (!plan) return;
        document.getElementById('invest-plan-name').textContent = planName;
        document.getElementById('invest-rate').textContent = plan.rate + '% mensual';
        document.getElementById('invest-term').textContent = plan.term;
        document.getElementById('invest-min').textContent = '$' + plan.min.toLocaleString();
        document.getElementById('invest-amount').value = plan.min;
        document.getElementById('invest-amount').min = plan.min;
        updateProjection(planName, plan.min);
        document.getElementById('invest-modal').style.display = 'flex';
    };

    function updateProjection(planName, amount) {
        const plan = PLAN_DATA[planName];
        if (!plan) return;
        const monthlyReturn = amount * (plan.rate / 100);
        document.getElementById('projection-return').textContent = '$' + monthlyReturn.toLocaleString('en-US', { minimumFractionDigits: 2 });
        document.getElementById('projection-total').textContent = '$' + (amount + monthlyReturn).toLocaleString('en-US', { minimumFractionDigits: 2 });
    }

    document.getElementById('invest-amount')?.addEventListener('input', function() {
        const planName = document.getElementById('invest-plan-name').textContent;
        const plan = PLAN_DATA[planName];
        if (!plan) return;
        const val = parseFloat(this.value) || 0;
        if (val < plan.min || val > plan.max) {
            this.style.borderColor = 'var(--neon-magenta)';
        } else {
            this.style.borderColor = '';
        }
        updateProjection(planName, val);
    });

    document.getElementById('btn-confirm-invest')?.addEventListener('click', function() {
        const planName = document.getElementById('invest-plan-name').textContent;
        const plan = PLAN_DATA[planName];
        const amount = parseFloat(document.getElementById('invest-amount').value) || 0;
        if (amount < plan.min || amount > plan.max) {
            showNotification('Error', `Monto debe ser entre $${plan.min.toLocaleString()} y $${plan.max.toLocaleString()}`, 'error');
            return;
        }
        const returnVal = amount * (plan.rate / 100);
        document.getElementById('invest-modal').style.display = 'none';
        showNotification('Inversión Confirmada',
            `$${amount.toLocaleString()} en ${planName}. Retorno estimado: $${returnVal.toLocaleString()}`,
            'success');
    });

    document.getElementById('invest-modal')?.addEventListener('click', function(e) {
        if (e.target === this) this.style.display = 'none';
    });

    // --- Hamburger Menu ---
    document.getElementById('hamburger-btn')?.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('sidebar-open');
    });
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !e.target.closest('.sidebar') && !e.target.closest('#hamburger-btn')) {
            document.querySelector('.sidebar')?.classList.remove('sidebar-open');
        }
    });

    // --- Tab Transitions ---
    const origSwitchFn = window.switchTab;
    window.switchTab = function(tabName) {
        const current = document.querySelector('.tab-content.active');
        const next = document.getElementById('tab-' + tabName);
        if (current && next && current !== next) {
            current.style.opacity = '0';
            current.style.transform = 'translateY(8px)';
            setTimeout(() => {
                current.classList.remove('active');
                current.style.opacity = '';
                current.style.transform = '';
                next.classList.add('active');
                next.style.opacity = '0';
                next.style.transform = 'translateY(8px)';
                requestAnimationFrame(() => {
                    next.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                    next.style.opacity = '1';
                    next.style.transform = 'translateY(0)';
                    setTimeout(() => { next.style.transition = ''; next.style.opacity = ''; next.style.transform = ''; }, 300);
                });
            }, 150);
        }
        if (origSwitchFn) origSwitchFn(tabName);
    };

    // --- ROI Calculator Tier Selection & Math ---
    tierOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            tierOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            activeTier = opt.getAttribute('data-tier');
            
            const bounds = { silver: 500, gold: 2500, black: 5000, interbank: 10000, institutional: 25000, premium: 50000 };
            const bound = bounds[activeTier] || 500;
            if (parseFloat(calcInvestmentSlider.value) < bound) calcInvestmentSlider.value = bound;
            else if (activeTier === 'silver' && calcInvestmentSlider.value >= 1000) calcInvestmentSlider.value = 500;

            updateCalculator();
        });
    });

    function updateCalculator() {
        const principal = parseFloat(calcInvestmentSlider.value);
        calcAmountLabel.textContent = `$${principal.toLocaleString('en-US')} USD`;

        let monthlyRate = 0;
        if (activeTier === 'silver') { monthlyRate = 0.0125;
            if (principal >= 1000) { setCalculatorTierActive('gold'); return; }
        } else if (activeTier === 'gold') { monthlyRate = 0.0175;
            if (principal >= 5000) { setCalculatorTierActive('black'); return; }
            if (principal < 1000) { setCalculatorTierActive('silver'); return; }
        } else if (activeTier === 'black') { monthlyRate = 0.0225;
            if (principal >= 10000) { setCalculatorTierActive('interbank'); return; }
            if (principal < 5000) { setCalculatorTierActive('gold'); return; }
        } else if (activeTier === 'interbank') { monthlyRate = 0.042;
            if (principal >= 25000) { setCalculatorTierActive('institutional'); return; }
            if (principal < 10000) { setCalculatorTierActive('black'); return; }
        } else if (activeTier === 'institutional') { monthlyRate = 0.068;
            if (principal >= 50000) { setCalculatorTierActive('premium'); return; }
            if (principal < 25000) { setCalculatorTierActive('interbank'); return; }
        } else if (activeTier === 'premium') { monthlyRate = 0.12;
            if (principal < 50000) { setCalculatorTierActive('institutional'); return; }
        }

        const dailyRate = monthlyRate / 30;
        const dailyReturn = principal * dailyRate;
        const monthlyReturn = principal * monthlyRate;
        const yearlyReturn = dailyReturn * 365;

        calcDailyVal.textContent = `+$${dailyReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
        calcMonthlyVal.textContent = `+$${monthlyReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
        calcYearlyVal.textContent = `+$${yearlyReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    }

    function setCalculatorTierActive(tierKey) {
        tierOptions.forEach(o => {
            if (o.getAttribute('data-tier') === tierKey) {
                o.classList.add('active');
            } else {
                o.classList.remove('active');
            }
        });
        activeTier = tierKey;
        updateCalculator();
    }

    calcInvestmentSlider.addEventListener('input', updateCalculator);
    updateCalculator(); // Run initial calculation


    // --- Double Wallet sub-tab switcher ---
    subTabWithdrawBtn.addEventListener('click', () => {
        subTabWithdrawBtn.classList.add('active');
        subTabDepositBtn.classList.remove('active');
        walletWithdrawContent.classList.add('active');
        walletDepositContent.classList.remove('active');
    });

    subTabDepositBtn.addEventListener('click', () => {
        subTabDepositBtn.classList.add('active');
        subTabWithdrawBtn.classList.remove('active');
        walletDepositContent.classList.add('active');
        walletWithdrawContent.classList.remove('active');
    });


    // --- Wallet Security Validation ---
    const WALLET_REGEX = {
        BTC: /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{25,39})$/,
        USDT_TRC20: /^T[A-Za-y0-9]{33}$/,
        USDT_ERC20: /^0x[a-fA-F0-9]{40}$/
    };

    const HELPERS = {
        BTC: "BTC debe empezar con '1', '3' o 'bc1' y tener entre 26 y 42 caracteres.",
        USDT_TRC20: "USDT TRC20 debe empezar con 'T' y tener exactamente 34 caracteres.",
        USDT_ERC20: "USDT ERC20 debe empezar con '0x' seguido de 40 dígitos hexadecimales."
    };

    function validateWalletInputs() {
        const asset = walletAssetSelect.value;
        const address = walletAddressInput.value.trim();
        const amount = parseFloat(walletAmountInput.value);
        
        let isAddressValid = false;

        walletHelperText.textContent = HELPERS[asset];

        if (address === '') {
            walletValidationIcon.textContent = 'pending';
            walletValidationIcon.className = 'material-icons-round validation-icon';
        } else if (WALLET_REGEX[asset].test(address)) {
            walletValidationIcon.textContent = 'check_circle';
            walletValidationIcon.className = 'material-icons-round validation-icon success';
            isAddressValid = true;
        } else {
            walletValidationIcon.textContent = 'error';
            walletValidationIcon.className = 'material-icons-round validation-icon error';
            isAddressValid = false;
        }

        const isFormComplete = isAddressValid && !isNaN(amount) && amount > 0;
        btnShowQR.disabled = !isFormComplete;
        btnTotalLiquidation.disabled = !isAddressValid;
    }

    walletAssetSelect.addEventListener('change', () => {
        walletAddressInput.value = '';
        validateWalletInputs();
        qrContainerBox.style.display = 'none';
    });
    walletAddressInput.addEventListener('input', validateWalletInputs);
    walletAmountInput.addEventListener('input', validateWalletInputs);


    // --- Show QR Gateway ---
    btnShowQR.addEventListener('click', () => {
        const asset = walletAssetSelect.options[walletAssetSelect.selectedIndex].text;
        const address = walletAddressInput.value.trim();

        qrAssetLabel.textContent = asset;
        qrAddressDisplay.textContent = address;
        qrContainerBox.style.display = 'block';

        qrContainerBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });


    // --- Deposit Fondeo Generator con QR real + polling ---
    function generateQR(address, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        try {
            new QRCode(container, { text: address, width: 160, height: 160 });
        } catch (e) {
            showNotification('QR no disponible', 'Usando placeholder', 'info');
        }
    }

    let depositPollInterval = null;

    function startDepositPolling(transactionId) {
        if (depositPollInterval) clearInterval(depositPollInterval);
        depositPollInterval = setInterval(async () => {
            try {
                const result = await ApiService.getDepositStatus(transactionId);
                if (result.transaction.status === 'completed') {
                    clearInterval(depositPollInterval);
                    depositPollInterval = null;
                    ScaffoldMessengerNote('Depósito Confirmado', `$${result.transaction.amount} USD acreditado en tu cuenta.`);
                    if (typeof syncWithBackend === 'function') syncWithBackend();
                }
            } catch (e) {
                // ignore polling errors
            }
        }, 15000);
    }

    btnGenerateDeposit.addEventListener('click', async () => {
        const assetKey = depositAssetSelect.value;
        const assetName = depositAssetSelect.options[depositAssetSelect.selectedIndex].text;
        const amount = document.getElementById('deposit-amount').value.trim();

        btnGenerateDeposit.disabled = true;
        btnGenerateDeposit.innerHTML = '<span class="material-icons-round pulse">sync</span> <span>GENERANDO BILLETERA...</span>';

        if (isLiveMode) {
            try {
                const result = await ApiService.deposit(assetKey, amount ? parseFloat(amount) : null);
                depositQRLabel.textContent = assetName;
                depositAddressDisplay.textContent = result.address;
                depositInstructionsCard.style.opacity = '1';
                depositInstructionsCard.style.pointerEvents = 'auto';
                generateQR(result.address, 'qrcode-deposit-container');
                ScaffoldMessengerNote('Dirección de Depósito Creada', result.message);
                if (result.transactionId) startDepositPolling(result.transactionId);
            } catch (e) {
                showModal('error', 'Error', e.message);
            }
            btnGenerateDeposit.disabled = false;
            btnGenerateDeposit.innerHTML = '<span class="material-icons-round">add_circle_outline</span> <span>Obtener Dirección de Fondeo</span>';
            return;
        }

        setTimeout(() => {
            btnGenerateDeposit.disabled = false;
            btnGenerateDeposit.innerHTML = '<span class="material-icons-round">add_circle_outline</span> <span>Obtener Dirección de Fondeo</span>';

            depositQRLabel.textContent = assetName;
            depositAddressDisplay.textContent = MOCK_DEPOSIT_ADDRESSES[assetKey];
            depositInstructionsCard.style.opacity = '1';
            depositInstructionsCard.style.pointerEvents = 'auto';
            generateQR(MOCK_DEPOSIT_ADDRESSES[assetKey], 'qrcode-deposit-container');

            ScaffoldMessengerNote('Dirección de Depósito Creada', `Fondeo en ${assetName} disponible para inyección inmediata.`);
        }, 1500);
    });

    btnCopyDeposit.addEventListener('click', () => {
        const address = depositAddressDisplay.textContent;
        if (address.includes('...')) return;

        navigator.clipboard.writeText(address).then(() => {
            const originalHTML = btnCopyDeposit.innerHTML;
            btnCopyDeposit.innerHTML = '<span class="material-icons-round text-success font-11">done</span>';
            setTimeout(() => {
                btnCopyDeposit.innerHTML = originalHTML;
            }, 1800);
        });
    });


    // --- CRITICAL ACTION: Total Liquidation Execution ---
    btnTotalLiquidation.addEventListener('click', async () => {
        const address = walletAddressInput.value.trim();

        btnTotalLiquidation.disabled = true;
        btnTotalLiquidation.innerHTML = '<span class="material-icons-round pulse">sync</span> <span>PROCESANDO RETIRO INSTITUCIONAL...</span>';

        if (isLiveMode) {
            try {
                const asset = walletAssetSelect.value;
                const result = await ApiService.withdraw(asset, address, totalBalance);
                showModal('check_circle', 'Liquidación Exitosa', result.message);
                totalBalance = 0;
                accumulatedEarnings = 0;
                liveBalanceEl.textContent = '$0.00';
                liveEarningsEl.textContent = '$0.00 USD';
                walletAddressInput.value = '';
                walletAmountInput.value = '';
                qrContainerBox.style.display = 'none';
                validateWalletInputs();
                btnTotalLiquidation.innerHTML = '<span class="material-icons-round">warning_amber</span> <span>EJECUTAR LIQUIDACIÓN TOTAL</span>';
                return;
            } catch (e) {
                showModal('error', 'Error', e.message);
                btnTotalLiquidation.disabled = false;
                btnTotalLiquidation.innerHTML = '<span class="material-icons-round">warning_amber</span> <span>EJECUTAR LIQUIDACIÓN TOTAL</span>';
                return;
            }
        }
        
        setTimeout(() => {
            btnTotalLiquidation.innerHTML = '<span class="material-icons-round">warning_amber</span> <span>EJECUTAR LIQUIDACIÓN TOTAL</span>';
            
            showModal(
                'check_circle',
                'Liquidación Exitosa',
                `La liquidación de $${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD ha sido aprobada con éxito. Los fondos serán transmitidos al monedero blockchain [${address.substring(0, 8)}...${address.substring(address.length - 8)}] en un lapso estimado de 10 minutos.`
            );

            totalBalance = 0;
            accumulatedEarnings = 0;
            liveBalanceEl.textContent = '$0.00';
            liveEarningsEl.textContent = '$0.00 USD';

            walletAddressInput.value = '';
            walletAmountInput.value = '';
            qrContainerBox.style.display = 'none';
            validateWalletInputs();
        }, 3000);
    });


    // --- AES-256 Encryption Engine (Web Crypto API - AES-GCM) ---
    let lastCiphertext = "";
    let cryptoKey = null;

    async function getAESKey() {
        if (cryptoKey) return cryptoKey;
        cryptoKey = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
        return cryptoKey;
    }

    function arrayBufferToBase64(buf) {
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function base64ToArrayBuffer(b64) {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    btnEncrypt.addEventListener('click', async () => {
        const plainText = aesInput.value.trim();
        if (plainText === '') return;

        try {
            const key = await getAESKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encoded = new TextEncoder().encode(plainText);

            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                encoded
            );

            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encrypted), iv.length);

            lastCiphertext = arrayBufferToBase64(combined.buffer);

            aesCipherOutput.textContent = lastCiphertext;
            aesResultsContainer.style.display = 'flex';
            btnDecrypt.disabled = false;
            aesPlainContainer.style.display = 'none';
        } catch (e) {
            showModal('error', 'Error de Cifrado', e.message || 'Ocurrió un error al cifrar los datos.');
        }
    });

    btnDecrypt.addEventListener('click', async () => {
        if (!lastCiphertext) return;

        try {
            const combined = new Uint8Array(base64ToArrayBuffer(lastCiphertext));

            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            const key = await getAESKey();
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                ciphertext
            );

            const decryptedString = new TextDecoder().decode(decrypted);
            aesPlainOutput.textContent = decryptedString;
            aesPlainContainer.style.display = 'block';
        } catch (e) {
            showModal('error', 'Fallo en el Descifrado', 'El criptograma está dañado o la llave criptográfica ha cambiado.');
        }
    });

    aesInput.addEventListener('input', () => {
        if (aesInput.value.trim() === '') {
            btnDecrypt.disabled = true;
            aesPlainContainer.style.display = 'none';
        }
    });


    // --- 2FA Authenticator TOTP Engine (RFC 6238 / HMAC-SHA1) ---
    const TOTP_SECRET = window.FUT_CONFIG?.TOTP_SECRET || 'FUTINVEST777TRUSTKEY';
    let totpInterval = null;
    let totpSeconds = 30;
    let lastTotpWindow = -1;

    async function computeTOTP() {
        try {
            const epoch = Math.floor(Date.now() / 1000);
            const counter = Math.floor(epoch / 30);

            if (counter === lastTotpWindow) return;
            lastTotpWindow = counter;

            const counterBuf = new ArrayBuffer(8);
            const counterView = new DataView(counterBuf);
            counterView.setUint32(0, Math.floor(counter / 0x100000000));
            counterView.setUint32(4, counter >>> 0);

            const key = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(TOTP_SECRET),
                { name: 'HMAC', hash: 'SHA-1' },
                false,
                ['sign']
            );

            const hmacResult = await crypto.subtle.sign('HMAC', key, counterBuf);
            const hmac = new Uint8Array(hmacResult);

            const offset = hmac[hmac.length - 1] & 0xf;
            const code = ((hmac[offset] & 0x7f) << 24) |
                         ((hmac[offset + 1] & 0xff) << 16) |
                         ((hmac[offset + 2] & 0xff) << 8) |
                         (hmac[offset + 3] & 0xff);

            const totpStr = (code % 1000000).toString().padStart(6, '0');
            totpCodeEl.textContent = `${totpStr.substring(0, 3)} ${totpStr.substring(3)}`;
        } catch (e) {
            console.error('TOTP error:', e);
        }
    }

    function updateTotpUI() {
        if (totpSeconds > 1) {
            totpSeconds--;
        } else {
            totpSeconds = 30;
        }

        const percentage = (totpSeconds / 30) * 100;
        totpTimerFill.style.width = `${percentage}%`;
        totpTimerText.textContent = `El código cambiará en ${totpSeconds} segundos`;

        if (totpSeconds < 8) {
            totpTimerFill.classList.add('danger');
            totpTimerText.style.color = 'var(--color-secondary)';
            totpTimerText.style.fontWeight = '700';
        } else {
            totpTimerFill.classList.remove('danger');
            totpTimerText.style.color = 'var(--color-text-muted)';
            totpTimerText.style.fontWeight = 'normal';
        }

        computeTOTP();
    }

    toggle2fa.addEventListener('change', async () => {
        if (toggle2fa.checked) {
            if (isLiveMode) {
                try {
                    await ApiService.toggle2FA(true);
                } catch (e) {
                    showModal('error', 'Error', e.message);
                    toggle2fa.checked = false;
                    return;
                }
            }
            totpDisplayArea.style.opacity = '1';
            totpDisplayArea.style.pointerEvents = 'auto';
            totpSeconds = 30;
            lastTotpWindow = -1;
            computeTOTP();
            totpInterval = setInterval(updateTotpUI, 1000);

            showModal('check_circle', '2FA Habilitado', 'Autenticador de doble factor activo. Los códigos temporales se sincronizan con HMAC-SHA1.');
        } else {
            if (isLiveMode) {
                try { await ApiService.toggle2FA(false); } catch (_) {}
            }
            totpDisplayArea.style.opacity = '0.5';
            totpDisplayArea.style.pointerEvents = 'none';
            clearInterval(totpInterval);
            totpCodeEl.textContent = '000 000';
            totpTimerFill.style.width = '100%';
            totpTimerText.textContent = 'El código cambiará en 30 segundos';
            totpTimerFill.classList.remove('danger');
        }
    });


    // --- Interactive Binary Tree Network Canvas ---
    let zoomLevel = 1.0;
    let isDragging = false;
    let startX, startY, currentX = 0, currentY = 0;
    const canvasWrapper = document.getElementById('canvas-wrapper');

    canvasWrapper.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - currentX;
        startY = e.clientY - currentY;
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvasWrapper.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;
        updateTreeTransform();
    });

    btnZoomIn.addEventListener('click', () => {
        if (zoomLevel < 2.0) {
            zoomLevel += 0.15;
            updateTreeTransform();
        }
    });

    btnZoomOut.addEventListener('click', () => {
        if (zoomLevel > 0.4) {
            zoomLevel -= 0.15;
            updateTreeTransform();
        }
    });

    btnZoomReset.addEventListener('click', () => {
        zoomLevel = 1.0;
        currentX = 0;
        currentY = 0;
        updateTreeTransform();
    });

    function updateTreeTransform() {
        interactiveTree.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) scale(${zoomLevel})`;
    }


    // --- Flutter Code Exporter tab ---
    function loadCodeFile(fileKey) {
        if (FLUTTER_CODEBASE[fileKey]) {
            codeDisplay.textContent = FLUTTER_CODEBASE[fileKey];
            activeFileName.textContent = `lib/${fileKey.includes('theme') ? 'theme' : fileKey.includes('service') ? 'services' : 'screens'}/${fileKey}.dart`;
            
            fileItems.forEach(item => {
                if (item.getAttribute('data-file') === fileKey) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
    }

    fileItems.forEach(item => {
        item.addEventListener('click', () => {
            const fileKey = item.getAttribute('data-file');
            loadCodeFile(fileKey);
        });
    });

    btnCopyCode.addEventListener('click', () => {
        const codeText = codeDisplay.textContent;
        navigator.clipboard.writeText(codeText).then(() => {
            const originalHTML = btnCopyCode.innerHTML;
            btnCopyCode.innerHTML = '<span class="material-icons-round text-success">done</span> <span>Copiado</span>';
            setTimeout(() => {
                btnCopyCode.innerHTML = originalHTML;
            }, 2000);
        }).catch(err => {
            showNotification('Error al copiar', err.message, 'error');
        });
    });


    // --- Helper UI Notes ---
    function ScaffoldMessengerNote(title, msg) {
        // Mock a sleek dynamic toast notification in bottom right
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `<strong class="toast-title">${title}</strong><span>${msg}</span>`;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'scale-up 0.25s reverse';
            setTimeout(() => toast.remove(), 250);
        }, 3500);
    }

    // --- Modals System helper ---
    function showModal(icon, title, message) {
        modalAlertIcon.textContent = icon;
        modalAlertIcon.className = `material-icons-round modal-icon ${icon === 'error' || icon === 'warning_amber' ? 'warning' : ''}`;
        modalAlertTitle.textContent = title;
        modalAlertMessage.textContent = message;
        modalAlert.style.display = 'flex';
    }

    btnCloseModal.addEventListener('click', () => {
        modalAlert.style.display = 'none';
    });

    modalAlert.addEventListener('click', (e) => {
        if (e.target === modalAlert) {
            modalAlert.style.display = 'none';
        }
    });

    // --- Dark Mode Toggle ---
    const savedTheme = localStorage.getItem('futinvest_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = savedTheme === 'dark' ? '<span class="material-icons-round">light_mode</span>' : '<span class="material-icons-round">dark_mode</span>';
    themeToggle.title = savedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro';
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('futinvest_theme', next);
        themeToggle.innerHTML = next === 'dark' ? '<span class="material-icons-round">light_mode</span>' : '<span class="material-icons-round">dark_mode</span>';
        themeToggle.title = next === 'dark' ? 'Modo claro' : 'Modo oscuro';
    });

    // --- Locale Selector ---
    const localeSelect = document.createElement('select');
    localeSelect.className = 'locale-select';
    localeSelect.innerHTML = '<option value="es">ES</option><option value="en">EN</option>';
    localeSelect.value = getLocale();
    localeSelect.addEventListener('change', (e) => setLocale(e.target.value));

    // --- i18n: Traducir UI al cambiar idioma ---
    const I18N_ELEMENTS = {
        'current-page-title': { es: 'Dashboard de Inversionista', en: 'Investor Dashboard' },
        'current-page-subtitle': { es: 'Rendimiento de tus contratos activos y balance del portafolio.', en: 'Performance of your active contracts and portfolio balance.' },
        'hero-card-tag': { es: 'BALANCE TOTAL DISPONIBLE', en: 'TOTAL AVAILABLE BALANCE' },
        'live-roi-label': { es: 'ROI Diario: ', en: 'Daily ROI: ' },
        'stat-label-earnings': { es: 'Ganancia Acumulada (Contratos Activos)', en: 'Accumulated Earnings (Active Contracts)' },
        'stat-label-capital': { es: 'Capital Total en Contratos', en: 'Total Capital in Contracts' },
    };

    function translateUI() {
        const locale = getLocale();
        for (const [id, texts] of Object.entries(I18N_ELEMENTS)) {
            const el = document.getElementById(id);
            if (el) el.textContent = texts[locale] || texts.es;
        }
        // Nav items
        const navLabels = {
            'btn-tab-dashboard': { es: 'Dashboard', en: 'Dashboard' },
            'btn-tab-wallet': { es: 'Billetera', en: 'Wallet' },
            'btn-tab-security': { es: 'Seguridad', en: 'Security' },
            'btn-tab-network': { es: 'Red Binaria', en: 'Binary Network' },
            'btn-tab-codehub': { es: 'Flutter Code Hub', en: 'Flutter Code Hub' },
            'btn-tab-admin': { es: 'Administración', en: 'Admin Panel' },
            'btn-tab-settings': { es: 'Configuración', en: 'Settings' },
        };
        for (const [id, texts] of Object.entries(navLabels)) {
            const btn = document.getElementById(id);
            if (btn) {
                const span = btn.querySelector('span:last-child');
                if (span) span.textContent = texts[locale] || texts.es;
            }
        }
        // Auth modal
        const authTitle = document.getElementById('auth-modal-title');
        if (authTitle && !isRegisterMode) {
            authTitle.textContent = locale === 'en' ? 'Sign In' : 'Iniciar Sesión';
            document.getElementById('auth-modal-desc').textContent = locale === 'en'
                ? 'Access your institutional investment panel.'
                : 'Accede a tu panel de inversión institucional.';
        }
    }

    window.addEventListener('locale:changed', translateUI);

    // Add controls to sidebar footer
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter) {
        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '8px';
        controls.style.marginTop = '8px';
        controls.style.alignItems = 'center';
        controls.appendChild(themeToggle);
        controls.appendChild(localeSelect);
        sidebarFooter.appendChild(controls);
    }

    // --- Socket.IO ROI Real-time ---
    let socket = null;
    function connectSocket() {
        if (socket?.connected) return;
        try {
            const wsUrl = (window.FUT_CONFIG && window.FUT_CONFIG.WS_URL) || 'http://localhost:3001';
            const token = ApiService.token;
            socket = io(wsUrl, { transports: ['websocket', 'polling'], auth: { token } });
            socket.on('connect', () => {
                if (ApiService.isAuthenticated) {
                    const user = JSON.parse(atob(ApiService.token.split('.')[1]));
                    socket.emit('subscribe:roi', user.userId);
                }
            });
            socket.on('roi:update', (data) => {
                if (data.rate) {
                    currentRoi = parseFloat(data.rate.toFixed(2));
                    liveRoiEl.textContent = `+${currentRoi}%`;
                }
            });
            socket.on('disconnect', () => {});
        } catch (e) {
            if (window.Sentry && window.SENTRY_DSN) Sentry.captureException(e);
            showNotification('Socket.IO no disponible', 'Conexión en tiempo real fallida', 'error');
        }
    }

    // Conectar Socket.IO al autenticar
    window.addEventListener('auth:login', connectSocket);
    if (ApiService.token) connectSocket();

    // --- In-app Notification System ---
    const notifCenter = document.getElementById('notification-center') || (() => {
        const el = document.createElement('div');
        el.id = 'notification-center';
        el.className = 'notification-center';
        document.body.appendChild(el);
        return el;
    })();

    function showNotification(title, body, type) {
        if (!notifCenter) return;
        const toast = document.createElement('div');
        toast.className = 'notification-toast notif-' + (type || 'info');
        const icons = { success: 'check_circle', error: 'error', info: 'info' };
        toast.innerHTML = '<span class="material-icons-round notif-icon">' + (icons[type] || 'info') + '</span>' +
            '<div class="notif-content">' +
            '<div class="notif-title">' + title + '</div>' +
            '<div class="notif-body">' + body + '</div>' +
            '</div>';
        notifCenter.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 350);
        }, 5000);
    }

    // Socket.IO notification listeners
    function setupNotificationListeners(sock) {
        if (!sock) return;
        sock.on('notification:deposit', (data) => showNotification(data.title, data.body, 'success'));
        sock.on('notification:withdrawal', (data) => showNotification(data.title, data.body, data.type));
        sock.on('notification:kyc', (data) => showNotification(data.title, data.body, data.type));
    }

    // Integrar con connectSocket existente
    const origConnect = connectSocket;
    connectSocket = function () {
        origConnect();
        if (socket) setupNotificationListeners(socket);
    };
    if (socket) setupNotificationListeners(socket);

    // --- Tree node click handlers (SVG data-*) ---
    document.querySelectorAll('.tree-node').forEach(node => {
        node.addEventListener('click', (e) => {
            const el = e.currentTarget;
            document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('active-node'));
            el.classList.add('active-node');

            const name = el.dataset.name;
            const role = el.dataset.role;
            const left = el.dataset.left;
            const right = el.dataset.right;
            const volume = el.dataset.volume;

            document.getElementById('node-details-name').textContent = name;
            document.getElementById('node-details-role').textContent = role;
            document.getElementById('node-details-volume').textContent = `$${volume} USD`;
            document.getElementById('node-details-pts-left').textContent = `${left} pts`;
            document.getElementById('node-details-pts-right').textContent = `${right} pts`;

            const detailsCard = document.getElementById('node-details-card');
            detailsCard.className = 'glass-card compact-card';
            if (role.includes('Izquierdo')) detailsCard.classList.add('border-left-primary');
            else if (role.includes('Derecho')) detailsCard.classList.add('border-left-secondary');
        });
    });
});
