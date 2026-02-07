import { Injectable, Inject, forwardRef, StreamableFile } from '@nestjs/common';
import { Workbook, Worksheet, Buffer as ExcelBuffer } from 'exceljs';
import { ReportesService } from '../../reportes/services/reportes.service';
import { GetUsersSummaryDto } from '../../reportes/dto/get-users-summary.dto';
import { GetUsersHistoryDto } from '../../reportes/dto/get-users-history.dto';
import { GetCoursesSummaryDto } from '../../reportes/dto/get-courses-summary.dto';

@Injectable()
export class ExcelService {
  constructor(
    @Inject(forwardRef(() => ReportesService))
    private readonly reportesService: ReportesService,
  ) {}

  /**
   * Crea un libro de trabajo base con metadatos del creador.
   */
  private createWorkbook(): Workbook {
    const workbook = new Workbook();
    workbook.creator = 'Plataforma Algoritmia';
    workbook.created = new Date();
    return workbook;
  }

  /**
   * Agrega el encabezado institucional, logo y metadatos del reporte.
   * Replica la estructura visual del PDF.
   */
  protected addHeader(
    workbook: Workbook,
    worksheet: Worksheet,
    metadata: { institucion: any; usuario: any; logoBase64: string | null },
    reportInfo: {
      reporteDB: any;
      filtrosTexto: string[];
      titulo: string;
      subtitulo?: string;
      aPresentarA?: string;
    },
  ) {
    // 1. Configuración de Columnas (Anchos ajustados para mejor lectura en Excel)
    worksheet.columns = [
      { width: 20 }, // A
      { width: 20 }, // B
      { width: 20 }, // C
      { width: 20 }, // D
      { width: 20 }, // E
      { width: 20 }, // F
      { width: 20 }, // G
      { width: 25 }, // H
    ];

    // Ajustamos altura de filas 1-4 para que sean uniformes y proporcionales al texto
    [1, 2, 3, 4].forEach((r) => {
      worksheet.getRow(r).height = 20;
    });

    // --- COL 1: LOGO (Izquierda: A1:B4) ---
    if (metadata.logoBase64) {
      const logoId = workbook.addImage({
        base64: metadata.logoBase64,
        extension: 'png', // exceljs detecta mime type del base64 usualmente
      });
      worksheet.mergeCells('A1:B4');
      worksheet.addImage(logoId, {
        tl: { col: 0, row: 0 }, // A1
        br: { col: 2, row: 4 }, // Fin de B4
      } as any);
    }

    // --- COL 2: INSTITUCIÓN (Centro: C1:F4) ---
    const centerStyle: Partial<any> = {
      vertical: 'middle',
      horizontal: 'center',
    };

    // Fila 1: Nombre
    worksheet.mergeCells('C1:F1');
    const instName = worksheet.getCell('C1');
    instName.value = metadata.institucion?.nombre || 'Institución';
    instName.font = {
      name: 'Calibri',
      size: 14,
      bold: true,
      color: { argb: 'FF1976D2' },
    };
    instName.alignment = centerStyle;

    // Fila 2: Dirección, Localidad, Provincia
    worksheet.mergeCells('C2:F2');
    const instAddr = worksheet.getCell('C2');
    const loc = metadata.institucion?.localidad;
    const prov = loc?.provincia;
    const direccion = metadata.institucion
      ? `${metadata.institucion.direccion}, ${loc?.localidad || ''}, ${prov?.provincia || ''}`
      : '';
    instAddr.value = direccion;
    instAddr.font = { name: 'Calibri', size: 11, color: { argb: 'FF444444' } };
    instAddr.alignment = centerStyle;

    // Fila 3: Email
    worksheet.mergeCells('C3:F3');
    const instEmail = worksheet.getCell('C3');
    instEmail.value = metadata.institucion?.email || '';
    instEmail.font = { name: 'Calibri', size: 11, color: { argb: 'FF444444' } };
    instEmail.alignment = centerStyle;

    // Fila 4: Teléfono
    worksheet.mergeCells('C4:F4');
    const instPhone = worksheet.getCell('C4');
    instPhone.value = metadata.institucion?.telefono || '';
    instPhone.font = { name: 'Calibri', size: 11, color: { argb: 'FF444444' } };
    instPhone.alignment = centerStyle;

    // --- COL 3: REPORTE INFO (Derecha: G1:H4) ---
    const labelStyle = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FF333333' },
    };
    const valStyle = { name: 'Calibri', size: 11, color: { argb: 'FF333333' } };
    const rightAlign = { vertical: 'middle', horizontal: 'right' } as const;
    const leftAlign = { vertical: 'middle', horizontal: 'left' } as const;

