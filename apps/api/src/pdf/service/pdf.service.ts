import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import hbs from 'hbs';
import { readFile } from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PdfService {
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
}
