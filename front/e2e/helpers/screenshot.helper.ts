import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e', 'clientes', 'screenshots');

export class ScreenshotHelper {
  /**
   * Limpia y prepara la carpeta de capturas de pantalla antes de iniciar las suites
   */
  static cleanScreenshotsDir() {
    if (fs.existsSync(SCREENSHOTS_DIR)) {
      const files = fs.readdirSync(SCREENSHOTS_DIR);
      for (const file of files) {
        if (file.endsWith('.png')) {
          fs.unlinkSync(path.join(SCREENSHOTS_DIR, file));
        }
      }
    } else {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
  }

  /**
   * Toma una captura de pantalla de la página completa y la guarda en la carpeta de pruebas
   */
  static async take(page: Page, fileName: string) {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
    const cleanName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(SCREENSHOTS_DIR, `${cleanName}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
  }
}
