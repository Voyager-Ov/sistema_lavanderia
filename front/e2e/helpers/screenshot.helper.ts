import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export class ScreenshotHelper {
  /**
   * Obtiene la ruta absoluta de la carpeta de screenshots para un módulo
   */
  static getDir(moduleName: string = 'dashboard'): string {
    return path.join(process.cwd(), 'e2e', moduleName, 'screenshots');
  }

  /**
   * Limpia y prepara la carpeta de capturas de pantalla antes de iniciar las suites
   */
  static cleanScreenshotsDir(moduleName: string = 'dashboard') {
    const dir = this.getDir(moduleName);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.png')) {
          fs.unlinkSync(path.join(dir, file));
        }
      }
    } else {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Toma una captura de pantalla de la página completa y la guarda en la carpeta de pruebas
   */
  static async take(page: Page, fileName: string, moduleName: string = 'dashboard') {
    const dir = this.getDir(moduleName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const cleanName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(dir, `${cleanName}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
  }
}
