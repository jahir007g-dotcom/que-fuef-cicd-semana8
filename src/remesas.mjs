// Modelo didactico local. Sin dinero real, API, KYC ni conexion bancaria.
// La persistencia compartida representa un doble de prueba, no una BD durable.
export function persistenciaSimulada() {
  return { porLlave: new Map(), porId: new Map(), recaudos: 0,
    ordenesAbono: 0, confirmaciones: 0, siguienteId: 1, eventos: new Set() };
}

export function convertirCentavos(eurCentavos, tasaMillonesimas) {
  // Redondeo decimal HALF_UP; todos los valores son enteros simulados positivos.
  if (!Number.isSafeInteger(eurCentavos) || eurCentavos <= 0 ||
      !Number.isSafeInteger(tasaMillonesimas) || tasaMillonesimas <= 0) {
    throw new Error('IMPORTE_O_TASA_INVALIDOS');
  }
  return Number((BigInt(eurCentavos) * BigInt(tasaMillonesimas) + 500000n) / 1000000n);
}

export function nucleoSimulado(db, { aplicarIdempotencia }, version) {
  return {
    crear(llave, solicitud) {
      if (!llave) throw new Error('FALTA_IDEMPOTENCY_KEY');
      const huella = JSON.stringify(solicitud);
      const previa = db.porLlave.get(llave);
      if (previa && previa.huella !== huella) throw new Error('LLAVE_CON_OTRO_CONTENIDO');
      if (previa && aplicarIdempotencia) return structuredClone(previa.remesa);

      const remesa = {
        EndToEndId: `SIM-REMESA-${db.siguienteId++}`,
        versionQueCreo: version,
        beneficiario: solicitud.beneficiario,
        eurCentavos: solicitud.eurCentavos,
        cotizacion: structuredClone(solicitud.cotizacion),
        usdCentavos: convertirCentavos(solicitud.eurCentavos, solicitud.cotizacion.tasaMillonesimas),
        estado: 'enviada'
      };
      // Un unico efecto en el simulador por intencion. No describe una Saga real.
      db.recaudos += 1;
      db.ordenesAbono += 1;
      db.porLlave.set(llave, { huella, remesa });
      db.porId.set(remesa.EndToEndId, remesa);
      return structuredClone(remesa);
    },
    consultar(id) {
      if (!db.porId.has(id)) throw new Error('REMESA_NO_EXISTE');
      return structuredClone(db.porId.get(id));
    },
    confirmar(eventoId, id, usdCentavos) {
      const remesa = db.porId.get(id);
      if (!remesa) throw new Error('REMESA_NO_EXISTE');
      if (usdCentavos !== remesa.usdCentavos) throw new Error('IMPORTE_NO_COINCIDE');
      if (!db.eventos.has(eventoId)) {
        db.eventos.add(eventoId);
        if (remesa.estado !== 'pagada') db.confirmaciones += 1;
        remesa.estado = 'pagada';
      }
      return structuredClone(remesa);
    }
  };
}
