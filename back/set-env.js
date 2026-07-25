import { execSync } from 'child_process';

const envs = {
  DATABASE_URL: "postgresql://neondb_owner:npg_XvHJV26pjeEK@ep-blue-sky-aclc4e86-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  JWT_SECRET: "super_secret_jwt_key_lavanderia_2026",
  GOOGLE_CLIENT_ID: "425529759200-27e7p0k15bpqpnjrv3i2faj21oeni7ur.apps.googleusercontent.com"
};

for (const [key, value] of Object.entries(envs)) {
  console.log(`Setting ${key}...`);
  try {
    execSync(`vercel env rm ${key} production -y --scope octavios-projects-1ae9bdf9`, { stdio: 'ignore' });
  } catch (e) {}
  
  execSync(`vercel env add ${key} production --scope octavios-projects-1ae9bdf9`, {
    input: value,
    stdio: ['pipe', 'inherit', 'inherit']
  });
}
