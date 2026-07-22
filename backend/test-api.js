fetch('http://localhost:5000/api/v1/auth/login', { 
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' }, 
  body: JSON.stringify({ email: 'admin@xog.com', password: 'password123' }) 
})
  .then(res => res.json())
  .then(data => {
    console.log('Login Token:', data.token);
    return fetch('http://localhost:5000/api/v1/work-orders', {
      headers: { Authorization: `Bearer ${data.token}` }
    });
  })
  .then(res => res.json())
  .then(data => console.log('WOs:', JSON.stringify(data, null, 2)))
  .catch(console.error);
