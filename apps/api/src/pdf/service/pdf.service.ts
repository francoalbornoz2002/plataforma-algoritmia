import { Injectable, Inject, forwardRef, StreamableFile } from '@nestjs/common';
import puppeteer from 'puppeteer';
import hbs from 'hbs';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { ReportesService } from '../../reportes/services/reportes.service';
import { GetCourseClassesHistoryDto } from '../../reportes/dto/get-course-classes-history.dto';
import { GetUsersSummaryDto } from '../../reportes/dto/get-users-summary.dto';
import { estado_clase_consulta } from '@prisma/client';

@Injectable()
export class PdfService {
  constructor(
    @Inject(forwardRef(() => ReportesService))
    private readonly reportesService: ReportesService,
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

    hbs.registerPartial('styles', styles);
    hbs.registerPartial('header', header);
    hbs.registerPartial('footer', footer);
    // Helper básico para comparaciones
    hbs.registerHelper('eq', (a, b) => a === b);
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
    dto: GetCourseClassesHistoryDto,
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
    const chartJsMain = require.resolve('chart.js');
    const chartJsPath = path.join(path.dirname(chartJsMain), 'chart.umd.js');
    const chartJsContent = await readFile(chartJsPath, 'utf-8');

    const chartConfig = {
      type: 'bar',
      data: {
        labels: data.chartData.map((d) =>
          d.fecha.split('-').slice(1).reverse().join('/'),
        ),
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
        ],
      },
    };

    const templateData = {
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
        titulo: 'Historial de Clases de Consulta',
        subtitulo: `Curso: ${curso?.nombre || 'Desconocido'}`,
        fechaEmision: new Date().toLocaleDateString(),
        generadoPor: usuario
          ? `${usuario.nombre} ${usuario.apellido}`
          : 'Sistema',
        filtrosTexto: filtrosTexto.join(' | '),
        aPresentarA: dto.aPresentarA,
      },
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
    const chartJsMain = require.resolve('chart.js');
    const chartJsPath = path.join(path.dirname(chartJsMain), 'chart.umd.js');
    const chartJsContent = await readFile(chartJsPath, 'utf-8');

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

    const templateData = {
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
        titulo: 'Resumen de Usuarios',
        fechaEmision: new Date().toLocaleDateString(),
        generadoPor: usuario
          ? `${usuario.nombre} ${usuario.apellido}`
          : 'Sistema',
        filtrosTexto: filtrosTexto.join(' | '),
        aPresentarA: aPresentarA,
      },
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
}
