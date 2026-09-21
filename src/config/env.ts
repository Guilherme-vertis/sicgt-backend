import 'dotenv/config';

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável ${name} não configurada`);
  return value;
};

export const env = {
  get databaseUrl() { return required('DATABASE_URL'); },
  get jwtSecret() { return required('JWT_SECRET'); },
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'https://contspeed-connect.vercel.app,http://localhost:3000')
    .split(',')
    .map(v => v.trim()),
};
