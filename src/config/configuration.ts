export default () => ({
    database: {
      host: process.env.DB_HOST,
    //   port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    },
    supabase: {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY,
      bucket: process.env.SUPABASE_BUCKET || 'secure-documents',
    },
    encryption: {
      secretKey: process.env.ENCRYPTION_SECRET_KEY,
      algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc',
    },
    app: {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    }
  });