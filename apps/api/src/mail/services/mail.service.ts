import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { render } from '@react-email/render';
import { EmailBienvenida } from '../emails/EmailBienvenida';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async enviarBienvenida(email: string, nombre: string, contrasena: string) {
    // 1. Renderizamos el HTML
    const html = await render(
      EmailBienvenida({
        nombre: nombre,
        contrasena: contrasena,
      }),
    );

    // 2. Enviamos
    await this.mailerService.sendMail({
      to: email,
      subject: '¡Bienvenido a Algoritmia! 🎮',
      html: html,
    });
  }
}
