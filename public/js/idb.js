let db;
const request = indexedDB.open('budget_tracker', 1);


// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `new_pizza`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('budget_update', { autoIncrement: true });
  };

  // upon a successful 
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;
  
    // check if app is online, if yes run updateBudget(); function to send all local db data to api
    if (navigator.onLine) {
      updateBudget();
    }
  };
  
  request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
  };

  // This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['updated_budget'], 'readwrite');
  
    // access the object store for `new_pizza`
    const budgetUpdate = transaction.objectStore('updated_budget');
  
    // add record to your store with add method
    budgetUpdate.add(record);
}

function updateBudget() {
    // open a transaction on your db
    const transaction = db.transaction(['updated_budget'], 'readwrite');
  
    // access your object store
    const budgetUpdate = transaction.objectStore('updated_budget');
  
    // get all records from store and set to a variable
    const getAll = budgetUpdate.getAll();
  
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
          fetch('/api/transaction', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(serverResponse => {
              if (serverResponse.message) {
                throw new Error(serverResponse);
              }
              // open one more transaction
              const transaction = db.transaction(['updated_budget'], 'readwrite');
              // access the budget_update object store
              const budgetUpdate = transaction.objectStore('updated_budget');
              // clear all items in your store
              budgetUpdate.clear();
    
              alert('Budget updates have been submitted');
            })
            .catch(err => {
              console.log(err);
            });
        }
      };
  }

  // listen for app coming back online
window.addEventListener('online', updateBudget);