
var  mysql = require('mysql-json-schema');
mysql.ExportSchemaToFiles({
    user: 'root',
    password: 'foomanchu',
    host: 'localhost',
    database: 'm2m_test',
    outputFolder: 'out',
    discoverRelations: true,
    extractRelations: false,
    ignoreDefaultNames: false,
    sufix: '_id'
});
