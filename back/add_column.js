import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config({ path: 'd:/github desktop/sistema_lavanderia/sistema_lavanderia/back/.env' });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query('ALTER TABLE "configuraciones_negocio" ADD COLUMN "whatsappMensajeManual" TEXT;');
    console.log('Columna whatsappMensajeManual añadida.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

run();
