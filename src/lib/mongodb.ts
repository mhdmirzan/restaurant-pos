import mongoose from 'mongoose';
import dns from 'dns';

// Ensure DNS resolution for mongodb+srv:// works on networks where local DNS blocks SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore in environments where setting DNS servers is not allowed
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function resolveSrvUri(srvUri: string): Promise<string> {
  if (!srvUri.startsWith('mongodb+srv://')) {
    return srvUri;
  }
  try {
    const { Resolver } = await import('dns/promises');
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);

    const match = srvUri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/.*)?$/);
    if (!match) return srvUri;
    const [, user, pass, host, rest] = match;

    const [srvRecords, txtRecords] = await Promise.all([
      resolver.resolveSrv(`_mongodb._tcp.${host}`),
      resolver.resolveTxt(host).catch(() => [] as string[][]),
    ]);

    if (!srvRecords || srvRecords.length === 0) return srvUri;

    const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(',');
    const txtParams = txtRecords.flat().join('&');
    const baseRest = rest ? (rest.startsWith('/') ? rest : `/${rest}`) : '/';
    const queryChar = baseRest.includes('?') ? '&' : '?';
    const extraParams = [txtParams, 'ssl=true'].filter(Boolean).join('&');

    return `mongodb://${user}:${pass}@${hosts}${baseRest}${queryChar}${extraParams}`;
  } catch (err) {
    console.warn('DNS SRV resolution warning (falling back to original URI):', err);
    return srvUri;
  }
}

async function dbConnect(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (!dbName) {
    throw new Error('Please define the MONGODB_DB_NAME environment variable');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName,
    };
    cached.promise = (async () => {
      const resolvedUri = await resolveSrvUri(uri);
      return mongoose.connect(resolvedUri, opts);
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
