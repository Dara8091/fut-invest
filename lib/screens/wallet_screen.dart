import 'package:flutter/material.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({Key? super.key}) : super(key: super.key);

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final _addressController = TextEditingController();
  final _amountController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  String _selectedAsset = 'USDT (TRC20)';
  bool _isAddressValid = false;
  bool _showQRCode = false;
  bool _isLiquidating = false;

  // Variables de depósito
  String _selectedDepositAsset = 'USDT (TRC20)';
  String? _depositAddress;
  bool _isGeneratingDeposit = false;

  final Map<String, String> _mockDepositAddresses = {
    'BTC': '1FutInvest883DepositBtcAddress777Xy',
    'USDT (TRC20)': 'TInvestTRC20DepositUSDT998242Apx7',
    'USDT (ERC20)': '0xInvestERC20DepositUSDT88374242A77A1',
  };

  final RegExp _btcRegex = RegExp(r'^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{25,39})$');
  final RegExp _usdtTrc20Regex = RegExp(r'^T[A-Za-z0-9]{33}$');
  final RegExp _usdtErc20Regex = RegExp(r'^0x[a-fA-F0-9]{40}$');

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

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

  void _generateWithdrawalQR() {
    if (_formKey.currentState!.validate() && _isAddressValid) {
      setState(() {
        _showQRCode = true;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Pasarela inicializada. Dirección validada.'),
          backgroundColor: Color(0xFF12B76A),
        ),
      );
    }
  }

  void _generateDepositAddress() {
    setState(() {
      _isGeneratingDeposit = true;
      _depositAddress = null;
    });

    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() {
          _isGeneratingDeposit = false;
          _depositAddress = _mockDepositAddresses[_selectedDepositAsset];
        });
      }
    });
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
            title: Row(
              children: const [
                Icon(Icons.check_circle, color: Color(0xFF12B76A)),
                SizedBox(width: 8),
                Text('Liquidación Exitosa'),
              ],
            ),
            content: const Text(
              'La liquidación total de fondos ha sido autorizada. El pago será transmitido a la blockchain en los próximos 10 minutos.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Entendido', style: TextStyle(color: Color(0xFF002855))),
              ),
            ],
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _addressController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Billetera y Fondeo'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: theme.colorScheme.secondary,
          tabs: const [
            Tab(icon: Icon(Icons.call_made), text: 'Retiros'),
            Tab(icon: Icon(Icons.call_received), text: 'Depósitos'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildWithdrawView(theme),
          _buildDepositView(theme),
        ],
      ),
    );
  }

  Widget _buildWithdrawView(ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Retiro y Liquidación', style: theme.textTheme.headlineMedium?.copyWith(fontSize: 20)),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Activo de Destino', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedAsset,
                      decoration: const InputDecoration(border: OutlineInputBorder()),
                      items: const [
                        DropdownMenuItem(value: 'BTC', child: Text('BTC')),
                        DropdownMenuItem(value: 'USDT (TRC20)', child: Text('USDT (TRC20)')),
                        DropdownMenuItem(value: 'USDT (ERC20)', child: Text('USDT (ERC20)')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedAsset = val;
                            _validateAddress(_addressController.text);
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 16),
                    const Text('Dirección de Billetera', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _addressController,
                      decoration: InputDecoration(
                        hintText: 'Ingrese su dirección $_selectedAsset',
                        border: const OutlineInputBorder(),
                        suffixIcon: _addressController.text.isNotEmpty
                            ? Icon(
                                _isAddressValid ? Icons.check_circle : Icons.error,
                                color: _isAddressValid ? const Color(0xFF12B76A) : const Color(0xFFD90000),
                              )
                            : null,
                      ),
                      onChanged: _validateAddress,
                      validator: (value) {
                        if (value == null || value.isEmpty) return 'Requerido';
                        if (!_isAddressValid) return 'Formato inválido';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    const Text('Monto a Liquidar (USD)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _amountController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(prefixText: '\$ ', border: OutlineInputBorder()),
                      validator: (value) {
                        if (value == null || value.isEmpty) return 'Requerido';
                        if (double.tryParse(value) == null) return 'Monto inválido';
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isAddressValid ? _generateWithdrawalQR : null,
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF002855), foregroundColor: Colors.white),
                        child: const Text('Mostrar QR de Pago'),
                      ),
                    )
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (_showQRCode)
              Card(
                color: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    children: [
                      const Text('CÓDIGO DE RETIRO BLOCKCHAIN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                      const SizedBox(height: 12),
                      const Center(child: Icon(Icons.qr_code_2, size: 140, color: Color(0xFF002855))),
                      const SizedBox(height: 12),
                      SelectableText(_addressController.text, textAlign: TextAlign.center, style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 16),
            Card(
              color: const Color(0xFFD90000).withOpacity(0.05),
              shape: RoundedRectangleBorder(side: const BorderSide(color: Color(0xFFD90000)), borderRadius: BorderRadius.circular(8.0)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Liquidación Completa de Capital', style: TextStyle(color: Color(0xFFD90000), fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: (_isAddressValid && !_isLiquidating) ? _runTotalLiquidation : null,
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD90000), foregroundColor: Colors.white),
                        child: _isLiquidating ? const CircularProgressIndicator(color: Colors.white) : const Text('LIQUIDAR TODO AHORA'),
                      ),
                    )
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildDepositView(ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Añadir Capital al Portafolio', style: theme.textTheme.headlineMedium?.copyWith(fontSize: 20)),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Activo Blockchain a Depositar', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedDepositAsset,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    items: const [
                      DropdownMenuItem(value: 'BTC', child: Text('BTC')),
                      DropdownMenuItem(value: 'USDT (TRC20)', child: Text('USDT (TRC20)')),
                      DropdownMenuItem(value: 'USDT (ERC20)', child: Text('USDT (ERC20)')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _selectedDepositAsset = val;
                          _depositAddress = null;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isGeneratingDeposit ? null : _generateDepositAddress,
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF002855), foregroundColor: Colors.white),
                      child: _isGeneratingDeposit ? const CircularProgressIndicator(color: Colors.white) : const Text('Obtener Dirección de Fondeo'),
                    ),
                  )
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (_depositAddress != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    const Text('DIRECCIÓN DE DEPÓSITO INSTITUCIONAL', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                    const SizedBox(height: 16),
                    const Center(child: Icon(Icons.qr_code_2, size: 140, color: Color(0xFFD90000))),
                    const SizedBox(height: 12),
                    SelectableText(_depositAddress!, textAlign: TextAlign.center, style: const TextStyle(fontFamily: 'monospace', fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: const Color(0xFFD90000).withOpacity(0.05), borderRadius: BorderRadius.circular(6)),
                      child: Row(
                        children: const [
                          Icon(Icons.warning, color: Color(0xFFD90000), size: 18),
                          SizedBox(width: 8),
                          Expanded(child: Text('Solo envíe el activo especificado. El envío de otros tokens resultará en pérdidas permanentes.', style: TextStyle(color: Color(0xFFD90000), fontSize: 11))),
                        ],
                      ),
                    )
                  ],
                ),
              ),
            )
        ],
      ),
    );
  }
}
