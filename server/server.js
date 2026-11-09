require('dotenv').config();
const app = require('./app');
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`KATANA PARFUM running on http://localhost:${port}`));
