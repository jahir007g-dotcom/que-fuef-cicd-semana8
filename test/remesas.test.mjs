import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { persistenciaSimulada, nucleoSimulado, convertirCentavos } from '../src/remesas.mjs';

const config = JSON.parse(fs.readFileSync(new URL('../config.json', import.meta.url)));
const solicitud = () => ({
  eurCentavos: 10000,
  beneficiario: 'BENEFICIARIO_SIMULADO',
  cotizacion: { proveedor: 'FX_NUEVO_SIMULADO', version: 'demo-2',
    tasaMillonesimas: 1080000, comisionEurCentavos: 200 }
});

test('SIMULADO: misma llave entre dos versiones produce un solo recaudo y abono', () => {
  const db = persistenciaSimulada();
  const verde = nucleoSimulado(db, config, 'verde-demo');
  const azul = nucleoSimulado(db, config, 'azul-demo');
  const primera = verde.crear('IDEMPOTENCIA_SIMULADA_001', solicitud());
  const reintento = azul.crear('IDEMPOTENCIA_SIMULADA_001', solicitud());
  assert.equal(db.recaudos, 1, 'IDEMPOTENCIA: el reintento genero un segundo recaudo simulado');
  assert.equal(db.ordenesAbono, 1, 'El reintento genero una segunda orden de abono');
  assert.equal(primera.EndToEndId, reintento.EndToEndId);
  assert.equal(db.porId.size, 1);
});

test('SIMULADO: la misma llave con otro contenido se rechaza', () => {
  const app = nucleoSimulado(persistenciaSimulada(), config, 'demo');
  app.crear('IDEMPOTENCIA_SIMULADA_002', solicitud());
  assert.throws(() => app.crear('IDEMPOTENCIA_SIMULADA_002', {
    ...solicitud(), eurCentavos: 20000
  }), /LLAVE_CON_OTRO_CONTENIDO/);
});

test('SIMULADO: la version de retorno conserva la cotizacion ya aceptada', () => {
  const db = persistenciaSimulada();
  const verde = nucleoSimulado(db, config, 'verde-demo');
  const creada = verde.crear('IDEMPOTENCIA_SIMULADA_003', solicitud());
  const azul = nucleoSimulado(db, config, 'azul-demo');
  const leida = azul.consultar(creada.EndToEndId);
  assert.equal(leida.cotizacion.proveedor, 'FX_NUEVO_SIMULADO');
  assert.equal(leida.cotizacion.tasaMillonesimas, 1080000);
  assert.equal(leida.usdCentavos, 10800);
  assert.equal(leida.cotizacion.comisionEurCentavos, 200);
});

test('SIMULADO: el redondeo decimal de medio centavo es HALF_UP', () => {
  assert.equal(convertirCentavos(1, 1500000), 2);
  assert.equal(convertirCentavos(10000, 1075000), 10750);
});

test('SIMULADO: un webhook repetido confirma una sola vez y valida importe', () => {
  const db = persistenciaSimulada();
  const app = nucleoSimulado(db, config, 'demo');
  const creada = app.crear('IDEMPOTENCIA_SIMULADA_004', solicitud());
  assert.throws(() => app.confirmar('EVENTO_INVALIDO', creada.EndToEndId, 10799), /IMPORTE_NO_COINCIDE/);
  app.confirmar('EVENTO_SIMULADO_001', creada.EndToEndId, 10800);
  const repetida = app.confirmar('EVENTO_SIMULADO_001', creada.EndToEndId, 10800);
  assert.equal(repetida.estado, 'pagada');
  assert.equal(db.confirmaciones, 1);
  assert.equal(db.ordenesAbono, 1);
});
