async function fetchBootstrap() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }
  return response.json();
}

async function postAction(data) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }
  return response.json();
}
