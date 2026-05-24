import 'package:flutter/material.dart';

class BinaryTreeScreen extends StatefulWidget {
  const BinaryTreeScreen({Key? super.key}) : super(key: key);

  @override
  State<BinaryTreeScreen> createState() => _BinaryTreeScreenState();
}

class _BinaryTreeScreenState extends State<BinaryTreeScreen> {
  // Puntos de la red binaria
  final int _leftPoints = 12500;
  final int _rightPoints = 8400;
  
  String _selectedNodeInfo = 'Toca cualquier nodo de tu red para ver su rendimiento y volumen acumulado.';
  String _selectedNodeName = 'Red Binaria Global';

  void _showNodeDetails(String name, String pointsLeft, String pointsRight, String volume) {
    setState(() {
      _selectedNodeName = name;
      _selectedNodeInfo = 'Puntos Izquierda: $pointsLeft pts\nPuntos Derecha: $pointsRight pts\nVolumen total acumulado: \$${volume} USD';
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: Column(
        children: [
          // Sección Superior: Métricas y Estado
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Mi Red Multinivel',
                  style: theme.textTheme.headlineMedium?.copyWith(fontSize: 22),
                ),
                const SizedBox(height: 12),
                
                // Marcador de Puntos Izq/Der (Diseño de tarjetas de Institutional Trust)
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: const Color(0xFFE1E2E5)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('PUNTOS IZQUIERDA', style: TextStyle(fontSize: 10, color: Color(0xFF667085), fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('$_leftPoints pts', style: const TextStyle(fontSize: 20, color: Color(0xFF002855), fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: const Color(0xFFE1E2E5)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('PUNTOS DERECHA', style: TextStyle(fontSize: 10, color: Color(0xFF667085), fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('$_rightPoints pts', style: const TextStyle(fontSize: 20, color: Color(0xFFD90000), fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Sección Central: El Árbol Binario Interactivo usando InteractiveViewer
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE1E2E5)),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Stack(
                  children: [
                    // Grid de fondo simulado
                    Positioned.fill(
                      child: CustomPaint(
                        painter: GridPainter(),
                      ),
                    ),

                    // Visor Interactivo para Zoom y Pan
                    InteractiveViewer(
                      boundaryMargin: const EdgeInsets.all(300.0),
                      minScale: 0.3,
                      maxScale: 2.0,
                      child: Center(
                        child: SizedBox(
                          width: 600,
                          height: 400,
                          child: Stack(
                            children: [
                              // Conexiones de líneas pintadas
                              Positioned.fill(
                                child: CustomPaint(
                                  painter: ConnectionLinesPainter(),
                                ),
                              ),
                              
                              // Nivel 0 (Raíz - Patrocinador)
                              Positioned(
                                left: 260,
                                top: 20,
                                child: _buildNode('Tú (Raíz)', 'Principal', '12,500', '8,400', '20,900', Colors.blue.shade900),
                              ),

                              // Nivel 1 (Izquierda y Derecha)
                              Positioned(
                                left: 100,
                                top: 120,
                                child: _buildNode('Líder Izq', 'Lado Izquierdo', '7,200', '5,300', '12,500', const Color(0xFF002855)),
                              ),
                              Positioned(
                                left: 420,
                                top: 120,
                                child: _buildNode('Líder Der', 'Lado Derecho', '4,100', '4,300', '8,400', const Color(0xFFD90000)),
                              ),

                              // Nivel 2 (Nodos finales de ejemplo)
                              Positioned(
                                left: 20,
                                top: 240,
                                child: _buildNode('Socio A', 'Nivel 2', '3,500', '3,700', '7,200', Colors.grey.shade700),
                              ),
                              Positioned(
                                left: 180,
                                top: 240,
                                child: _buildNode('Socio B', 'Nivel 2', '2,100', '3,200', '5,300', Colors.grey.shade700),
                              ),
                              Positioned(
                                left: 340,
                                top: 240,
                                child: _buildNode('Socio C', 'Nivel 2', '2,000', '2,100', '4,100', Colors.grey.shade700),
                              ),
                              Positioned(
                                left: 500,
                                top: 240,
                                child: _buildNode('Socio D', 'Nivel 2', '2,200', '2,100', '4,300', Colors.grey.shade700),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Mensaje flotante de instrucción de zoom
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF002855).withOpacity(0.85),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.zoom_in, color: Colors.white, size: 14),
                            SizedBox(width: 4),
                            Text(
                              'Pellizca para Zoom / Arrastra',
                              style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Sección Inferior: Panel de Detalles del Nodo Seleccionado
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8.0),
              border: Border.all(color: const Color(0xFFE1E2E5)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _selectedNodeName,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Color(0xFF002855),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _selectedNodeInfo,
                  style: const TextStyle(
                    color: Color(0xFF667085),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNode(String name, String role, String pointsLeft, String pointsRight, String volume, Color color) {
    return GestureDetector(
      onTap: () => _showNodeDetails(name, pointsLeft, pointsRight, volume),
      child: Container(
        width: 120,
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8.0),
          border: Border.all(color: color, width: 2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 3,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(Icons.person, color: color, size: 24),
            const SizedBox(height: 4),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF1A1C1E)),
            ),
            Text(
              role,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 9, color: Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }
}

// Pintor personalizado para dibujar las líneas de conexión de la red binaria
class ConnectionLinesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFE1E2E5)
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    // Coordenadas aproximadas de los centros de los nodos
    // Raíz: 260 + 60, 20 + 20
    const rootX = 320.0;
    const rootY = 40.0;

    // L1: Izq 160, 140 | Der 480, 140
    const l1IzqX = 160.0;
    const l1IzqY = 140.0;
    const l1DerX = 480.0;
    const l1DerY = 140.0;

    // L2: Socios
    const l2A = 80.0;
    const l2B = 240.0;
    const l2C = 400.0;
    const l2D = 560.0;
    const l2Y = 260.0;

    // Dibujar líneas desde raíz a nivel 1
    canvas.drawLine(const Offset(rootX, rootY), const Offset(l1IzqX, l1IzqY), paint);
    canvas.drawLine(const Offset(rootX, rootY), const Offset(l1DerX, l1DerY), paint);

    // Dibujar líneas desde L1 Izq a sus hijos
    canvas.drawLine(const Offset(l1IzqX, l1IzqY), const Offset(l2A, l2Y), paint);
    canvas.drawLine(const Offset(l1IzqX, l1IzqY), const Offset(l2B, l2Y), paint);

    // Dibujar líneas desde L1 Der a sus hijos
    canvas.drawLine(const Offset(l1DerX, l1DerY), const Offset(l2C, l2Y), paint);
    canvas.drawLine(const Offset(l1DerX, l1DerY), const Offset(l2D, l2Y), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// Pintor para el fondo cuadriculado (Grid)
class GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.grey.shade100
      ..strokeWidth = 0.5;

    const step = 20.0;
    for (double i = 0; i < size.width; i += step) {
      canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint);
    }
    for (double i = 0; i < size.height; i += step) {
      canvas.drawLine(Offset(0, i), Offset(size.width, i), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