    // Fila 1: Reporte N
    worksheet.getCell('G1').value = 'Reporte N°:';
    worksheet.getCell('G1').font = labelStyle;
    worksheet.getCell('G1').alignment = rightAlign;

    worksheet.getCell('H1').value = reportInfo.reporteDB.nroReporte;
    worksheet.getCell('H1').font = valStyle;
    worksheet.getCell('H1').alignment = leftAlign;

    // Fila 2: Fecha
    worksheet.getCell('G2').value = 'Fecha de emisión:';
    worksheet.getCell('G2').font = labelStyle;
    worksheet.getCell('G2').alignment = rightAlign;

    worksheet.getCell('H2').value = new Date().toLocaleDateString();
    worksheet.getCell('H2').font = valStyle;
    worksheet.getCell('H2').alignment = leftAlign;

    // Fila 3: Usuario
    worksheet.getCell('G3').value = 'Generado por:';
    worksheet.getCell('G3').font = labelStyle;
    worksheet.getCell('G3').alignment = rightAlign;

    const userName = metadata.usuario
      ? `${metadata.usuario.nombre} ${metadata.usuario.apellido}`
      : 'Sistema';
    worksheet.getCell('H3').value = userName;
    worksheet.getCell('H3').font = valStyle;
    worksheet.getCell('H3').alignment = leftAlign;

    // Fila 4: A presentar a (Forzado)
    worksheet.getCell('G4').value = 'A presentar a:';
    worksheet.getCell('G4').font = labelStyle;
    worksheet.getCell('G4').alignment = rightAlign;

    worksheet.getCell('H4').value = reportInfo.aPresentarA || '';
    worksheet.getCell('H4').font = valStyle;
    worksheet.getCell('H4').alignment = leftAlign;

    // --- TÍTULO DEL REPORTE (Fila 6) ---
    const titleRow = 6;
    worksheet.mergeCells(`A${titleRow}:H${titleRow}`);
    const titleCell = worksheet.getCell(`A${titleRow}`);
    titleCell.value = reportInfo.titulo.toUpperCase();
    titleCell.font = {
      name: 'Calibri',
      size: 16,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' }, // Azul Institucional
    };
    worksheet.getRow(titleRow).height = 30;

