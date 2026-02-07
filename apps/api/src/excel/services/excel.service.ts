import { Injectable, Inject, forwardRef, StreamableFile } from '@nestjs/common';
import { Workbook, Worksheet, Buffer as ExcelBuffer } from 'exceljs';
import { ReportesService } from '../../reportes/services/reportes.service';
import { GetUsersSummaryDto } from '../../reportes/dto/get-users-summary.dto';
import { GetUsersHistoryDto } from '../../reportes/dto/get-users-history.dto';
import { GetCoursesSummaryDto } from '../../reportes/dto/get-courses-summary.dto';
import { GetCoursesHistoryDto } from '../../reportes/dto/get-courses-history.dto';
import { GetStudentEnrollmentHistoryDto } from '../../reportes/dto/get-student-enrollment-history.dto';
import { GetTeacherAssignmentHistoryDto } from '../../reportes/dto/get-teacher-assignment-history.dto';
import { GetCourseProgressSummaryDto } from '../../reportes/dto/get-course-progress-summary.dto';
import { GetCourseMissionsReportDto } from '../../reportes/dto/get-course-missions-report.dto';
import { GetCourseMissionDetailReportDto } from '../../reportes/dto/get-course-mission-detail-report.dto';
import { GetCourseDifficultiesReportDto } from '../../reportes/dto/get-course-difficulties-report.dto';
import { GetCourseDifficultiesHistoryDto } from '../../reportes/dto/get-course-difficulties-history.dto';
import { GetStudentDifficultiesReportDto } from '../../reportes/dto/get-student-difficulties-report.dto';
import { GetCourseConsultationsSummaryDto } from '../../reportes/dto/get-course-consultations-summary.dto';
import { GetCourseConsultationsHistoryDto } from '../../reportes/dto/get-course-consultations-history.dto';
import { GetCourseClassesSummaryDto } from '../../reportes/dto/get-course-classes-summary.dto';
import { GetCourseClassesHistoryDto } from '../../reportes/dto/get-course-classes-history.dto';
import {
  GetCourseSessionsSummaryDto,
  GetCourseSessionsSummaryPdfDto,
} from '../../reportes/dto/get-course-sessions-summary.dto';
import { GetCourseSessionsHistoryPdfDto } from '../../reportes/dto/get-course-sessions-history.dto';

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
   * Helper para agregar una tarjeta de estadística (Título coloreado + Valor).
   * Ocupa 2 filas: Título y Valor.
   */
  protected addStatCard(
    worksheet: Worksheet,
    row: number,
    colIndex: number, // 1-based index (A=1, B=2...)
    width: number, // Cantidad de columnas a fusionar
    title: string,
    value: string | number,
    colorArgb: string,
  ) {
    // Fila Título
    worksheet.mergeCells(row, colIndex, row, colIndex + width - 1);
    const titleCell = worksheet.getCell(row, colIndex);
    titleCell.value = title;
    titleCell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colorArgb },
    };
    titleCell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    titleCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // Fila Valor
    worksheet.mergeCells(row + 1, colIndex, row + 1, colIndex + width - 1);
    const valueCell = worksheet.getCell(row + 1, colIndex);
    valueCell.value = value;
    valueCell.font = {
      name: 'Calibri',
      size: 12,
      bold: true,
      color: { argb: 'FF333333' },
    };
    valueCell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    valueCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
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

  /**
   * Genera el reporte Excel de Historial de Cursos.
   */
  async getCoursesHistoryExcel(
    dto: GetCoursesHistoryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const { history, chartData } =
      await this.reportesService.getCoursesHistory(dto);

    // 2. Metadatos
    const { institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Historial de Cursos',
        'Cursos',
        { ...dto, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Historial Cursos');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Cursos',
        aPresentarA,
      },
    );

    // 6. Resumen Gráfico (Tabla de datos del gráfico)
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

    chartData.forEach((d: any) => {
      worksheet.getCell(`A${currentRow}`).value = d.fecha;
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

    const headers = ['Fecha', 'Curso', 'Tipo Movimiento', 'Detalle'];
    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.getCell(`B${currentRow}`).value = headers[1];
    worksheet.getCell(`C${currentRow}`).value = headers[2];
    worksheet.mergeCells(`D${currentRow}:H${currentRow}`);
    worksheet.getCell(`D${currentRow}`).value = headers[3];
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    history.forEach((h: any) => {
      worksheet.getCell(`A${currentRow}`).value = h.fecha
        ? new Date(h.fecha).toLocaleDateString()
        : '-';
      worksheet.getCell(`B${currentRow}`).value = h.curso;
      worksheet.getCell(`C${currentRow}`).value = h.tipo;

      const detalle =
        typeof h.detalle === 'object'
          ? `Docentes: ${h.detalle.docentes || 'Ninguno'} | Días: ${h.detalle.dias || 'Ninguno'}`
          : h.detalle;

      worksheet.mergeCells(`D${currentRow}:H${currentRow}`);
      worksheet.getCell(`D${currentRow}`).value = detalle;

      const color = h.tipo === 'Alta' ? 'FF2E7D32' : 'FFD32F2F';
      worksheet.getCell(`C${currentRow}`).font = {
        color: { argb: color },
        bold: true,
      };

      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="historial-cursos.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Historial de Inscripciones.
   */
  async getStudentEnrollmentHistoryExcel(
    dto: GetStudentEnrollmentHistoryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    const events = await this.reportesService.getStudentEnrollmentHistory(dto);
    const { institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId);
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Historial de Inscripciones',
        'Cursos',
        { ...dto, aPresentarA },
      );

    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Inscripciones');

    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Inscripciones',
        aPresentarA,
      },
    );

    // --- Resumen por Fecha (Cálculo manual) ---
    const summaryMap = new Map<
      string,
      { inscripciones: number; bajas: number }
    >();
    events.forEach((e) => {
      const dateKey = e.fecha.toISOString().split('T')[0];
      if (!summaryMap.has(dateKey))
        summaryMap.set(dateKey, { inscripciones: 0, bajas: 0 });
      const entry = summaryMap.get(dateKey)!;
      if (e.tipo === 'Inscripción') entry.inscripciones++;
      else if (e.tipo === 'Baja') entry.bajas++;
    });

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
    worksheet.getCell(`B${currentRow}`).value = 'Inscripciones';
    worksheet.getCell(`C${currentRow}`).value = 'Bajas';
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    // Ordenamos fechas descendente para la tabla
    const sortedDates = Array.from(summaryMap.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );

    sortedDates.forEach((date) => {
      const data = summaryMap.get(date)!;
      worksheet.getCell(`A${currentRow}`).value = new Date(
        date,
      ).toLocaleDateString();
      worksheet.getCell(`B${currentRow}`).value = data.inscripciones;
      worksheet.getCell(`C${currentRow}`).value = data.bajas;
      currentRow++;
    });

    currentRow += 2;

    // --- Detalle ---
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

    const headers = ['Fecha', 'Alumno', 'Curso', 'Tipo Movimiento'];
    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = headers[1];
    worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
    worksheet.getCell(`D${currentRow}`).value = headers[2];
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = headers[3];
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    events.forEach((e) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        e.fecha,
      ).toLocaleDateString();
      worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
      worksheet.getCell(`B${currentRow}`).value = e.alumno;
      worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
      worksheet.getCell(`D${currentRow}`).value = e.curso;
      worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
      worksheet.getCell(`G${currentRow}`).value = e.tipo;

      const color = e.tipo === 'Inscripción' ? 'FF2E7D32' : 'FFD32F2F';
      worksheet.getCell(`G${currentRow}`).font = {
        color: { argb: color },
        bold: true,
      };
      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="historial-inscripciones.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Historial de Asignaciones Docentes.
   */
  async getTeacherAssignmentHistoryExcel(
    dto: GetTeacherAssignmentHistoryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // Reutilizamos la lógica de inscripciones ya que la estructura es idéntica
    // solo cambian las etiquetas (Alumno -> Docente, Inscripción -> Asignación)
    const events = await this.reportesService.getTeacherAssignmentHistory(dto);
    const { institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId);
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Historial de Asignaciones',
        'Cursos',
        { ...dto, aPresentarA },
      );

    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Asignaciones');

    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Asignaciones',
        aPresentarA,
      },
    );

    // Detalle directo (sin resumen gráfico para simplificar, o igual que arriba)
    currentRow++;
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

    const headers = ['Fecha', 'Docente', 'Curso', 'Tipo Movimiento'];
    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = headers[1];
    worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
    worksheet.getCell(`D${currentRow}`).value = headers[2];
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = headers[3];
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    events.forEach((e) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        e.fecha,
      ).toLocaleDateString();
      worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
      worksheet.getCell(`B${currentRow}`).value = e.docente;
      worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
      worksheet.getCell(`D${currentRow}`).value = e.curso;
      worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
      worksheet.getCell(`G${currentRow}`).value = e.tipo;

      const color = e.tipo === 'Asignación' ? 'FF2E7D32' : 'FFD32F2F';
      worksheet.getCell(`G${currentRow}`).font = {
        color: { argb: color },
        bold: true,
      };
      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="historial-asignaciones.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Resumen de Progreso del Curso.
   */
  async getCourseProgressSummaryExcel(
    idCurso: string,
    dto: GetCourseProgressSummaryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getCourseProgressSummary(
      idCurso,
      dto,
    );

    // 2. Metadatos
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Resumen de Progreso del Curso',
        'Progreso',
        { ...dto, cursoId: idCurso, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Resumen Progreso');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Progreso del Curso',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    // 6. KPIs
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const kpiTitle = worksheet.getCell(`A${currentRow}`);
    kpiTitle.value = 'ESTADÍSTICAS GENERALES';
    kpiTitle.font = { bold: true, size: 12 };
    kpiTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;
    currentRow++; // Espacio adicional

    // Fila 1 de KPIs
    this.addStatCard(
      worksheet,
      currentRow,
      1, // Col A
      2, // Ancho 2
      'PROGRESO TOTAL',
      `${data.resumen.progresoTotal.toFixed(1)}%`,
      'FF1976D2', // Azul
    );
    this.addStatCard(
      worksheet,
      currentRow,
      4, // Col D
      2, // Ancho 2
      'ALUMNOS ACTIVOS',
      data.resumen.totalAlumnos,
      'FF2E7D32', // Verde
    );
    this.addStatCard(
      worksheet,
      currentRow,
      7, // Col G
      2, // Ancho 2
      'ALUMNOS INACTIVOS',
      data.resumen.totalAlumnosInactivos,
      'FFD32F2F', // Rojo
    );
    currentRow += 3; // 2 filas de la card + 1 espacio

    // Fila 2 de KPIs
    this.addStatCard(
      worksheet,
      currentRow,
      1,
      2,
      'MISIONES COMPLETADAS',
      data.resumen.misionesCompletadas,
      'FF0288D1', // Celeste
    );
    this.addStatCard(
      worksheet,
      currentRow,
      4,
      2,
      'ESTRELLAS TOTALES',
      data.resumen.estrellasTotales,
      'FFED6C02', // Naranja
    );
    this.addStatCard(
      worksheet,
      currentRow,
      7,
      2,
      'INTENTOS TOTALES',
      data.resumen.intentosTotales,
      'FF9C27B0', // Violeta
    );
    currentRow += 3;

    // Fila 3 de KPIs
    this.addStatCard(
      worksheet,
      currentRow,
      1,
      2,
      'EXPERIENCIA TOTAL',
      data.resumen.expTotal,
      'FF1976D2',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      4,
      2,
      'PROM. ESTRELLAS',
      data.resumen.promEstrellas.toFixed(1),
      'FFED6C02',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      7,
      2,
      'PROM. INTENTOS',
      data.resumen.promIntentos.toFixed(1),
      'FF9C27B0',
    );
    currentRow += 3;

    // 7. Evolución (Tabla de datos del gráfico)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const evoTitle = worksheet.getCell(`A${currentRow}`);
    evoTitle.value = 'EVOLUCIÓN DEL PROGRESO';
    evoTitle.font = { bold: true, size: 12 };
    evoTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Fecha';
    worksheet.getCell(`B${currentRow}`).value = 'Progreso Promedio (%)';
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.evolucion.forEach((e: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        e.fecha,
      ).toLocaleDateString();
      worksheet.getCell(`B${currentRow}`).value =
        `${Number(e.progreso).toFixed(2)}%`;
      currentRow++;
    });

    // Nota: Los Tops de alumnos son complejos de renderizar en esta estructura de grid simple
    // y ya están bien cubiertos en el PDF o en la vista web. Nos enfocamos en los datos duros.

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="resumen-progreso.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Misiones Completadas.
   */
  async getCourseMissionsReportExcel(
    idCurso: string,
    dto: GetCourseMissionsReportDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getCourseMissionsReport(
      idCurso,
      dto,
    );

    // 2. Metadatos
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Reporte de Misiones Completadas',
        'Progreso',
        { ...dto, cursoId: idCurso, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Misiones Completadas');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Reporte de Misiones Completadas',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    // 6. KPIs
    currentRow++;
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
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1, // A
      3, // Ancho 3
      'TOTAL COMPLETADAS',
      data.kpis.totalCompletions,
      'FF0288D1', // Info/Celeste
    );

    this.addStatCard(
      worksheet,
      currentRow,
      5, // E
      4, // Ancho 4
      'MISIÓN DESTACADA',
      `${data.kpis.topMission.nombre} (${data.kpis.topMission.porcentaje.toFixed(1)}%)`,
      'FFED6C02', // Warning/Naranja
    );

    currentRow += 3;

    // 7. Gráfico (Datos)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const chartTitle = worksheet.getCell(`A${currentRow}`);
    chartTitle.value = 'EVOLUCIÓN DE MISIONES COMPLETADAS POR FECHA';
    chartTitle.font = { bold: true, size: 12 };
    chartTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Fecha';
    worksheet.getCell(`B${currentRow}`).value = 'Cantidad';
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.grafico.forEach((d: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        d.fecha,
      ).toLocaleDateString();
      worksheet.getCell(`B${currentRow}`).value = d.cantidad;
      currentRow++;
    });

    currentRow += 2;

    // 8. Tabla Detallada
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const listTitle = worksheet.getCell(`A${currentRow}`);
    listTitle.value = 'DETALLE POR MISIÓN';
    listTitle.font = { bold: true, size: 12 };
    listTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = [
      'Misión',
      'Dificultad',
      'Completado Por',
      '% Completado',
      'Prom. Estrellas',
      'Prom. Exp',
      'Prom. Intentos',
    ];

    // A-B para Nombre
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.getCell(`C${currentRow}`).value = headers[1];
    worksheet.getCell(`D${currentRow}`).value = headers[2];
    worksheet.getCell(`E${currentRow}`).value = headers[3];
    worksheet.getCell(`F${currentRow}`).value = headers[4];
    worksheet.getCell(`G${currentRow}`).value = headers[5];
    worksheet.getCell(`H${currentRow}`).value = headers[6];

    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    const centerAlign: Partial<any> = {
      vertical: 'middle',
      horizontal: 'center',
    };

    data.tabla.forEach((m: any) => {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = m.nombre;

      worksheet.getCell(`C${currentRow}`).value = m.dificultad;
      worksheet.getCell(`C${currentRow}`).alignment = centerAlign;

      worksheet.getCell(`D${currentRow}`).value = m.completadoPor;
      worksheet.getCell(`D${currentRow}`).alignment = centerAlign;

      worksheet.getCell(`E${currentRow}`).value =
        `${m.pctCompletado.toFixed(1)}%`;
      worksheet.getCell(`E${currentRow}`).alignment = centerAlign;

      worksheet.getCell(`F${currentRow}`).value = m.promEstrellas.toFixed(1);
      worksheet.getCell(`F${currentRow}`).alignment = centerAlign;

      worksheet.getCell(`G${currentRow}`).value = m.promExp.toFixed(1);
      worksheet.getCell(`G${currentRow}`).alignment = centerAlign;

      worksheet.getCell(`H${currentRow}`).value = m.promIntentos.toFixed(1);
      worksheet.getCell(`H${currentRow}`).alignment = centerAlign;

      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="misiones-completadas.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Detalle por Misión.
   */
  async getCourseMissionDetailReportExcel(
    idCurso: string,
    dto: GetCourseMissionDetailReportDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getCourseMissionDetailReport(
      idCurso,
      dto,
    );

    if (!data.mision) {
      throw new Error('Debe seleccionar una misión para generar el reporte.');
    }

    // 2. Metadatos
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Detalle por Misión',
        'Progreso',
        { ...dto, cursoId: idCurso, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Detalle Misión');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: `Detalle por Misión: ${data.mision.nombre}`,
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    // 6. KPIs
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const kpiTitle = worksheet.getCell(`A${currentRow}`);
    kpiTitle.value = 'ESTADÍSTICAS GENERALES';
    kpiTitle.font = { bold: true, size: 12 };
    kpiTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      2,
      'VECES COMPLETADA',
      data.stats.vecesCompletada,
      'FF2E7D32',
    ); // Success/Verde
    this.addStatCard(
      worksheet,
      currentRow,
      3,
      2,
      'ALUMNOS',
      `${data.stats.alumnosCompletaron} (${data.stats.pctAlumnos.toFixed(1)}%)`,
      'FF1976D2',
    ); // Primary/Azul
    this.addStatCard(
      worksheet,
      currentRow,
      5,
      2,
      'PROM. ESTRELLAS',
      data.stats.promEstrellas.toFixed(1),
      'FFED6C02',
    ); // Warning/Naranja
    this.addStatCard(
      worksheet,
      currentRow,
      7,
      2,
      'PROM. INTENTOS',
      data.stats.promIntentos.toFixed(1),
      'FF0288D1',
    ); // Info/Celeste

    currentRow += 3;

    // 7. Gráfico (Datos)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const chartTitle = worksheet.getCell(`A${currentRow}`);
    chartTitle.value = 'FRECUENCIA DE COMPLETADO';
    chartTitle.font = { bold: true, size: 12 };
    chartTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Fecha';
    worksheet.getCell(`B${currentRow}`).value = 'Cantidad';
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.grafico.forEach((d: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        d.fecha,
      ).toLocaleDateString();
      worksheet.getCell(`B${currentRow}`).value = d.cantidad;
      currentRow++;
    });

    currentRow += 2;

    // 8. Tabla Detallada
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const listTitle = worksheet.getCell(`A${currentRow}`);
    listTitle.value = 'ALUMNOS QUE LA COMPLETARON';
    listTitle.font = { bold: true, size: 12 };
    listTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = [
      'Alumno',
      'Estrellas',
      'Exp',
      'Intentos',
      'Fecha Completado',
    ];

    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.getCell(`E${currentRow}`).value = headers[1];
    worksheet.getCell(`F${currentRow}`).value = headers[2];
    worksheet.getCell(`G${currentRow}`).value = headers[3];
    worksheet.getCell(`H${currentRow}`).value = headers[4];

    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    const centerAlign: Partial<any> = {
      vertical: 'middle',
      horizontal: 'center',
    };

    data.tabla.forEach((t: any) => {
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = t.alumno;

      worksheet.getCell(`E${currentRow}`).value = t.estrellas;
      worksheet.getCell(`E${currentRow}`).alignment = centerAlign;

      worksheet.getCell(`F${currentRow}`).value = t.exp;
      worksheet.getCell(`F${currentRow}`).alignment = centerAlign;

      worksheet.getCell(`G${currentRow}`).value = t.intentos;
      worksheet.getCell(`G${currentRow}`).alignment = centerAlign;

      worksheet.getCell(`H${currentRow}`).value = t.fecha
        ? new Date(t.fecha).toLocaleDateString()
        : '-';
      worksheet.getCell(`H${currentRow}`).alignment = centerAlign;

      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="detalle-mision.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Resumen de Dificultades.
   */
  async getCourseDifficultiesReportExcel(
    idCurso: string,
    dto: GetCourseDifficultiesReportDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getCourseDifficultiesReport(
      idCurso,
      dto,
    );

    // 2. Metadatos
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Resumen de Dificultades',
        'Dificultades',
        { ...dto, cursoId: idCurso, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Resumen Dificultades');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Dificultades',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    // 6. KPIs
    currentRow++;
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
    currentRow++;

    // Fila 1: Promedio (A-D) y Tema Frecuente (E-H)
    this.addStatCard(
      worksheet,
      currentRow,
      1,
      4,
      'PROM. DIFICULTADES',
      data.kpis.promDificultades.toFixed(1),
      'FF1976D2',
    ); // Primary
    this.addStatCard(
      worksheet,
      currentRow,
      5,
      4,
      'TEMA FRECUENTE',
      `${data.kpis.temaFrecuente.nombre} (${data.kpis.temaFrecuente.pctAlumnos.toFixed(1)}%)`,
      'FF0288D1',
    ); // Info
    currentRow += 2;

    // Fila 2: Dificultad Frecuente (A-H)
    this.addStatCard(
      worksheet,
      currentRow,
      1,
      8,
      'DIFICULTAD FRECUENTE',
      `${data.kpis.dificultadFrecuente.nombre} (${data.kpis.dificultadFrecuente.pctAlumnos.toFixed(1)}%)`,
      'FFED6C02',
    ); // Warning
    currentRow += 2;

    // Fila 3: Grado Alto (A-H)
    this.addStatCard(
      worksheet,
      currentRow,
      1,
      8,
      'GRADO ALTO',
      `${data.kpis.gradoAlto.pctAlumnos.toFixed(1)}% (Moda: ${data.kpis.gradoAlto.modaNombre})`,
      'FFD32F2F',
    ); // Error
    currentRow += 3;

    // 7. Distribuciones (Tablas simples)

    // A. Por Dificultad
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const distTitle = worksheet.getCell(`A${currentRow}`);
    distTitle.value = 'DISTRIBUCIÓN DE ALUMNOS POR DIFICULTAD';
    distTitle.font = { bold: true, size: 12 };
    distTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    // Reservamos 2 celdas para el nombre (A-B)
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'Dificultad';
    worksheet.getCell(`C${currentRow}`).value = 'Cantidad Alumnos';
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.graficos.porDificultad.forEach((d: any) => {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const cell = worksheet.getCell(`A${currentRow}`);
      cell.value = d.label;
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
      }; // Ajuste de texto
      worksheet.getCell(`C${currentRow}`).value = d.value;
      currentRow++;
    });
    currentRow++;

    // B. Por Tema
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const topicTitle = worksheet.getCell(`A${currentRow}`);
    topicTitle.value = 'DISTRIBUCIÓN DE ALUMNOS POR TEMA';
    topicTitle.font = { bold: true, size: 12 };
    topicTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Tema';
    worksheet.getCell(`B${currentRow}`).value = 'Cantidad Alumnos';
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.graficos.porTema.forEach((d: any) => {
      worksheet.getCell(`A${currentRow}`).value = d.label;
      worksheet.getCell(`B${currentRow}`).value = d.value;
      currentRow++;
    });
    currentRow++;

    // 8. Detalle de Grados (Tabla Completa)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const detailTitle = worksheet.getCell(`A${currentRow}`);
    detailTitle.value = 'DETALLE DE GRADOS POR DIFICULTAD';
    detailTitle.font = { bold: true, size: 12 };
    detailTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = [
      'Dificultad',
      'Tema',
      'Grado Bajo',
      'Grado Medio',
      'Grado Alto',
      'Total Alumnos',
    ];
    ['A', 'C', 'E', 'F', 'G', 'H'].forEach((col, idx) => {
      worksheet.getCell(`${col}${currentRow}`).value = headers[idx];
    });
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.distribucionGrados.forEach((d: any) => {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const cell = worksheet.getCell(`A${currentRow}`);
      cell.value = d.nombre;
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
      }; // Ajuste de texto
      worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
      worksheet.getCell(`C${currentRow}`).value = d.tema;
      worksheet.getCell(`E${currentRow}`).value = d.grados.Bajo;
      worksheet.getCell(`F${currentRow}`).value = d.grados.Medio;
      worksheet.getCell(`G${currentRow}`).value = d.grados.Alto;
      worksheet.getCell(`H${currentRow}`).value = d.total;
      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="resumen-dificultades.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Historial de Dificultades.
   */
  async getCourseDifficultiesHistoryExcel(
    idCurso: string,
    dto: GetCourseDifficultiesHistoryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getCourseDifficultiesHistory(
      idCurso,
      dto,
    );

    // 2. Metadatos
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Historial de Dificultades',
        'Dificultades',
        { ...dto, cursoId: idCurso, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Historial Dificultades');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Dificultades',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    // 6. KPIs (Stats de Mejora)
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const kpiTitle = worksheet.getCell(`A${currentRow}`);
    kpiTitle.value = 'ESTADÍSTICAS DE MEJORA';
    kpiTitle.font = { bold: true, size: 12 };
    kpiTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      2,
      'TOTAL MEJORAS',
      data.stats.totalMejoras,
      'FF2E7D32',
    ); // Success
    this.addStatCard(
      worksheet,
      currentRow,
      3,
      3,
      '% VIDEOJUEGO',
      `${data.stats.porcentajeVideojuego.toFixed(1)}%`,
      'FF1976D2',
    ); // Primary
    this.addStatCard(
      worksheet,
      currentRow,
      6,
      3,
      '% SESIONES',
      `${data.stats.porcentajeSesion.toFixed(1)}%`,
      'FF9C27B0',
    ); // Secondary/Purple

    currentRow += 3;

    // 7. Evolución (Timeline)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const chartTitle = worksheet.getCell(`A${currentRow}`);
    chartTitle.value = 'EVOLUCIÓN DE CAMBIOS POR FUENTE';
    chartTitle.font = { bold: true, size: 12 };
    chartTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Fecha';
    worksheet.getCell(`B${currentRow}`).value = 'Videojuego';
    worksheet.getCell(`C${currentRow}`).value = 'Sesión de Refuerzo';
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.timeline.forEach((t: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        t.fecha,
      ).toLocaleDateString();
      worksheet.getCell(`B${currentRow}`).value = t.videojuego;
      worksheet.getCell(`C${currentRow}`).value = t.sesion_refuerzo;
      currentRow++;
    });

    currentRow += 2;

    // 8. Tabla Detallada
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const listTitle = worksheet.getCell(`A${currentRow}`);
    listTitle.value = 'DETALLE DE CAMBIOS';
    listTitle.font = { bold: true, size: 12 };
    listTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = [
      'Fecha',
      'Alumno',
      'Dificultad',
      'Tema',
      'Cambio Grado',
      'Fuente',
    ];

    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = headers[1];
    worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
    worksheet.getCell(`D${currentRow}`).value = headers[2];
    worksheet.getCell(`F${currentRow}`).value = headers[3];
    worksheet.getCell(`G${currentRow}`).value = headers[4];
    worksheet.getCell(`H${currentRow}`).value = headers[5];

    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    const gradeWeight: Record<string, number> = {
      Ninguno: 0,
      Bajo: 1,
      Medio: 2,
      Alto: 3,
    };

    data.tabla.forEach((h: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        h.fechaCambio,
      ).toLocaleString();

      worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
      const cellAlumno = worksheet.getCell(`B${currentRow}`);
      cellAlumno.value = `${h.alumno.nombre} ${h.alumno.apellido}`;
      cellAlumno.alignment = { vertical: 'middle', wrapText: true };

      worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
      const cellDificultad = worksheet.getCell(`D${currentRow}`);
      cellDificultad.value = h.dificultad.nombre;
      cellDificultad.alignment = { vertical: 'middle', wrapText: true };

      worksheet.getCell(`F${currentRow}`).value = h.dificultad.tema;

      const wOld = gradeWeight[h.gradoAnterior] || 0;
      const wNew = gradeWeight[h.gradoNuevo] || 0;
      const esMejora = wOld > wNew;

      const cellCambio = worksheet.getCell(`G${currentRow}`);
      cellCambio.value = `${h.gradoAnterior} ➔ ${h.gradoNuevo}`;
      cellCambio.alignment = { vertical: 'middle', horizontal: 'center' };
      if (esMejora) {
        cellCambio.font = {
          color: { argb: 'FF2E7D32' },
          bold: true,
        };
      }

      const cellFuente = worksheet.getCell(`H${currentRow}`);
      cellFuente.value = h.fuente === 'VIDEOJUEGO' ? 'Videojuego' : 'Sesión';
      cellFuente.alignment = { vertical: 'middle', horizontal: 'center' };

      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="historial-dificultades.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Dificultades por Alumno.
   */
  async getStudentDifficultiesReportExcel(
    idCurso: string,
    dto: GetStudentDifficultiesReportDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getStudentDifficultiesReport(
      idCurso,
      dto,
    );

    // 2. Metadatos
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // Intentamos obtener el nombre del alumno para el título
    let nombreAlumno = 'Alumno';
    if (data.history.length > 0) {
      nombreAlumno = `${data.history[0].alumno.nombre} ${data.history[0].alumno.apellido}`;
    } else {
      // Fallback: consultamos el usuario si no hay historial
      const alumno = await this.reportesService['prisma'].usuario.findUnique({
        where: { id: dto.studentId },
      });
      if (alumno) nombreAlumno = `${alumno.nombre} ${alumno.apellido}`;
    }

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Reporte de Dificultades por Alumno',
        'Dificultades',
        { ...dto, cursoId: idCurso, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Dificultades Alumno');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: `Dificultades por Alumno: ${nombreAlumno}`,
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    // 6. KPIs (Stats de Mejora)
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const kpiTitle = worksheet.getCell(`A${currentRow}`);
    kpiTitle.value = 'ESTADÍSTICAS DE MEJORA';
    kpiTitle.font = { bold: true, size: 12 };
    kpiTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      2,
      'TOTAL MEJORAS',
      data.stats.totalMejoras,
      'FF2E7D32',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      3,
      3,
      '% VIDEOJUEGO',
      `${data.stats.porcentajeVideojuego.toFixed(1)}%`,
      'FF1976D2',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      6,
      3,
      '% SESIONES',
      `${data.stats.porcentajeSesion.toFixed(1)}%`,
      'FF9C27B0',
    );

    currentRow += 3;

    // 7. Dificultades Actuales
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const currentTitle = worksheet.getCell(`A${currentRow}`);
    currentTitle.value = 'DIFICULTADES ACTUALES';
    currentTitle.font = { bold: true, size: 12 };
    currentTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'Dificultad';
    worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
    worksheet.getCell(`D${currentRow}`).value = 'Tema';
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = 'Grado Actual';
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    if (data.summary.tabla.length === 0) {
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value =
        'El alumno no presenta dificultades activas actualmente.';
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
      currentRow++;
    } else {
      data.summary.tabla.forEach((d: any) => {
        worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = d.nombre;
        worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
        worksheet.getCell(`D${currentRow}`).value = d.tema;
        worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
        worksheet.getCell(`G${currentRow}`).value = d.grado;

        const color =
          d.grado === 'Alto'
            ? 'FFD32F2F'
            : d.grado === 'Medio'
              ? 'FFED6C02'
              : 'FF2E7D32';
        worksheet.getCell(`G${currentRow}`).font = {
          color: { argb: color },
          bold: true,
        };

        currentRow++;
      });
    }

    currentRow += 2;

    // 8. Evolución (Matriz de Datos)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const evoTitle = worksheet.getCell(`A${currentRow}`);
    evoTitle.value = 'EVOLUCIÓN DE GRADOS (MATRIZ)';
    evoTitle.font = { bold: true, size: 12 };
    evoTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    // Headers dinámicos para la evolución
    const series = data.evolution.series;
    worksheet.getCell(`A${currentRow}`).value = 'Fecha';

    series.forEach((s: any, index: number) => {
      const colIndex = 2 + index; // B=2
      const cell = worksheet.getCell(currentRow, colIndex);
      cell.value = s.label;
      cell.font = {
        name: 'Calibri',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 10,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      const col = worksheet.getColumn(colIndex);
      if ((col.width || 0) < 15) col.width = 15;
    });

    const dateHeader = worksheet.getCell(`A${currentRow}`);
    dateHeader.font = {
      name: 'Calibri',
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11,
    };
    dateHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' },
    };
    dateHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    currentRow++;

    const gradeLabels = ['Ninguno', 'Bajo', 'Medio', 'Alto'];

    data.evolution.dataset.forEach((row: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        row.date,
      ).toLocaleDateString();

      series.forEach((s: any, index: number) => {
        const colIndex = 2 + index;
        const val = row[s.dataKey];
        const textVal = val !== undefined ? gradeLabels[val] : '-';
        const cell = worksheet.getCell(currentRow, colIndex);
        cell.value = textVal;
        cell.alignment = { horizontal: 'center' };
      });
      currentRow++;
    });

    currentRow += 2;

    // 9. Historial Detallado (Reutilizamos lógica de historial general pero simplificada)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const histTitle = worksheet.getCell(`A${currentRow}`);
    histTitle.value = 'HISTORIAL DETALLADO DE CAMBIOS';
    histTitle.font = { bold: true, size: 12 };
    histTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = ['Fecha', 'Dificultad', 'Tema', 'Cambio Grado', 'Fuente'];

    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = headers[1];
    worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
    worksheet.getCell(`D${currentRow}`).value = headers[2];
    worksheet.getCell(`F${currentRow}`).value = headers[3];
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = headers[4];

    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    const gradeWeight: Record<string, number> = {
      Ninguno: 0,
      Bajo: 1,
      Medio: 2,
      Alto: 3,
    };

    data.history.forEach((h: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        h.fechaCambio,
      ).toLocaleString();

      worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
      const cellDificultad = worksheet.getCell(`B${currentRow}`);
      cellDificultad.value = h.dificultad.nombre;
      cellDificultad.alignment = { vertical: 'middle', wrapText: true };

      worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
      worksheet.getCell(`D${currentRow}`).value = h.dificultad.tema;

      const wOld = gradeWeight[h.gradoAnterior] || 0;
      const wNew = gradeWeight[h.gradoNuevo] || 0;
      const esMejora = wOld > wNew;

      const cellCambio = worksheet.getCell(`F${currentRow}`);
      cellCambio.value = `${h.gradoAnterior} ➔ ${h.gradoNuevo}`;
      cellCambio.alignment = { vertical: 'middle', horizontal: 'center' };
      if (esMejora) {
        cellCambio.font = { color: { argb: 'FF2E7D32' }, bold: true };
      }

      worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
      worksheet.getCell(`G${currentRow}`).value =
        h.fuente === 'VIDEOJUEGO' ? 'Videojuego' : 'Sesión';
      worksheet.getCell(`G${currentRow}`).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="dificultades-alumno.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Resumen de Consultas.
   */
  async getCourseConsultationsSummaryExcel(
    idCurso: string,
    dto: GetCourseConsultationsSummaryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getCourseConsultationsSummary(
      idCurso,
      dto,
    );

    // 2. Metadatos
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Resumen de Consultas',
        'Cursos',
        { ...dto, cursoId: idCurso, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Resumen Consultas');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Consultas',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    // 6. KPIs Generales
    currentRow++;
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
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      2,
      'TOTAL CONSULTAS',
      data.kpis.totalConsultas,
      'FF1976D2',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      3,
      2,
      'ACTIVAS',
      data.kpis.activas,
      'FF2E7D32',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      5,
      2,
      'RESUELTAS',
      `${data.kpis.resueltas.count} (${data.kpis.resueltas.percentage.toFixed(1)}%)`,
      'FF4CAF50',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      7,
      2,
      'PENDIENTES',
      `${data.kpis.pendientes.count} (${data.kpis.pendientes.percentage.toFixed(1)}%)`,
      'FFED6C02',
    );

    currentRow += 3;

    // 7. Tops
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const topsTitle = worksheet.getCell(`A${currentRow}`);
    topsTitle.value = 'DESTACADOS';
    topsTitle.font = { bold: true, size: 12 };
    topsTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      3,
      'TEMA MÁS CONSULTADO',
      `${data.topTopic.name} (${data.topTopic.percentage.toFixed(1)}%)`,
      'FF0288D1',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      4,
      5,
      'DOCENTE MÁS ACTIVO',
      `${data.topTeacher.name} (${data.topTeacher.percentage.toFixed(1)}%)`,
      'FF9C27B0',
    );

    currentRow += 3;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      8,
      'ALUMNO CON MÁS CONSULTAS',
      `${data.topStudent.name} (${data.topStudent.percentage.toFixed(1)}%)`,
      'FF1976D2',
    );

    currentRow += 3;

    // 8. Impacto Clases
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const impactTitle = worksheet.getCell(`A${currentRow}`);
    impactTitle.value = 'IMPACTO DE CLASES DE CONSULTA';
    impactTitle.font = { bold: true, size: 12 };
    impactTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      4,
      'ATENDIDAS EN CLASE',
      `${data.kpis.impactoClases.revisadas.count} (${data.kpis.impactoClases.revisadas.percentage.toFixed(1)}%)`,
      'FF0288D1',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      5,
      4,
      'RESUELTAS VÍA CLASE',
      `${data.kpis.impactoClases.resueltas.count} (${data.kpis.impactoClases.resueltas.percentage.toFixed(1)}%)`,
      'FF2E7D32',
    );

    currentRow += 3;

    // 9. Distribuciones (Tema x Estado - Tabla detallada)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const detailTitle = worksheet.getCell(`A${currentRow}`);
    detailTitle.value = 'DETALLE POR TEMA Y ESTADO';
    detailTitle.font = { bold: true, size: 12 };
    detailTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = ['Tema', 'Pendiente', 'A revisar', 'Revisada', 'Resuelta'];
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.getCell(`E${currentRow}`).value = headers[1];
    worksheet.getCell(`F${currentRow}`).value = headers[2];
    worksheet.getCell(`G${currentRow}`).value = headers[3];
    worksheet.getCell(`H${currentRow}`).value = headers[4];
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.graficoTemasEstados.forEach((d: any) => {
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = d.tema;
      worksheet.getCell(`E${currentRow}`).value = d.Pendiente || 0;
      worksheet.getCell(`F${currentRow}`).value = d.A_revisar || 0;
      worksheet.getCell(`G${currentRow}`).value = d.Revisada || 0;
      worksheet.getCell(`H${currentRow}`).value = d.Resuelta || 0;
      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="resumen-consultas.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Historial de Consultas.
   */
  async getCourseConsultationsHistoryExcel(
    idCurso: string,
    dto: GetCourseConsultationsHistoryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getCourseConsultationsHistory(
      idCurso,
      dto,
    );

    // 2. Metadatos
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Historial de Consultas',
        'Cursos',
        { ...dto, cursoId: idCurso, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Historial Consultas');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Consultas',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    // 6. KPIs
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const kpiTitle = worksheet.getCell(`A${currentRow}`);
    kpiTitle.value = 'ESTADÍSTICAS DEL PERIODO';
    kpiTitle.font = { bold: true, size: 12 };
    kpiTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      2,
      'TOTAL CONSULTAS',
      data.stats.total,
      'FF1976D2',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      3,
      3,
      'PROMEDIO DIARIO',
      data.stats.promedioDiario.toFixed(1),
      'FF0288D1',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      6,
      3,
      'PROMEDIO SEMANAL',
      data.stats.promedioSemanal.toFixed(1),
      'FF2E7D32',
    );

    currentRow += 3;

    // 7. Evolución (Timeline)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const chartTitle = worksheet.getCell(`A${currentRow}`);
    chartTitle.value = 'EVOLUCIÓN TEMPORAL';
    chartTitle.font = { bold: true, size: 12 };
    chartTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Fecha';
    worksheet.getCell(`B${currentRow}`).value = 'Cantidad';
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.timeline.forEach((t: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        t.fecha,
      ).toLocaleDateString();
      worksheet.getCell(`B${currentRow}`).value = t.cantidad;
      currentRow++;
    });

    currentRow += 2;

    // 8. Tabla Detallada
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const listTitle = worksheet.getCell(`A${currentRow}`);
    listTitle.value = 'DETALLE DE CONSULTAS';
    listTitle.font = { bold: true, size: 12 };
    listTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = [
      'Fecha',
      'Título',
      'Tema',
      'Alumno',
      'Estado',
      'Atendido por',
      'Valoración',
    ];
    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = headers[1];
    worksheet.getCell(`D${currentRow}`).value = headers[2];
    worksheet.getCell(`E${currentRow}`).value = headers[3];
    worksheet.getCell(`F${currentRow}`).value = headers[4];
    worksheet.getCell(`G${currentRow}`).value = headers[5];
    worksheet.getCell(`H${currentRow}`).value = headers[6];

    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.tabla.forEach((c: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        c.fecha,
      ).toLocaleDateString();

      worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
      const cellTitulo = worksheet.getCell(`B${currentRow}`);
      cellTitulo.value = c.titulo;
      cellTitulo.alignment = { vertical: 'middle', wrapText: true };

      worksheet.getCell(`D${currentRow}`).value = c.tema;

      const cellAlumno = worksheet.getCell(`E${currentRow}`);
      cellAlumno.value = c.alumno;
      cellAlumno.alignment = { vertical: 'middle', wrapText: true };

      worksheet.getCell(`F${currentRow}`).value = c.estado.replace('_', ' ');

      const cellDocente = worksheet.getCell(`G${currentRow}`);
      cellDocente.value = c.docente;
      cellDocente.alignment = { vertical: 'middle', wrapText: true };

      worksheet.getCell(`H${currentRow}`).value = c.valoracion
        ? `${c.valoracion} ⭐`
        : '-';
      worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center' };

      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="historial-consultas.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Resumen de Clases de Consulta.
   */
  async getCourseClassesSummaryExcel(
    idCurso: string,
    dto: GetCourseClassesSummaryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getCourseClassesSummary(
      idCurso,
      dto,
    );

    // 2. Metadatos
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Resumen de Clases de Consulta',
        'Cursos',
        { ...dto, cursoId: idCurso, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Resumen Clases');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Clases de Consulta',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    // 6. KPIs Generales
    currentRow++;
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
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      2,
      'TOTAL CLASES',
      data.kpis.totalClases,
      'FF1976D2',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      3,
      2,
      'ACTIVAS',
      data.kpis.activas,
      'FF2E7D32',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      5,
      2,
      'INACTIVAS',
      data.kpis.inactivas,
      'FFD32F2F',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      7,
      2,
      'PROM. CONSULTAS',
      data.kpis.promConsultasPorClase.toFixed(1),
      'FF0288D1',
    );

    currentRow += 3;

    // 7. Efectividad e Impacto
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const effectTitle = worksheet.getCell(`A${currentRow}`);
    effectTitle.value = 'EFECTIVIDAD E IMPACTO';
    effectTitle.font = { bold: true, size: 12 };
    effectTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      3,
      'EFECTIVIDAD REVISIÓN',
      `${data.efectividad.promedioRevisadasPct.toFixed(1)}%`,
      'FF0288D1',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      4,
      3,
      'IMPACTO RESOLUCIÓN',
      `${data.impacto.porcentaje.toFixed(1)}%`,
      'FF2E7D32',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      7,
      2,
      'EFECTIVIDAD AUTO',
      `${data.kpis.origen.pctSistemaRealizadas.toFixed(1)}%`,
      'FF9C27B0',
    );

    currentRow += 3;

    // 8. Tops
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const topsTitle = worksheet.getCell(`A${currentRow}`);
    topsTitle.value = 'DESTACADOS';
    topsTitle.font = { bold: true, size: 12 };
    topsTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      4,
      'TEMA MÁS TRATADO',
      `${data.topTopic.name} (${data.topTopic.percentage.toFixed(1)}%)`,
      'FF0288D1',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      5,
      4,
      'DOCENTE MÁS ACTIVO',
      `${data.topTeacher.name} (${data.topTeacher.count} clases)`,
      'FF1976D2',
    );

    currentRow += 3;

    // 9. Distribuciones (Estado x Origen)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const distTitle = worksheet.getCell(`A${currentRow}`);
    distTitle.value = 'DISTRIBUCIÓN POR ESTADO Y ORIGEN';
    distTitle.font = { bold: true, size: 12 };
    distTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = ['Estado', 'Origen: Sistema', 'Origen: Docente', 'Total'];
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
    worksheet.getCell(`D${currentRow}`).value = headers[1];
    worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
    worksheet.getCell(`F${currentRow}`).value = headers[2];
    worksheet.getCell(`H${currentRow}`).value = headers[3];
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.graficoEstadosOrigen.forEach((d: any) => {
      worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = d.estado;

      worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
      worksheet.getCell(`D${currentRow}`).value = d.Sistema;

      worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
      worksheet.getCell(`F${currentRow}`).value = d.Docente;

      worksheet.getCell(`H${currentRow}`).value =
        (d.Sistema || 0) + (d.Docente || 0);
      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="resumen-clases.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Historial de Clases de Consulta.
   */
  async getCourseClassesHistoryExcel(
    idCurso: string,
    dto: GetCourseClassesHistoryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getCourseClassesHistory(
      idCurso,
      dto,
    );

    // 2. Metadatos
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Historial de Clases de Consulta',
        'Cursos',
        { ...dto, cursoId: idCurso, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Historial Clases');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Clases de Consulta',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    // 6. Evolución (Chart Data)
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const chartTitle = worksheet.getCell(`A${currentRow}`);
    chartTitle.value = 'EVOLUCIÓN DE CONSULTAS POR CLASE';
    chartTitle.font = { bold: true, size: 12 };
    chartTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const chartHeaders = [
      'Fecha',
      'Estado de clase',
      'Revisadas',
      'No Revisadas',
      'Pendientes',
      'A Revisar',
    ];
    worksheet.getCell(`A${currentRow}`).value = chartHeaders[0];
    worksheet.getCell(`B${currentRow}`).value = chartHeaders[1];
    worksheet.getCell(`C${currentRow}`).value = chartHeaders[2];
    worksheet.getCell(`D${currentRow}`).value = chartHeaders[3];
    worksheet.getCell(`E${currentRow}`).value = chartHeaders[4];
    worksheet.getCell(`F${currentRow}`).value = chartHeaders[5];
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.chartData.forEach((d: any) => {
      const fechaStr = new Date(d.fecha).toLocaleDateString();
      const estadoStr = d.estado.replace(/_/g, ' ');
      worksheet.getCell(`A${currentRow}`).value = fechaStr;
      worksheet.getCell(`B${currentRow}`).value = estadoStr;
      worksheet.getCell(`C${currentRow}`).value = d.revisadas;
      worksheet.getCell(`D${currentRow}`).value = d.noRevisadas;
      worksheet.getCell(`E${currentRow}`).value = d.pendientes;
      worksheet.getCell(`F${currentRow}`).value = d.aRevisar;
      currentRow++;
    });

    currentRow += 2;

    // 7. Detalle de Clases
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const listTitle = worksheet.getCell(`A${currentRow}`);
    listTitle.value = 'DETALLE DE CLASES';
    listTitle.font = { bold: true, size: 12 };
    listTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = [
      'Fecha Agenda',
      'Nombre Clase',
      'Docente',
      'Estado',
      'Consultas',
      'Revisadas',
      'Realizada el',
    ];
    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = headers[1];
    worksheet.getCell(`D${currentRow}`).value = headers[2];
    worksheet.getCell(`E${currentRow}`).value = headers[3];
    worksheet.getCell(`F${currentRow}`).value = headers[4];
    worksheet.getCell(`G${currentRow}`).value = headers[5];
    worksheet.getCell(`H${currentRow}`).value = headers[6];

    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.tableData.forEach((c: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        c.fechaAgenda,
      ).toLocaleDateString();

      worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
      const cellNombre = worksheet.getCell(`B${currentRow}`);
      cellNombre.value = c.nombre;
      cellNombre.alignment = { vertical: 'middle', wrapText: true };

      const cellDocente = worksheet.getCell(`D${currentRow}`);
      cellDocente.value = c.docente;
      cellDocente.alignment = { vertical: 'middle', wrapText: true };

      worksheet.getCell(`E${currentRow}`).value = c.estado.replace(/_/g, ' ');
      worksheet.getCell(`F${currentRow}`).value = c.totalConsultas;
      worksheet.getCell(`G${currentRow}`).value = c.revisadas;

      worksheet.getCell(`H${currentRow}`).value = c.fechaRealizacion
        ? new Date(c.fechaRealizacion).toLocaleString()
        : '-';

      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="historial-clases.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Resumen de Sesiones de Refuerzo.
   */
  async getCourseSessionsSummaryExcel(
    idCurso: string,
    dto: GetCourseSessionsSummaryPdfDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getCourseSessionsSummary(
      idCurso,
      dto,
    );

    // 2. Metadatos
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Resumen de Sesiones de Refuerzo',
        'Cursos',
        { ...dto, cursoId: idCurso, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Resumen Sesiones');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Sesiones de Refuerzo',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    // 6. KPIs Generales
    currentRow++;
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
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      2,
      'TOTAL SESIONES',
      data.kpis.total,
      'FF1976D2',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      3,
      2,
      'ACTIVAS',
      data.kpis.activas,
      'FF2E7D32',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      5,
      2,
      'INACTIVAS',
      data.kpis.inactivas,
      'FFD32F2F',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      7,
      2,
      'GRADO PROM.',
      data.kpis.promedioGrado,
      'FFED6C02',
    );

    currentRow += 3;

    // 7. Tops
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const topsTitle = worksheet.getCell(`A${currentRow}`);
    topsTitle.value = 'DESTACADOS';
    topsTitle.font = { bold: true, size: 12 };
    topsTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;
    currentRow++;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      4,
      'TEMA MÁS FRECUENTE',
      `${data.tops.tema.label} (${data.tops.tema.value})`,
      'FF0288D1',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      5,
      4,
      'DIFICULTAD MÁS FRECUENTE',
      `${data.tops.dificultad.name} (${data.tops.dificultad.count})`,
      'FFD32F2F',
    );

    currentRow += 3;

    this.addStatCard(
      worksheet,
      currentRow,
      1,
      4,
      'ALUMNO CON MÁS SESIONES',
      `${data.tops.alumno.name} (${data.tops.alumno.count})`,
      'FF1976D2',
    );
    this.addStatCard(
      worksheet,
      currentRow,
      5,
      4,
      'DOCENTE QUE MÁS ASIGNA',
      `${data.tops.docente.name} (${data.tops.docente.count})`,
      'FF9C27B0',
    );

    currentRow += 3;

    // 8. Efectividad
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const effTitle = worksheet.getCell(`A${currentRow}`);
    effTitle.value = 'EFECTIVIDAD (SESIONES COMPLETADAS)';
    effTitle.font = { bold: true, size: 12 };
    effTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const effHeaders = [
      'Origen',
      'Total Completadas',
      'Mejora Leve (40-60%)',
      'Mejora Sig. (60-85%)',
      'Mejora Total (>85%)',
    ];
    worksheet.getCell(`A${currentRow}`).value = effHeaders[0];
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = effHeaders[1];
    worksheet.getCell(`D${currentRow}`).value = effHeaders[2];
    worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
    worksheet.getCell(`E${currentRow}`).value = effHeaders[3];
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = effHeaders[4];
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    // Sistema
    worksheet.getCell(`A${currentRow}`).value = 'Sistema';
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = data.efectividad.sistema.total;
    worksheet.getCell(`D${currentRow}`).value = data.efectividad.sistema.level1;
    worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
    worksheet.getCell(`E${currentRow}`).value = data.efectividad.sistema.level2;
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = data.efectividad.sistema.level3;
    currentRow++;

    // Docente
    worksheet.getCell(`A${currentRow}`).value = 'Docente';
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = data.efectividad.docente.total;
    worksheet.getCell(`D${currentRow}`).value = data.efectividad.docente.level1;
    worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
    worksheet.getCell(`E${currentRow}`).value = data.efectividad.docente.level2;
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = data.efectividad.docente.level3;
    currentRow++;

    currentRow += 3;

    // 9. Distribución (Condicional según filtro)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const distTitle = worksheet.getCell(`A${currentRow}`);
    distTitle.font = { bold: true, size: 12 };
    distTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    if (dto.agruparPor === 'AMBOS') {
      distTitle.value = 'DISTRIBUCIÓN POR ESTADO Y ORIGEN';

      const distHeaders = [
        'Estado',
        'Origen: Sistema',
        'Origen: Docente',
        'Total',
      ];
      worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = distHeaders[0];
      worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
      worksheet.getCell(`D${currentRow}`).value = distHeaders[1];
      worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
      worksheet.getCell(`F${currentRow}`).value = distHeaders[2];
      worksheet.getCell(`H${currentRow}`).value = distHeaders[3];
      this.styleTableHeaders(worksheet.getRow(currentRow));
      currentRow++;

      data.graficos.estadosOrigen.forEach((d: any) => {
        worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = d.estado;
        worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
        worksheet.getCell(`D${currentRow}`).value = d.Sistema || 0;
        worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
        worksheet.getCell(`F${currentRow}`).value = d.Docente || 0;
        worksheet.getCell(`H${currentRow}`).value =
          (d.Sistema || 0) + (d.Docente || 0);
        currentRow++;
      });
    } else if (dto.agruparPor === 'ORIGEN') {
      distTitle.value = 'DISTRIBUCIÓN POR ORIGEN';

      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'Origen';
      worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
      worksheet.getCell(`E${currentRow}`).value = 'Cantidad';
      this.styleTableHeaders(worksheet.getRow(currentRow));
      currentRow++;

      data.graficos.origen.forEach((d: any) => {
        worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = d.label;
        worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
        worksheet.getCell(`E${currentRow}`).value = d.value;
        currentRow++;
      });
    } else {
      // ESTADO (Default)
      distTitle.value = 'DISTRIBUCIÓN POR ESTADO';

      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'Estado';
      worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
      worksheet.getCell(`E${currentRow}`).value = 'Cantidad';
      this.styleTableHeaders(worksheet.getRow(currentRow));
      currentRow++;

      data.graficos.estados.forEach((d: any) => {
        worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = d.label;
        worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
        worksheet.getCell(`E${currentRow}`).value = d.value;
        currentRow++;
      });
    }

    currentRow += 3;

    // 10. Contenido (Condicional según filtro)
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const contentTitle = worksheet.getCell(`A${currentRow}`);
    contentTitle.font = { bold: true, size: 12 };
    contentTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    if (dto.agruparPorContenido === 'AMBOS') {
      contentTitle.value = 'DISTRIBUCIÓN POR TEMA Y DIFICULTAD';

      const difficulties = data.graficos.allDifficulties || [];

      // Encabezados dinámicos
      worksheet.getCell(`A${currentRow}`).value = 'Tema';
      let colIndex = 2; // B
      difficulties.forEach((dif: string) => {
        // Fusionamos 2 celdas para dar más espacio
        worksheet.mergeCells(currentRow, colIndex, currentRow, colIndex + 1);
        const cell = worksheet.getCell(currentRow, colIndex);
        cell.value = dif;
        colIndex += 2;
      });
      const totalCell = worksheet.getCell(currentRow, colIndex);
      totalCell.value = 'Total';

      this.styleTableHeaders(worksheet.getRow(currentRow));

      // Ajustamos tamaño de letra para las dificultades
      colIndex = 2;
      difficulties.forEach(() => {
        const cell = worksheet.getCell(currentRow, colIndex);
        cell.font = {
          name: 'Calibri',
          bold: true,
          color: { argb: 'FFFFFFFF' },
          size: 8, // Letra más pequeña
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        };
        colIndex += 2;
      });

      currentRow++;

      // Datos de la matriz
      data.graficos.temasDificultades.forEach((row: any) => {
        worksheet.getCell(`A${currentRow}`).value = row.tema;
        let rowTotal = 0;
        colIndex = 2;

        difficulties.forEach((dif: string) => {
          const val = row[dif] || 0;

          // Fusionamos celdas de datos también
          worksheet.mergeCells(currentRow, colIndex, currentRow, colIndex + 1);
          const cell = worksheet.getCell(currentRow, colIndex);

          cell.value = val;
          cell.alignment = { horizontal: 'center' };
          rowTotal += val;
          colIndex += 2;
        });

        const cellTotal = worksheet.getCell(currentRow, colIndex);
        cellTotal.value = rowTotal;
        cellTotal.alignment = { horizontal: 'center' };
        currentRow++;
      });
    } else if (dto.agruparPorContenido === 'DIFICULTAD') {
      contentTitle.value = 'DISTRIBUCIÓN POR DIFICULTAD';

      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'Dificultad';
      worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
      worksheet.getCell(`E${currentRow}`).value = 'Cantidad';
      this.styleTableHeaders(worksheet.getRow(currentRow));
      currentRow++;

      data.graficos.dificultades.forEach((d: any) => {
        worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = d.label;
        worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
        worksheet.getCell(`E${currentRow}`).value = d.value;
        currentRow++;
      });
    } else {
      // TEMA (Default)
      contentTitle.value = 'DISTRIBUCIÓN POR TEMA';

      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'Tema';
      worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
      worksheet.getCell(`E${currentRow}`).value = 'Cantidad';
      this.styleTableHeaders(worksheet.getRow(currentRow));
      currentRow++;

      data.graficos.temas.forEach((d: any) => {
        worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = d.label;
        worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
        worksheet.getCell(`E${currentRow}`).value = d.value;
        currentRow++;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="resumen-sesiones.xlsx"',
    });
  }

  /**
   * Genera el reporte Excel de Historial de Sesiones de Refuerzo.
   */
  async getCourseSessionsHistoryExcel(
    idCurso: string,
    dto: GetCourseSessionsHistoryPdfDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getCourseSessionsHistory(
      idCurso,
      dto,
    );

    // 2. Metadatos
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Historial de Sesiones de Refuerzo',
        'Cursos',
        { ...dto, cursoId: idCurso, aPresentarA },
      );

    // 4. Crear Excel
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet('Historial Sesiones');

    // 5. Encabezado
    let currentRow = this.addHeader(
      workbook,
      worksheet,
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Sesiones de Refuerzo',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    // 6. Evolución (Chart Data)
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const chartTitle = worksheet.getCell(`A${currentRow}`);
    chartTitle.value = 'EVOLUCIÓN TEMPORAL';
    chartTitle.font = { bold: true, size: 12 };
    chartTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Fecha';
    worksheet.getCell(`B${currentRow}`).value = 'Cantidad Sesiones';
    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.chartData.forEach((d: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        d.fecha,
      ).toLocaleDateString();
      worksheet.getCell(`B${currentRow}`).value = d.cantidad;
      currentRow++;
    });

    currentRow += 2;

    // 7. Detalle de Sesiones
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const listTitle = worksheet.getCell(`A${currentRow}`);
    listTitle.value = 'DETALLE DE SESIONES';
    listTitle.font = { bold: true, size: 12 };
    listTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEEEEE' },
    };
    currentRow++;

    const headers = [
      'Fecha',
      'Alumno',
      'Origen',
      'Tema',
      'Dificultad',
      'Estado',
      'Pct. Aciertos',
    ];
    worksheet.getCell(`A${currentRow}`).value = headers[0];
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = headers[1];
    worksheet.getCell(`D${currentRow}`).value = headers[2];
    worksheet.getCell(`E${currentRow}`).value = headers[3];
    worksheet.getCell(`F${currentRow}`).value = headers[4];
    worksheet.getCell(`G${currentRow}`).value = headers[5];
    worksheet.getCell(`H${currentRow}`).value = headers[6];

    this.styleTableHeaders(worksheet.getRow(currentRow));
    currentRow++;

    data.sessions.forEach((s: any) => {
      worksheet.getCell(`A${currentRow}`).value = new Date(
        s.fechaGrafico,
      ).toLocaleDateString();

      worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
      const cellAlumno = worksheet.getCell(`B${currentRow}`);
      cellAlumno.value = `${s.alumno.nombre} ${s.alumno.apellido}`;
      cellAlumno.alignment = { vertical: 'middle', wrapText: true };

      worksheet.getCell(`D${currentRow}`).value = s.origen;
      worksheet.getCell(`E${currentRow}`).value = s.dificultad.tema;

      const cellDificultad = worksheet.getCell(`F${currentRow}`);
      cellDificultad.value = s.dificultad.nombre;
      cellDificultad.alignment = { vertical: 'middle', wrapText: true };

      worksheet.getCell(`G${currentRow}`).value = s.estado.replace(/_/g, ' ');

      const score = s.resultadoSesion
        ? `${Number(s.resultadoSesion.pctAciertos).toFixed(0)}%`
        : '-';
      worksheet.getCell(`H${currentRow}`).value = score;
      worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'center' };

      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="historial-sesiones.xlsx"',
    });
  }
}
