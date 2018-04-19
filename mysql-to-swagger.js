
let definition = require('sequelize-json-schema')
let Sequelize = require('sequelize');
let Yaml = require('json2yaml')
let _ = require('lodash');

var  mysql = require('mysql-json-schema');

let args = {
  user: 'root',
  password: 'foomanchu',
  host: 'localhost',
  database: 'm2m_test',
  outputFolder: 'out',
  discoverRelations: true,
  extractRelations: false,
  ignoreDefaultNames: false,
  sufix: '_id'
}
const connection = mysql.CreateConnection(args);
connection.connect();
//
// get the json so that we can transform it
mysql.GetSchemaWithRelationsByFieldNames(connection)
  .then((schema) => {
    connection.end(); // close the connection
//     console.log(JSON.stringify(schema));

    // get the swagger template
    var fs = require("fs");
    var contents = fs.readFileSync("swagger-template.json");
    // parse into json
    var swagger = JSON.parse(contents);

    let sequelize = new Sequelize({
      database: args.database,
      username: args.user,
      password: args.password,
      dialect: 'mysql'
    });

//     console.log(JSON.stringify(schema.tables));
    Object.keys(schema.tables).forEach(function(tableName) {
//       console.log(JSON.stringify(tableName));
      // console.log(JSON.stringify(schema.tables[tableName]));
      let table = schema.tables[tableName];

      // map the data types
      let props = {};
      let required = [];
      let keys = [];
      let primaryKey;
      // console.log(table.fields);
      Object.keys(table.fields).forEach(function (i) {
        let field = table.fields[i]
        // console.log(field.Field);
        props[field.Field] = {
          type: mapDataType(field.Type),
          primaryKey: false
        }
        if (field.Key == "PRI") {
          props[field.Field].primaryKey = true
          primaryKey = field.Field;
        }
        if (field.Key != "") {
          keys.push(field.Field);
        }
        if (field.Null == false) {
          required.push(field.Field);
        }
      })

// console.log(props);
// console.log(required);exit;

      // create the definition
      let Table = sequelize.define(tableName, props);
      let def = definition(Table);
      // console.log(def);
      if (required.length > 0) {
        def.required = required;
      }

      // console.log(def);
      let tableNameUpper = capitalizeFirstLetter(tableName);
      let tableNameUrlized = urlize(tableName);

      // append to swagger
      swagger.definitions[tableNameUpper] = def;

      // create the paths
      swagger.paths["/" + tableNameUrlized] = {
        "x-swagger-router-controller": tableNameUpper
      };
      swagger.paths["/" + tableNameUrlized]["get"] = {
        "tags": [ tableNameUpper ],
        "summary": "Returns a list of " + tableNameUpper + "s",
        "description": "Returns a list of " + tableNameUpper + " with pagination. This can only be done by the logged in user.",
        "operationId": "find" + tableNameUpper,
        "produces": [
          "application/json"
        ],
        "parameters": [
          {
            "name": "page_num",
            "in": "query",
            "description": "The page number to return resutls for " + tableNameUpper,
            "required": false,
            "type": "integer",
            "format": "int64",
            "default": 1,
            "allowEmptyValue": true,
            "minimum": 1
          },
          {
            "name": "page_size",
            "in": "query",
            "description": "The maximum page number to return resutls for " + tableNameUpper,
            "required": false,
            "type": "integer",
            "format": "int64",
            "default": 20,
            "allowEmptyValue": true,
            "minimum": 1,
            "maximum": 100
          },
          {
            "name": "sort_by",
            "in": "query",
            "description": "field to sort by",
            "required": false,
            "type": "string",
            "allowEmptyValue": true,
            "default": "placeholder",
            "enum": [ "placeholder" ]
          },
          {
            "name": "sort_dir",
            "in": "query",
            "description": "The sort direction",
            "required": false,
            "type": "string",
            "allowEmptyValue": true,
            "default": "asc",
            "enum": [
              "asc",
              "desc"
            ]
          }
        ],
        "responses": {
          "200": {
						"description": "successful operation",
						"schema": {
							"type": "array",
							"items": {
								"$ref": "#/definitions/" + tableNameUpper
							}
						}
					},
          "403": {
            "description": "Access Denied",
            "schema": {
              "$ref": "#/definitions/Error"
            }
          }
        },
        "x-security-scopes": [
          "admin"
        ],
        "security": [
          {
            "Bearer" : []
          }
        ]
      };
      swagger.paths["/" + tableNameUrlized]["post"] = {
        "tags": [ tableNameUpper ],
        "summary": "Add a new " + tableNameUpper,
        "description": "",
        "operationId": "add" + tableNameUpper,
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "description": tableNameUpper + " object that needs to be added",
            "required": true,
            "schema": {
              "$ref": "#/definitions/" + tableNameUpper
            }
          }
        ],
        "responses": {
          "403": {
            "description": "Access Denied",
            "schema": {
              "$ref": "#/definitions/Error"
            }
          },
          "405": {
            "description": "Invalid input"
          }
        },
        "x-security-scopes": [
          "admin"
        ],
        "security": [
          {
            "Bearer" : []
          }
        ]
      };
      // console.log(tableName);
      for (i in keys) {
        fieldName = keys[i];
        fieldUpper = capitalizeFirstLetter(fieldName);
        fieldNameUrlized = urlize(fieldName);
        // console.log(primaryKey);
        // console.log(fieldName);
        if (primaryKey == fieldName) {
          swagger.paths["/" + tableNameUrlized + "/{" + primaryKey + "}"] = {
            "x-swagger-router-controller": tableNameUpper,
            "get" : {
              "tags": [ tableNameUpper ],
              "summary": "Find " + tableNameUpper + " by " + primaryKey,
              "description": "Returns a single " + tableNameUpper,
              "operationId": "get" + tableNameUpper + "By" + primaryKey,
              "produces": [
                "application/json"
              ],
              "parameters": [
                {
                  "name": primaryKey,
                  "in": "path",
                  "description": primaryKey + " of " + tableNameUpper + " to return",
                  "required": true,
                  "type": "integer",
                  "format": "int64"
                }
              ],
              "responses": {
                "200": {
                  "description": "successful operation",
                  "schema": {
                    "$ref": "#/definitions/" + tableNameUpper
                  }
                },
                "400": {
                  "description": "Invalid " + primaryKey + " supplied"
                },
                "403": {
                  "description": "Access Denied",
                  "schema": {
                    "$ref": "#/definitions/Error"
                  }
                },
                "404": {
                  "description": tableNameUpper + " not found"
                }
              },
              "x-security-scopes": [
                "admin"
              ],
              "security": [
                {
                  "Bearer": []
                }
              ]
            },
            "put" : {
              "tags": [ tableNameUpper ],
              "summary": "Update an existing " + tableNameUpper,
              "description": "",
              "operationId": "update" + tableNameUpper,
              "parameters": [
                {
                  "in": "body",
                  "name": "body",
                  "description": tableNameUpper + " object that needs to be added",
                  "required": true,
                  "schema": {
                    "$ref": "#/definitions/" + tableNameUpper
                  }
                },
                {
                  "name": primaryKey,
                  "in": "path",
                  "description": tableNameUpper + " id to delete",
                  "required": true,
                  "type": "integer",
                  "format": "int64"
                }
              ],
              "responses": {
                "400": {
                  "description": "Invalid ID supplied"
                },
                "403": {
                  "description": "Access Denied",
                  "schema": {
                    "$ref": "#/definitions/Error"
                  }
                },
                "404": {
                  "description": tableNameUpper + " not found"
                },
                "405": {
                  "description": "Validation exception"
                }
              },
              "x-security-scopes": [
                "admin"
              ],
              "security": [
                {
                  "Bearer" : []
                }
              ]
            },
            "delete" : {
              "tags": [ tableNameUpper ],
              "summary": "Deletes a " + tableNameUpper,
              "description": "",
              "operationId": "delete" + tableNameUpper,
              "produces": [
                "application/xml",
                "application/json"
              ],
              "parameters": [
                {
                  "name": primaryKey,
                  "in": "path",
                  "description": tableNameUpper + " id to delete",
                  "required": true,
                  "type": "integer",
                  "format": "int64"
                }
              ],
              "responses": {
                "400": {
                  "description": "Invalid ID supplied"
                },
                "403": {
                  "description": "Access Denied",
                  "schema": {
                    "$ref": "#/definitions/Error"
                  }
                },
                "404": {
                  "description": tableNameUpper + " not found"
                }
              },
              "x-security-scopes": [
                "admin"
              ],
              "security": [
                {
                  "Bearer" : []
                }
              ]
            }
          }
        } else {
          swagger.paths["/" + tableNameUrlized + "/find-by-" + fieldNameUrlized] = {
            "x-swagger-router-controller": tableNameUpper
          };
          swagger.paths["/" + tableNameUrlized + "/find-by-" + fieldNameUrlized]["get"] = {
            "tags": [ tableNameUpper ],
            "summary": "Find " + tableNameUpper + " by " + fieldName,
            "description": "Multiple values can be provided with comma separated strings",
            "operationId": "find" + tableNameUpper + "By" + fieldUpper,
            "produces": [
              "application/xml",
              "application/json"
            ],
            "parameters": [
              {
                "name": fieldName,
                "in": "query",
                "description": fieldUpper + " values that need to be considered for filter",
                "required": true,
                "type": "array",
                "items": {
                  "type": "string"
                },
                "collectionFormat": "multi"
              }
            ],
            "responses": {
              "200": {
                "description": "successful operation",
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/definitions/" + tableNameUpper
                  }
                }
              },
              "400": {
                "description": "Invalid " + fieldName + " value"
              },
              "403": {
                "description": "Access Denied",
                "schema": {
                  "$ref": "#/definitions/Error"
                }
              }
            },
            "x-security-scopes": [
              "admin"
            ],
            "security": [
              {
                "Bearer" : []
              }
            ]
          }
        }
      }

      // create tags
      swagger.tags.push({
        "name": tableNameUpper,
        "description": "Everything about " + capitalizeFirstLetter(tableNameUpper),
        "externalDocs": {
          "description": "Find out more",
          "url": "https://docs.inmarket.com/launch/" + tableName
        }
      });

    });

    swagger = Yaml.stringify(swagger);
    console.log(swagger);

  });



