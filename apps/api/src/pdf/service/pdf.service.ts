import { Injectable, Inject, forwardRef, StreamableFile } from '@nestjs/common';
import puppeteer from 'puppeteer';
import hbs from 'hbs';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { ReportesService } from '../../reportes/services/reportes.service';
import { GetCourseClassesHistoryPdfDto } from '../../reportes/dto/get-course-classes-history.dto';
import { GetUsersSummaryDto } from '../../reportes/dto/get-users-summary.dto';
import { GetUsersHistoryDto } from '../../reportes/dto/get-users-history.dto';
import { GetCoursesHistoryDto } from '../../reportes/dto/get-courses-history.dto';
import { GetCoursesSummaryDto } from '../../reportes/dto/get-courses-summary.dto';
import { GetStudentEnrollmentHistoryDto } from '../../reportes/dto/get-student-enrollment-history.dto';
import { GetTeacherAssignmentHistoryDto } from '../../reportes/dto/get-teacher-assignment-history.dto';
import { estado_clase_consulta } from '@prisma/client';
import { GetCourseConsultationsSummaryPdfDto } from 'src/reportes/dto/get-course-consultations-summary.dto';
import { GetCourseConsultationsHistoryPdfDto } from 'src/reportes/dto/get-course-consultations-history.dto';
import { GetCourseClassesSummaryPdfDto } from 'src/reportes/dto/get-course-classes-summary.dto';
import { GetCourseSessionsSummaryPdfDto } from 'src/reportes/dto/get-course-sessions-summary.dto';
import { GetCourseSessionsHistoryPdfDto } from 'src/reportes/dto/get-course-sessions-history.dto';
import { GetCourseProgressSummaryPdfDto } from 'src/reportes/dto/get-course-progress-summary.dto';
import { GetCourseMissionsReportPdfDto } from 'src/reportes/dto/get-course-missions-report.dto';
import { GetCourseMissionDetailReportDto } from 'src/reportes/dto/get-course-mission-detail-report.dto';
import { GetCourseDifficultiesReportPdfDto } from 'src/reportes/dto/get-course-difficulties-report.dto';
import { GetCourseDifficultiesHistoryPdfDto } from 'src/reportes/dto/get-course-difficulties-history.dto';
import { GetStudentDifficultiesReportPdfDto } from 'src/reportes/dto/get-student-difficulties-report.dto';
import { AuditoriaService } from '../../auditoria/services/auditoria.service';
import { FindAuditoriaLogsPdfDto } from '../../auditoria/dto/find-audit-logs.dto';

