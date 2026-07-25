import 'dotenv/config';
import { connectionManager } from "./src/models/connectionManager.js";

async function run() {
  await connectionManager.initCentral();
  const centralModels = connectionManager.centralModels;

  const urls = [
    'https://front-1-rho.vercel.app',
    'https://front-2-ten.vercel.app',
    'https://front-1-cyezg2cnx-octavios-projects-1ae9bdf9.vercel.app',
    'https://front-2-5xub41cc9-octavios-projects-1ae9bdf9.vercel.app'
  ];

  for (const url of urls) {
    await centralModels.MicroFrontend.findOrCreate({
      where: { urlOrigen: url },
      defaults: { nombre: 'Vercel Front', activo: true }
    });
  }

  console.log("CORS origins added!");
  process.exit(0);
}

run();
