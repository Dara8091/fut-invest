import 'dart:math';
import 'package:flutter/material.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? super.key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  // Balance simulado
  double _totalBalance = 12450.75;
  double _dailyROIPercentage = 1.85; // ROI base
  double _accumulatedEarnings = 342.10;

  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _simulateLiveROIUpdate();
  }

  // Simular fluctuación del ROI diario entre 1.5% y 2.5%
  void _simulateLiveROIUpdate() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        setState(() {
          _dailyROIPercentage = 1.5 + _random.nextDouble() * 1.0;
          // Pequeño incremento al balance para simular ganancias en vivo
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
            // Encabezado
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Bienvenido a',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: const Color(0xFF667085),
                      ),
                    ),
                    Text(
                      'fut.invest',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        fontSize: 28,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF12B76A).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.shield, color: Color(0xFF12B76A), size: 16),
                      SizedBox(width: 4),
                      Text(
                        'Trust Sec',
                        style: TextStyle(
                          color: Color(0xFF12B76A),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                )
              ],
            ),
            const SizedBox(height: 24),

            // Card Principal: Balance Total (Institutional Trust Navy)
            Card(
              color: const Color(0xFF002855),
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'BALANCE TOTAL DE INVERSIÓN',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '\$${_totalBalance.toStringAsFixed(2)} USD',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 30,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const Icon(
                          Icons.trending_up,
                          color: Color(0xFF12B76A),
                          size: 32,
                        ),
                      ],
                    ),
                    const Divider(color: Colors.white24, height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Retorno Diario Actual (ROI)',
                              style: TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '+${_dailyROIPercentage.toStringAsFixed(2)}%',
                              style: const TextStyle(
                                color: Color(0xFF12B76A),
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'Ganancias Acumuladas',
                              style: TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '+\$${_accumulatedEarnings.toStringAsFixed(2)}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        )
                      ],
                    )
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Estadísticas Rápidas
            Text(
              'Rendimiento Institucional',
              style: theme.textTheme.headlineMedium?.copyWith(fontSize: 18),
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: _buildMetricCard(
                    title: 'Seguridad',
                    value: '100% Activa',
                    subtitle: 'Cifrado AES-256',
                    icon: Icons.lock_outline,
                    iconColor: const Color(0xFF002855),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMetricCard(
                    title: 'Red Binaria',
                    value: 'Activo',
                    subtitle: 'Puntos Izq/Der',
                    icon: Icons.account_tree_outlined,
                    iconColor: const Color(0xFFD90000),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Tarjeta Informativa de ROI (Rango 1.5% - 2.5%)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8.0),
                border: Border.all(color: const Color(0xFFE1E2E5)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF002855).withOpacity(0.05),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.percent,
                      color: Color(0xFF002855),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'ROI Dinámico Establecido',
                          style: TextStyle(
                            color: Color(0xFF1A1C1E),
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'El retorno de inversión diario fluctúa entre el 1.5% y el 2.5% dependiendo del volumen y liquidez institucional del mercado.',
                          style: TextStyle(
                            color: Color(0xFF667085),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: iconColor, size: 24),
                const Icon(Icons.arrow_forward_ios, size: 12, color: Colors.grey),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                color: Color(0xFF667085),
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                color: Color(0xFF1A1C1E),
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                color: Color(0xFF98A2B3),
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
