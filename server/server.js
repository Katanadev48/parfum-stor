require('dotenv').config();
const connectDatabase = require('./config/db');
const app = require('./app');
const port = process.env.PORT || 3000;
connectDatabase().then(() => app.listen(port, () => console.log(`KATANA PARFUM running on http://localhost:${port}`))).catch(error => { console.error(error.message); process.exit(1); });