/*
    "Order": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "format": "int64"
        },
        "petId": {
          "type": "integer",
          "format": "int64"
        },
        "quantity": {
          "type": "integer",
          "format": "int32"
        },
        "shipDate": {
          "type": "string",
          "format": "date-time"
        },
        "status": {
          "type": "string",
          "description": "Order Status",
          "enum": [
            "placed",
            "approved",
            "delivered"
          ]
        },
        "complete": {
          "type": "boolean",
          "default": false
        }
      },
      "xml": {
        "name": "Order"
      }
    },
*/



function mapDataType (fromType) {
  let toType;
  // console.log(fromType);
  fromTypeUpper = fromType.toUpperCase();
  if (fromTypeUpper.substr(0,7) == 'VARCHAR') {
    toType = Sequelize.STRING;
  } else if (fromTypeUpper.substr(0,3) == 'INT' || fromTypeUpper.substr(0,7) == 'TINYINT') {
    toType = Sequelize.INTEGER;
  } else if (fromTypeUpper.substr(0,4) == 'ENUM') {
      let parts = fromType.split("(");
      parts = parts[1].split(")");
      parts = parts[0].replace(new RegExp("\'", 'g'), "'").split(",");
      toType = Sequelize.ENUM(parts);
  } else {
    switch (fromTypeUpper) {
      case 'INTEGER':
        toType = Sequelize.INTEGER;
        break;
      case 'BIGINT(11)':
        toType = Sequelize.BIGINT(11);
        break;
      case 'FLOAT':
        toType = Sequelize.FLOAT;
        break;
      case 'FLOAT(11)':
        toType = Sequelize.FLOAT(11);
        break;
      case 'FLOAT(11,12)':
        toType = Sequelize.FLOAT(11, 12);
        break;
      case 'REAL':        // PostgreSQL only.
        toType = Sequelize.REAL;
        break;
      case 'REAL(11)':    // PostgreSQL only.
        toType = Sequelize.REAL(11);
        break;
      case 'REAL(11,12)': // PostgreSQL only.
        toType = Sequelize.REAL(11, 12);
        break;
      case 'DOUBLE':
        toType = Sequelize.DOUBLE;
        break;
      case 'DOUBLE(11)':
        toType = Sequelize.DOUBLE(11);
        break;
      case 'DOUBLE(11,12)':
        toType = Sequelize.DOUBLE(11, 12);
        break;
      case 'DECIMAL':
        toType = Sequelize.DECIMAL;
        break;
      case 'DECIMAL':
        toType = Sequelize.DECIMAL;
        break;
      case 'DECIMAL(10,2)':
        toType = Sequelize.DECIMAL(10, 2);
        break;
      case 'TIMESTAMP':
      case 'DATETIME':    // for mysql / sqlite, TIMESTAMP WITH TIME ZONE for postgres
        toType = Sequelize.DATE;
        break;
      case 'DATETIME(6)': // for mysql 5.6.4+. Fractional seconds support with up to 6 digits of precision
        toType = Sequelize.DATE(6);
        break;
      case 'DATE':        // DATE without time.
        toType = Sequelize.DATEONLY;
        break;
      case 'TINYINT(1)':
        toType = Sequelize.BOOLEAN;
        break;
    }
  }
//   console.log(toType);
  return toType;
}


function capitalizeFirstLetter(str) {
    str.replace(new RegExp("_", 'g'), " ");
    str = _.startCase(_.toLower(str));
    return str.replace(new RegExp(" ", 'g'), "");
}

function urlize(str) {
  str = str.replace(/_/g, '-');
  str = _.toLower(str);
  return str;
}