    // --- SUBTÍTULO (Fila 7) ---
    let currentRow = titleRow + 1;
    if (reportInfo.subtitulo) {
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
      const subTitleCell = worksheet.getCell(`A${currentRow}`);
      subTitleCell.value = reportInfo.subtitulo;
      subTitleCell.font = {
        name: 'Calibri',
        size: 12,
        italic: true,
        color: { argb: 'FF333333' },
      };
      subTitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEEEEEE' },
      };
      subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(currentRow).height = 20;
      currentRow++;
    }

    // --- FILTROS (Fila 8 o siguiente) ---
    if (reportInfo.filtrosTexto && reportInfo.filtrosTexto.length > 0) {
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
      const filterCell = worksheet.getCell(`A${currentRow}`);
      filterCell.value = `Filtros Aplicados: ${reportInfo.filtrosTexto.join(' | ')}`;
      filterCell.font = {
        name: 'Calibri',
        size: 10,
        color: { argb: 'FF555555' },
      };
      filterCell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
      };
      worksheet.getRow(currentRow).height = 25; // Un poco más alto para filtros largos
      currentRow++;
    }

    // Espacio antes de los datos
    currentRow++;

    return currentRow;
  }

  /**
   * Helper para estilizar encabezados de tablas de datos.
   */
  protected styleTableHeaders(row: any) {
    row.eachCell((cell) => {
      cell.font = {
        name: 'Calibri',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' }, // Azul Institucional
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  }

  /**
   * Genera el reporte Excel de Resumen de Usuarios.
   */
  async getUsersSummaryExcel(
    dto: GetUsersSummaryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const summaryResult = await this.reportesService.getUsersSummary(dto);
    const { kpis, distribucion, lista } = summaryResult;

    // 2. Metadatos
    const { institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Resumen de Usuarios',
        'Usuarios',
        { ...dto, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Resumen de Usuarios');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Usuarios',
        aPresentarA,
      },
    );

    // 6. KPIs
    currentRow += 1;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const kpiTitle = worksheet.getCell(`A${currentRow}`);
    kpiTitle.value = 'INDICADORES PRINCIPALES';
    kpiTitle.font = { bold: true, size: 12 };
    kpiTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    worksheet.getCell(`B${currentRow}`).value = 'TOTAL USUARIOS';
    worksheet.getCell(`B${currentRow}`).font = { bold: true };
    worksheet.getCell(`C${currentRow}`).value = kpis.total;

    worksheet.getCell(`D${currentRow}`).value = 'ACTIVOS';
    worksheet.getCell(`D${currentRow}`).font = {
      bold: true,
      color: { argb: 'FF2E7D32' },
    };
    worksheet.getCell(`E${currentRow}`).value = kpis.activos;

    worksheet.getCell(`F${currentRow}`).value = 'INACTIVOS';
    worksheet.getCell(`F${currentRow}`).font = {
      bold: true,
      color: { argb: 'FFD32F2F' },
    };
    worksheet.getCell(`G${currentRow}`).value = kpis.inactivos;

    currentRow += 2;

    // 7. Tabla de Distribución
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const distTitle = worksheet.getCell(`A${currentRow}`);
    distTitle.value = 'DISTRIBUCIÓN';
    distTitle.font = { bold: true, size: 12 };
    distTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    worksheet.getCell(`B${currentRow}`).value = 'Grupo';
    worksheet.getCell(`C${currentRow}`).value = 'Cantidad';
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    distribucion.forEach((d: any) => {
      const label = d.grupo || `${d.rol} - ${d.estado}`;
      worksheet.getCell(`B${currentRow}`).value = label;
      worksheet.getCell(`C${currentRow}`).value = d.cantidad;
      currentRow++;
    });

    currentRow += 2;

    // 8. Lista Detallada
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const listTitle = worksheet.getCell(`A${currentRow}`);
    listTitle.value = 'DETALLE DE USUARIOS';
    listTitle.font = { bold: true, size: 12 };
    listTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = [
      'Nombre',
      'Apellido',
      'DNI',
      'Email',
      'Rol',
      'Estado',
      'Último Acceso',
    ];
    ['A', 'B', 'C', 'D', 'F', 'G', 'H'].forEach((col, idx) => {
      worksheet.getCell(`${col}${currentRow}`).value = headers[idx];
    });
    worksheet.mergeCells(`D${currentRow}:E${currentRow}`); // Email más ancho
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    lista.forEach((u: any) => {
      worksheet.getCell(`A${currentRow}`).value = u.nombre;
      worksheet.getCell(`B${currentRow}`).value = u.apellido;
      worksheet.getCell(`C${currentRow}`).value = u.dni;
      worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
      worksheet.getCell(`D${currentRow}`).value = u.email;
      worksheet.getCell(`F${currentRow}`).value = u.rol;
      worksheet.getCell(`G${currentRow}`).value = u.estado;
      worksheet.getCell(`H${currentRow}`).value = u.ultimoAcceso
        ? new Date(u.ultimoAcceso).toLocaleDateString()
        : '-';

      if (u.estado === 'Inactivo') {
        worksheet.getCell(`G${currentRow}`).font = {
          color: { argb: 'FFD32F2F' },
        };
      } else {
        worksheet.getCell(`G${currentRow}`).font = {
          color: { argb: 'FF2E7D32' },
        };
      }
      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="resumen-usuarios.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Historial de Usuarios.
   */
  async getUsersHistoryExcel(
    dto: GetUsersHistoryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const { history, chartData } =
      await this.reportesService.getUsersHistory(dto);

    // 2. Metadatos
    const { institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Historial de Usuarios',
        'Usuarios',
        { ...dto, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Historial Usuarios');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Usuarios',
        aPresentarA,
      },
    );

    // 6. Resumen por Fecha (Tabla de datos del gráfico)
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const chartTitle = worksheet.getCell(`A${currentRow}`);
    chartTitle.value = 'RESUMEN DE MOVIMIENTOS POR FECHA';
    chartTitle.font = { bold: true, size: 12 };
    chartTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Fecha';
    worksheet.getCell(`B${currentRow}`).value = 'Altas';
    worksheet.getCell(`C${currentRow}`).value = 'Bajas';
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    // Ordenamos chartData por fecha descendente para el reporte
    const chartDataDesc = [...chartData].sort(
      (a: any, b: any) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );

    chartDataDesc.forEach((d: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        d.fecha,
      ).toLocaleDateString();
      worksheet.getCell(`B${currentRow}`).value = d.altas;
      worksheet.getCell(`C${currentRow}`).value = d.bajas;
      currentRow++;
    });

    currentRow += 2;

    // 7. Detalle de Movimientos
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const listTitle = worksheet.getCell(`A${currentRow}`);
    listTitle.value = 'DETALLE DE MOVIMIENTOS';
    listTitle.font = { bold: true, size: 12 };
    listTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = [
      'Fecha',
      'Nombre',
      'Apellido',
      'Email',
      'Rol',
      'Tipo Movimiento',
    ];
    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.getCell(`B${currentRow}`).value = headers[1];
    worksheet.getCell(`C${currentRow}`).value = headers[2];
    worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
    worksheet.getCell(`D${currentRow}`).value = headers[3];
    worksheet.getCell(`F${currentRow}`).value = headers[4];
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = headers[5];

    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    history.forEach((h: any) => {
      worksheet.getCell(`A${currentRow}`).value = h.fecha
        ? new Date(h.fecha).toLocaleDateString()
        : '-';
      worksheet.getCell(`B${currentRow}`).value = h.nombre;
      worksheet.getCell(`C${currentRow}`).value = h.apellido;
      worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
      worksheet.getCell(`D${currentRow}`).value = h.email;
      worksheet.getCell(`F${currentRow}`).value = h.rol;

      worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
      worksheet.getCell(`G${currentRow}`).value = h.tipoMovimiento;

      const color = h.tipoMovimiento === 'Alta' ? 'FF2E7D32' : 'FFD32F2F';
      worksheet.getCell(`G${currentRow}`).font = {
        color: { argb: color },
        bold: true,
      };

      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="historial-usuarios.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Resumen de Cursos.
   */
  async getCoursesSummaryExcel(
    dto: GetCoursesSummaryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const { kpis, lista } = await this.reportesService.getCoursesSummary(dto);

    // 2. Metadatos
    const { institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Resumen de Cursos',
        'Cursos',
        { ...dto, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Resumen de Cursos');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Cursos',
        aPresentarA,
      },
    );

    // 6. KPIs
    currentRow += 1;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const kpiTitle = worksheet.getCell(`A${currentRow}`);
    kpiTitle.value = 'INDICADORES PRINCIPALES';
    kpiTitle.font = { bold: true, size: 12 };
    kpiTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    worksheet.getCell(`B${currentRow}`).value = 'TOTAL CURSOS';
    worksheet.getCell(`B${currentRow}`).font = { bold: true };
    worksheet.getCell(`C${currentRow}`).value = kpis.total;

    worksheet.getCell(`D${currentRow}`).value = 'ACTIVOS';
    worksheet.getCell(`D${currentRow}`).font = {
      bold: true,
      color: { argb: 'FF2E7D32' },
    };
    worksheet.getCell(`E${currentRow}`).value = kpis.activos;

    worksheet.getCell(`F${currentRow}`).value = 'INACTIVOS';
    worksheet.getCell(`F${currentRow}`).font = {
      bold: true,
      color: { argb: 'FFD32F2F' },
    };
    worksheet.getCell(`G${currentRow}`).value = kpis.inactivos;

    currentRow += 2;

    // 7. Lista Detallada
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const listTitle = worksheet.getCell(`A${currentRow}`);
    listTitle.value = 'DETALLE DE CURSOS';
    listTitle.font = { bold: true, size: 12 };
    listTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = [
      'Nombre',
      'Estado',
      'Alumnos Activos',
      'Docentes Activos',
      'Fecha Creación',
    ];
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.getCell(`C${currentRow}`).value = headers[1];
    worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
    worksheet.getCell(`D${currentRow}`).value = headers[2];
    worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
    worksheet.getCell(`F${currentRow}`).value = headers[3];
    worksheet.getCell(`H${currentRow}`).value = headers[4];
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    lista.forEach((c: any) => {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = c.nombre;
      worksheet.getCell(`C${currentRow}`).value = c.estado;
      worksheet.getCell(`C${currentRow}`).font = {
        color: { argb: c.estado === 'Activo' ? 'FF2E7D32' : 'FFD32F2F' },
      };
      worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
      worksheet.getCell(`D${currentRow}`).value = c.alumnos.activos;
      worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
      worksheet.getCell(`F${currentRow}`).value = c.docentes.activos;
      worksheet.getCell(`H${currentRow}`).value = c.createdAt
        ? new Date(c.createdAt).toLocaleDateString()
        : '-';
      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="resumen-cursos.xlsx"',
    });
  }
}
