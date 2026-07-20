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
    const [results] = await sequelize.query("SELECT * FROM information_schema.tables WHERE table_schema='public'");
    console.log(results.map(r => r.table_name || r.TABLE_NAME));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

run();
