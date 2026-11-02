import app from '../src/index.mjs';
const port=Number(process.env.PORT||3000);
app.listen(port,'127.0.0.1',()=>console.log(`Civis Atelier: http://localhost:${port} (http://127.0.0.1:${port})`));
app.listen(port,'::1');
