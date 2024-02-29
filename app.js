const mysql = require('mysql');
const inquirer = require('inquirer');

// Create a MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '5710slapstick!',
  database: 'employeeTracker'
});

// Connect to the database
connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database.');
  // Start the application
  startApp();
});

function startApp() {
  // Prompt user for action
  inquirer.prompt({
    name: 'action',
    type: 'list',
    message: 'What would you like to do?',
    choices: [
      'View all departments',
      'View all roles',
      'View all employees',
      'Add a department',
      'Add a role',
      'Add an employee',
      'Update an employee role',
      'Exit'
    ]
  }).then(answer => {
    // Handle user's choice
    switch (answer.action) {
      case 'View all departments':
        viewDepartments();
        break;
      case 'View all roles':
        viewRoles();
        break;
      case 'View all employees':
        viewEmployees();
        break;
      case 'Add a department':
        addDepartment()
        break;
      case 'Add a role':
        addRole()
        break;
      case 'Add an employee':
        addEmployee()
        break;
      case 'Update an employee role':
        updateEmployeeRole()
        break;
      case 'Exit':
        console.log('Exiting application.');
        connection.end();
        break;
    }
  });
}

function viewDepartments() {
  // Query the database to get all departments
  connection.query('SELECT * FROM department', (err, res) => {
    if (err) {
      console.error('Error viewing departments: ' + err.stack);
      startApp();
      return;
    }
    // Display the departments
    console.table(res);
    // Restart the application
    startApp();
  });
}

function viewRoles() {
  // Query the database to get all roles
  connection.query('SELECT * FROM role', (err, res) => {
    if (err) {
      console.error('Error viewing roles: ' + err.stack);
      startApp();
      return;
    }
    // Display the roles
    console.table(res);
    // Restart the application
    startApp();
  });
}

function viewEmployees() {
  // Query the database to get all employees
  connection.query('SELECT * FROM employee', (err, res) => {
    if (err) {
      console.error('Error viewing employees: ' + err.stack);
      startApp();
      return;
    }
    // Display the employees
    console.table(res);
    // Restart the application
    startApp();
  });
}

function addDepartment() {
  inquirer.prompt({
      name: 'departmentName',
      type: 'input',
      message: 'Enter the name of the department:'
  }).then(answer => {
      // Insert the department into the database
      connection.query('INSERT INTO department (name) VALUES (?)', [answer.departmentName], (err, res) => {
          if (err) throw err;
          console.log('Department added successfully!');
          // Restart the application
          startApp();
      });
  });
}

function addRole() {
  inquirer.prompt({
    name: 'roleName',
    type: 'input',
    message: 'Enter the name of the role:'
  }).then(answer => {
    // Insert the role into the database
    connection.query('INSERT INTO role (title) VALUES (?)', [answer.roleName], (err, res) => {
      if (err) throw err;
      console.log('Role added successfully!');
      // Restart the application
      startApp();
    });
  });
}

function addEmployee() {
  // Query the database to get the list of roles
  connection.query('SELECT * FROM role', (err, roles) => {
    if (err) throw err;
    
    // Query the database to get the list of managers
    connection.query('SELECT * FROM employee', (err, employees) => {
      if (err) throw err;

      inquirer.prompt([
        {
          name: 'firstName',
          type: 'input',
          message: 'Enter the employee\'s first name:'
        },
        {
          name: 'lastName',
          type: 'input',
          message: 'Enter the employee\'s last name:'
        },
        {
          name: 'role',
          type: 'list',
          message: 'Select the employee\'s role:',
          choices: roles.map(role => ({
            name: role.title,
            value: role.id
          }))
        },
        {
          name: 'manager',
          type: 'list',
          message: 'Select the employee\'s manager:',
          choices: employees.map(employee => ({
            name: `${employee.first_name} ${employee.last_name}`,
            value: employee.id
          }))
        }
      ]).then(answers => {
        // Insert the employee into the database
        connection.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', 
          [answers.firstName, answers.lastName, answers.role, answers.manager], 
          (err, res) => {
            if (err) throw err;
            console.log('Employee added successfully!');
            // Restart the application
            startApp();
          });
      });
    });
  });
}

function updateEmployeeRole() {
  // Query the database to get the list of departments
  connection.query('SELECT * FROM department', (err, departments) => {
    if (err) throw err;

    inquirer.prompt({
      name: 'department',
      type: 'list',
      message: 'Select a department:',
      choices: departments.map(department => department.name)
    }).then(answer => {
      // Query the database to get the list of employees in the selected department
      connection.query('SELECT * FROM employee JOIN role ON employee.role_id = role.id WHERE role.department_id IN (SELECT id FROM department WHERE name = ?)', 
        [answer.department], 
        (err, employees) => {
          if (err) throw err;

          inquirer.prompt({
            name: 'employee',
            type: 'list',
            message: 'Select the employee you want to update:',
            choices: employees.map(employee => ({
              name: `${employee.first_name} ${employee.last_name}`,
              value: employee.id
            }))
          }).then(employeeAnswer => {
            // Query the database to get the list of roles
            connection.query('SELECT * FROM role', (err, roles) => {
              if (err) throw err;

              inquirer.prompt({
                name: 'role',
                type: 'list',
                message: 'Select the employee\'s new role:',
                choices: roles.map(role => ({
                  name: role.title,
                  value: role.id
                }))
              }).then(roleAnswer => {
                // Update the employee's role in the database
                connection.query('UPDATE employee SET role_id = ? WHERE id = ?', 
                  [roleAnswer.role, employeeAnswer.employee], 
                  (err, res) => {
                    if (err) throw err;
                    console.log('Employee role updated successfully!');
                    // Restart the application
                    startApp();
                  });
              });
            });
          });
      });
    });
  });
}
