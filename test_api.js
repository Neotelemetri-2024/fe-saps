const http = require('http');

const endpoints = [
  { method: 'GET', path: '/' },
  { method: 'GET', path: '/api/kurikulum/aktif' },
  { method: 'GET', path: '/api/matriks' },
  { method: 'GET', path: '/api/kegiatan' },
  { method: 'GET', path: '/api/umum/dashboard/mahasiswa?mahasiswaId=6' },
  { method: 'GET', path: '/api/umum/dashboard/pimpinan-ditmawa' },
];

async function runTests() {
  console.log('🚀 Memulai API Test untuk SAPS Backend...\n');
  let passed = 0;

  for (const ep of endpoints) {
    try {
      const result = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 3000,
          path: ep.path,
          method: ep.method,
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.end();
      });

      const isSuccess = result.statusCode >= 200 && result.statusCode < 300;
      if (isSuccess) {
        passed++;
        console.log(`✅ [${ep.method}] ${ep.path} -> ${result.statusCode} OK`);
        
        // Print snippet of data
        try {
          const json = JSON.parse(result.body);
          let snippet = JSON.stringify(json.data || json).substring(0, 80);
          if (snippet.length >= 80) snippet += '...';
          console.log(`   Data: ${snippet}`);
        } catch(e) {}
      } else {
        console.log(`❌ [${ep.method}] ${ep.path} -> ${result.statusCode} Error`);
        console.log(`   Response: ${result.body}`);
      }
    } catch (error) {
      console.log(`❌ [${ep.method}] ${ep.path} -> Request failed: ${error.message}`);
    }
    console.log('--------------------------------------------------');
  }

  console.log(`\n🎉 Test Selesai! ${passed}/${endpoints.length} endpoint berhasil merespon.`);
}

runTests();