@Injectable()
export class PdfService {
  constructor(
    @Inject(forwardRef(() => ReportesService))
    private readonly reportesService: ReportesService,
    @Inject(forwardRef(() => AuditoriaService))
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private async registerPartials() {
    const partialsDir = path.join(
      process.cwd(),
      'src',
      'pdf',
      'templates',
      'partials',
    );

    const styles = await readFile(
      path.join(partialsDir, 'styles.hbs'),
      'utf-8',
    );
    const header = await readFile(
      path.join(partialsDir, 'header.hbs'),
      'utf-8',
    );
    const footer = await readFile(
      path.join(partialsDir, 'footer.hbs'),
      'utf-8',
    );
    const chartSetup = await readFile(
      path.join(partialsDir, 'chart-setup.hbs'),
      'utf-8',
    );

    hbs.registerPartial('styles', styles);
    hbs.registerPartial('header', header);
    hbs.registerPartial('footer', footer);
    hbs.registerPartial('chartSetup', chartSetup);
    // Helper básico para comparaciones
    hbs.registerHelper('eq', (a, b) => a === b);
    // Helper para formatear decimales
    hbs.registerHelper('fixed', (n, d) => Number(n).toFixed(d));
  }

  /**
   * Helper para leer la librería Chart.js una sola vez
   */
  private async getChartJsContent(): Promise<string> {
    const chartJsMain = require.resolve('chart.js');
    const chartJsPath = path.join(path.dirname(chartJsMain), 'chart.umd.js');
    return readFile(chartJsPath, 'utf-8');
  }

  /**
   * Helper para construir la estructura común de datos del reporte (Header/Footer)
   */
  private buildCommonTemplateData(
    metadata: { institucion: any; usuario: any; logoBase64: string | null },
    reportInfo: {
      reporteDB: any;
      filtrosTexto: string[];
      titulo: string;
      subtitulo?: string;
      aPresentarA?: string;
    },
  ) {
    const { institucion, usuario, logoBase64 } = metadata;
    const { reporteDB, filtrosTexto, titulo, subtitulo, aPresentarA } =
      reportInfo;

    return {
      institucion: {
        nombre: institucion?.nombre || 'Plataforma Algoritmia',
        direccion: institucion
          ? `${institucion.direccion}, ${institucion.localidad.localidad}, ${institucion.localidad.provincia.provincia}`
          : '',
        email: institucion?.email || '',
        telefono: institucion?.telefono || '',
        logoUrl: logoBase64,
      },
      reporte: {
        numero: reporteDB.nroReporte,
        titulo: titulo,
        subtitulo: subtitulo,
        fechaEmision: new Date().toLocaleDateString(),
        generadoPor: usuario
          ? `${usuario.nombre} ${usuario.apellido}`
          : 'Sistema',
        filtrosTexto: filtrosTexto.join(' | '),
        aPresentarA: aPresentarA,
      },
    };
  }

  async generatePdf(templateName: string, data: any): Promise<Buffer> {
    // 0. Registrar parciales
    await this.registerPartials();

    // 1. Compilar la plantilla HBS
    const templatePath = path.join(
      process.cwd(), // Apunta a la raíz del proyecto en ejecución (apps/api)
      'src',
      'pdf',
      'templates',
      `${templateName}.hbs`,
    );

    const templateHtml = await readFile(templatePath, 'utf-8');
    const template = hbs.compile(templateHtml);
    const html = template(data);

    // 2. Iniciar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // 3. Cargar contenido
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // 4. Generar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '40px',
        left: '20px',
        right: '20px',
      },
      displayHeaderFooter: true,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: grey;">
          Página <span class="pageNumber"></span> de <span class="totalPages"></span>
        </div>
      `,
    });

    await browser.close();

    // Convertir Uint8Array a Buffer
    return Buffer.from(pdfBuffer);
  }

  // --- MÉTODOS DE ORQUESTACIÓN DE REPORTES ---

  async getCourseClassesHistoryPdf(
    idCurso: string,
    dto: GetCourseClassesHistoryPdfDto,
    userId: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos del reporte desde ReportesService
    const data = await this.reportesService.getCourseClassesHistory(
      idCurso,
      dto,
    );

    // 2. Obtener metadatos comunes (Curso, Institución, Usuario, Logo)
    const { curso, institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId, idCurso);

    // 3. Registrar Generación de Reporte en BD
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Historial de Clases de Consulta',
        'Cursos',
        dto,
      );

    // 4. Preparamos los KPIs para el reporte
    const totalClases = data.tableData.length;
    const realizadas = data.tableData.filter(
      (c) => c.estado === estado_clase_consulta.Realizada,
    ).length;

    // Calcular efectividad promedio
    let sumPct = 0;
    let countRealizadasConConsultas = 0;
    data.tableData.forEach((c) => {
      if (
        c.estado === estado_clase_consulta.Realizada &&
        c.totalConsultas > 0
      ) {
        sumPct += (c.revisadas / c.totalConsultas) * 100;
        countRealizadasConConsultas++;
      }
    });
    const pctEfectividad =
      countRealizadasConConsultas > 0
        ? (sumPct / countRealizadasConConsultas).toFixed(1)
        : '0.0';

    // 5. Formateamos los datos para Handlebars
    const clasesFormatted = data.tableData.map((c) => ({
      fecha: c.fechaAgenda.toISOString().split('T')[0],
      nombre: c.nombre,
      docente: c.docente,
      estado: c.estado.replace(/_/g, ' '),
      estadoRaw: c.estado,
      totalConsultas: c.totalConsultas,
      revisadas: c.revisadas,
    }));

    // 6. Preparar datos para el Gráfico (Chart.js)
    const chartJsContent = await this.getChartJsContent();

    const chartConfig = {
      type: 'bar',
      data: {
        labels: data.chartData.map((d) => {
          const datePart = d.fecha.split('-').slice(1).reverse().join('/');
          const statusPart = d.estado.replace(/_/g, ' ');
          return `${datePart} (${statusPart})`;
        }),
        datasets: [
          {
            label: 'Revisadas',
            data: data.chartData.map((d) => d.revisadas),
            backgroundColor: '#2e7d32',
            stack: 'Stack 0',
          },
          {
            label: 'No Revisadas',
            data: data.chartData.map((d) => d.noRevisadas),
            backgroundColor: '#ed6c02',
            stack: 'Stack 0',
          },
          {
            label: 'Pendientes',
            data: data.chartData.map((d) => d.pendientes),
            backgroundColor: '#9e9e9e', // Gris
            stack: 'Stack 0',
          },
          {
            label: 'A Revisar',
            data: data.chartData.map((d) => d.aRevisar),
            backgroundColor: '#1976d2', // Azul
            stack: 'Stack 0',
          },
        ],
      },
    };

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Clases de Consulta',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA: dto.aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      kpis: {
        total: totalClases,
        realizadas,
        pctEfectividad,
      },
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
      clases: clasesFormatted,
    };

    const pdfBuffer = await this.generatePdf('reporte-clases', templateData);

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="historial-clases-${idCurso}.pdf"`,
    });
  }

  async getUsersSummaryPdf(
    summaryDto: GetUsersSummaryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const summaryResult =
      await this.reportesService.getUsersSummary(summaryDto);

    const {
      kpis: summary,
      distribucion: distribution,
      lista: list,
    } = summaryResult;

    // 2. Metadatos
    const { institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Resumen de Usuarios',
        'Usuarios',
        { ...summaryDto, aPresentarA },
      );

    // 4. Configurar Gráfico
    const chartJsContent = await this.getChartJsContent();

    // Preparar datos del gráfico según agrupación
    const agruparPor = summaryDto.agruparPor || 'ROL';
    const totalDistribucion = distribution.reduce(
      (acc: number, curr: any) => acc + curr.cantidad,
      0,
    );

    const chartConfig: any = {
      type: 'bar',
      data: { labels: [], datasets: [] },
      options: {
        scales: {
          y: {
            ticks: {
              stepSize: 1,
              precision: 0,
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: `Distribución de usuarios por ${
              agruparPor === 'AMBOS'
                ? 'ROL y ESTADO'
                : agruparPor.replace('_', ' ')
            }`,
            font: { size: 16 },
          },
          legend: { position: 'right' },
        },
      },
    };

    // Colores consistentes
    const colors: Record<string, string> = {
      Administrador: '#9c27b0',
      Docente: '#ed6c02',
      Alumno: '#0288d1',
      Activo: '#2e7d32',
      Inactivo: '#d32f2f',
    };

    if (agruparPor === 'AMBOS') {
      // Stacked Bar: X=Estado, Series=Roles
      chartConfig.data.labels = ['Activo', 'Inactivo'];
      chartConfig.options.scales.x = { stacked: true };
      chartConfig.options.scales.y.stacked = true;

      const roles = Array.from(new Set(distribution.map((d: any) => d.rol)));
      chartConfig.data.datasets = roles.map((rol: any) => {
        const data = ['Activo', 'Inactivo'].map((estado) => {
          const found = distribution.find(
            (d: any) => d.rol === rol && d.estado === estado,
          );
          return found ? found.cantidad : 0;
        });

        // Calcular total del rol para el porcentaje en leyenda (aproximado)
        const totalRol = distribution
          .filter((d: any) => d.rol === rol)
          .reduce((acc: number, curr: any) => acc + curr.cantidad, 0);
        const pct = ((totalRol / totalDistribucion) * 100).toFixed(1);

        return {
          label: `${rol} (${totalRol} - ${pct}%)`,
          data,
          backgroundColor: colors[rol] || '#888',
        };
      });
    } else {
      // Simple Bar (Rol o Estado)
      // Para tener leyenda con colores, usamos un dataset por categoría
      chartConfig.data.labels = ['Total']; // Una sola barra agrupada o separada
      chartConfig.data.datasets = distribution.map((d: any) => {
        const pct = ((d.cantidad / totalDistribucion) * 100).toFixed(1);
        return {
          label: `${d.grupo} (${d.cantidad} - ${pct}%)`,
          data: [d.cantidad],
          backgroundColor: colors[d.grupo] || '#888',
        };
      });
    }

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Usuarios',
        aPresentarA: aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      kpis: summary,
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
      usuarios: list,
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-usuarios-resumen',
      templateData,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="resumen-usuarios.pdf"`,
    });
  }

  async getUsersHistoryPdf(
    dto: GetUsersHistoryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos (El servicio ya devuelve ordenado descendente por fecha)
    const { history } = await this.reportesService.getUsersHistory(dto);

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

    // 4. Configurar Gráfico (Línea de tiempo)
    const chartJsContent = await this.getChartJsContent();

    // Agrupar por fecha para el gráfico
    const timelineMap = new Map<string, { altas: number; bajas: number }>();

    // Ordenar cronológicamente (ascendente) para el gráfico
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );

    sortedHistory.forEach((h) => {
      const dateKey = h.fecha.toISOString().split('T')[0];
      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, { altas: 0, bajas: 0 });
      }
      const entry = timelineMap.get(dateKey)!;
      if (h.tipoMovimiento === 'Alta') entry.altas++;
      else if (h.tipoMovimiento === 'Baja') entry.bajas++;
    });

    const labels = Array.from(timelineMap.keys());
    const altasData = Array.from(timelineMap.values()).map((v) => v.altas);
    const bajasData = Array.from(timelineMap.values()).map((v) => v.bajas);

    const chartConfig = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Altas',
            data: altasData,
            borderColor: '#1976d2',
            backgroundColor: '#1976d2',
            tension: 0.1,
            fill: false,
          },
          {
            label: 'Bajas',
            data: bajasData,
            borderColor: '#d32f2f',
            backgroundColor: '#d32f2f',
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            ticks: { stepSize: 1, precision: 0 },
            beginAtZero: true,
          },
        },
        plugins: {
          title: { display: true, text: 'Evolución de Movimientos' },
          legend: { position: 'top' },
        },
      },
    };

    // Formatear tabla para la vista (fechas legibles)
    const historyFormatted = history.map((h) => ({
      fecha: h.fecha.toISOString().split('T')[0],
      nombre: h.nombre,
      apellido: h.apellido,
      email: h.email,
      rol: h.rol,
      tipo: h.tipoMovimiento,
      esAlta: h.tipoMovimiento === 'Alta',
    }));

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Usuarios',
        aPresentarA: aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
      movimientos: historyFormatted,
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-usuarios-historial',
      templateData,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="historial-usuarios.pdf"`,
    });
  }

  async getCoursesHistoryPdf(
    dto: GetCoursesHistoryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    const { history, chartData } =
      await this.reportesService.getCoursesHistory(dto);

    const { institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId);

    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Historial de Cursos',
        'Cursos',
        { ...dto, aPresentarA },
      );

    const chartJsContent = await this.getChartJsContent();

    const labels = chartData.map((d) => d.fecha);
    const altasData = chartData.map((d) => d.altas);
    const bajasData = chartData.map((d) => d.bajas);

    const chartConfig = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Altas',
            data: altasData,
            borderColor: '#1976d2',
            backgroundColor: '#1976d2',
            tension: 0.1,
            fill: false,
          },
          {
            label: 'Bajas',
            data: bajasData,
            borderColor: '#d32f2f',
            backgroundColor: '#d32f2f',
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            ticks: { stepSize: 1, precision: 0 },
            beginAtZero: true,
          },
        },
        plugins: {
          title: { display: true, text: 'Evolución de Movimientos' },
          legend: { position: 'top' },
        },
      },
    };

    const historyFormatted = history.map((h) => ({
      fecha: h.fecha.toISOString().split('T')[0],
      curso: h.curso,
      tipo: h.tipo,
      esAlta: h.tipo === 'Alta',
      detalle:
        typeof h.detalle === 'object'
          ? `Docentes: ${h.detalle.docentes || 'Ninguno'} | Días: ${h.detalle.dias || 'Ninguno'}`
          : h.detalle,
    }));

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Cursos',
        aPresentarA: aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
      movimientos: historyFormatted,
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-usuarios-historial', // Reutilizamos la plantilla de historial (es genérica)
      templateData,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="historial-cursos.pdf"`,
    });
  }

  async getCoursesSummaryPdf(
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

    // 4. Configurar Gráfico
    const chartJsContent = await this.getChartJsContent();

    const chartConfig = {
      type: 'bar',
      data: {
        labels: ['Total'],
        datasets: [
          {
            label: `Activos (${kpis.activos})`,
            data: [kpis.activos],
            backgroundColor: '#2e7d32',
          },
          {
            label: `Inactivos (${kpis.inactivos})`,
            data: [kpis.inactivos],
            backgroundColor: '#d32f2f',
          },
        ],
      },
      options: {
        scales: {
          y: {
            ticks: { stepSize: 1, precision: 0 },
            beginAtZero: true,
          },
        },
        plugins: {
          title: { display: true, text: 'Distribución de Cursos por Estado' },
          legend: { position: 'right' },
        },
      },
    };

    // Formatear lista
    const cursosFormatted = lista.map((c) => ({
      nombre: c.nombre,
      estado: c.estado,
      alumnosActivos: c.alumnos.activos,
      docentesActivos: c.docentes.activos,
      createdAt: c.createdAt.toISOString().split('T')[0],
    }));

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Cursos',
        aPresentarA: aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      kpis,
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
      cursos: cursosFormatted,
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-cursos-resumen',
      templateData,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="resumen-cursos.pdf"`,
    });
  }

  async getStudentEnrollmentHistoryPdf(
    dto: GetStudentEnrollmentHistoryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const events = await this.reportesService.getStudentEnrollmentHistory(dto);

    // 2. Metadatos
    const { institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Historial de Inscripciones',
        'Cursos',
        { ...dto, aPresentarA },
      );

    // 4. Configurar Gráfico (Agrupación manual ya que el servicio devuelve array plano)
    const chartJsContent = await this.getChartJsContent();

    const timelineMap = new Map<
      string,
      { inscripciones: number; bajas: number }
    >();

    // Ordenar ascendente para el gráfico
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );

    sortedEvents.forEach((e) => {
      const dateKey = e.fecha.toISOString().split('T')[0];
      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, { inscripciones: 0, bajas: 0 });
      }
      const entry = timelineMap.get(dateKey)!;
      if (e.tipo === 'Inscripción') entry.inscripciones++;
      else if (e.tipo === 'Baja') entry.bajas++;
    });

    const labels = Array.from(timelineMap.keys());
    const inscripcionesData = Array.from(timelineMap.values()).map(
      (v) => v.inscripciones,
    );
    const bajasData = Array.from(timelineMap.values()).map((v) => v.bajas);

    const chartConfig = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Inscripciones',
            data: inscripcionesData,
            borderColor: '#2e7d32',
            backgroundColor: '#2e7d32',
            tension: 0.1,
            fill: false,
          },
          {
            label: 'Bajas',
            data: bajasData,
            borderColor: '#d32f2f',
            backgroundColor: '#d32f2f',
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: { ticks: { stepSize: 1, precision: 0 }, beginAtZero: true },
        },
        plugins: {
          title: { display: true, text: 'Evolución de Inscripciones' },
          legend: { position: 'top' },
        },
      },
    };

    // Formatear tabla
    const historyFormatted = events.map((e) => ({
      fecha: e.fecha.toISOString().split('T')[0],
      tipo: e.tipo,
      esInscripcion: e.tipo === 'Inscripción',
      alumno: e.alumno,
      curso: e.curso,
    }));

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Inscripciones',
        aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
      movimientos: historyFormatted,
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-inscripciones-historial',
      templateData,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="historial-inscripciones.pdf"`,
    });
  }

  async getTeacherAssignmentHistoryPdf(
    dto: GetTeacherAssignmentHistoryDto,
    userId: string,
    aPresentarA?: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const events = await this.reportesService.getTeacherAssignmentHistory(dto);

    // 2. Metadatos
    const { institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Historial de Asignaciones',
        'Cursos',
        { ...dto, aPresentarA },
      );

    // 4. Configurar Gráfico
    const chartJsContent = await this.getChartJsContent();

    const timelineMap = new Map<
      string,
      { asignaciones: number; bajas: number }
    >();

    // Ordenar ascendente para el gráfico
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );

    sortedEvents.forEach((e) => {
      const dateKey = e.fecha.toISOString().split('T')[0];
      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, { asignaciones: 0, bajas: 0 });
      }
      const entry = timelineMap.get(dateKey)!;
      if (e.tipo === 'Asignación') entry.asignaciones++;
      else if (e.tipo === 'Baja') entry.bajas++;
    });

    const labels = Array.from(timelineMap.keys());
    const asignacionesData = Array.from(timelineMap.values()).map(
      (v) => v.asignaciones,
    );
    const bajasData = Array.from(timelineMap.values()).map((v) => v.bajas);

    const chartConfig = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Asignaciones',
            data: asignacionesData,
            borderColor: '#2e7d32',
            backgroundColor: '#2e7d32',
            tension: 0.1,
            fill: false,
          },
          {
            label: 'Bajas',
            data: bajasData,
            borderColor: '#d32f2f',
            backgroundColor: '#d32f2f',
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: { ticks: { stepSize: 1, precision: 0 }, beginAtZero: true },
        },
        plugins: {
          title: { display: true, text: 'Evolución de Asignaciones' },
          legend: { position: 'top' },
        },
      },
    };

    // Formatear tabla
    const historyFormatted = events.map((e) => ({
      fecha: e.fecha.toISOString().split('T')[0],
      tipo: e.tipo,
      esAsignacion: e.tipo === 'Asignación',
      docente: e.docente,
      curso: e.curso,
    }));

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Asignaciones',
        aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
      movimientos: historyFormatted,
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-asignaciones-historial',
      templateData,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="historial-asignaciones.pdf"`,
    });
  }

  async getCourseConsultationsSummaryPdf(
    idCurso: string,
    dto: GetCourseConsultationsSummaryPdfDto,
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

    // 4. Configurar Gráfico según agrupación
    const chartJsContent = await this.getChartJsContent();
    let chartConfig: any;

    if (dto.agruparPor === 'AMBOS') {
      // Gráfico de Barras Apiladas (Tema x Estado)
      const labels = data.graficoTemasEstados.map((d) => d.tema);
      const statuses = [
        { key: 'Pendiente', color: '#ff9800', label: 'Pendiente' },
        { key: 'A_revisar', color: '#2196f3', label: 'A revisar' },
        { key: 'Revisada', color: '#9c27b0', label: 'Revisada' },
        { key: 'Resuelta', color: '#4caf50', label: 'Resuelta' },
      ];

      const datasets = statuses.map((s) => ({
        label: s.label,
        data: data.graficoTemasEstados.map((d) => d[s.key] || 0),
        backgroundColor: s.color,
        stack: 'Stack 0',
      }));

      chartConfig = {
        type: 'bar',
        data: { labels, datasets },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución de consultas por ESTADO y TEMA',
            },
            legend: { position: 'bottom' },
          },
          scales: {
            x: {
              stacked: true,
              title: { display: true, text: 'Temas' },
            },
            y: {
              stacked: true,
              title: { display: true, text: 'Cantidad de Consultas' },
              beginAtZero: true,
            },
          },
        },
      };
    } else if (dto.agruparPor === 'TEMA') {
      // Gráfico de Torta (Por Tema)
      chartConfig = {
        type: 'pie',
        data: {
          labels: data.graficoTemas.map((d) => `${d.label} (${d.value})`),
          datasets: [
            {
              data: data.graficoTemas.map((d) => d.value),
              backgroundColor: [
                '#3f51b5',
                '#e91e63',
                '#009688',
                '#ffc107',
                '#607d8b',
                '#ff5722',
                '#795548',
                '#9e9e9e',
              ],
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución de consultas por TEMA',
            },
            legend: { position: 'bottom' },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      };
    } else {
      // Gráfico de Torta (Por Estado - Default)
      chartConfig = {
        type: 'pie',
        data: {
          labels: data.graficoEstados.map((d) => `${d.label} (${d.value})`),
          datasets: [
            {
              data: data.graficoEstados.map((d) => d.value),
              backgroundColor: data.graficoEstados.map((d) => d.color),
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución de consultas por ESTADO',
            },
            legend: { position: 'bottom' },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      };
    }

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Consultas',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      kpis: data.kpis,
      topStats: {
        student: data.topStudent,
        teacher: data.topTeacher,
        topic: data.topTopic,
      },
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-consultas-resumen',
      templateData,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="resumen-consultas.pdf"`,
    });
  }

  async getCourseConsultationsHistoryPdf(
    idCurso: string,
    dto: GetCourseConsultationsHistoryPdfDto,
    userId: string,
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
        dto,
      );

    // 4. Configurar Gráfico
    const chartJsContent = await this.getChartJsContent();

    const chartConfig = {
      type: 'line',
      data: {
        labels: data.timeline.map((d) =>
          d.fecha.split('-').slice(1).reverse().join('/'),
        ),
        datasets: [
          {
            label: 'Consultas Realizadas',
            data: data.timeline.map((d) => d.cantidad),
            borderColor: '#1976d2',
            backgroundColor: '#1976d2',
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad de consultas',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Fecha',
            },
          },
        },
      },
    };

    // 5. Formatear Tabla
    const consultasFormatted = data.tabla.map((c) => ({
      fecha: c.fecha.toISOString().split('T')[0],
      titulo: c.titulo,
      tema: c.tema,
      alumno: c.alumno,
      estado: c.estado.replace('_', ' '),
      estadoRaw: c.estado,
      docente: c.docente,
      valoracion: c.valoracion ? `${c.valoracion} ⭐` : '-',
    }));

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Consultas',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA: dto.aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      stats: data.stats,
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
      consultas: consultasFormatted,
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-consultas-historial',
      templateData,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="historial-consultas-${idCurso}.pdf"`,
    });
  }

  async getCourseClassesSummaryPdf(
    idCurso: string,
    dto: GetCourseClassesSummaryPdfDto,
    userId: string,
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
        { ...dto, cursoId: idCurso },
      );

    // 4. Configurar Gráfico
    const chartJsContent = await this.getChartJsContent();
    let chartConfig: any;

    if (dto.agruparPor === 'AMBOS') {
      // Barras Apiladas (Estado x Origen)
      const labels = data.graficoEstadosOrigen.map((d) => d.estado);
      const datasets = [
        {
          label: 'Sistema',
          data: data.graficoEstadosOrigen.map((d) => d.Sistema),
          backgroundColor: '#9c27b0',
          stack: 'Stack 0',
        },
        {
          label: 'Docente',
          data: data.graficoEstadosOrigen.map((d) => d.Docente),
          backgroundColor: '#ff9800',
          stack: 'Stack 0',
        },
      ];

      chartConfig = {
        type: 'bar',
        data: { labels, datasets },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución de Clases de Consulta por ESTADO y ORIGEN',
            },
            legend: { position: 'bottom' },
          },
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true },
          },
        },
      };
    } else if (dto.agruparPor === 'ORIGEN') {
      // Torta (Origen)
      chartConfig = {
        type: 'pie',
        data: {
          labels: data.graficoOrigen.map((d) => `${d.label} (${d.value})`),
          datasets: [
            {
              data: data.graficoOrigen.map((d) => d.value),
              backgroundColor: data.graficoOrigen.map((d) => d.color),
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución de Clases de Consulta por ORIGEN',
            },
            legend: { position: 'right' },
          },
          scales: { x: { display: false }, y: { display: false } },
        },
      };
    } else {
      // Torta (Estado - Default)
      chartConfig = {
        type: 'pie',
        data: {
          labels: data.graficoEstados.map((d) => `${d.label} (${d.value})`),
          datasets: [
            {
              data: data.graficoEstados.map((d) => d.value),
              backgroundColor: data.graficoEstados.map((d) => d.color),
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución de Clases de Consulta por ESTADO',
            },
            legend: { position: 'right' },
          },
          scales: { x: { display: false }, y: { display: false } },
        },
      };
    }

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Clases de Consulta',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA: dto.aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      kpis: data.kpis,
      efectividad: data.efectividad,
      impacto: data.impacto,
      topTopic: data.topTopic,
      topTeacher: data.topTeacher,
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-clases-resumen',
      templateData,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="resumen-clases-${idCurso}.pdf"`,
    });
  }

  async getCourseSessionsSummaryPdf(
    idCurso: string,
    dto: GetCourseSessionsSummaryPdfDto,
    userId: string,
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
        { ...dto, cursoId: idCurso },
      );

    // 4. Configurar Gráficos
    const chartJsContent = await this.getChartJsContent();

    // --- Gráfico 1: Distribución (Estado / Origen) ---
    let chartConfig1: any;
    if (dto.agruparPor === 'AMBOS') {
      const labels = data.graficos.estadosOrigen.map((d) => d.estado);
      chartConfig1 = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Sistema',
              data: data.graficos.estadosOrigen.map((d) => d.Sistema),
              backgroundColor: '#9c27b0',
              stack: 'Stack 0',
            },
            {
              label: 'Docente',
              data: data.graficos.estadosOrigen.map((d) => d.Docente),
              backgroundColor: '#ff9800',
              stack: 'Stack 0',
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución de Sesiones de Refuerzo por ESTADO y ORIGEN',
            },
            legend: { position: 'bottom' },
          },
          scales: { x: { stacked: true }, y: { stacked: true } },
        },
      };
    } else if (dto.agruparPor === 'ORIGEN') {
      chartConfig1 = {
        type: 'pie',
        data: {
          labels: data.graficos.origen.map((d) => `${d.label} (${d.value})`),
          datasets: [
            {
              data: data.graficos.origen.map((d) => d.value),
              backgroundColor: data.graficos.origen.map((d) => d.color),
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución de Sesiones de Refuerzo por ORIGEN',
            },
            legend: { position: 'bottom' },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      };
    } else {
      // ESTADO (Default)
      chartConfig1 = {
        type: 'pie',
        data: {
          labels: data.graficos.estados.map((d) => `${d.label} (${d.value})`),
          datasets: [
            {
              data: data.graficos.estados.map((d) => d.value),
              backgroundColor: data.graficos.estados.map((d) => d.color),
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución de Sesiones de Refuerzo por ESTADO',
            },
            legend: { position: 'bottom' },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      };
    }

    // --- Gráfico 2: Contenido (Tema / Dificultad) ---
    let chartConfig2: any;
    if (dto.agruparPorContenido === 'AMBOS') {
      const labels = data.graficos.temasDificultades.map((d: any) => d.tema);
      const datasets = data.graficos.allDifficulties.map(
        (dif: string, i: number) => ({
          label: dif,
          data: data.graficos.temasDificultades.map((d: any) => d[dif] || 0),
          backgroundColor: `hsl(${(i * 360) / data.graficos.allDifficulties.length}, 70%, 50%)`, // Colores dinámicos
          stack: 'Stack 0',
        }),
      );

      chartConfig2 = {
        type: 'bar',
        data: { labels, datasets },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución de Sesiones de Refuerzo por TEMA y DIFICULTAD',
            },
            legend: { position: 'bottom' },
          },
          scales: { x: { stacked: true }, y: { stacked: true } },
        },
      };
    } else if (dto.agruparPorContenido === 'DIFICULTAD') {
      chartConfig2 = {
        type: 'pie',
        data: {
          labels: data.graficos.dificultades.map(
            (d) => `${d.label} (${d.value})`,
          ),
          datasets: [
            {
              data: data.graficos.dificultades.map((d) => d.value),
              backgroundColor: [
                '#e91e63',
                '#9c27b0',
                '#673ab7',
                '#3f51b5',
                '#2196f3',
                '#03a9f4',
              ],
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución de Sesiones de Refuerzo por DIFICULTAD',
            },
            legend: { position: 'bottom' },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      };
    } else {
      // TEMA (Default)
      chartConfig2 = {
        type: 'pie',
        data: {
          labels: data.graficos.temas.map((d) => `${d.label} (${d.value})`),
          datasets: [
            {
              data: data.graficos.temas.map((d) => d.value),
              backgroundColor: [
                '#f44336',
                '#ff9800',
                '#ffeb3b',
                '#4caf50',
                '#009688',
                '#00bcd4',
              ],
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribución de Sesiones de Refuerzo por TEMA',
            },
            legend: { position: 'bottom' },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      };
    }

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Sesiones de Refuerzo',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA: dto.aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      ...data, // kpis, tops, efectividad
      chartJsContent,
      chartConfig1: JSON.stringify(chartConfig1),
      chartConfig2: JSON.stringify(chartConfig2),
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-sesiones-resumen',
      templateData,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="resumen-sesiones-${idCurso}.pdf"`,
    });
  }

  async getCourseSessionsHistoryPdf(
    idCurso: string,
    dto: GetCourseSessionsHistoryPdfDto,
    userId: string,
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
        { ...dto, cursoId: idCurso },
      );

    // 4. Configurar Gráfico (Línea de tiempo)
    const chartJsContent = await this.getChartJsContent();

    const chartConfig = {
      type: 'line',
      data: {
        labels: data.chartData.map((d) =>
          d.fecha.split('-').slice(1).reverse().join('/'),
        ),
        datasets: [
          {
            label: 'Sesiones',
            data: data.chartData.map((d) => d.cantidad),
            borderColor: '#2196f3',
            backgroundColor: '#2196f3',
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 },
            title: { display: true, text: 'Cantidad de sesiones' },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    };

    // 5. Formatear Tabla
    const sesionesFormatted = data.sessions.map((s) => ({
      fecha: s.fechaGrafico.toISOString().split('T')[0],
      alumno: `${s.alumno.nombre} ${s.alumno.apellido}`,
      origen: s.origen,
      tema: s.dificultad.tema,
      dificultad: s.dificultad.nombre,
      estado: s.estado.replace(/_/g, ' '),
      estadoRaw: s.estado,
      score: s.resultadoSesion
        ? `${Number(s.resultadoSesion.pctAciertos).toFixed(0)}%`
        : '-',
    }));

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Sesiones de Refuerzo',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA: dto.aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
      sesiones: sesionesFormatted,
      totalSesiones: sesionesFormatted.length,
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-sesiones-historial',
      templateData,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="historial-sesiones-${idCurso}.pdf"`,
    });
  }

  async getCourseProgressSummaryPdf(
    idCurso: string,
    dto: GetCourseProgressSummaryPdfDto,
    userId: string,
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
        { ...dto, cursoId: idCurso, aPresentarA: dto.aPresentarA },
      );

    // 4. Configurar Gráficos
    const chartJsContent = await this.getChartJsContent();

    // Gráfico 1: Evolución (Línea)
    const evolutionLabels = data.evolucion.map((d) =>
      d.fecha.toISOString().split('T')[0].split('-').reverse().join('/'),
    );
    const evolutionValues = data.evolucion.map((d) => d.progreso);

    const chartConfigEvolution = {
      type: 'line',
      data: {
        labels: evolutionLabels,
        datasets: [
          {
            label: 'Progreso Promedio (%)',
            data: evolutionValues,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            fill: true,
            tension: 0.1,
            pointRadius: 3,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Porcentaje Completado' },
          },
        },
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Evolución del Progreso' },
        },
      },
    };

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Progreso del Curso',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA: dto.aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      resumen: data.resumen,
      tops: data.tops,
      chartJsContent,
      chartConfigEvolution: JSON.stringify(chartConfigEvolution),
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-progreso-resumen',
      templateData,
    );

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="resumen-progreso-${idCurso}.pdf"`,
    });
  }

  async getCourseMissionsReportPdf(
    idCurso: string,
    dto: GetCourseMissionsReportPdfDto,
    userId: string,
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
        { ...dto, cursoId: idCurso, aPresentarA: dto.aPresentarA },
      );

    // 4. Configurar Gráfico
    const chartJsContent = await this.getChartJsContent();

    const labels = data.grafico.map((d) => {
      const parts = d.fecha.split('T')[0].split('-');
      return `${parts[2]}/${parts[1]}`; // dd/MM
    });
    const values = data.grafico.map((d) => d.cantidad);

    // Ajuste de escala Y para valores pequeños
    const maxVal = Math.max(...values, 0);
    const yAxisConfig: any = {
      beginAtZero: true,
      title: { display: true, text: 'Misiones Completadas' },
    };
    if (maxVal < 5) {
      yAxisConfig.max = 5;
      yAxisConfig.ticks = { stepSize: 1, precision: 0 };
    } else {
      yAxisConfig.ticks = { precision: 0 };
    }

    const chartConfig = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Cantidad',
            data: values,
            borderColor: '#1976d2',
            backgroundColor: '#1976d2',
            tension: 0.1,
            fill: false,
            pointRadius: 3,
          },
        ],
      },
      options: {
        scales: { y: yAxisConfig },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Cantidad de Misiones Completadas por Fecha',
          },
        },
      },
    };

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Reporte de Misiones Completadas',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA: dto.aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      kpis: data.kpis,
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
      tabla: data.tabla.map((m) => ({
        ...m,
        alumnosCompletaronUnified: `${m.completadoPor} (${m.pctCompletado.toFixed(1)}%)`,
        promEstrellas: m.promEstrellas.toFixed(1),
        promIntentos: m.promIntentos.toFixed(1),
      })),
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-misiones-completadas',
      templateData,
    );
    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="misiones-completadas-${idCurso}.pdf"`,
    });
  }

  async getCourseMissionDetailReportPdf(
    idCurso: string,
    dto: GetCourseMissionDetailReportDto & { aPresentarA?: string },
    userId: string,
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
        { ...dto, cursoId: idCurso, aPresentarA: dto.aPresentarA },
      );

    // 4. Configurar Gráfico
    const chartJsContent = await this.getChartJsContent();

    const labels = data.grafico.map((d) => {
      const parts = d.fecha.split('T')[0].split('-');
      return `${parts[2]}/${parts[1]}`; // dd/MM
    });
    const values = data.grafico.map((d) => d.cantidad);

    // Ajuste de escala Y
    const maxVal = Math.max(...values, 0);
    const yAxisConfig: any = {
      beginAtZero: true,
      title: { display: true, text: 'Cantidad' },
    };
    if (maxVal < 5) {
      yAxisConfig.max = 5;
      yAxisConfig.ticks = { stepSize: 1, precision: 0 };
    } else {
      yAxisConfig.ticks = { precision: 0 };
    }

    const chartConfig = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Completados',
            data: values,
            borderColor: '#2e7d32',
            backgroundColor: '#2e7d32',
            tension: 0.1,
            fill: false,
            pointRadius: 3,
          },
        ],
      },
      options: {
        scales: { y: yAxisConfig },
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Frecuencia de Completado' },
        },
      },
    };

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: `Detalle por Misión: ${data.mision.nombre}`,
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA: dto.aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      mision: data.mision,
      stats: {
        ...data.stats,
        pctAlumnos: data.stats.pctAlumnos.toFixed(1),
        promEstrellas: data.stats.promEstrellas.toFixed(1),
        promIntentos: data.stats.promIntentos.toFixed(1),
      },
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
      tabla: data.tabla.map((t) => ({
        ...t,
        fecha: t.fecha
          ? t.fecha.toISOString().split('T')[0].split('-').reverse().join('/')
          : '-',
      })),
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-detalle-mision',
      templateData,
    );
    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="detalle-mision-${idCurso}.pdf"`,
    });
  }

  async getCourseDifficultiesReportPdf(
    idCurso: string,
    dto: GetCourseDifficultiesReportPdfDto,
    userId: string,
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
        { ...dto, cursoId: idCurso, aPresentarA: dto.aPresentarA },
      );

    // 4. Configurar Gráficos
    const chartJsContent = await this.getChartJsContent();

    // Gráfico 1: Distribución por Dificultad (Pie)
    const chartConfigDificultad = {
      type: 'pie',
      data: {
        labels: data.graficos.porDificultad.map(
          (d) => `${d.label} (${d.value})`,
        ),
        datasets: [
          {
            data: data.graficos.porDificultad.map((d) => d.value),
            backgroundColor: [
              '#3f51b5',
              '#e91e63',
              '#009688',
              '#ffc107',
              '#607d8b',
              '#ff5722',
              '#795548',
              '#9e9e9e',
            ],
          },
        ],
      },
      options: {
        layout: { padding: 20 },
        scales: { x: { display: false }, y: { display: false } },
        plugins: {
          title: { display: true, text: 'Alumnos afectados por Dificultad' },
          legend: { position: 'right' },
        },
      },
    };

    // Gráfico 2: Distribución por Tema (Pie)
    const chartConfigTema = {
      type: 'pie',
      data: {
        labels: data.graficos.porTema.map((d) => `${d.label} (${d.value})`),
        datasets: [
          {
            data: data.graficos.porTema.map((d) => d.value),
            backgroundColor: [
              '#f44336',
              '#ff9800',
              '#ffeb3b',
              '#4caf50',
              '#009688',
              '#00bcd4',
            ],
          },
        ],
      },
      options: {
        layout: { padding: 20 },
        scales: { x: { display: false }, y: { display: false } },
        plugins: {
          title: { display: true, text: 'Alumnos afectados por Tema' },
          legend: { position: 'right' },
        },
      },
    };

    // Gráfico 3: Distribución por Grado (Pie)
    const chartConfigGrado = {
      type: 'pie',
      data: {
        labels: data.graficos.porGrado.map((d) => `${d.label} (${d.value})`),
        datasets: [
          {
            data: data.graficos.porGrado.map((d) => d.value),
            backgroundColor: data.graficos.porGrado.map((d) => d.color),
          },
        ],
      },
      options: {
        layout: { padding: 20 },
        scales: { x: { display: false }, y: { display: false } },
        plugins: {
          title: { display: true, text: 'Alumnos afectados por Grado' },
          legend: { position: 'right' },
        },
      },
    };

    // Gráfico 4: Detalle por Grado (Barra Apilada Horizontal)
    const labels = data.distribucionGrados.map((d) => d.nombre);
    const datasetBajo = data.distribucionGrados.map((d) => d.grados.Bajo);
    const datasetMedio = data.distribucionGrados.map((d) => d.grados.Medio);
    const datasetAlto = data.distribucionGrados.map((d) => d.grados.Alto);

    const chartConfigDetalle = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Bajo',
            data: datasetBajo,
            backgroundColor: '#4caf50',
            stack: 'Stack 0',
          },
          {
            label: 'Medio',
            data: datasetMedio,
            backgroundColor: '#ff9800',
            stack: 'Stack 0',
          },
          {
            label: 'Alto',
            data: datasetAlto,
            backgroundColor: '#f44336',
            stack: 'Stack 0',
          },
        ],
      },
      options: {
        indexAxis: 'y',
        layout: { padding: 20 },
        scales: {
          x: {
            stacked: true,
            title: { display: true, text: 'Cantidad de Alumnos' },
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 },
          },
          y: { stacked: true },
        },
        plugins: {
          title: { display: true, text: 'Detalle de Grados por Dificultad' },
          legend: { position: 'bottom' },
        },
      },
    };

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Resumen de Dificultades',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA: dto.aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      kpis: {
        ...data.kpis,
        promDificultades: data.kpis.promDificultades.toFixed(1),
        temaFrecuentePct: data.kpis.temaFrecuente.pctAlumnos.toFixed(1),
        dificultadFrecuentePct:
          data.kpis.dificultadFrecuente.pctAlumnos.toFixed(1),
        gradoAltoPct: data.kpis.gradoAlto.pctAlumnos.toFixed(1),
      },
      chartJsContent,
      chartConfigDificultad: JSON.stringify(chartConfigDificultad),
      chartConfigTema: JSON.stringify(chartConfigTema),
      chartConfigGrado: JSON.stringify(chartConfigGrado),
      chartConfigDetalle: JSON.stringify(chartConfigDetalle),
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-dificultades-resumen',
      templateData,
    );
    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="resumen-dificultades-${idCurso}.pdf"`,
    });
  }

  async getCourseDifficultiesHistoryPdf(
    idCurso: string,
    dto: GetCourseDifficultiesHistoryPdfDto,
    userId: string,
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
        { ...dto, cursoId: idCurso, aPresentarA: dto.aPresentarA },
      );

    // 4. Configurar Gráfico
    const chartJsContent = await this.getChartJsContent();

    const labels = data.timeline.map((d) =>
      d.fecha.split('T')[0].split('-').reverse().join('/'),
    );
    const videojuegoData = data.timeline.map((d) => d.videojuego);
    const sesionData = data.timeline.map((d) => d.sesion_refuerzo);

    const chartConfig = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Videojuego',
            data: videojuegoData,
            borderColor: '#1976d2',
            backgroundColor: '#1976d2',
            tension: 0.1,
            fill: false,
          },
          {
            label: 'Sesión de Refuerzo',
            data: sesionData,
            borderColor: '#9c27b0',
            backgroundColor: '#9c27b0',
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 },
            title: { display: true, text: 'Cantidad de Cambios' },
          },
        },
        plugins: {
          title: { display: true, text: 'Evolución de Cambios por Fuente' },
          legend: { position: 'top' },
        },
      },
    };

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Historial de Dificultades',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA: dto.aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      stats: {
        ...data.stats,
        porcentajeVideojuego: data.stats.porcentajeVideojuego.toFixed(1),
        porcentajeSesion: data.stats.porcentajeSesion.toFixed(1),
      },
      chartJsContent,
      chartConfig: JSON.stringify(chartConfig),
      tabla: data.tabla.map((h) => {
        const d = new Date(h.fechaCambio);
        d.setUTCHours(d.getUTCHours() - 3); // Ajuste a hora local (UTC-3)

        return {
          fecha:
            d.toISOString().split('T')[0].split('-').reverse().join('/') +
            ' ' +
            d.toISOString().split('T')[1].substring(0, 5),
          alumno: `${h.alumno.nombre} ${h.alumno.apellido}`,
          dificultad: h.dificultad.nombre,
          tema: h.dificultad.tema,
          gradoAnterior: h.gradoAnterior,
          gradoNuevo: h.gradoNuevo,
          fuente: h.fuente === 'VIDEOJUEGO' ? 'Videojuego' : 'Sesión',
          esMejora:
            ({ Ninguno: 0, Bajo: 1, Medio: 2, Alto: 3 }[h.gradoAnterior] || 0) >
            ({ Ninguno: 0, Bajo: 1, Medio: 2, Alto: 3 }[h.gradoNuevo] || 0),
        };
      }),
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-dificultades-historial',
      templateData,
    );
    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="historial-dificultades-${idCurso}.pdf"`,
    });
  }

  async getStudentDifficultiesReportPdf(
    idCurso: string,
    dto: GetStudentDifficultiesReportPdfDto,
    userId: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos
    const data = await this.reportesService.getStudentDifficultiesReport(
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
        'Reporte de Dificultades por Alumno',
        'Dificultades',
        { ...dto, cursoId: idCurso, aPresentarA: dto.aPresentarA },
      );

    // 4. Configurar Gráficos
    const chartJsContent = await this.getChartJsContent();

    // Gráfico 1: Por Grado (Pie)
    const chartConfigGrado = {
      type: 'pie',
      data: {
        labels: data.summary.graficos.porGrado.map(
          (d) => `${d.label} (${d.value})`,
        ),
        datasets: [
          {
            data: data.summary.graficos.porGrado.map((d) => d.value),
            backgroundColor: data.summary.graficos.porGrado.map((d) => d.color),
          },
        ],
      },
      options: {
        layout: { padding: 20 },
        scales: { x: { display: false }, y: { display: false } },
        plugins: {
          title: { display: true, text: 'Dificultades por Grado' },
          legend: { position: 'right' },
        },
      },
    };

    // Gráfico 2: Por Tema (Pie)
    const chartConfigTema = {
      type: 'pie',
      data: {
        labels: data.summary.graficos.porTema.map(
          (d) => `${d.label} (${d.value})`,
        ),
        datasets: [
          {
            data: data.summary.graficos.porTema.map((d) => d.value),
            backgroundColor: [
              '#f44336',
              '#ff9800',
              '#ffeb3b',
              '#4caf50',
              '#009688',
              '#00bcd4',
            ],
          },
        ],
      },
      options: {
        layout: { padding: 20 },
        scales: { x: { display: false }, y: { display: false } },
        plugins: {
          title: { display: true, text: 'Dificultades por Tema' },
          legend: { position: 'right' },
        },
      },
    };

    // Gráfico 3: Evolución (Line)
    const evolutionLabels = data.evolution.dataset.map((d) => {
      const parts = d.date.toISOString().split('T')[0].split('-');
      return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
    });

    const evolutionDatasets = data.evolution.series.map((s, i) => {
      const color = `hsl(${(i * 137.5) % 360}, 70%, 50%)`;
      return {
        label: s.label,
        data: data.evolution.dataset.map((d) => d[s.dataKey]),
        borderColor: color,
        backgroundColor: color,
        tension: 0.1,
        fill: false,
        spanGaps: true,
        pointRadius: 2,
      };
    });

    const chartConfigEvolution = {
      type: 'line',
      data: { labels: evolutionLabels, datasets: evolutionDatasets },
      options: {
        scales: {
          y: {
            min: 0,
            max: 3,
            ticks: { stepSize: 1 },
            title: { display: true, text: 'Grado de Dificultad' },
          },
        },
        plugins: {
          title: { display: true, text: 'Evolución de Grados por Dificultad' },
          legend: {
            position: 'bottom',
            labels: { font: { size: 4 }, boxWidth: 4, boxHeight: 4 },
          },
        },
      },
    };

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Reporte de Dificultades por Alumno',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        aPresentarA: dto.aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      stats: {
        ...data.stats,
        porcentajeVideojuego: data.stats.porcentajeVideojuego.toFixed(1),
        porcentajeSesion: data.stats.porcentajeSesion.toFixed(1),
      },
      currentDifficulties: data.summary.tabla,
      chartJsContent,
      chartConfigGrado: JSON.stringify(chartConfigGrado),
      chartConfigTema: JSON.stringify(chartConfigTema),
      chartConfigEvolution: JSON.stringify(chartConfigEvolution),
      history: data.history.map((h) => {
        const d = new Date(h.fechaCambio);
        d.setUTCHours(d.getUTCHours() - 3);
        return {
          fecha:
            d.toISOString().split('T')[0].split('-').reverse().join('/') +
            ' ' +
            d.toISOString().split('T')[1].substring(0, 5),
          dificultad: h.dificultad.nombre,
          tema: h.dificultad.tema,
          gradoAnterior: h.gradoAnterior,
          gradoNuevo: h.gradoNuevo,
          fuente: h.fuente === 'VIDEOJUEGO' ? 'Videojuego' : 'Sesión',
          esMejora:
            ({ Ninguno: 0, Bajo: 1, Medio: 2, Alto: 3 }[h.gradoAnterior] || 0) >
            ({ Ninguno: 0, Bajo: 1, Medio: 2, Alto: 3 }[h.gradoNuevo] || 0),
        };
      }),
    };

    const pdfBuffer = await this.generatePdf(
      'reporte-dificultades-alumno',
      templateData,
    );
    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="dificultades-alumno-${idCurso}.pdf"`,
    });
  }

  async getAuditoriaLogsPdf(
    dto: FindAuditoriaLogsPdfDto,
    userId: string,
  ): Promise<StreamableFile> {
    // 1. Obtener datos (Sin paginación real, traemos un límite alto)
    const { data: logs } = await this.auditoriaService.findAll({
      ...dto,
      limit: 10000, // Límite alto para reporte
      page: 1,
    });

    // 2. Metadatos
    const { institucion, usuario, logoBase64 } =
      await this.reportesService.getReportMetadata(userId);

    // 3. Registrar Reporte
    const { reporteDB, filtrosTexto } =
      await this.reportesService.registerReport(
        userId,
        'Reporte de Auditoría',
        'Auditoría',
        { ...dto },
      );

    // 4. Formatear datos para la vista
    const logsFormatted = logs.map((log) => ({
      fecha:
        log.fechaHora.toISOString().split('T')[0] +
        ' ' +
        log.fechaHora.toISOString().split('T')[1].substring(0, 8),
      usuario: log.usuarioModifico
        ? `${log.usuarioModifico.nombre} ${log.usuarioModifico.apellido}`
        : 'Sistema',
      tabla: log.tablaAfectada,
      operacion: log.operacion,
      idFila: log.idFilaAfectada,
    }));

    const commonData = this.buildCommonTemplateData(
      { institucion, usuario, logoBase64 },
      {
        reporteDB,
        filtrosTexto,
        titulo: 'Reporte de Auditoría',
        aPresentarA: dto.aPresentarA,
      },
    );

    const templateData = {
      ...commonData,
      logs: logsFormatted,
    };

    const pdfBuffer = await this.generatePdf('reporte-auditoria', templateData);
    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="reporte-auditoria.pdf"`,
    });
  }
}
