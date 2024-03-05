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
  const query = `
      SELECT r.id, r.title, r.salary, d.name AS department_name
      FROM role r
      JOIN department d ON r.department_id = d.id
  `;
  connection.query(query, (err, res) => {
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
  const query = `
      SELECT 
          e.id,
          e.first_name,
          e.last_name,
          r.title AS job_title,
          d.name AS department,
          r.salary,
          CONCAT(m.first_name, ' ', m.last_name) AS manager
      FROM employee e
      LEFT JOIN role r ON e.role_id = r.id
      LEFT JOIN department d ON r.department_id = d.id
      LEFT JOIN employee m ON e.manager_id = m.id
  `;
  connection.query(query, (err, res) => {
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
  // Query the database to get the list of departments
  connection.query('SELECT * FROM department', (err, departments) => {
    if (err) throw err;

    inquirer.prompt([
      {
        name: 'roleName',
        type: 'input',
        message: 'Enter the name of the role:'
      },
      {
        name: 'salary',
        type: 'input',
        message: 'Enter the salary for this role:'
      },
      {
        name: 'department',
        type: 'list',
        message: 'Select the department for this role:',
        choices: departments.map(department => department.name)
      }
    ]).then(answer => {
      // Find the department ID based on the selected department name
      const selectedDepartment = departments.find(department => department.name === answer.department);

      // Insert the role into the database with the selected department ID
      connection.query('INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)', 
        [answer.roleName, answer.salary, selectedDepartment.id], 
        (err, res) => {
          if (err) throw err;
          console.log('Role added successfully!');
          // Restart the application
          startApp();
      });
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

      // Add an option for no manager
      const managerChoices = employees.map(employee => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id
      }));
      managerChoices.push({ name: 'None', value: null });

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
          choices: managerChoices
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
  let roles;
  let employees;

  // Function to fetch roles from the database
  function fetchRoles() {
    return new Promise((resolve, reject) => {
      connection.query('SELECT * FROM role', (err, res) => {
        if (err) {
          reject(err);
        } else {
          roles = res;
          resolve();
        }
      });
    });
  }

  // Function to fetch employees from the database
  function fetchEmployees() {
    return new Promise((resolve, reject) => {
      connection.query('SELECT * FROM employee', (err, res) => {
        if (err) {
          reject(err);
        } else {
          employees = res;
          resolve();
        }
      });
    });
  }

  // Fetch roles data
  fetchRoles()
    .then(() => {
      // Fetch employees data
      return fetchEmployees();
    })
    .then(() => {
      // Prompt the user to select an employee
      inquirer.prompt({
        name: 'employee',
        type: 'list',
        message: 'Select the employee you want to update:',
        choices: employees.map(employee => ({
          name: `${employee.first_name} ${employee.last_name}`,
          value: employee.id
        }))
      }).then(employeeAnswer => {
        // Prompt the user to choose what to update
        inquirer.prompt({
          name: 'updateChoice',
          type: 'list',
          message: 'What would you like to update?',
          choices: ['Role', 'Manager']
        }).then(choiceAnswer => {
          if (choiceAnswer.updateChoice === 'Role') {
            // Prompt the user to select a new role for the employee
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
                  if (err) {
                    console.error('Error updating employee role: ' + err.stack);
                  } else {
                    console.log('Employee role updated successfully!');
                  }
                  // Restart the application
                  startApp();
                });
            });
          } else if (choiceAnswer.updateChoice === 'Manager') {
            // Prompt the user to select a new manager for the employee
            inquirer.prompt({
              name: 'manager',
              type: 'list',
              message: 'Select the employee\'s new manager:',
              choices: employees.map(employee => ({
                name: `${employee.first_name} ${employee.last_name}`,
                value: employee.id
              }))
            }).then(managerAnswer => {
              // Update the employee's manager in the database
              connection.query('UPDATE employee SET manager_id = ? WHERE id = ?', 
                [managerAnswer.manager, employeeAnswer.employee], 
                (err, res) => {
                  if (err) {
                    console.error('Error updating employee manager: ' + err.stack);
                  } else {
                    console.log('Employee manager updated successfully!');
                  }
                  // Restart the application
                  startApp();
                });
            });
          }
        });
      });
    })
    .catch(err => {
      console.error('Error updating employee role/manager: ' + err.stack);
      startApp(); // Restart the application
    });
}

