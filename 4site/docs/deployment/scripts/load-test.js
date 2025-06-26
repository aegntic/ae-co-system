import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

const API_URL = 'https://api.4site.pro';

export default function () {
  // Test health endpoint
  const healthRes = http.get(`${API_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });
  
  // Test lead capture
  const leadRes = http.post(`${API_URL}/api/leads`, JSON.stringify({
    siteId: 'test-site-id',
    email: `test-${Date.now()}@example.com`,
    name: 'Load Test User'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(leadRes, {
    'lead capture status is 201': (r) => r.status === 201,
  });
  
  sleep(1);
}