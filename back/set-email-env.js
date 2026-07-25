import { execSync } from 'child_process';

const envs = {
  EMAIL_USER: "octavio.velo2022@gmail.com",
  EMAIL_PASS: "vcljygxmxkyrkcwi"
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
